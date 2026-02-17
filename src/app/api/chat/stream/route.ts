import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hybridSearch } from '@/lib/server-utils';
import { streamText } from '@/lib/vertex-ai';
import { requireAuth } from '@/lib/auth-firebase';
import { checkRateLimit } from '@/lib/rate-limit';

// POST - Stream ghost-written content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, toneInstruction = 'Formal e direto', projectId, styleProfileId, knowledgeProjectIds } = body;

    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.prismaUser.id;

    // Rate limit per user
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns segundos.' }), {
        status: 429, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Get or create session
    let chatSession;
    if (sessionId) {
      chatSession = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          userId: userId || null,
          projectId: projectId || null,
          styleProfileId: styleProfileId || null,
          knowledgeProjectIds: knowledgeProjectIds ? JSON.stringify(knowledgeProjectIds) : null,
        },
        include: { messages: true }
      });
    }

    // 2. Retrieve relevant chunks
    // Determine which projects to source KB from
    const kbProjectIds: string[] = knowledgeProjectIds || (projectId && projectId !== 'all' ? [projectId] : []);
    
    const contentWhere: { isActive: boolean; projectId?: { in: string[] } } = { isActive: true };
    if (kbProjectIds.length > 0) {
      contentWhere.projectId = { in: kbProjectIds };
    }

    // 2a. Get content chunks from selected KB projects
    const contentChunks = await db.documentChunk.findMany({
      where: { document: { type: 'content', ...contentWhere } },
      select: { id: true, content: true, keywords: true, embedding: true }
    });
    const contentContext = await hybridSearch(message, contentChunks, 4);
    const contentText = contentContext.map(c => c.content).join('\n\n---\n\n');

    // 2b. Get style — prefer StyleProfile's systemPrompt over raw style docs
    let stylePrompt = '';
    if (styleProfileId) {
      const profile = await db.styleProfile.findUnique({ where: { id: styleProfileId } });
      if (profile?.systemPrompt) {
        stylePrompt = profile.systemPrompt;
      }
    }

    // Fallback: search style docs if no profile prompt
    if (!stylePrompt) {
      const styleChunks = await db.documentChunk.findMany({
        where: { document: { type: 'style', isActive: true, ...(projectId && projectId !== 'all' ? { projectId } : {}) } },
        select: { id: true, content: true, keywords: true, embedding: true }
      });
      const styleContext = await hybridSearch(message, styleChunks, 2);
      stylePrompt = styleContext.map(c => c.content).join('\n\n---\n\n') || 'Nenhum estilo de referência fornecido. Use um estilo profissional e claro.';
    }

    // 3. Build the Ghost Writer prompt
    const systemPrompt = `Você é a Gabi, uma Ghost Writer de elite. Seu nome é Gabi e você é uma assistente de escrita altamente qualificada.

Sua tarefa é escrever textos impecáveis baseando-se ESTRITAMENTE nas instruções abaixo.

REGRAS FUNDAMENTAIS:
1. Use APENAS as informações da BASE DE CONHECIMENTO para fatos e dados
2. Imite o ESTILO do autor de referência (estrutura de frases, vocabulário, ritmo, pontuação)
3. Não copie o texto literalmente - copie a "alma" e o estilo
4. Mantenha a autenticidade e naturalidade da escrita
5. Escreva APENAS o texto solicitado, sem meta-comentários sobre o processo de escrita`;

    const userPrompt = `### OBJETIVO
Escreva uma resposta para: "${message}"

### BASE DE CONHECIMENTO (FATOS)
${contentText || 'Nenhuma informação específica fornecida. Use conhecimento geral quando apropriado.'}

### REFERÊNCIA DE ESTILO (FORMA)
${stylePrompt}

### INSTRUÇÃO ADICIONAL DE TOM
${toneInstruction}

Resposta:`;

    // 4. Create streaming response
    // Build conversation history
    const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
      { role: 'assistant', content: systemPrompt }
    ];

    // Add recent conversation history
    const recentMessages = chatSession.messages.slice(-6);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session info first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'session', sessionId: chatSession.id })}\n\n`));

          // Send context info
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'context',
            styleSource: styleProfileId || 'chunks',
            contentChunks: contentContext.length,
            contentSources: contentContext.map(c => c.id)
          })}\n\n`));

          // Get streaming completion from Vertex AI
          const stream = streamText(messages);

          // Stream tokens
          for await (const content of stream) {
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`));
            }
          }

          // Save messages to database
          await db.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: 'user',
              content: message,
              toneInstruction,
              contentSources: JSON.stringify(contentContext.map(c => c.id)),
              styleSources: styleProfileId || null
            }
          });

          await db.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: 'assistant',
              content: fullResponse
            }
          });

          // Update session
          const updateData: { updatedAt: Date; title?: string } = { updatedAt: new Date() };
          if (!chatSession.title && chatSession.messages.length === 0) {
            updateData.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
          }

          await db.chatSession.update({
            where: { id: chatSession.id },
            data: updateData
          });

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in chat stream:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

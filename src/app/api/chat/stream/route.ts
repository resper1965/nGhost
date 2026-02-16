import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getZAI, keywordSearch } from '@/lib/server-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Stream ghost-written content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, toneInstruction = 'Formal e direto', projectId } = body;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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
          projectId: projectId || null
        },
        include: { messages: true }
      });
    }

    // 2. Retrieve relevant chunks using fast keyword search
    // Filter by project if provided
    const documentWhere: {
      isActive: boolean;
      projectId?: string | null;
    } = { isActive: true };

    if (projectId && projectId !== 'all') {
      documentWhere.projectId = projectId;
    }

    const [styleChunks, contentChunks] = await Promise.all([
      db.documentChunk.findMany({
        where: { document: { type: 'style', ...documentWhere } },
        select: { id: true, content: true, keywords: true }
      }),
      db.documentChunk.findMany({
        where: { document: { type: 'content', ...documentWhere } },
        select: { id: true, content: true, keywords: true }
      })
    ]);

    const styleContext = keywordSearch(message, styleChunks, 2);
    const contentContext = keywordSearch(message, contentChunks, 4);

    const styleText = styleContext.map(c => c.content).join('\n\n---\n\n');
    const contentText = contentContext.map(c => c.content).join('\n\n---\n\n');

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
${styleText || 'Nenhum estilo de referência fornecido. Use um estilo profissional e claro.'}

### INSTRUÇÃO ADICIONAL DE TOM
${toneInstruction}

Resposta:`;

    // 4. Create streaming response
    const zai = await getZAI();

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
            styleChunks: styleContext.length,
            contentChunks: contentContext.length,
            styleSources: styleContext.map(c => c.id),
            contentSources: contentContext.map(c => c.id)
          })}\n\n`));

          // Get completion with streaming
          const completion = await zai.chat.completions.create({
            messages,
            stream: true,
            thinking: { type: 'disabled' }
          });

          // Stream tokens
          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content || '';
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
              styleSources: JSON.stringify(styleContext.map(c => c.id))
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

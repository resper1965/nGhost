import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getZAI, keywordSearch } from '@/lib/server-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - List chat sessions (filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build where clause
    const where: {
      projectId?: string | null;
      userId?: string;
    } = {};

    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    }

    // If authenticated, filter by user
    if (userId) {
      where.userId = userId;
    }

    const sessions = await db.chatSession.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title || s.messages[0]?.content?.slice(0, 50) || 'New Chat',
        projectId: s.projectId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Generate ghost-written content (non-streaming fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, toneInstruction = 'Formal e direto', projectId } = body;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
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

    // 4. Generate response with LLM
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

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';

    // 5. Save user message
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

    // 6. Save assistant message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: 'assistant',
        content: aiResponse
      }
    });

    // 7. Update session with title if it's a new session
    const updateData: { updatedAt: Date; title?: string } = { updatedAt: new Date() };

    if (!chatSession.title && chatSession.messages.length === 0) {
      updateData.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    await db.chatSession.update({
      where: { id: chatSession.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: chatSession.id,
      context: {
        styleChunks: styleContext.length,
        contentChunks: contentContext.length
      }
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

// DELETE - Clear session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (sessionId) {
      // Verify ownership if authenticated
      if (userId) {
        const chatSession = await db.chatSession.findFirst({
          where: { id: sessionId, userId }
        });
        if (!chatSession) {
          return NextResponse.json(
            { success: false, error: 'Session not found or access denied' },
            { status: 404 }
          );
        }
      }
      await db.chatSession.delete({ where: { id: sessionId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

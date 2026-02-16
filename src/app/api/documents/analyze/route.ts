import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getZAI } from '@/lib/server-utils';

// POST - Analyze writing style of a document
export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document with chunks
    const document = await db.knowledgeDocument.findUnique({
      where: { id: documentId },
      include: {
        chunks: {
          take: 5,
          select: { content: true }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.type !== 'style') {
      return NextResponse.json(
        { success: false, error: 'Can only analyze style documents' },
        { status: 400 }
      );
    }

    // Combine sample chunks for analysis
    const sampleText = document.chunks.map(c => c.content).join('\n\n---\n\n');

    const zai = await getZAI();

    // Analyze style with LLM
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `Você é um especialista em análise de estilo literário. Analise o texto fornecido e extraia características de estilo.

Responda APENAS com um JSON válido no seguinte formato:
{
  "summary": "Resumo de 1 frase do estilo",
  "characteristics": [
    "Característica 1",
    "Característica 2"
  ],
  "sentenceStyle": "curtas|médias|longas|variadas",
  "vocabulary": "simples|moderado|sofisticado|técnico",
  "tone": ["tom1", "tom2"],
  "commonExpressions": ["expressão1", "expressão2"],
  "punctuationStyle": "descrição do uso de pontuação",
  "rhythm": "descrição do ritmo da escrita"
}`
        },
        {
          role: 'user',
          content: `Analise o estilo de escrita do seguinte texto:\n\n${sampleText}`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let analysis;
    try {
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Fallback if parsing fails
      analysis = {
        summary: 'Estilo analisado',
        characteristics: ['Características extraídas do texto'],
        sentenceStyle: 'variadas',
        vocabulary: 'moderado',
        tone: ['neutro'],
        commonExpressions: [],
        punctuationStyle: 'Uso padrão de pontuação',
        rhythm: 'Ritmo moderado'
      };
    }

    // Update document with summary
    await db.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        summary: analysis.summary
      }
    });

    return NextResponse.json({
      success: true,
      analysis,
      document: {
        id: document.id,
        filename: document.filename,
        summary: analysis.summary
      }
    });
  } catch (error) {
    console.error('Error analyzing style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze style' },
      { status: 500 }
    );
  }
}

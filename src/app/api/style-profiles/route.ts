import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFirebaseUser, getOrCreatePrismaUser } from '@/lib/auth-firebase';
import { generateText } from '@/lib/vertex-ai';

// ============================================
// Style Profiles API
// ============================================

// GET - List user's style profiles
export async function GET(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getOrCreatePrismaUser(firebaseUser);

    const profiles = await db.styleProfile.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        _count: { select: { documents: true, chatSessions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error('Error fetching style profiles:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

// POST - Create a new style profile
export async function POST(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getOrCreatePrismaUser(firebaseUser);

    const { name, description } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const profile = await db.styleProfile.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error creating style profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to create profile' }, { status: 500 });
  }
}

// PATCH - Update profile or trigger analysis
export async function PATCH(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getOrCreatePrismaUser(firebaseUser);

    const { id, name, description, analyze } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Profile ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.styleProfile.findFirst({
      where: { id, userId: user.id },
      include: { documents: { include: { chunks: { take: 5, select: { content: true } } } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // If analyze flag, run LLM analysis on linked docs
    if (analyze) {
      const sampleTexts = existing.documents
        .flatMap(doc => doc.chunks.map(c => c.content))
        .slice(0, 10)
        .join('\n\n---\n\n');

      if (sampleTexts.length > 0) {
        const analysisJson = await generateText([
          {
            role: 'system',
            content: `Você é um especialista em análise de estilo literário. Analise o texto e retorne APENAS JSON válido:
{
  "summary": "Resumo do estilo em 1 frase",
  "tone": ["tom1", "tom2"],
  "vocabulary": "simples|moderado|sofisticado|técnico",
  "sentenceStyle": "curtas|médias|longas|variadas",
  "rhythm": "descrição do ritmo",
  "characteristics": ["característica 1", "característica 2"],
  "commonExpressions": ["expressão 1", "expressão 2"]
}`,
          },
          {
            role: 'user',
            content: `Analise o estilo de escrita:\n\n${sampleTexts}`,
          },
        ]);

        let analysis: string | null = null;
        try {
          const jsonMatch = analysisJson.match(/\{[\s\S]*\}/);
          if (jsonMatch) analysis = jsonMatch[0];
        } catch {
          // Fallback — save raw response
          analysis = analysisJson;
        }

        // Generate system prompt from analysis
        const systemPrompt = await generateText([
          {
            role: 'system',
            content: 'Você gera instruções de sistema para um ghost writer. Dado uma análise de estilo, crie um system prompt conciso que instrua uma IA a escrever nesse estilo. Retorne APENAS o prompt, sem explicações.',
          },
          {
            role: 'user',
            content: `Nome do estilo: "${existing.name}"\nAnálise: ${analysis}`,
          },
        ]);

        const profile = await db.styleProfile.update({
          where: { id },
          data: { analysis, systemPrompt },
        });

        return NextResponse.json({ success: true, profile, analyzed: true });
      }

      return NextResponse.json({ success: false, error: 'No documents to analyze' }, { status: 400 });
    }

    // Regular update (name/description)
    const profile = await db.styleProfile.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating style profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE - Soft-delete a profile
export async function DELETE(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    if (!firebaseUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getOrCreatePrismaUser(firebaseUser);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Profile ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.styleProfile.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    await db.styleProfile.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting style profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete profile' }, { status: 500 });
  }
}

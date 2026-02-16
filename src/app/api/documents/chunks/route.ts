import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch chunks by IDs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'No chunk IDs provided' },
        { status: 400 }
      );
    }

    const chunkIds = ids.split(',').filter(Boolean);

    const chunks = await db.documentChunk.findMany({
      where: {
        id: { in: chunkIds }
      },
      select: {
        id: true,
        content: true,
        document: {
          select: {
            type: true,
            filename: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      chunks: chunks.map(c => ({
        id: c.id,
        content: c.content,
        type: c.document.type,
        filename: c.document.filename
      }))
    });
  } catch (error) {
    console.error('Error fetching chunks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chunks' },
      { status: 500 }
    );
  }
}

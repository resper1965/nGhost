import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List versions for a message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const versions = await db.textVersion.findMany({
      where: { messageId },
      orderBy: { version: 'desc' }
    });

    return NextResponse.json({
      success: true,
      versions: versions.map(v => ({
        id: v.id,
        content: v.content,
        version: v.version,
        note: v.note,
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST - Create a new version
export async function POST(request: NextRequest) {
  try {
    const { messageId, content, note, userId } = await request.json();

    if (!messageId || !content) {
      return NextResponse.json(
        { success: false, error: 'Message ID and content are required' },
        { status: 400 }
      );
    }

    // Get current version count
    const existingVersions = await db.textVersion.count({
      where: { messageId }
    });

    const version = await db.textVersion.create({
      data: {
        messageId,
        content,
        version: existingVersions + 1,
        note,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        content: version.content,
        version: version.version,
        note: version.note,
        createdAt: version.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

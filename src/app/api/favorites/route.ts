import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List favorites
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const tag = searchParams.get('tag');

    const where: { userId: string; tags?: { contains: string } } = { userId };
    if (tag) {
      where.tags = { contains: tag };
    }

    const favorites = await db.favorite.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        session: {
          select: { title: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      favorites: favorites.map(f => ({
        id: f.id,
        title: f.title,
        content: f.content,
        tags: f.tags ? JSON.parse(f.tags) : [],
        note: f.note,
        sessionTitle: f.session?.title,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST - Create a favorite
export async function POST(request: NextRequest) {
  try {
    const { title, content, tags, note, sessionId, userId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    const favorite = await db.favorite.create({
      data: {
        title: title || 'Untitled',
        content,
        tags: tags ? JSON.stringify(tags) : null,
        note,
        sessionId,
        userId: userId || 'anonymous'
      }
    });

    return NextResponse.json({
      success: true,
      favorite: {
        id: favorite.id,
        title: favorite.title,
        content: favorite.content,
        tags: favorite.tags ? JSON.parse(favorite.tags) : [],
        note: favorite.note,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create favorite' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Favorite ID is required' },
        { status: 400 }
      );
    }

    await db.favorite.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}

// PATCH - Update a favorite
export async function PATCH(request: NextRequest) {
  try {
    const { id, title, tags, note } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Favorite ID is required' },
        { status: 400 }
      );
    }

    const favorite = await db.favorite.update({
      where: { id },
      data: {
        title,
        tags: tags ? JSON.stringify(tags) : undefined,
        note
      }
    });

    return NextResponse.json({
      success: true,
      favorite: {
        id: favorite.id,
        title: favorite.title,
        tags: favorite.tags ? JSON.parse(favorite.tags) : [],
        note: favorite.note,
        updatedAt: favorite.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update favorite' },
      { status: 500 }
    );
  }
}

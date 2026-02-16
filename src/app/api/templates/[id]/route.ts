import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Increment template use count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.customTemplate.update({
      where: { id },
      data: {
        useCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing use count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update use count' },
      { status: 500 }
    );
  }
}

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.customTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        prompt: template.prompt,
        category: template.category,
        icon: template.icon,
        color: template.color,
        variables: template.variables ? JSON.parse(template.variables) : [],
        example: template.example,
        isPublic: template.isPublic,
        useCount: template.useCount,
        createdAt: template.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

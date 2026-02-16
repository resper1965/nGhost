import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List custom templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';

    const where: {
      OR?: Array<{ userId: string | null } | { isPublic: boolean }>;
      userId?: string | null;
      category?: string;
      isPublic?: boolean;
    } = {};

    if (publicOnly) {
      where.isPublic = true;
    } else if (userId) {
      // Show user's templates + public templates
      where.OR = [
        { userId },
        { isPublic: true }
      ];
    } else {
      // Show only public templates for anonymous users
      where.isPublic = true;
    }

    if (category) {
      where.category = category;
    }

    const templates = await db.customTemplate.findMany({
      where,
      orderBy: [
        { useCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        prompt: t.prompt,
        category: t.category,
        icon: t.icon,
        color: t.color,
        variables: t.variables ? JSON.parse(t.variables) : [],
        example: t.example,
        isPublic: t.isPublic,
        useCount: t.useCount,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create a custom template
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      prompt,
      category,
      icon,
      color,
      variables,
      example,
      isPublic,
      userId
    } = await request.json();

    if (!name || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Name and prompt are required' },
        { status: 400 }
      );
    }

    // Extract variables from prompt ({{variableName}})
    const extractedVariables = prompt.match(/\{\{(\w+)\}\}/g)?.map(
      v => v.replace(/\{\{|\}\}/g, '')
    ) || [];

    const template = await db.customTemplate.create({
      data: {
        name,
        description,
        prompt,
        category: category || 'Custom',
        icon: icon || 'FileText',
        color: color || '#00ade8',
        variables: JSON.stringify(variables || extractedVariables),
        example,
        isPublic: isPublic || false,
        userId: userId || null
      }
    });

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
        createdAt: template.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PATCH - Update a template
export async function PATCH(request: NextRequest) {
  try {
    const {
      id,
      name,
      description,
      prompt,
      category,
      icon,
      color,
      variables,
      example,
      isPublic
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await db.customTemplate.update({
      where: { id },
      data: {
        name,
        description,
        prompt,
        category,
        icon,
        color,
        variables: variables ? JSON.stringify(variables) : undefined,
        example,
        isPublic
      }
    });

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
        isPublic: template.isPublic
      }
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await db.customTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

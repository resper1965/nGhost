import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create a fresh Prisma client instance for this route
const prisma = new PrismaClient({ log: ['error'] });

// GET - List custom templates (filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');
    const publicOnly = searchParams.get('public') === 'true';

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Build where clause
    const where: {
      OR?: Array<{ userId: string | null; projectId?: string | null } | { isPublic: boolean }>;
      userId?: string | null;
      projectId?: string | null;
      category?: string;
      isPublic?: boolean;
    } = {};

    if (publicOnly) {
      where.isPublic = true;
    } else if (userId) {
      // Authenticated user sees their templates + public templates
      where.OR = [
        { userId, projectId: projectId || null },
        { isPublic: true }
      ];
    } else {
      // Guest sees only public templates
      where.isPublic = true;
    }

    if (category) {
      where.category = category;
    }

    const templates = await prisma.customTemplate.findMany({
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
        projectId: t.projectId,
        useCount: t.useCount,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: true, templates: [] });
  }
}

// POST - Create a custom template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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
      projectId
    } = await request.json();

    if (!name || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Name and prompt are required' },
        { status: 400 }
      );
    }

    // If projectId provided, verify user has access
    if (projectId && userId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      });
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    }

    const extractedVariables = prompt.match(/\{\{(\w+)\}\}/g)?.map(
      v => v.replace(/\{\{|\}\}/g, '')
    ) || [];

    const template = await prisma.customTemplate.create({
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
        userId: userId || null,
        projectId: projectId || null
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
        projectId: template.projectId,
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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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

    // Verify ownership if authenticated
    if (userId) {
      const existing = await prisma.customTemplate.findFirst({
        where: { id, userId }
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Template not found or access denied' },
          { status: 404 }
        );
      }
    }

    const template = await prisma.customTemplate.update({
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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership if authenticated
    if (userId) {
      const existing = await prisma.customTemplate.findFirst({
        where: { id, userId }
      });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Template not found or access denied' },
          { status: 404 }
        );
      }
    }

    await prisma.customTemplate.delete({
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

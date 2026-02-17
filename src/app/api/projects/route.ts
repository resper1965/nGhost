import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFirebaseUser, getOrCreatePrismaUser } from '@/lib/auth-firebase';

// GET - List all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    const userId = firebaseUser ? (await getOrCreatePrismaUser(firebaseUser)).id : null;

    // If not authenticated, return empty projects (guest mode)
    if (!userId) {
      return NextResponse.json({
        success: true,
        projects: [],
        isGuest: true
      });
    }

    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            documents: true,
            chatSessions: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        color: p.color,
        icon: p.icon,
        isActive: p.isActive,
        documentCount: p._count.documents,
        chatSessionCount: p._count.chatSessions,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      isGuest: false
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    const userId = firebaseUser ? (await getOrCreatePrismaUser(firebaseUser)).id : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to create projects' },
        { status: 401 }
      );
    }

    const { name, description, color, icon } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Check project limit per user (optional - can be configured)
    const existingProjects = await db.project.count({ where: { userId } });
    if (existingProjects >= 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum number of projects reached (50)' },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#00ade8',
        icon: icon || 'FolderOpen',
        userId
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
        isActive: project.isActive,
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PATCH - Update a project
export async function PATCH(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    const userId = firebaseUser ? (await getOrCreatePrismaUser(firebaseUser)).id : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, name, description, color, icon, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingProject = await db.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const project = await db.project.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        color,
        icon,
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
        isActive: project.isActive,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const firebaseUser = await getFirebaseUser(request);
    const userId = firebaseUser ? (await getOrCreatePrismaUser(firebaseUser)).id : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingProject = await db.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Delete project (cascade will delete associated documents, sessions, etc.)
    await db.project.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

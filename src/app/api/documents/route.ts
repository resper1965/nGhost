import { NextRequest, NextResponse } from 'next/server';
import { type DocumentType } from '@prisma/client';
import { db } from '@/lib/db';
import { chunkText, extractKeywords } from '@/lib/server-utils';
import { validateFile, validateContent } from '@/lib/utils';
import { requireAuth } from '@/lib/auth-firebase';
import { storeEmbedding } from '@/lib/embeddings';

// GET - List all documents (filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.prismaUser.id;

    // Build where clause
    const where: {
      type?: DocumentType;
      projectId?: string | null;
      userId?: string;
    } = {};

    if (type) where.type = type as DocumentType;

    // If authenticated and projectId provided, filter by project
    if (projectId && projectId !== 'all') {
      where.projectId = projectId;
    } else if (userId && projectId !== 'all') {
      // If authenticated but no specific project, show user's documents
      // This allows guest mode to work without projectId
    }

    const [documents, total] = await Promise.all([
      db.knowledgeDocument.findMany({
        where,
        include: {
          _count: {
            select: { chunks: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.knowledgeDocument.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        type: doc.type,
        fileSize: doc.fileSize,
        chunkCount: doc._count.chunks,
        projectId: doc.projectId,
        createdAt: doc.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST - Upload and ingest a document
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;
    const userId = auth.prismaUser.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;
    const content = formData.get('content') as string | null;
    const projectId = formData.get('projectId') as string | null;

    // Validate type
    if (!type || !['style', 'content'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "style" or "content"' },
        { status: 400 }
      );
    }

    // If projectId provided, verify user has access
    if (projectId && userId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId }
      });
      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found or access denied' },
          { status: 404 }
        );
      }
    }

    let textContent = content || '';
    let filename = 'text-input.txt';
    let fileSize = textContent.length;
    let mimeType = 'text/plain';

    // Handle file upload
    if (file && file.size > 0) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      filename = file.name;
      fileSize = file.size;
      mimeType = file.type || 'text/plain';

      const buffer = await file.arrayBuffer();
      textContent = new TextDecoder().decode(buffer);
    }

    // Validate content
    const contentValidation = validateContent(textContent);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { success: false, error: contentValidation.error },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunkSize = type === 'style' ? 2000 : 1000;
    const overlap = type === 'style' ? 300 : 200;
    const chunks = chunkText(textContent, chunkSize, overlap);

    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid content chunks could be extracted' },
        { status: 400 }
      );
    }

    const document = await db.knowledgeDocument.create({
      data: {
        filename,
        type: type as DocumentType,
        fileSize,
        mimeType,
        chunkCount: chunks.length,
        userId: userId || null,
        projectId: projectId || null,
        chunks: {
          create: chunks.map((chunk, index) => ({
            content: chunk,
            chunkIndex: index,
            keywords: JSON.stringify(extractKeywords(chunk))
          }))
        }
      },
      include: {
        chunks: true
      }
    });

    // Fire-and-forget: generate embeddings for all chunks in background
    // This keeps the upload response fast while indexing happens async
    Promise.all(
      document.chunks.map(chunk =>
        storeEmbedding(chunk.id, chunk.content).catch(err =>
          console.error(`[embeddings] Failed to embed chunk ${chunk.id}:`, err)
        )
      )
    ).then(results => {
      const indexed = results.filter(Boolean).length;
      console.log(`[embeddings] Indexed ${indexed}/${document.chunks.length} chunks for ${filename}`);
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        type: document.type,
        chunkCount: document.chunkCount,
        projectId: document.projectId,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error ingesting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ingest document' },
      { status: 500 }
    );
  }
}

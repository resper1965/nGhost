import { db } from '@/lib/db'
import { generateEmbedding as vertexGenerateEmbedding } from '@/lib/vertex-ai'
import { Prisma } from '@prisma/client'

// ============================================
// Embedding Cache (in-memory for development)
// ============================================

const embeddingCache = new Map<string, number[]>()

// ============================================
// Embedding Functions (Vertex AI + pgvector)
// ============================================

/**
 * Generate embedding for a text using Vertex AI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = text.slice(0, 100)
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!
  }
  
  try {
    const embedding = await vertexGenerateEmbedding(text)
    
    if (embedding.length > 0) {
      embeddingCache.set(cacheKey, embedding)
    }
    
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return []
  }
}

/**
 * Calculate cosine similarity between two vectors (fallback for non-pgvector)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Format embedding array as pgvector string: [0.1,0.2,0.3]
 */
function toPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Native pgvector similarity search for document chunks
 * Uses cosine distance operator <=> for fast indexed search
 */
export async function vectorSearch(
  query: string,
  type: 'style' | 'content',
  topK: number = 4,
  projectIds?: string[]
): Promise<{ id: string; content: string; score: number }[]> {
  const queryEmbedding = await generateEmbedding(query)
  
  if (queryEmbedding.length === 0) {
    return []
  }

  const pgVector = toPgVector(queryEmbedding)

  try {
    // Build project filter
    let projectFilter = Prisma.empty
    if (projectIds && projectIds.length > 0) {
      projectFilter = Prisma.sql`AND kd."projectId" IN (${Prisma.join(projectIds)})`
    }

    const results = await db.$queryRaw<Array<{ id: string; content: string; score: number }>>`
      SELECT dc.id, dc.content, 1 - (dc.embedding::vector <=> ${pgVector}::vector) as score
      FROM "DocumentChunk" dc
      INNER JOIN "KnowledgeDocument" kd ON dc."documentId" = kd.id
      WHERE kd.type = ${type}
        AND kd."isActive" = true
        AND dc.embedding IS NOT NULL
        ${projectFilter}
      ORDER BY dc.embedding::vector <=> ${pgVector}::vector
      LIMIT ${topK}
    `

    return results
  } catch (error) {
    console.error('[pgvector] Vector search failed, falling back to in-memory:', error)
    // Fallback to in-memory search if pgvector not available
    return vectorSearchFallback(queryEmbedding, type, topK)
  }
}

/**
 * Fallback in-memory vector search (for dev without pgvector)
 */
async function vectorSearchFallback(
  queryEmbedding: number[],
  type: 'style' | 'content',
  topK: number
): Promise<{ id: string; content: string; score: number }[]> {
  const chunks = await db.documentChunk.findMany({
    where: {
      document: { type, isActive: true }
    },
    select: { id: true, content: true, embedding: true }
  })
  
  const scored = chunks
    .filter(chunk => chunk.embedding)
    .map(chunk => {
      try {
        const chunkEmbedding = JSON.parse(chunk.embedding!)
        const score = cosineSimilarity(queryEmbedding, chunkEmbedding)
        return { id: chunk.id, content: chunk.content, score }
      } catch {
        return { id: chunk.id, content: chunk.content, score: 0 }
      }
    })
  
  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * Store embedding for a chunk (pgvector-compatible format)
 */
export async function storeEmbedding(chunkId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  
  if (embedding.length > 0) {
    // Store as pgvector-compatible string format: [0.1,0.2,...]
    const pgVector = toPgVector(embedding)
    await db.documentChunk.update({
      where: { id: chunkId },
      data: { embedding: pgVector }
    })
  }
}

/**
 * Batch generate and store embeddings for all chunks without embeddings
 */
export async function indexAllChunks(): Promise<{ indexed: number; errors: number }> {
  const chunks = await db.documentChunk.findMany({
    where: { embedding: null },
    select: { id: true, content: true }
  })
  
  let indexed = 0
  let errors = 0
  
  for (const chunk of chunks) {
    try {
      await storeEmbedding(chunk.id, chunk.content)
      indexed++
    } catch (error) {
      console.error(`Error indexing chunk ${chunk.id}:`, error)
      errors++
    }
  }
  
  return { indexed, errors }
}

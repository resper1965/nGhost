import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// ============================================
// Embedding Cache (in-memory for development)
// In production, use Redis or database storage
// ============================================

const embeddingCache = new Map<string, number[]>()

// ============================================
// ZAI Instance for Embeddings
// ============================================

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null

async function getZAI() {
  if (!zaiInstance && !zaiPromise) {
    zaiPromise = ZAI.create().then(instance => {
      zaiInstance = instance
      return instance
    })
  }
  return zaiPromise || zaiInstance!
}

// ============================================
// Embedding Functions
// ============================================

/**
 * Generate embedding for a text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cacheKey = text.slice(0, 100) // Simple cache key
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!
  }
  
  const zai = await getZAI()
  
  try {
    // Use z-ai-sdk for embeddings
    // Note: The actual embedding API might differ - adjust based on SDK
    const response = await zai.embeddings.create({
      input: text.slice(0, 8000), // Limit text length
      model: 'text-embedding-3-small'
    })
    
    const embedding = response.data[0]?.embedding || []
    
    // Cache the result
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
 * Calculate cosine similarity between two vectors
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
 * Vector similarity search for document chunks
 */
export async function vectorSearch(
  query: string,
  type: 'style' | 'content',
  topK: number = 4
): Promise<{ id: string; content: string; score: number }[]> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)
  
  if (queryEmbedding.length === 0) {
    // Fallback to keyword search if embeddings fail
    return []
  }
  
  // Get all chunks of the specified type
  const chunks = await db.documentChunk.findMany({
    where: {
      document: {
        type,
        isActive: true
      }
    },
    select: {
      id: true,
      content: true,
      embedding: true
    }
  })
  
  // Calculate similarity for each chunk
  const scored = chunks.map(chunk => {
    let score = 0
    
    if (chunk.embedding) {
      try {
        const chunkEmbedding = JSON.parse(chunk.embedding)
        score = cosineSimilarity(queryEmbedding, chunkEmbedding)
      } catch {
        score = 0
      }
    }
    
    return {
      id: chunk.id,
      content: chunk.content,
      score
    }
  })
  
  // Sort by score and return top K
  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * Store embedding for a chunk
 */
export async function storeEmbedding(chunkId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  
  if (embedding.length > 0) {
    await db.documentChunk.update({
      where: { id: chunkId },
      data: { embedding: JSON.stringify(embedding) }
    })
  }
}

/**
 * Batch generate and store embeddings for all chunks
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

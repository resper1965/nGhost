// ============================================
// Text Processing & Search Utilities (Server-side)
// ============================================

// ============================================
// Text Processing Utilities (Server-side)
// ============================================

/**
 * Chunk text into smaller pieces with smart break points
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    let end = start + chunkSize
    
    // Try to find a natural break point (paragraph or sentence)
    if (end < text.length) {
      const nextParagraph = text.indexOf('\n\n', end - 100)
      const nextSentence = text.indexOf('. ', end - 100)
      
      if (nextParagraph !== -1 && nextParagraph < end + 100) {
        end = nextParagraph + 2
      } else if (nextSentence !== -1 && nextSentence < end + 50) {
        end = nextSentence + 2
      }
    }
    
    chunks.push(text.slice(start, end).trim())
    start = end - overlap
  }
  
  return chunks.filter(chunk => chunk.length > 50)
}

/**
 * Extract keywords from text for better retrieval
 */
export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
  
  const wordCount: Record<string, number> = {}
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1
  }
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

// ============================================
// Search Utilities (Server-side)
// ============================================

interface SearchableChunk {
  id: string
  content: string
  keywords: string | null
}

interface ScoredChunk {
  id: string
  content: string
  score: number
}

/**
 * Fast keyword-based search for document chunks
 */
export function keywordSearch(
  query: string,
  chunks: SearchableChunk[],
  topK: number = 4
): ScoredChunk[] {
  if (chunks.length === 0) return []
  
  const queryWords = query.toLowerCase()
    .replace(/[^\w\sáéíóúàèìòùâêîôûãõç]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
  
  const scored = chunks.map(chunk => {
    // Safe JSON parse with fallback
    let chunkKeywords: string[] = []
    try {
      chunkKeywords = chunk.keywords ? JSON.parse(chunk.keywords) : []
    } catch {
      chunkKeywords = []
    }
    
    const chunkText = chunk.content.toLowerCase()
    let score = 0
    
    // Score based on keyword matches
    for (const word of queryWords) {
      if (chunkKeywords.includes(word)) score += 3
      if (chunkText.includes(word)) score += 1
    }
    
    // Boost for exact phrase matches
    if (chunkText.includes(query.toLowerCase().slice(0, 50))) {
      score += 5
    }
    
    return { id: chunk.id, content: chunk.content, score }
  })
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

/**
 * Hybrid search combining keyword matching (30%) with vector similarity (70%)
 * Falls back to keyword-only when embeddings are not available
 */
export async function hybridSearch(
  query: string,
  chunks: (SearchableChunk & { embedding?: string | null })[],
  topK: number = 4
): Promise<ScoredChunk[]> {
  if (chunks.length === 0) return []

  // Step 1: Get keyword scores
  const keywordResults = keywordSearch(query, chunks, chunks.length)
  const keywordScoreMap = new Map(keywordResults.map(r => [r.id, r.score]))
  const maxKeywordScore = Math.max(...keywordResults.map(r => r.score), 1)

  // Step 2: Try vector search
  let vectorScoreMap = new Map<string, number>()
  let hasEmbeddings = false

  try {
    // Check if any chunks have embeddings
    const chunksWithEmbeddings = chunks.filter(c => c.embedding)
    
    if (chunksWithEmbeddings.length > 0) {
      // Dynamic import to avoid circular dependencies
      const { generateEmbedding, cosineSimilarity } = await import('@/lib/embeddings')
      const queryEmbedding = await generateEmbedding(query)

      if (queryEmbedding.length > 0) {
        hasEmbeddings = true
        for (const chunk of chunksWithEmbeddings) {
          try {
            // Supports both pgvector format [0.1,0.2] and legacy JSON
            const chunkEmbedding = JSON.parse(chunk.embedding!)
            const score = cosineSimilarity(queryEmbedding, chunkEmbedding)
            vectorScoreMap.set(chunk.id, score)
          } catch {
            // Skip chunks with invalid embeddings
          }
        }
      }
    }
  } catch (error) {
    console.warn('[hybrid-search] Vector search failed, using keyword-only:', error)
  }

  const maxVectorScore = Math.max(...vectorScoreMap.values(), 0.001)

  // Step 3: Combine scores
  const KEYWORD_WEIGHT = hasEmbeddings ? 0.3 : 1.0
  const VECTOR_WEIGHT = hasEmbeddings ? 0.7 : 0.0

  const scored = chunks.map(chunk => {
    const normalizedKeyword = (keywordScoreMap.get(chunk.id) || 0) / maxKeywordScore
    const normalizedVector = (vectorScoreMap.get(chunk.id) || 0) / maxVectorScore
    const combinedScore = (normalizedKeyword * KEYWORD_WEIGHT) + (normalizedVector * VECTOR_WEIGHT)

    return {
      id: chunk.id,
      content: chunk.content,
      score: combinedScore
    }
  })

  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

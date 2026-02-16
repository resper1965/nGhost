import ZAI from 'z-ai-web-dev-sdk'

// ============================================
// ZAI Instance Management (Thread-safe Singleton)
// Server-side only - do not import in client components
// ============================================

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null

export async function getZAI() {
  // Use a promise to prevent race conditions
  if (!zaiInstance && !zaiPromise) {
    zaiPromise = ZAI.create().then(instance => {
      zaiInstance = instance
      return instance
    })
  }
  return zaiPromise || zaiInstance!
}

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

// ============================================
// Simple In-Memory Rate Limiter
// Uses token bucket algorithm per IP
// Suitable for single-instance Cloud Run
// ============================================

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

// Config
const MAX_TOKENS = 30       // Max requests per window
const REFILL_RATE = 1        // Tokens per second
const REFILL_INTERVAL = 1000 // ms

/**
 * Check if a request should be rate-limited.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  let bucket = buckets.get(identifier)

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now }
    buckets.set(identifier, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL) * REFILL_RATE
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  if (bucket.tokens > 0) {
    bucket.tokens--
    return true // Allowed
  }

  return false // Rate limited
}

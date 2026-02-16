/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting for API routes
 */

interface RateLimitOptions {
  interval?: number // Time window in milliseconds
  uniqueTokenPerInterval?: number // Max unique tokens per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

/**
 * Create a rate limiter instance
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    interval = 60000, // 1 minute default
    uniqueTokenPerInterval = 500
  } = options

  return {
    /**
     * Check rate limit for a given token
     * @param token - Unique identifier (e.g., IP address, user ID)
     * @param limit - Maximum requests per interval
     */
    async check(token: string, limit: number = 10): Promise<RateLimitResult> {
      const now = Date.now()
      const resetTime = now + interval

      // Clean up if too many unique tokens
      if (rateLimitStore.size >= uniqueTokenPerInterval) {
        for (const [key, value] of rateLimitStore.entries()) {
          if (value.resetTime < now) {
            rateLimitStore.delete(key)
          }
        }
      }

      const current = rateLimitStore.get(token)

      if (!current || current.resetTime < now) {
        // First request or expired - create new entry
        rateLimitStore.set(token, { count: 1, resetTime })
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: resetTime
        }
      }

      if (current.count >= limit) {
        // Rate limit exceeded
        return {
          success: false,
          limit,
          remaining: 0,
          reset: current.resetTime
        }
      }

      // Increment count
      current.count++
      rateLimitStore.set(token, current)

      return {
        success: true,
        limit,
        remaining: limit - current.count,
        reset: current.resetTime
      }
    }
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'anonymous'
}

/**
 * Rate limit middleware helper
 */
export async function checkRateLimit(
  request: Request, 
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ success: boolean; error?: string; headers?: Headers }> {
  const limiter = rateLimit({ interval: windowMs })
  const ip = getClientIp(request)
  
  const result = await limiter.check(ip, limit)
  
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString()
  })
  
  if (!result.success) {
    return {
      success: false,
      error: 'Too many requests. Please try again later.',
      headers
    }
  }
  
  return { success: true, headers }
}

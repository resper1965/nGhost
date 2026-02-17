import { NextRequest, NextResponse } from 'next/server'

// ============================================
// Next.js Middleware — Route Protection
// Lightweight cookie-based check (no Firebase Admin in edge runtime)
// Full token verification happens in API route handlers
// ============================================

const PUBLIC_PATHS = [
  '/auth/signin',
  '/auth/error',
  '/landing',
  '/api/auth',     // Keep for any legacy callbacks
  '/_next',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('__session')

  if (!sessionCookie?.value) {
    // No session — redirect to sign in
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Cookie exists — allow through (full verification in API routes)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, logo.png, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|manifest\\.json).*)',
  ],
}

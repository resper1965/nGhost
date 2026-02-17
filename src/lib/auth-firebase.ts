import { adminAuth } from '@/lib/firebase-admin'
import { db } from '@/lib/db'
import type { DecodedIdToken } from 'firebase-admin/auth'

// ============================================
// Firebase Auth Server-Side Helpers
// Used by API routes to verify tokens and sync users
// ============================================

export interface FirebaseUser {
  uid: string
  email: string | undefined
  name: string | undefined
  picture: string | undefined
}

/**
 * Extract and verify Firebase ID token from the Authorization header.
 * Returns the decoded user info or null if missing/invalid.
 *
 * Usage in API routes:
 * ```ts
 * const firebaseUser = await getFirebaseUser(request)
 * if (!firebaseUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * const user = await getOrCreatePrismaUser(firebaseUser)
 * ```
 */
export async function getFirebaseUser(request: Request): Promise<FirebaseUser | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const idToken = authHeader.slice(7) // Remove "Bearer "
    if (!idToken) {
      return null
    }

    const decoded: DecodedIdToken = await adminAuth.verifyIdToken(idToken)

    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
  } catch (error) {
    console.error('[auth-firebase] Token verification failed:', error)
    return null
  }
}

/**
 * Find or create a Prisma User from a Firebase user.
 * Uses Firebase UID as the lookup key (stored in User.id).
 * If user exists but has a different ID (legacy NextAuth), 
 * looks up by email and updates the record.
 */
export async function getOrCreatePrismaUser(firebaseUser: FirebaseUser) {
  const { uid, email, name, picture } = firebaseUser

  if (!email) {
    throw new Error('Firebase user must have an email')
  }

  // First try: look up by Firebase UID (new users)
  let user = await db.user.findUnique({
    where: { id: uid },
  })

  if (user) {
    // Update profile if changed
    if (user.name !== name || user.image !== picture) {
      user = await db.user.update({
        where: { id: uid },
        data: {
          name: name || user.name,
          image: picture || user.image,
        },
      })
    }
    return user
  }

  // Second try: look up by email (migrating from NextAuth)
  const existingByEmail = await db.user.findUnique({
    where: { email },
  })

  if (existingByEmail) {
    // Migrate: update the existing user's ID to Firebase UID
    user = await db.user.update({
      where: { email },
      data: {
        id: uid,
        name: name || existingByEmail.name,
        image: picture || existingByEmail.image,
      },
    })
    return user
  }

  // New user: create
  user = await db.user.create({
    data: {
      id: uid,
      email,
      name: name || email.split('@')[0],
      image: picture || null,
    },
  })

  return user
}

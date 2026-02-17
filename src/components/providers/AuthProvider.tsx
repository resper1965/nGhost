'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
  type Auth,
} from 'firebase/auth'
import { getAuth } from '@/lib/firebase'

// Lazy auth accessor — only call client-side
function getFirebaseAuth(): Auth {
  return getAuth() as unknown as Auth
}

// ============================================
// Auth Context Types
// ============================================

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getIdToken: () => Promise<string | null>
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================
// Cookie Helpers (for middleware)
// ============================================

function setSessionCookie(token: string) {
  // Set a session cookie that the middleware can read
  // HttpOnly is NOT set so middleware (edge) can access it
  document.cookie = `__session=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
}

function clearSessionCookie() {
  document.cookie = '__session=; path=/; max-age=0'
}

// ============================================
// Auth Provider Component
// ============================================

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        // Set session cookie for middleware
        const token = await firebaseUser.getIdToken()
        setSessionCookie(token)
      } else {
        clearSessionCookie()
      }
    })

    return () => unsubscribe()
  }, [])

  // Refresh token periodically (tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true) // force refresh
        setSessionCookie(token)
      } catch (error) {
        console.error('[AuthProvider] Token refresh failed:', error)
      }
    }, 45 * 60 * 1000) // Refresh every 45 minutes

    return () => clearInterval(interval)
  }, [user])

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), googleProvider)
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  }, [])

  const logout = useCallback(async () => {
    clearSessionCookie()
    await firebaseSignOut(getFirebaseAuth())
  }, [])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null
    return user.getIdToken()
  }, [user])

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = user ? await user.getIdToken() : null
    const headers = new Headers(options.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetch(url, { ...options, headers })
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUp,
        logout,
        getIdToken,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

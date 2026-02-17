import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase lazily - safe during build/SSR when env vars are missing
let app: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseApp(): FirebaseApp {
  if (app) return app
  
  if (!firebaseConfig.apiKey) {
    // During build/SSR without env vars, return a dummy that will never be used
    // The AuthProvider only runs client-side where env vars are available
    throw new Error('Firebase API key not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY env var.')
  }
  
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return app
}

function getFirebaseAuth(): Auth {
  if (auth) return auth
  auth = getAuth(getFirebaseApp())
  return auth
}

export { getFirebaseApp as getApp, getFirebaseAuth as getAuth }

// Legacy exports (lazy getters) for compatibility
export { getFirebaseApp as app, getFirebaseAuth as auth }

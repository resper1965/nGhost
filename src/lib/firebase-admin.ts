import { initializeApp, cert, getApps, getApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

// ============================================
// Firebase Admin SDK - Server-side Only
// Uses Application Default Credentials on GCP
// or FIREBASE_ADMIN_* env vars locally
// ============================================

function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp()
  }

  // Option 1: Service account JSON string from env
  const serviceAccountJSON = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
  if (serviceAccountJSON) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJSON)
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      })
    } catch (error) {
      console.error('[firebase-admin] Failed to parse service account JSON:', error)
    }
  }

  // Option 2: Individual env vars
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  // Option 3: Application Default Credentials (GCP environments)
  return initializeApp({ projectId })
}

const adminApp = initializeFirebaseAdmin()
const adminAuth: Auth = getAuth(adminApp)

export { adminApp, adminAuth }

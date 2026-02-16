import NextAuth, { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'
import { randomBytes, randomUUID } from 'crypto'

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Credentials (email/password) - for demo purposes
    Credentials({
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@nghost.ai' },
      },
      async authorize(credentials) {
        // Demo user - in production, verify against database
        if (credentials?.email) {
          let user = await db.user.findUnique({
            where: { email: credentials.email }
          })
          
          if (!user) {
            // Create demo user
            user = await db.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
              }
            })
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true
      }
      
      // OAuth sign in - create or update user
      if (user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email }
        })
        
        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
            }
          })
        }
      }
      
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ''
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    generateSessionToken: () => {
      return randomUUID?.() ?? randomBytes(32).toString('hex')
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'nghost-secret-key-change-in-production',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

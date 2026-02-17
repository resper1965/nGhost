'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

// Brand colors
const ACCENT_COLOR = '#00ade8'
const ACCENT_GRADIENT = 'linear-gradient(135deg, #00ade8 0%, #0095c9 100%)'

function PenIcon({ className, color = ACCENT_COLOR }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="M15 5l2 2" strokeWidth="1.5" />
      <circle cx="4" cy="20" r="0.5" fill={color} stroke="none" />
      <circle cx="3" cy="21" r="0.3" fill={color} stroke="none" opacity="0.6" />
    </svg>
  )
}

export default function SignInPage() {
  const { signInWithGoogle, signInWithEmail, signUp } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      router.push('/')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': 'E-mail ou senha inválidos.',
        'auth/user-not-found': 'Conta não encontrada.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este e-mail já está em uso.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      }
      setError(errorMessages[firebaseError.code || ''] || firebaseError.message || 'Erro ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        setError(firebaseError.message || 'Erro ao entrar com Google.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-border bg-card mb-4">
            <PenIcon className="w-7 h-7" color={ACCENT_COLOR} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <span className="text-foreground">Gabi</span>
              <span style={{ color: ACCENT_COLOR }}>.</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Ghost Writer • <span className="text-foreground">ness</span>
            <span style={{ color: ACCENT_COLOR }}>.</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'signin'
                ? 'Continue para o Gabi Ghost Writer'
                : 'Crie sua conta para começar'}
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-accent/50 text-foreground text-sm font-medium transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: ACCENT_GRADIENT }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="font-medium hover:underline transition-colors"
              style={{ color: ACCENT_COLOR }}
            >
              {mode === 'signin' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          powered by <span className="text-foreground font-medium">ness</span>
          <span style={{ color: ACCENT_COLOR }}>.</span>
        </p>
      </motion.div>
    </div>
  )
}

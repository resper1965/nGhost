'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, PenTool, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

// Brand colors
const ACCENT_COLOR = '#00ade8'
const ACCENT_GRADIENT = 'linear-gradient(135deg, #00ade8 0%, #0095c9 100%)'

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
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00ade8, transparent 70%)' }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 60, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        initial={{ top: '-10%', left: '-10%' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #0095c9, transparent 70%)' }}
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 60, -80, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        initial={{ bottom: '-10%', right: '-5%' }}
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 px-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
            style={{ 
              background: 'rgba(0, 173, 232, 0.1)',
              border: '1px solid rgba(0, 173, 232, 0.2)',
              boxShadow: '0 0 40px rgba(0, 173, 232, 0.15)'
            }}
          >
            <PenTool className="w-7 h-7" style={{ color: ACCENT_COLOR }} />
            <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1" style={{ color: ACCENT_COLOR }} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'Montserrat, var(--font-dm-sans), sans-serif' }}>
              Gabi<span style={{ color: ACCENT_COLOR }}>.</span>
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-400 mt-1.5 tracking-wide"
          >
            Ghost Writer • <span className="text-slate-300">ness</span>
            <span style={{ color: ACCENT_COLOR }}>.</span>
          </motion.p>
        </div>

        {/* Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">
              {mode === 'signin' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              {mode === 'signin'
                ? 'Entre para continuar escrevendo'
                : 'Comece a escrever com Gabi'}
            </p>
          </div>

          {/* Google Sign In */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-slate-500" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 173, 232, 0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 173, 232, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 173, 232, 0.4)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 173, 232, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              style={{ background: ACCENT_GRADIENT }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </motion.button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-slate-400">
            {mode === 'signin' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="font-semibold hover:underline transition-colors cursor-pointer"
              style={{ color: ACCENT_COLOR }}
            >
              {mode === 'signin' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          powered by <span className="text-slate-400 font-medium">ness</span>
          <span style={{ color: ACCENT_COLOR }}>.</span>
        </p>
      </motion.div>
    </div>
  )
}

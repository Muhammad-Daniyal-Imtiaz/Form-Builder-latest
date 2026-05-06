'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layout, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
  const { currentTheme } = useTheme()
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setRedirectTo(searchParams.get('redirectTo') || '/dashboard')

    const errorCode = searchParams.get('error')
    if (errorCode) {
      const errors: Record<string, string> = {
        'auth_failed': 'We could not finish sign-in. Please try again.',
        'no_code': 'The sign-in link was incomplete. Please try again.',
        'invalid_confirmation_link': 'That email confirmation link is invalid or expired.',
        'email_confirmation_failed': 'We could not confirm your email.',
        'server_error': 'Something went wrong on the server.',
      }
      setError(errors[errorCode] || 'An unexpected error occurred.')
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, redirectTo }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      window.location.assign(data.redirectTo || redirectTo)
    } catch {
      setError('Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.assign(`/api/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex justify-between items-center backdrop-blur-xl border-b" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter" style={{ color: currentTheme.textPrimary }}>FormFlow</span>
        </Link>
        
        <div className="hidden lg:block">
          <ThemeSwitcher />
        </div>

        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors" style={{ color: currentTheme.textMuted }}>Pricing</Link>
          <Link href="/signup" className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-lg" style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}>Sign Up</Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 relative">
      {/* Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full animate-pulse transition-colors duration-1000 opacity-[0.15]" 
          style={{ backgroundColor: currentTheme.primary }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full animate-pulse transition-colors duration-1000 opacity-[0.15]" 
          style={{ backgroundColor: currentTheme.secondary, animationDelay: '2s' }} 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] mb-6"
            style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary, borderColor: `${currentTheme.primary}20` }}
          >
            <Sparkles className="w-3 h-3" />
            Welcome Back
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
              <Layout className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-2" style={{ color: currentTheme.text }}>
            Sign In to <span style={{ color: currentTheme.textMuted }}>FormFlow</span>
          </h2>
          <p className="text-sm font-medium" style={{ color: currentTheme.textMuted }}>Continue your journey of building world-class forms.</p>
        </div>

        <div 
          className="p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl border"
          style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 ml-1" style={{ color: currentTheme.textMuted }}>Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: currentTheme.textMuted }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-12 pr-4 py-4 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all outline-none"
                  style={{ 
                    backgroundColor: currentTheme.bg, 
                    borderColor: currentTheme.border, 
                    color: currentTheme.text,
                    '--tw-ring-color': `${currentTheme.primary}20`
                  } as any}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 ml-1" style={{ color: currentTheme.textMuted }}>Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: currentTheme.textMuted }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-12 pr-4 py-4 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all outline-none"
                  style={{ 
                    backgroundColor: currentTheme.bg, 
                    borderColor: currentTheme.border, 
                    color: currentTheme.text,
                    '--tw-ring-color': `${currentTheme.primary}20`
                  } as any}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 group/btn shadow-lg"
              style={{ 
                backgroundColor: currentTheme.primary, 
                color: currentTheme.lightMode ? 'white' : 'black' 
              }}
            >
              {loading ? 'Processing...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: currentTheme.border }} />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="px-4" style={{ backgroundColor: currentTheme.bg, color: currentTheme.textMuted }}>Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-8 w-full py-4 border rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-3"
            style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, color: currentTheme.text }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
               <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
               <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
               <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
               <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Account
          </button>
        </div>

        <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>
          New here?{' '}
          <Link href="/signup" className="hover:opacity-80 transition-colors" style={{ color: currentTheme.primary }}>
            Create an Account
          </Link>
        </p>
      </motion.div>
      </div>
    </div>
  )
}

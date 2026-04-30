'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Star, Sparkles, Layout } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utils/cn'
import { useTheme } from '@/components/ThemeProvider'

export default function Home() {
  const { currentTheme } = useTheme()

  React.useEffect(() => {
    // Catch-all for redirected auth codes that land on the home page
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (code || error) {
      const callbackUrl = new URL('/api/auth/callback', window.location.origin)
      searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value)
      })
      window.location.assign(callbackUrl.toString())
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-500">
      {/* Premium Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 opacity-[0.15]" 
          style={{ backgroundColor: currentTheme.primary }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 opacity-[0.15]" 
          style={{ backgroundColor: currentTheme.secondary, animationDelay: '3s' }} 
        />
        {!currentTheme.lightMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        )}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex items-center justify-between backdrop-blur-md border-b" style={{ backgroundColor: `${currentTheme.bg}10`, borderColor: currentTheme.border }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter" style={{ color: currentTheme.text }}>FormFlow</span>
        </div>
        <div className="flex items-center gap-8">
           <Link href="/pricing" className="text-xs font-bold transition-colors" style={{ color: currentTheme.textMuted }}>Pricing</Link>
           <Link href="/login" className="text-xs font-bold transition-colors" style={{ color: currentTheme.textMuted }}>Login</Link>
           <Link 
             href="/signup" 
             className="px-5 py-2.5 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
             style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}
           >
             Get Started
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 pt-44 pb-32 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border text-[10px] font-black uppercase tracking-widest mb-8"
          style={{ color: currentTheme.primary, borderColor: currentTheme.border }}
        >
          <Sparkles className="w-3 h-3" />
          The Future of Form Building
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl md:text-9xl font-black mb-10 leading-[0.9] tracking-tighter"
          style={{ color: currentTheme.text }}
        >
          Build forms that <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r transition-all duration-1000" style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>convert.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          style={{ color: currentTheme.textMuted }}
        >
          Create stunning, high-performance forms in seconds. 
          Zero bloat, bank-grade security, and 10+ premium themes included.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link
            href="/signup"
            className="w-full sm:w-auto px-10 py-5 text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`, boxShadow: `0 20px 40px ${currentTheme.primary}30` }}
          >
            Start Building Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-10 py-5 bg-white/5 border hover:bg-white/10 font-black rounded-2xl transition-all text-sm uppercase tracking-widest"
            style={{ color: currentTheme.text, borderColor: currentTheme.border }}
          >
            View Pricing
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
           <HeroFeature 
             icon={<Zap />} 
             title="Blazing Fast" 
             desc="Forms that load instantly, ensuring you never lose a lead to slow performance." 
             color={currentTheme.primary} 
           />
           <HeroFeature 
             icon={<Shield />} 
             title="Secure by Default" 
             desc="Enterprise-grade encryption and spam protection built into every form." 
             color={currentTheme.secondary} 
           />
           <HeroFeature 
             icon={<Star />} 
             title="Premium Design" 
             desc="10+ stunning themes that make your forms look like they cost thousands to build." 
             color={currentTheme.primary} 
           />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t mt-20 backdrop-blur-xl" style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.bg}80` }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>
               <Layout className="w-3 h-3 text-white" />
             </div>
             <span className="text-sm font-black tracking-tighter" style={{ color: currentTheme.text }}>FormFlow</span>
           </div>
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>© 2024 FormFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function HeroFeature({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  const { currentTheme } = useTheme()
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2.5rem] border transition-all duration-500"
      style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: `${color}10`, color: color }}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <h3 className="text-xl font-black mb-3" style={{ color: currentTheme.text }}>{title}</h3>
      <p className="text-xs font-medium leading-relaxed" style={{ color: currentTheme.textMuted }}>{desc}</p>
    </motion.div>
  )
}

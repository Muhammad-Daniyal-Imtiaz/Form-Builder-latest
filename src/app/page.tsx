'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Star, Sparkles, Layout, Database, MousePointer2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utils/cn'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Premium Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex items-center justify-between backdrop-blur-md bg-black/10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter">FormFlow</span>
        </div>
        <div className="flex items-center gap-8">
           <Link href="/pricing" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">Pricing</Link>
           <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">Login</Link>
           <Link 
             href="/signup" 
             className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-black hover:scale-105 active:scale-95 transition-all"
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-8"
        >
          <Sparkles className="w-3 h-3" />
          The Future of Form Building
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-7xl md:text-9xl font-black mb-10 leading-[0.9] tracking-tighter"
        >
          Build forms that <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500">convert.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
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
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black rounded-2xl transition-all text-sm uppercase tracking-widest"
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
             color="text-amber-500" 
           />
           <HeroFeature 
             icon={<Shield />} 
             title="Secure by Default" 
             desc="Enterprise-grade encryption and spam protection built into every form." 
             color="text-emerald-500" 
           />
           <HeroFeature 
             icon={<Star />} 
             title="Premium Design" 
             desc="10+ stunning themes that make your forms look like they cost thousands to build." 
             color="text-indigo-500" 
           />
        </div>

        {/* Dynamic Bento Section Mockup */}
        <div className="mt-40 relative">
           <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full" />
           <div className="relative p-1 bg-gradient-to-b from-white/10 to-transparent rounded-[3rem] border border-white/10">
              <div className="bg-[#0c0c0e] rounded-[2.8rem] p-12 flex flex-col items-center justify-center min-h-[400px]">
                 <div className="flex gap-4 mb-8">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center animate-bounce" style={{ animationDelay: `${i*0.2}s` }}>
                          <Layout className="w-5 h-5 text-indigo-500" />
                       </div>
                    ))}
                 </div>
                 <h3 className="text-3xl font-black mb-4 tracking-tight">The ultimate dashboard experience.</h3>
                 <p className="text-gray-500 text-sm max-w-md mx-auto">Manage submissions, track analytics, and integrate with your favorite tools in one beautiful place.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5 mt-20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
               <Layout className="w-3 h-3 text-white" />
             </div>
             <span className="text-sm font-black tracking-tighter">FormFlow</span>
           </div>
           <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
           </div>
           <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">© 2024 FormFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function HeroFeature({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500"
    >
      <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6", color)}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <h3 className="text-xl font-black mb-3">{title}</h3>
      <p className="text-xs font-medium text-gray-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

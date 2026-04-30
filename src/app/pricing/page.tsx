'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Star, Zap, Shield, Crown, Rocket, ArrowRight, Palette, Sparkles, Flame, Droplets, Ghost, Moon, Sun, Laptop } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utils/cn'

// --- THEME DEFINITIONS ---
const themes = [
  { id: 'midnight', name: 'Midnight', primary: '#6366f1', secondary: '#a855f7', bg: '#0a0a0c', card: 'rgba(255, 255, 255, 0.03)', border: 'rgba(255, 255, 255, 0.1)', icon: <Moon className="w-4 h-4" /> },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: '#ff00ff', secondary: '#00ffff', bg: '#050505', card: 'rgba(255, 0, 255, 0.02)', border: 'rgba(255, 0, 255, 0.2)', icon: <Zap className="w-4 h-4" /> },
  { id: 'emerald', name: 'Emerald', primary: '#10b981', secondary: '#34d399', bg: '#06100c', card: 'rgba(16, 185, 129, 0.03)', border: 'rgba(16, 185, 129, 0.1)', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#38bdf8', bg: '#020617', card: 'rgba(14, 165, 233, 0.03)', border: 'rgba(14, 165, 233, 0.1)', icon: <Droplets className="w-4 h-4" /> },
  { id: 'rose', name: 'Rose Gold', primary: '#fb7185', secondary: '#fda4af', bg: '#0f0507', card: 'rgba(251, 113, 133, 0.03)', border: 'rgba(251, 113, 133, 0.1)', icon: <Flame className="w-4 h-4" /> },
  { id: 'luxury', name: 'Luxury Gold', primary: '#eab308', secondary: '#facc15', bg: '#0a0904', card: 'rgba(234, 179, 8, 0.03)', border: 'rgba(234, 179, 8, 0.2)', icon: <Crown className="w-4 h-4" /> },
  { id: 'nebula', name: 'Nebula', primary: '#8b5cf6', secondary: '#ec4899', bg: '#0d0a1a', card: 'rgba(139, 92, 246, 0.03)', border: 'rgba(139, 92, 246, 0.2)', icon: <Ghost className="w-4 h-4" /> },
  { id: 'volcano', name: 'Volcano', primary: '#ef4444', secondary: '#f97316', bg: '#110202', card: 'rgba(239, 68, 68, 0.03)', border: 'rgba(239, 68, 68, 0.1)', icon: <Flame className="w-4 h-4" /> },
  { id: 'minimalist', name: 'White Minimal', primary: '#000000', secondary: '#404040', bg: '#ffffff', card: 'rgba(0, 0, 0, 0.02)', border: 'rgba(0, 0, 0, 0.05)', lightMode: true, icon: <Sun className="w-4 h-4" /> },
  { id: 'dracula', name: 'Dracula', primary: '#bd93f9', secondary: '#ff79c6', bg: '#282a36', card: 'rgba(255, 255, 255, 0.05)', border: 'rgba(189, 147, 249, 0.2)', icon: <Moon className="w-4 h-4" /> },
  { id: 'sakura', name: 'Sakura', primary: '#f9a8d4', secondary: '#fce7f3', bg: '#fff5f7', card: 'rgba(249, 168, 212, 0.1)', border: 'rgba(249, 168, 212, 0.2)', lightMode: true, icon: <Palette className="w-4 h-4" /> },
  { id: 'slate', name: 'Slate Pro', primary: '#475569', secondary: '#94a3b8', bg: '#0f172a', card: 'rgba(255, 255, 255, 0.02)', border: 'rgba(255, 255, 255, 0.1)', icon: <Laptop className="w-4 h-4" /> },
]

const plans = [
  {
    id: 'free',
    name: 'Free',
    subTitle: 'Ad-Supported',
    price: '$0',
    description: 'Perfect for small side projects',
    features: { forms: '5', subs: '1,500', storage: '50 MB', ads: true, aiText: '5/mo', webhooks: false, integrations: 'None' },
    buttonText: 'Get Started',
    icon: <Rocket />
  },
  {
    id: 'micro',
    name: 'Micro',
    price: '$10',
    description: 'For growing individuals',
    features: { forms: '15', subs: '5,000', storage: '500 MB', ads: false, aiText: '25/mo', webhooks: '250 calls', integrations: 'Zapier' },
    buttonText: 'Go Micro',
    icon: <Zap />
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$15',
    description: 'The most powerful choice',
    popular: true,
    features: { forms: '50', subs: '20,000', storage: '2 GB', ads: false, aiText: '100/mo', webhooks: '5k calls', integrations: 'Zapier + Make' },
    buttonText: 'Start Growth',
    icon: <Star />
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$27',
    description: 'For professional teams',
    features: { forms: '200', subs: '100k', storage: '10 GB', ads: false, aiText: '500/mo', webhooks: '25k calls', integrations: 'All + Slack' },
    buttonText: 'Upgrade to Pro',
    icon: <Shield />
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'Unlimited power',
    features: { forms: 'Unlimited', subs: '1M+', storage: '50 GB', ads: false, aiText: 'Unlimited', webhooks: '500k+', integrations: 'All + CRM' },
    buttonText: 'Contact Sales',
    icon: <Crown />
  }
]

export default function PricingPage() {
  const [currentTheme, setCurrentTheme] = useState(themes[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div 
      className={cn(
        "min-h-screen transition-colors duration-1000 overflow-x-hidden",
        currentTheme.lightMode ? "text-gray-900" : "text-white"
      )}
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            background: `radial-gradient(circle at 20% 30%, ${currentTheme.primary}15 0%, transparent 50%), 
                         radial-gradient(circle at 80% 70%, ${currentTheme.secondary}15 0%, transparent 50%)`
          }}
          className="absolute inset-0 blur-[120px]"
        />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Theme Switcher Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 p-1.5 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex gap-1 shadow-2xl overflow-x-auto max-w-[90vw]">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setCurrentTheme(t)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all duration-300",
              currentTheme.id === t.id 
                ? "bg-white text-black shadow-lg scale-105" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            {t.icon}
            {t.name}
          </button>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <div className="text-center mb-24">
          <motion.div
            key={currentTheme.id + 'badge'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest mb-8"
            style={{ color: currentTheme.primary }}
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            World Class Design
          </motion.div>
          
          <motion.h1 
            key={currentTheme.id + 'title'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight"
          >
            Choose your <span className="italic opacity-50">vibe.</span><br />
            Scale your <span style={{ color: currentTheme.primary }}>empire.</span>
          </motion.h1>

          <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className={cn("text-lg max-w-2xl mx-auto font-medium", currentTheme.lightMode ? "text-gray-600" : "text-gray-400")}
          >
            Free plan includes 1,500 submissions/month and 50 MB storage. <br />
            <span className="font-black" style={{ color: currentTheme.primary }}>Upgrade to Micro ($10) for 500 MB storage and no ads.</span>
          </motion.p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {plans.map((plan, idx) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              theme={currentTheme} 
              index={idx}
            />
          ))}
        </div>

        {/* Comparison Reveal Section */}
        <div className="mt-32 text-center">
           <h2 className="text-4xl font-black mb-12">The <span className="opacity-50">Unfair</span> Advantage</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AdvantageCard icon={<Flame />} title="Lightning Fast" desc="Built for performance with zero bloat. Instant form loads, always." theme={currentTheme} />
              <AdvantageCard icon={<Shield />} title="Bank-Grade Security" desc="All submissions are encrypted and stored with the highest standards." theme={currentTheme} />
              <AdvantageCard icon={<Star />} title="Premium UX" desc="Beautiful interfaces that make your brand stand out from the crowd." theme={currentTheme} />
           </div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({ plan, theme, index }: { plan: any; theme: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-700",
        plan.popular ? "scale-105 z-20" : "hover:scale-[1.02]",
        theme.lightMode ? "bg-white/50 border-black/5" : "bg-white/[0.02] border-white/5"
      )}
      style={{ 
        borderColor: isHovered || plan.popular ? `${theme.primary}50` : undefined,
        boxShadow: isHovered || plan.popular ? `0 20px 40px -10px ${theme.primary}15` : undefined
      }}
    >
      {plan.popular && (
        <div 
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white z-10"
          style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
        >
          Most Popular
        </div>
      )}

      {/* Spotlighting Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
            style={{ 
              background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${theme.primary}10, transparent 40%)` 
            }}
          />
        )}
      </AnimatePresence>

      <div className="mb-8 relative z-10">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
        >
          {React.cloneElement(plan.icon, { className: "w-6 h-6" })}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-black">{plan.name}</h3>
          {plan.subTitle && <span className="text-[10px] font-bold opacity-50 uppercase">{plan.subTitle}</span>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black">{plan.price}</span>
          <span className="text-sm opacity-50 font-bold">/mo</span>
        </div>
        <p className="text-[11px] opacity-50 mt-3 font-medium leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className="space-y-4 mb-10 flex-1 relative z-10">
        <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mb-4">Core Features</div>
        <FeatureItem label="Forms" value={plan.features.forms} theme={theme} />
        <FeatureItem label="Submissions" value={plan.features.subs} theme={theme} />
        <FeatureItem label="Storage" value={plan.features.storage} theme={theme} />
        <FeatureItem label="AI Assist" value={plan.features.aiText} theme={theme} />
        
        <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
          <BooleanItem label="No Ads" active={!plan.features.ads} theme={theme} />
          <BooleanItem label="Integrations" active={plan.features.integrations !== 'None'} subText={plan.features.integrations} theme={theme} />
          <BooleanItem label="Webhooks" active={!!plan.features.webhooks} subText={plan.features.webhooks} theme={theme} />
        </div>
      </div>

      <Link
        href="/signup"
        className={cn(
          "relative w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center transition-all duration-500 overflow-hidden group/btn",
          plan.popular ? "text-white" : theme.lightMode ? "bg-black text-white" : "bg-white text-black"
        )}
        style={plan.popular ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` } : {}}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {plan.buttonText}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </span>
      </Link>
    </motion.div>
  )
}

function FeatureItem({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold opacity-50">{label}</span>
      <span className="text-[11px] font-black">{value}</span>
    </div>
  )
}

function BooleanItem({ label, active, theme, subText }: { label: string; active: boolean; theme: any; subText?: string }) {
  return (
    <div className={cn("flex items-start gap-3 transition-opacity duration-500", active ? "opacity-100" : "opacity-20")}>
      <div 
        className={cn("w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5")}
        style={active ? { backgroundColor: `${theme.primary}20`, color: theme.primary } : { backgroundColor: 'rgba(0,0,0,0.1)', color: 'gray' }}
      >
        {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </div>
      <div>
        <div className="text-[11px] font-black tracking-tight">{label}</div>
        {subText && <div className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">{subText}</div>}
      </div>
    </div>
  )
}

function AdvantageCard({ icon, title, desc, theme }: { icon: any; title: string; desc: string; theme: any }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={cn(
        "p-8 rounded-[2rem] border transition-all duration-500 text-left",
        theme.lightMode ? "bg-white border-black/5" : "bg-white/[0.02] border-white/5"
      )}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
        style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
      >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <h3 className="text-xl font-black mb-3">{title}</h3>
      <p className="text-xs font-medium opacity-50 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

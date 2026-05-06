'use client'
//Check this code.
import React from 'react'
import { motion } from 'framer-motion'
import { Check, Star, ArrowRight, Sparkles, Shield, Zap, Database, Globe, Cpu, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/utils/cn'

import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Layout } from 'lucide-react'

export default function PricingPage() {
  const { currentTheme } = useTheme()

  const plans = [
    {
      name: "Free (Ad‑Supported)",
      price: "0",
      description: "Perfect for testing the waters.",
      features: ["5 Forms", "1,500 Submissions/mo", "50 MB Storage", "AI Text‑to‑Form (5/mo)", "AI Image‑to‑Form (1/mo)", "Google Ads Enabled"],
      button: "Get Started",
      popular: false,
      color: "from-gray-500 to-slate-500"
    },
    {
      name: "Micro",
      price: "10",
      description: "For small projects and creators.",
      features: ["15 Forms", "5,000 Submissions/mo", "500 MB Storage", "AI Text‑to‑Form (25/mo)", "AI Image‑to‑Form (5/mo)", "No Ads", "Zapier (basic)"],
      button: "Choose Micro",
      popular: false,
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "Growth",
      price: "15",
      description: "Everything you need to scale fast.",
      features: ["50 Forms", "20,000 Submissions/mo", "2 GB Storage", "AI Text‑to‑Form (100/mo)", "AI Image‑to‑Form (20/mo)", "Remove Branding", "Zapier + Make + Pabbly"],
      button: "Start Growth",
      popular: true,
      color: `from-[${currentTheme.primary}] to-[${currentTheme.secondary}]`
    },
    {
      name: "Pro",
      price: "27",
      description: "The ultimate power user package.",
      features: ["200 Forms", "100,000 Submissions/mo", "10 GB Storage", "AI Text‑to‑Form (500/mo)", "AI Image‑to‑Form (100/mo)", "2 Custom Domains", "Slack/Discord Integrations"],
      button: "Go Pro",
      popular: false,
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Enterprise",
      price: "49+",
      description: "Unmatched scale and support.",
      features: ["Unlimited Forms", "1M+ Submissions/mo", "50 GB Storage", "Unlimited AI Usage", "Unlimited Domains", "CRM (HubSpot, Salesforce)", "Dedicated Support"],
      button: "Contact Sales",
      popular: false,
      color: "from-amber-500 to-orange-500"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-5 flex items-center justify-between backdrop-blur-xl border-b" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter" style={{ color: currentTheme.textPrimary }}>FormFlow</span>
        </Link>

        {/* Global Theme Switcher In Header */}
        <div className="hidden lg:block">
          <ThemeSwitcher />
        </div>

        <div className="flex items-center gap-8">
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

      <div className="flex-1 py-32 px-6 relative">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 opacity-20" 
          style={{ backgroundColor: currentTheme.primary }} 
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 opacity-20" 
          style={{ backgroundColor: currentTheme.secondary, animationDelay: '3s' }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            style={{ color: currentTheme.primary, borderColor: currentTheme.border }}
          >
            <Sparkles className="w-3 h-3" />
            Pricing Plans
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none" style={{ color: currentTheme.text }}>
            Choose your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r transition-all duration-1000" style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>power level.</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto font-medium" style={{ color: currentTheme.textMuted }}>
            Predictable pricing designed for scale. Start free, upgrade as you grow.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-32">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "group relative rounded-[2.5rem] p-8 transition-all duration-500 flex flex-col h-full overflow-hidden",
                plan.popular ? "scale-105 z-20" : "hover:scale-102"
              )}
              style={{ 
                backgroundColor: currentTheme.card,
                border: `1px solid ${plan.popular ? currentTheme.primary : currentTheme.border}`,
                boxShadow: plan.popular ? `0 0 40px ${currentTheme.primary}20` : 'none'
              }}
            >
              {plan.popular && (
                <div 
                  className="absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-1" style={{ color: currentTheme.text }}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black" style={{ color: currentTheme.text }}>${plan.price}</span>
                  <span className="text-xs font-bold" style={{ color: currentTheme.textMuted }}>/mo</span>
                </div>
              </div>

              <p className="text-xs font-medium mb-8 leading-relaxed h-10" style={{ color: currentTheme.textMuted }}>{plan.description}</p>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map(feat => (
                  <div key={feat} className="flex items-start gap-3 group/item">
                    <div 
                      className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      style={{ backgroundColor: `${currentTheme.primary}20` }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: currentTheme.primary }} />
                    </div>
                    <span className="text-[11px] font-bold transition-colors" style={{ color: currentTheme.text }}>{feat}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup"
                className={cn(
                  "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all duration-300 flex items-center justify-center gap-2 group/btn",
                  plan.popular ? "text-black" : "text-white hover:scale-105"
                )}
                style={{ 
                  backgroundColor: plan.popular ? currentTheme.primary : 'rgba(255,255,255,0.05)',
                  color: plan.popular && currentTheme.lightMode ? 'white' : plan.popular ? 'black' : 'white',
                  border: !plan.popular ? `1px solid ${currentTheme.border}` : 'none'
                }}
              >
                {plan.button}
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Section (Simplified for Premium feel) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-20 border-t" style={{ borderColor: currentTheme.border }}>
           <Feature icon={<Shield />} title="Bank-Grade Security" desc="All your form data is encrypted at rest and in transit with enterprise standards." />
           <Feature icon={<Cpu />} title="AI-Powered" desc="Generate complex forms from simple text prompts or even hand-drawn images." />
           <Feature icon={<Globe />} title="Global Infrastructure" desc="Edge-cached forms that load in milliseconds for users anywhere on Earth." />
           <Feature icon={<MessageSquare />} title="24/7 Support" desc="Our growth and pro users get priority access to our dedicated engineering team." />
        </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  const { currentTheme } = useTheme()
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary }}>
        {React.cloneElement(icon, { className: "w-6 h-6", strokeWidth: 2.5 })}
      </div>
      <h3 className="text-xl font-black tracking-tight" style={{ color: currentTheme.text }}>{title}</h3>
      <p className="text-sm font-medium leading-relaxed" style={{ color: currentTheme.textMuted }}>{desc}</p>
    </div>
  )
}

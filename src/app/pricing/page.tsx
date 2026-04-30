'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Star, Zap, Shield, Crown, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utils/cn'

const plans = [
  {
    name: 'Free (Ad-Supported)',
    price: '$0',
    description: 'Perfect for small side projects',
    features: {
      forms: '5',
      submissions: '1,500',
      storage: '50 MB',
      customDomain: false,
      removeBranding: false,
      googleAds: true,
      aiText: '5/mo',
      aiImage: '1/mo',
      webhooks: false,
      integrations: 'None'
    },
    buttonText: 'Get Started',
    buttonClass: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    icon: <Rocket className="w-6 h-6 text-gray-400" />
  },
  {
    name: 'Micro',
    price: '$10',
    description: 'For growing individuals',
    features: {
      forms: '15',
      submissions: '5,000',
      storage: '500 MB',
      customDomain: false,
      removeBranding: false,
      googleAds: false,
      aiText: '25/mo',
      aiImage: '5/mo',
      webhooks: '250 calls',
      integrations: 'Zapier (basic)'
    },
    buttonText: 'Go Micro',
    buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
    icon: <Zap className="w-6 h-6 text-indigo-500" />
  },
  {
    name: 'Growth',
    price: '$15',
    description: 'The most powerful choice for businesses',
    popular: true,
    features: {
      forms: '50',
      submissions: '20,000',
      storage: '2 GB',
      customDomain: false,
      removeBranding: true,
      googleAds: false,
      aiText: '100/mo',
      aiImage: '20/mo',
      webhooks: '5,000 calls',
      integrations: 'Zapier + Make + Pabbly'
    },
    buttonText: 'Start Growth',
    buttonClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-xl shadow-indigo-500/20',
    icon: <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
  },
  {
    name: 'Pro',
    price: '$27',
    description: 'For professional teams',
    features: {
      forms: '200',
      submissions: '100,000',
      storage: '10 GB',
      customDomain: '2 domains',
      removeBranding: true,
      googleAds: false,
      aiText: '500/mo',
      aiImage: '100/mo',
      webhooks: '25,000 calls',
      integrations: 'All + custom webhooks + Slack/Discord'
    },
    buttonText: 'Upgrade to Pro',
    buttonClass: 'bg-gray-900 text-white hover:bg-black',
    icon: <Shield className="w-6 h-6 text-indigo-400" />
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    subPrice: '($49+)',
    description: 'Unlimited power for big teams',
    features: {
      forms: 'Unlimited',
      submissions: '1,000,000+',
      storage: '50 GB',
      customDomain: 'Unlimited',
      removeBranding: true,
      googleAds: false,
      aiText: 'Unlimited',
      aiImage: 'Unlimited',
      webhooks: '500k+ calls',
      integrations: 'All + CRM (HubSpot, Salesforce)'
    },
    buttonText: 'Contact Sales',
    buttonClass: 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50',
    icon: <Crown className="w-6 h-6 text-violet-600" />
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Zap className="w-3 h-3" />
            Simple Pricing
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
          >
            Scale Your Forms,<br />Not Your Costs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Free plan includes 1,500 submissions/month and 50 MB storage. <br />
            <span className="text-indigo-400 font-semibold">Upgrade to Micro ($10) for 500 MB storage and no ads.</span>
          </motion.p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={cn(
                "relative group flex flex-col p-8 rounded-3xl border transition-all duration-500",
                plan.popular 
                  ? "bg-white/[0.03] border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-20" 
                  : "bg-white/[0.01] border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-indigo-500/40">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.subPrice && <span className="text-sm text-gray-500 font-bold">{plan.subPrice}</span>}
                  <span className="text-gray-500 text-sm font-medium">/mo</span>
                </div>
                <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                <FeatureItem label="Forms" value={plan.features.forms} />
                <FeatureItem label="Submissions" value={plan.features.submissions} />
                <FeatureItem label="Storage" value={plan.features.storage} />
                <FeatureItem label="AI Text" value={plan.features.aiText} />
                <FeatureItem label="Webhooks" value={plan.features.webhooks} />
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <BooleanItem label="Remove Branding" active={plan.features.removeBranding} />
                  <BooleanItem label="Custom Domain" active={!!plan.features.customDomain} subText={plan.features.customDomain as string} />
                  <BooleanItem label="Ad-Free" active={!plan.features.googleAds} inverse labelIfFalse="Ad-Supported" />
                </div>
              </div>

              <Link
                href="/login"
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-black text-center transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group/btn",
                  plan.buttonClass
                )}
              >
                {plan.buttonText}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Details / Strategic Advice Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-[40px] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-6">Why our $15 Growth plan is <span className="text-indigo-500">the best choice</span></h2>
              <div className="space-y-6">
                <ComparisonPoint 
                  title="Unbeatable Volume" 
                  desc="20,000 submissions/month covers 99% of small businesses. That's 20x more than most competitors offer at this price." 
                />
                <ComparisonPoint 
                  title="Professional Identity" 
                  desc="Remove all 'Powered by' branding and keep your professional look. Most competitors lock this behind $30+ tiers." 
                />
                <ComparisonPoint 
                  title="Automation Power" 
                  desc="5,000 webhook calls and full Zapier/Make/Pabbly integration included. Build complex workflows without hitting limits." 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                 <div className="text-3xl font-black text-indigo-500 mb-1">20k</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Submissions</div>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                 <div className="text-3xl font-black text-violet-500 mb-1">2GB</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Storage</div>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                 <div className="text-3xl font-black text-emerald-500 mb-1">Free</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Branding Removal</div>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                 <div className="text-3xl font-black text-amber-500 mb-1">100/mo</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Generations</div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function FeatureItem({ label, value }: { label: string; value: string | boolean }) {
  if (!value || value === 'No' || value === false) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs font-bold text-gray-200">{value === true ? 'Unlimited' : value}</span>
    </div>
  )
}

function BooleanItem({ label, active, subText, inverse, labelIfFalse }: { label: string; active: boolean; subText?: string; inverse?: boolean; labelIfFalse?: string }) {
  const isActuallyActive = inverse ? !active : active;
  return (
    <div className={cn("flex items-center gap-3", active || (inverse && !active) ? "opacity-100" : "opacity-30")}>
      <div className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center",
        active ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-gray-600"
      )}>
        {active ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-300">
          {active ? label : (labelIfFalse || label)}
        </div>
        {active && subText && <div className="text-[10px] text-indigo-500 font-medium">{subText}</div>}
      </div>
    </div>
  )
}

function ComparisonPoint({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-indigo-400" />
      </div>
      <div>
        <div className="text-sm font-bold mb-1">{title}</div>
        <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  )
}

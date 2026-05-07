'use client'

import React from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import FormCard from './FormCard'
import ImportButton from './ImportButton'
import { Layout, Plus, Info, LayoutGrid, List } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/utils/cn'

import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function DashboardClient({ user, dbUser, forms, siteUrl }: any) {
  const { currentTheme } = useTheme()

  return (
    <div className="min-h-screen relative transition-colors duration-500">
      {/* Premium Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 opacity-[0.08]" 
          style={{ backgroundColor: currentTheme.primary }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000 opacity-[0.08]" 
          style={{ backgroundColor: currentTheme.secondary }}
        />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 px-8 py-4 flex justify-between items-center backdrop-blur-xl border-b" style={{ backgroundColor: `${currentTheme.bg}40`, borderColor: currentTheme.border }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter" style={{ color: currentTheme.text }}>
            Form Sync <span style={{ color: currentTheme.textMuted }} className="font-medium">Dashboard</span>
          </span>
        </div>

        {/* Global Theme Switcher In Header */}
        <div className="hidden lg:block">
          <ThemeSwitcher />
        </div>
        
        <div className="flex items-center gap-8">
          <Link 
            href="/dashboard/json-guide"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors hover:text-white"
            style={{ color: currentTheme.textMuted }}
          >
            <Info className="w-3.5 h-3.5" />
            JSON Guide
          </Link>
          <div className="w-px h-6" style={{ backgroundColor: currentTheme.border }} />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black" style={{ color: currentTheme.text }}>{dbUser?.name || user.user_metadata?.name || 'User'}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: currentTheme.primary }}>{dbUser?.role || 'Basic Plan'}</span>
            </div>
            <div className="w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-8">
          <div className="space-y-2">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.primary, borderColor: `${currentTheme.primary}20` }}
            >
              Overview
            </div>
            <h2 className="text-5xl font-black tracking-tighter" style={{ color: currentTheme.text }}>Your Creations</h2>
            <p className="font-medium max-w-md" style={{ color: currentTheme.textMuted }}>Manage your high-performance forms and analyze real-time response data.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex p-1 rounded-xl border mr-4" style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}>
                <button className="p-2 rounded-lg" style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.text }}><LayoutGrid className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg" style={{ color: currentTheme.textMuted }}><List className="w-4 h-4" /></button>
             </div>
             <ImportButton />
             <Link
               href="/dashboard/forms/new"
               className="inline-flex items-center px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
               style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}
             >
               <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
               Create Form
             </Link>
          </div>
        </div>

        {forms?.length === 0 ? (
          <div 
            className="text-center py-32 rounded-[3rem] border border-dashed flex flex-col items-center justify-center group transition-colors duration-500"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
          >
            <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${currentTheme.primary}10`, color: currentTheme.textMuted }}>
              <Layout className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight" style={{ color: currentTheme.text }}>Your space is empty.</h3>
            <p className="max-w-xs mx-auto text-sm font-medium leading-relaxed mb-8" style={{ color: currentTheme.textMuted }}>Click "Create Form" or import a JSON definition to get started on your journey.</p>
             <Link
               href="/dashboard/forms/new"
               className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:opacity-80"
               style={{ color: currentTheme.primary }}
             >
               Create your first form <Plus className="w-3 h-3" />
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms?.map((form: any) => (
              <FormCard key={form.id} form={form} siteUrl={siteUrl} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

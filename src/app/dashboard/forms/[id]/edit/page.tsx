'use client'

import { use } from 'react'
import { BuilderProvider } from '@/components/builder/BuilderContext'
import { Sidebar } from '@/components/builder/Sidebar'
import { Canvas } from '@/components/builder/Canvas'
import { FieldSettingsPanel } from '@/components/builder/FieldSettingsPanel'
import { ArrowLeft, Save, Eye, Loader2, Globe, FileText } from 'lucide-react'
import Link from 'next/link'
import { useBuilder } from '@/components/builder/BuilderContext'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/utils/cn'

import { ThemeSwitcher } from '@/components/ThemeSwitcher'

function BuilderHeader() {
  const { form, saving, saved, save, loading, formId, updateFormDetails } = useBuilder()
  const { currentTheme } = useTheme()

  if (loading) return null

  const formPublicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/f/${formId}?preview=true`

  return (
    <header 
      className="h-16 border-b sticky top-0 z-50 flex items-center justify-between px-6 shrink-0 backdrop-blur-xl transition-colors duration-500"
      style={{ backgroundColor: `${currentTheme.bg}80`, borderColor: currentTheme.border }}
    >
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="p-2 rounded-xl transition-all group"
          style={{ color: currentTheme.textMuted, backgroundColor: currentTheme.card }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="w-px h-6" style={{ backgroundColor: currentTheme.border }} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none" style={{ color: currentTheme.primary }}>Form Sync</p>
          <p className="text-sm font-black truncate max-w-[200px] sm:max-w-xs mt-1" style={{ color: currentTheme.text }}>
            {form?.title || 'Untitled Form'}
          </p>
        </div>
      </div>

      {/* Global Theme Switcher In Header */}
      <div className="hidden lg:block">
        <ThemeSwitcher />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateFormDetails({ published: !form?.published })}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
            form?.published ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full", form?.published ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
          {form?.published ? 'Live' : 'Draft'}
        </button>

        <a
          href={formPublicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border"
          style={{ color: currentTheme.textMuted, borderColor: currentTheme.border, backgroundColor: currentTheme.card }}
        >
          <Eye className="w-4 h-4" />
          Preview
        </a>

        <button
          onClick={save}
          disabled={saving || saved}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:scale-100 active:scale-95 group/btn"
          style={{ 
            backgroundColor: currentTheme.primary, 
            color: currentTheme.lightMode ? 'white' : 'black' 
          }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            'Saved!'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </header>
  )
}

function BuilderLayout() {
  const { loading, error } = useBuilder()
  const { currentTheme } = useTheme()

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: currentTheme.bg }}>
        <div 
          className="rounded-[2.5rem] p-12 max-w-md text-center border shadow-2xl"
          style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
        >
          <h2 className="text-2xl font-black mb-4 tracking-tight" style={{ color: currentTheme.text }}>Error Loading Builder</h2>
          <p className="text-sm font-medium mb-8" style={{ color: currentTheme.textMuted }}>{error}</p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all"
            style={{ backgroundColor: currentTheme.primary, color: currentTheme.lightMode ? 'white' : 'black' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Safety
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500" style={{ backgroundColor: currentTheme.bg }}>
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-spin" style={{ background: `linear-gradient(to bottom right, ${currentTheme.primary}, ${currentTheme.secondary})` }}>
             <Loader2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-[10px] font-black tracking-[0.3em] uppercase transition-colors" style={{ color: currentTheme.textMuted }}>Initializing Studio</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden transition-colors duration-500" style={{ backgroundColor: currentTheme.bg }}>
      <BuilderHeader />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.05]">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 blur-[100px] rounded-full" style={{ backgroundColor: currentTheme.primary }} />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 blur-[100px] rounded-full" style={{ backgroundColor: currentTheme.secondary }} />
        </div>
        <Sidebar />
        <Canvas />
        <FieldSettingsPanel />
      </div>
    </div>
  )
}

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return (
    <BuilderProvider formId={resolvedParams.id}>
      <BuilderLayout />
    </BuilderProvider>
  )
}
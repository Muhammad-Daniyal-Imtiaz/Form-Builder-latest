'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Moon, Zap, Sparkles, Droplets, Flame, Crown, Ghost, Sun, Palette, Laptop, Shield, Diamond } from 'lucide-react'

export type Theme = {
  id: string
  name: string
  primary: string
  secondary: string
  bg: string
  card: string
  border: string
  text: string
  textMuted: string
  lightMode?: boolean
  icon: React.ReactNode
}
export const themes: Theme[] = [
// --- PROFESSIONAL LIGHT (PRIORITY) ---
  { 
    id: 'minimalist', 
    name: 'Pure Minimal', 
    primary: '#000000', 
    secondary: '#404040', 
    bg: '#ffffff', 
    card: '#f9fafb', 
    border: '#f3f4f6', 
    text: '#111827', 
    textMuted: '#6b7280', 
    lightMode: true, 
    icon: <Sun className="w-4 h-4" /> 
  },
  { 
    id: 'ivory', 
    name: 'Ivory Elegance', 
    primary: '#c2a35d', 
    secondary: '#e2d1a8', 
    bg: '#fcfaf2', 
    card: '#ffffff', 
    border: '#e7e3d1', 
    text: '#2d2926', 
    textMuted: '#7c7467', 
    lightMode: true, 
    icon: <Crown className="w-4 h-4" /> 
  },
  { 
    id: 'sky', 
    name: 'Sky Breeze', 
    primary: '#0ea5e9', 
    secondary: '#7dd3fc', 
    bg: '#f0f9ff', 
    card: '#ffffff', 
    border: '#e0f2fe', 
    text: '#0c4a6e', 
    textMuted: '#7dd3fc', 
    lightMode: true, 
    icon: <Droplets className="w-4 h-4" /> 
  },
  { 
    id: 'lavender', 
    name: 'Lavender Mist', 
    primary: '#8b5cf6', 
    secondary: '#c4b5fd', 
    bg: '#f5f3ff', 
    card: '#ffffff', 
    border: '#ede9fe', 
    text: '#4c1d95', 
    textMuted: '#a78bfa', 
    lightMode: true, 
    icon: <Sparkles className="w-4 h-4" /> 
  },
  { 
    id: 'mint', 
    name: 'Mint Fresh', 
    primary: '#10b981', 
    secondary: '#6ee7b7', 
    bg: '#f0fdf4', 
    card: '#ffffff', 
    border: '#dcfce7', 
    text: '#064e3b', 
    textMuted: '#34d399', 
    lightMode: true, 
    icon: <Droplets className="w-4 h-4" /> 
  },
  { 
    id: 'soft-slate', 
    name: 'Soft Slate', 
    primary: '#475569', 
    secondary: '#64748b', 
    bg: '#f8fafc', 
    card: '#ffffff', 
    border: '#e2e8f0', 
    text: '#0f172a', 
    textMuted: '#64748b', 
    lightMode: true, 
    icon: <Laptop className="w-4 h-4" /> 
  },

  // --- PROFESSIONAL DARK (SOFTER) ---
  { 
    id: 'midnight', 
    name: 'Midnight Pro', 
    primary: '#6366f1', 
    secondary: '#a855f7', 
    bg: '#0f111a', 
    card: 'rgba(255, 255, 255, 0.04)', 
    border: 'rgba(255, 255, 255, 0.08)', 
    text: '#ffffff', 
    textMuted: '#94a3b8', 
    icon: <Moon className="w-4 h-4" /> 
  },
  { 
    id: 'slate', 
    name: 'Slate Enterprise', 
    primary: '#94a3b8', 
    secondary: '#cbd5e1', 
    bg: '#1e293b', 
    card: 'rgba(255, 255, 255, 0.03)', 
    border: 'rgba(255, 255, 255, 0.07)', 
    text: '#f1f5f9', 
    textMuted: '#94a3b8', 
    icon: <Laptop className="w-4 h-4" /> 
  },
  { 
    id: 'luxury', 
    name: 'Executive Gold', 
    primary: '#d4af37', 
    secondary: '#f1c40f', 
    bg: '#141410', 
    card: 'rgba(212, 175, 55, 0.04)', 
    border: 'rgba(212, 175, 55, 0.15)', 
    text: '#ffffff', 
    textMuted: '#8b7d4b', 
    icon: <Crown className="w-4 h-4" /> 
  },
  { 
    id: 'nebula', 
    name: 'Nebula Pro', 
    primary: '#8b5cf6', 
    secondary: '#d946ef', 
    bg: '#120d1d', 
    card: 'rgba(139, 92, 246, 0.04)', 
    border: 'rgba(139, 92, 246, 0.1)', 
    text: '#ffffff', 
    textMuted: '#a78bfa', 
    icon: <Sparkles className="w-4 h-4" /> 
  },
  { 
    id: 'rose', 
    name: 'Modern Rose', 
    primary: '#fb7185', 
    secondary: '#e11d48', 
    bg: '#0a0506', 
    card: 'rgba(251, 113, 133, 0.02)', 
    border: 'rgba(251, 113, 133, 0.08)', 
    text: '#ffffff', 
    textMuted: '#881337', 
    icon: <Palette className="w-4 h-4" /> 
  },
  { 
    id: 'dracula', 
    name: 'Modern Dark', 
    primary: '#bd93f9', 
    secondary: '#ff79c6', 
    bg: '#1a1b26', 
    card: 'rgba(255, 255, 255, 0.02)', 
    border: 'rgba(255, 255, 255, 0.05)', 
    text: '#a9b1d6', 
    textMuted: '#565f89', 
    icon: <Moon className="w-4 h-4" /> 
  },
  { 
    id: 'cyber', 
    name: 'Deep Tech', 
    primary: '#00f2ff', 
    secondary: '#7000ff', 
    bg: '#020205', 
    card: 'rgba(0, 242, 255, 0.02)', 
    border: 'rgba(0, 242, 255, 0.1)', 
    text: '#ffffff', 
    textMuted: '#003333', 
    icon: <Zap className="w-4 h-4" /> 
  },
]

type ThemeContextType = {
  currentTheme: Theme
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])

  useEffect(() => {
    const savedThemeId = localStorage.getItem('app-theme')
    if (savedThemeId) {
      const theme = themes.find(t => t.id === savedThemeId)
      if (theme) setCurrentTheme(theme)
    }

    // Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'app-theme') {
        const theme = themes.find(t => t.id === e.newValue)
        if (theme) setCurrentTheme(theme)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = (id: string) => {
    const theme = themes.find(t => t.id === id)
    if (theme) {
      setCurrentTheme(theme)
      localStorage.setItem('app-theme', id)
    }
  }

  // Inject CSS Variables for global styling
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--theme-bg', currentTheme.bg)
    root.style.setProperty('--theme-text', currentTheme.text)
    root.style.setProperty('--theme-text-muted', currentTheme.textMuted)
    root.style.setProperty('--theme-primary', currentTheme.primary)
    root.style.setProperty('--theme-secondary', currentTheme.secondary)
    root.style.setProperty('--theme-border', currentTheme.border)
    root.style.setProperty('--theme-card', currentTheme.card)
    
    if (currentTheme.lightMode) {
      root.classList.add('light-mode')
    } else {
      root.classList.remove('light-mode')
    }
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      <div 
        className="min-h-screen transition-colors duration-500"
        style={{ 
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-text)'
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Moon, Zap, Sparkles, Droplets, Flame, Crown, Ghost, Sun, Palette, Laptop } from 'lucide-react'

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
  { id: 'midnight', name: 'Midnight', primary: '#6366f1', secondary: '#a855f7', bg: '#050507', card: 'rgba(255, 255, 255, 0.03)', border: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', textMuted: '#94a3b8', icon: <Moon className="w-4 h-4" /> },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: '#ff00ff', secondary: '#00ffff', bg: '#050505', card: 'rgba(255, 0, 255, 0.02)', border: 'rgba(255, 0, 255, 0.2)', text: '#ffffff', textMuted: '#ff00ff80', icon: <Zap className="w-4 h-4" /> },
  { id: 'emerald', name: 'Emerald', primary: '#10b981', secondary: '#34d399', bg: '#06100c', card: 'rgba(16, 185, 129, 0.03)', border: 'rgba(16, 185, 129, 0.1)', text: '#ffffff', textMuted: '#6ee7b7', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#38bdf8', bg: '#020617', card: 'rgba(14, 165, 233, 0.03)', border: 'rgba(14, 165, 233, 0.1)', text: '#ffffff', textMuted: '#7dd3fc', icon: <Droplets className="w-4 h-4" /> },
  { id: 'rose', name: 'Rose Gold', primary: '#fb7185', secondary: '#fda4af', bg: '#0f0507', card: 'rgba(251, 113, 133, 0.03)', border: 'rgba(251, 113, 133, 0.1)', text: '#ffffff', textMuted: '#fda4af', icon: <Flame className="w-4 h-4" /> },
  { id: 'luxury', name: 'Luxury Gold', primary: '#eab308', secondary: '#facc15', bg: '#0a0904', card: 'rgba(234, 179, 8, 0.03)', border: 'rgba(234, 179, 8, 0.2)', text: '#ffffff', textMuted: '#fde047', icon: <Crown className="w-4 h-4" /> },
  { id: 'nebula', name: 'Nebula', primary: '#8b5cf6', secondary: '#ec4899', bg: '#0d0a1a', card: 'rgba(139, 92, 246, 0.03)', border: 'rgba(139, 92, 246, 0.2)', text: '#ffffff', textMuted: '#c084fc', icon: <Ghost className="w-4 h-4" /> },
  { id: 'volcano', name: 'Volcano', primary: '#ef4444', secondary: '#f97316', bg: '#110202', card: 'rgba(239, 68, 68, 0.03)', border: 'rgba(239, 68, 68, 0.1)', text: '#ffffff', textMuted: '#f87171', icon: <Flame className="w-4 h-4" /> },
  { id: 'minimalist', name: 'White Minimal', primary: '#000000', secondary: '#404040', bg: '#ffffff', card: 'rgba(0, 0, 0, 0.02)', border: 'rgba(0, 0, 0, 0.08)', text: '#000000', textMuted: '#666666', lightMode: true, icon: <Sun className="w-4 h-4" /> },
  { id: 'dracula', name: 'Dracula', primary: '#bd93f9', secondary: '#ff79c6', bg: '#282a36', card: 'rgba(255, 255, 255, 0.05)', border: 'rgba(189, 147, 249, 0.2)', text: '#f8f8f2', textMuted: '#6272a4', icon: <Moon className="w-4 h-4" /> },
  { id: 'sakura', name: 'Sakura', primary: '#f9a8d4', secondary: '#fce7f3', bg: '#fff5f7', card: 'rgba(249, 168, 212, 0.1)', border: 'rgba(249, 168, 212, 0.2)', text: '#1a0d14', textMuted: '#d946ef', lightMode: true, icon: <Palette className="w-4 h-4" /> },
  { id: 'slate', name: 'Slate Pro', primary: '#475569', secondary: '#94a3b8', bg: '#0f172a', card: 'rgba(255, 255, 255, 0.02)', border: 'rgba(255, 255, 255, 0.1)', text: '#f1f5f9', textMuted: '#94a3b8', icon: <Laptop className="w-4 h-4" /> },
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

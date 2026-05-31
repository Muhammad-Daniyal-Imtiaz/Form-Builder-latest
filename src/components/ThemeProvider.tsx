'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { themes as formThemes, applyTheme, initTheme, type ThemeTokens } from '@/lib/themeEngine'
import { Moon, Sun, Sparkles, Droplets, Palette } from 'lucide-react'

export type Theme = ThemeTokens & {
  id: string;
  icon: React.ReactNode;
  bg: string; // for compatibility
  text: string; // for compatibility
  textMuted: string; // for compatibility
  border: string; // for compatibility
  card: string; // for compatibility
  lightMode?: boolean;
}

const themeIcons: Record<string, React.ReactNode> = {
  'midnight-galaxy': <Sparkles className="w-4 h-4" />,
  'slate-minimal': <Moon className="w-4 h-4" />,
  'nordic-frost': <Sun className="w-4 h-4" />,
  'charcoal-cream': <Palette className="w-4 h-4" />,
  'serene-oasis': <Droplets className="w-4 h-4" />,
  'vibrant-brutalist': <Palette className="w-4 h-4" />
}

export const themes: Theme[] = Object.entries(formThemes).map(([id, t]) => ({
  ...t,
  id,
  icon: themeIcons[id] || <Palette className="w-4 h-4" />,
  bg: t.pageBg,
  text: t.textPrimary,
  textMuted: t.textSecondary,
  border: t.borderLight,
  card: t.cardBg,
  lightMode: id === 'serene-oasis' || id === 'vibrant-brutalist'
}))

type ThemeContextType = {
  currentTheme: Theme
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])

  useEffect(() => {
    const savedId = initTheme('midnight-galaxy')
    const theme = themes.find(t => t.id === savedId)
    if (theme) setCurrentTheme(theme)

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
    if (applyTheme(id)) {
      const theme = themes.find(t => t.id === id)
      if (theme) setCurrentTheme(theme)
    }
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      <div 
        className="min-h-screen transition-colors duration-500"
        style={{ 
          backgroundColor: currentTheme.pageBg,
          color: currentTheme.textPrimary
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

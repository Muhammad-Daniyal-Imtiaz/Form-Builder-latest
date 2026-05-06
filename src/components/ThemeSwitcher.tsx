'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { themes, useTheme } from './ThemeProvider'
import { cn } from '@/utils/cn'

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme()

  return (
    <div 
      className={cn(
        "p-1.5 rounded-xl flex gap-1 transition-all duration-500",
        currentTheme.lightMode 
          ? "bg-black/5" 
          : "bg-white/5"
      )}
    >
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black transition-all duration-300 relative group",
            currentTheme.id === t.id 
              ? (currentTheme.lightMode ? "bg-white text-black shadow-sm" : "bg-white/10 text-white shadow-sm")
              : (currentTheme.lightMode ? "text-gray-500 hover:text-black" : "text-gray-400 hover:text-white")
          )}
        >
          <span className={cn(
            "transition-transform duration-300",
            currentTheme.id === t.id ? "scale-110" : "group-hover:scale-110"
          )}>
            {t.icon}
          </span>
          <span className="hidden md:inline tracking-tight">{t.name}</span>
        </button>
      ))}
    </div>
  )
}

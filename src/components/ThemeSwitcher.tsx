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
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] p-2 rounded-2xl backdrop-blur-2xl border flex gap-1.5 shadow-2xl overflow-x-auto max-w-[95vw] no-scrollbar transition-all duration-500",
        currentTheme.lightMode 
          ? "bg-white/70 border-black/5 ring-1 ring-black/5" 
          : "bg-black/40 border-white/10 ring-1 ring-white/5"
      )}
    >
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all duration-300 relative group",
            currentTheme.id === t.id 
              ? (currentTheme.lightMode ? "bg-black text-white shadow-xl scale-105" : "bg-white text-black shadow-xl scale-105")
              : (currentTheme.lightMode ? "text-gray-500 hover:bg-black/5" : "text-gray-400 hover:bg-white/5")
          )}
        >
          <span className={cn(
            "transition-transform duration-300",
            currentTheme.id === t.id ? "scale-110" : "group-hover:scale-110"
          )}>
            {t.icon}
          </span>
          <span className="hidden sm:inline tracking-tight">{t.name}</span>
          
          {currentTheme.id === t.id && (
            <motion.div 
              layoutId="active-pill"
              className="absolute inset-0 rounded-xl -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

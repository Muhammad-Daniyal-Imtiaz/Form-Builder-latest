'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { themes, useTheme } from './ThemeProvider'
import { cn } from '@/utils/cn'

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] p-1.5 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex gap-1 shadow-2xl overflow-x-auto max-w-[90vw] no-scrollbar">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.name}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all duration-300",
            currentTheme.id === t.id 
              ? "bg-white text-black shadow-lg scale-105" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.name}</span>
        </button>
      ))}
    </div>
  )
}

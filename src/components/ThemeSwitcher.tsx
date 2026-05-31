'use client'

import React, { useState, useRef, useEffect } from 'react'
import { themes, useTheme } from './ThemeProvider'
import { cn } from '@/utils/cn'
import { ChevronDown, Palette, Check } from 'lucide-react'

export function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative z-[999]">
      {/* Premium Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border shadow-sm hover:scale-[1.02] active:scale-[0.98]",
          currentTheme.lightMode
            ? "bg-white border-black/10 text-black hover:bg-black/[0.02]"
            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
        )}
      >
        <span className="scale-110">{currentTheme.icon}</span>
        <span className="font-extrabold tracking-tight">{currentTheme.name}</span>
        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-300 opacity-60",
            isOpen ? "transform rotate-180" : ""
          )} 
        />
      </button>

      {/* Styled Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2",
            currentTheme.lightMode
              ? "bg-white/95 border-black/10 text-black"
              : "bg-black/90 border-white/10 text-white"
          )}
        >
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] opacity-40">
            Select Visual Theme
          </div>

          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group text-left",
                  currentTheme.id === t.id
                    ? (currentTheme.lightMode ? "bg-black/5" : "bg-white/10")
                    : (currentTheme.lightMode ? "hover:bg-black/[0.03]" : "hover:bg-white/5")
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <span className={cn(
                    "transition-transform duration-300 text-sm",
                    currentTheme.id === t.id ? "scale-110" : "group-hover:scale-110"
                  )}>
                    {t.icon}
                  </span>

                  {/* Name & Accent Dot */}
                  <div className="flex flex-col">
                    <span className="font-extrabold tracking-tight">{t.name}</span>
                    <div className="flex gap-1.5 mt-1 items-center">
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" 
                        style={{ backgroundColor: t.primary }}
                      />
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" 
                        style={{ backgroundColor: t.secondary }}
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Checkmark */}
                {currentTheme.id === t.id && (
                  <Check className="w-3.5 h-3.5 opacity-80" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

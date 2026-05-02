'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { GripVertical, Trash2, Copy, Plus, Palette, RotateCcw } from 'lucide-react'
import { useBuilder } from './BuilderContext'
import { FormField } from './types'
import { cn } from '@/utils/cn'
import { useTheme } from '@/components/ThemeProvider'

// ─── Color preset swatches ────────────────────────────────────────────────────
const BG_PRESETS = [
  { label: 'White',        value: '#ffffff' },
  { label: 'Light Gray',   value: '#f8fafc' },
  { label: 'Warm Gray',    value: '#fafafa' },
  { label: 'Light Blue',   value: '#eff6ff' },
  { label: 'Light Indigo', value: '#eef2ff' },
  { label: 'Light Purple', value: '#faf5ff' },
  { label: 'Light Pink',   value: '#fdf2f8' },
  { label: 'Light Green',  value: '#f0fdf4' },
  { label: 'Light Yellow', value: '#fefce8' },
  { label: 'Light Orange', value: '#fff7ed' },
  { label: 'Light Red',    value: '#fff1f2' },
  { label: 'Light Teal',   value: '#f0fdfa' },
  { label: 'Slate',        value: '#f1f5f9' },
  { label: 'Dark',         value: '#1e293b' },
  { label: 'Black',        value: '#000000' },
]

const TEXT_PRESETS = [
  { label: 'Dark',     value: '#111827' },
  { label: 'Gray',     value: '#6b7280' },
  { label: 'Slate',    value: '#334155' },
  { label: 'Indigo',   value: '#4f46e5' },
  { label: 'Purple',   value: '#7c3aed' },
  { label: 'Blue',     value: '#2563eb' },
  { label: 'Green',    value: '#059669' },
  { label: 'Red',      value: '#dc2626' },
  { label: 'Orange',   value: '#ea580c' },
  { label: 'White',    value: '#ffffff' },
]

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface ContextMenuProps {
  x: number
  y: number
  field: FormField
  onClose: () => void
  onChangeBg: (color: string) => void
  onChangeText: (color: string) => void
  onReset: () => void
}

function FieldContextMenu({ x, y, field, onClose, onChangeBg, onChangeText, onReset }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'bg' | 'text'>('bg')

  // Close on outside click or Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Clamp position so menu doesn't go off-screen
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    setPos({
      x: x + rect.width > vw ? x - rect.width : x,
      y: y + rect.height > vh ? y - rect.height : y,
    })
  }, [x, y])

  const presets = tab === 'bg' ? BG_PRESETS : TEXT_PRESETS
  const currentColor = tab === 'bg' ? (field.fieldBg || '#ffffff') : (field.fieldTextColor || '#111827')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ duration: 0.12 }}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Change Color</span>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('bg')}
            className={cn(
              "flex-1 text-[10px] font-black py-1 rounded-md transition-all",
              tab === 'bg' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"
            )}
          >Background</button>
          <button
            onClick={() => setTab('text')}
            className={cn(
              "flex-1 text-[10px] font-black py-1 rounded-md transition-all",
              tab === 'text' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"
            )}
          >Text Color</button>
        </div>
      </div>

      {/* Swatches */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {presets.map((p) => (
            <button
              key={p.value}
              title={p.label}
              onClick={() => { tab === 'bg' ? onChangeBg(p.value) : onChangeText(p.value) }}
              className="group relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md"
              style={{
                backgroundColor: p.value,
                borderColor: currentColor === p.value ? '#6366f1' : '#e5e7eb',
              }}
            >
              {currentColor === p.value && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={p.value === '#ffffff' || p.value === '#fefce8' || p.value === '#fff7ed' || p.value === '#fafafa' || p.value === '#f8fafc' ? '#4f46e5' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom color picker */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0 cursor-pointer shadow-sm">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => tab === 'bg' ? onChangeBg(e.target.value) : onChangeText(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: currentColor }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-white/80 rounded-tl flex items-center justify-center">
              <svg className="w-2 h-2 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.207 2.5a1 1 0 00-1.414 0l-7 7A1 1 0 002.5 10v3.5h3.5a1 1 0 00.707-.293l7-7a1 1 0 000-1.414l-2-2z"/>
              </svg>
            </div>
          </div>
          <input
            type="text"
            value={currentColor}
            onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) tab === 'bg' ? onChangeBg(e.target.value) : onChangeText(e.target.value) }}
            className="flex-1 text-xs font-mono px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 bg-gray-50"
            placeholder="#ffffff"
          />
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to Default
        </button>
      </div>
    </motion.div>
  )
}

// ─── SortableFieldItem ────────────────────────────────────────────────────────
function SortableFieldItem({ field }: { field: FormField }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const { activeFieldId, setActiveFieldId, removeField, duplicateField, customStyles, updateField } = useBuilder()
  const { currentTheme } = useTheme()
  const isSelected = activeFieldId === field.id

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : contextMenu ? 40 : 1,
  }

  const fieldBg = field.fieldBg || 'transparent'
  const fieldTextColor = field.fieldTextColor || undefined

  // Helper to render internal inputs for display only
  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${customStyles.inputBorderColor}`,
    background: customStyles.inputBg,
    color: fieldTextColor || customStyles.bodyText,
  }
  const inputCls = "w-full px-4 py-3 rounded-xl outline-none transition-all pointer-events-none"

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveFieldId(field.id)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [field.id, setActiveFieldId])

  const closeMenu = useCallback(() => setContextMenu(null), [])

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          borderColor: isSelected ? currentTheme.primary : 'transparent',
          backgroundColor: fieldBg,
        }}
        className={cn(
          "relative rounded-2xl border-2 transition-all group",
          isSelected ? "shadow-lg" : "border-transparent",
          isDragging && "opacity-50 scale-105 shadow-2xl"
        )}
        onClick={(e) => {
          e.stopPropagation()
          setActiveFieldId(field.id)
        }}
        onContextMenu={handleContextMenu}
      >
        <div className="p-6">
          {/* DRAG HANDLE */}
          <div
            {...attributes}
            {...listeners}
            className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Color indicator dot – shows when field has custom color */}
          {field.fieldBg && (
            <div
              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: field.fieldBg }}
              title="Custom background color"
            />
          )}

          {/* TOP ACTIONS */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute -top-12 right-0 rounded-xl shadow-xl border p-1 flex items-center gap-1 z-20"
                style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
              >
                {/* Color picker shortcut */}
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
                  className="p-2 text-gray-400 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                  title="Change Color"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateField(field.id) }}
                  className="p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors tooltip-trigger"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
                  className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors tooltip-trigger"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LABEL */}
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-bold" style={{ color: fieldTextColor || customStyles.labelColor }}>
              {field.label}
            </label>
            {field.required && <span className="text-red-500 font-bold">*</span>}
          </div>

          {/* FAKE INPUTS for Visuals */}
          <div className="relative">
            {field.type === 'text' && <input type="text" placeholder={field.placeholder || "Short answer text"} className={inputCls} style={inputStyle} readOnly />}
            {field.type === 'email' && <input type="email" placeholder={field.placeholder || "Email address"} className={inputCls} style={inputStyle} readOnly />}
            {field.type === 'number' && <input type="number" placeholder={field.placeholder || "Number"} className={inputCls} style={inputStyle} readOnly />}
            {field.type === 'textarea' && <textarea rows={3} placeholder={field.placeholder || "Long answer text"} className={cn(inputCls, "resize-none")} style={inputStyle} readOnly />}
            
            {['select', 'radio', 'checkbox', 'multiselect'].includes(field.type) && (
              <div className="space-y-3">
                {field.type === 'checkbox' && (!field.options || field.options.length === 0) ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border-2 border-gray-200 bg-white" />
                    <span className="text-sm text-gray-600">Option 1</span>
                  </div>
                ) : (
                  field.options?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {['radio', 'select'].includes(field.type) ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 bg-white" />
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-200 bg-white" />
                      )}
                      <span className="text-sm text-gray-600">{opt}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {field.type === 'rating' && (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="p-1 text-gray-300">
                     <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  </div>
                ))}
              </div>
            )}

            {['file', 'multifile'].includes(field.type) && (
              <div className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6 L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <span className="text-xs font-bold uppercase tracking-widest">File Upload Area</span>
              </div>
            )}
          </div>
        </div>

        {/* Right-click hint on hover */}
        <div className="absolute bottom-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Right-click to style</span>
        </div>
      </div>

      {/* Context Menu Portal */}
      <AnimatePresence>
        {contextMenu && (
          <FieldContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            field={field}
            onClose={closeMenu}
            onChangeBg={(color) => {
              updateField(field.id, { fieldBg: color })
            }}
            onChangeText={(color) => {
              updateField(field.id, { fieldTextColor: color })
            }}
            onReset={() => {
              updateField(field.id, { fieldBg: undefined, fieldTextColor: undefined })
              closeMenu()
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export function Canvas() {
  const { 
    form, fields, setFields, customStyles, 
    setActiveFieldId, formSettings, addPage, 
    removePage, pageCount,
    builderViewMode, setBuilderViewMode,
    builderActivePage, setBuilderActivePage
  } = useBuilder()
  const { currentTheme } = useTheme()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const containerStyle = {
    maxWidth: customStyles.containerWidth,
    margin: '0 auto',
    backgroundColor: customStyles.bodyBg,
    borderRadius: customStyles.borderRadius,
    boxShadow: customStyles.boxShadow,
    minHeight: '400px',
    transform: `scale(${customStyles.formScale || 1})`,
    transformOrigin: 'top center',
    fontFamily: `"${customStyles.fontFamily}", sans-serif`,
  }

  const bgStyle: React.CSSProperties = {
    backgroundColor: customStyles.pageBgColor,
    ...(customStyles.pageBgImage ? {
      backgroundImage: `url(${customStyles.pageBgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    } : {}),
  }

  const bgOverlayStyle: React.CSSProperties = customStyles.pageBgImage ? {
    backdropFilter: `blur(${customStyles.pageBgBlur}px)`,
    WebkitBackdropFilter: `blur(${customStyles.pageBgBlur}px)`,
    backgroundColor: `rgba(0,0,0,${(customStyles.pageBgOverlayOpacity || 0) / 100})`,
  } : {}

  const fontUrl = customStyles.fontFamily && !['Inter'].includes(customStyles.fontFamily)
    ? `https://fonts.googleapis.com/css2?family=${customStyles.fontFamily.replace(' ', '+')}:wght@400;700;800&display=swap`
    : null;

  const isSplit = customStyles.layout === 'split'
  const isSidebar = customStyles.layout === 'sidebar'
  const side = customStyles.layoutSide || 'left'

  return (
    <div className={cn(
      "flex-1 overflow-y-auto custom-scrollbar relative flex flex-col",
      (isSplit || isSidebar) ? "lg:flex-row" : "items-center py-12 px-4"
    )} onClick={() => setActiveFieldId(null)} style={bgStyle}>
      {fontUrl && <style dangerouslySetInnerHTML={{ __html: `@import url('${fontUrl}');` }} />}
      <style>{`
        ::placeholder {
          color: ${customStyles.bodyText} !important;
          opacity: 0.5 !important;
        }
      `}</style>

      {/* Background Overlay */}
      <div className="fixed inset-0 pointer-events-none" style={bgOverlayStyle} />

      {/* --- BRANDING SIDE (SPLIT/SIDEBAR) --- */}
      {(isSplit || isSidebar) && (
        <div className={cn(
          "relative z-10 p-8 lg:p-12 flex flex-col justify-between border-white/10",
          isSplit ? "lg:w-1/2 min-h-[300px] lg:min-h-full" : "lg:w-[320px] lg:shrink-0 lg:min-h-full border-r",
          side === 'right' && "lg:order-last border-l"
        )} style={{ 
          background: isSplit 
            ? (form?.cover_image_url ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${form.cover_image_url}) center/cover` : customStyles.headerBg)
            : customStyles.headerBg,
          color: customStyles.headerText
        }}>
          <div className="relative z-10">
            {form?.logo_url && (
              <div className="mb-10" style={{ textAlign: customStyles.logoAlignment }}>
                <img src={form.logo_url} alt="Logo" style={{ height: customStyles.logoHeight, borderRadius: customStyles.logoBorderRadius, display: 'inline-block' }} />
              </div>
            )}
            <h2 className="text-3xl lg:text-5xl font-black mb-4" style={{ textAlign: customStyles.headerAlignment }}>{form?.title || 'Form Title'}</h2>
            <p className="text-lg opacity-80" style={{ textAlign: customStyles.headerAlignment }}>{form?.description || 'Description...'}</p>
          </div>
          
          <div className="relative z-10 mt-12">
            {customStyles.secondaryImageUrl && (
              <div className="pt-8 border-t border-white/20">
                <img src={customStyles.secondaryImageUrl} alt="Secondary" className="max-h-12 opacity-60" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className={cn(
        "flex-1 relative z-10 flex flex-col items-center",
        (isSplit || isSidebar) ? "min-h-full" : "w-full"
      )}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...containerStyle,
            maxWidth: (isSplit || isSidebar) ? '100%' : customStyles.containerWidth,
            width: (isSplit || isSidebar) ? '100%' : 'auto',
            borderRadius: (isSplit || isSidebar) ? '0' : customStyles.borderRadius,
            boxShadow: (isSplit || isSidebar) ? 'none' : customStyles.boxShadow,
          }} 
          className={cn(
            "relative transition-all duration-300",
            (isSplit || isSidebar) ? "h-full" : "shadow-2xl overflow-hidden"
          )}
        >
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full" style={{ backgroundColor: customStyles.bodyBg }}>
            {/* Classic Header (Only for Centered Layout) — matches PublicForm exactly */}
            {!isSplit && !isSidebar && (
              <>
                {form?.cover_image_url && (
                  <div className="w-full bg-gray-200 border-b border-gray-100" style={{ height: customStyles.coverHeight || 240 }}>
                    <img src={form.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="mb-12 border-b border-gray-100 pb-10 px-10 pt-10" style={{ textAlign: customStyles.headerAlignment }}>
                  {form?.logo_url && (
                    <div className="mb-8" style={{ textAlign: customStyles.logoAlignment }}>
                      <img src={form.logo_url} alt="Logo" style={{ height: customStyles.logoHeight, borderRadius: customStyles.logoBorderRadius, display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    </div>
                  )}
                  <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: customStyles.bodyText }}>{form?.title || 'Form Title'}</h1>
                  <p className="text-lg opacity-60 leading-relaxed font-medium" style={{ color: customStyles.bodyText }}>{form?.description || 'Description...'}</p>
                </div>
              </>
            )}

            {/* Canvas Toolbar (Neutralized from Theme) */}
            <div 
              className="flex items-center justify-between px-8 py-3 border-b bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-gray-100"
            >
              <div className="flex p-1 rounded-xl shadow-sm border border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setBuilderViewMode('all')} 
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all", 
                    builderViewMode === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  All Pages
                </button>
                <button 
                  onClick={() => setBuilderViewMode('single')} 
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all", 
                    builderViewMode === 'single' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Single Step
                </button>
              </div>

              {builderViewMode === 'single' && (
                <div className="flex items-center gap-4">
                  <button disabled={builderActivePage === 0} onClick={() => setBuilderActivePage(Math.max(0, builderActivePage - 1))} className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Step {builderActivePage + 1} / {pageCount}</div>
                  <button disabled={builderActivePage === pageCount - 1} onClick={() => setBuilderActivePage(Math.min(pageCount - 1, builderActivePage + 1))} className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                </div>
              )}
            </div>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-6">
                  <SortableContext
                    items={fields.filter(f => builderViewMode === 'all' || f.pageIndex === builderActivePage).map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fields
                      .filter(f => builderViewMode === 'all' || f.pageIndex === builderActivePage)
                      .map((field) => (
                        <SortableFieldItem key={field.id} field={field} />
                      ))
                    }
                  </SortableContext>
                  
                  <button
                    onClick={() => addPage()}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Add New Page / Step</span>
                  </button>
                </div>
              </DndContext>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

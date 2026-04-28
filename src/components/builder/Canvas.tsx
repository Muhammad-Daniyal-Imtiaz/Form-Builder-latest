'use client'

import React, { useMemo } from 'react'
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
import { GripVertical, Trash2, Copy, Plus } from 'lucide-react'
import { useBuilder } from './BuilderContext'
import { FormField } from './types'
import { cn } from '@/utils/cn'

function SortableFieldItem({ field }: { field: FormField }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const { activeFieldId, setActiveFieldId, removeField, duplicateField, customStyles } = useBuilder()
  const isSelected = activeFieldId === field.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  }

  // Helper to render internal inputs for display only
  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${customStyles.inputBorderColor}`,
    background: customStyles.inputBg,
    color: customStyles.bodyText,
  }
  const inputCls = "w-full px-4 py-3 rounded-xl outline-none transition-all pointer-events-none"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-2xl border-2 transition-all group bg-transparent",
        isSelected ? "border-indigo-500 shadow-lg ring-4 ring-indigo-500/20" : "border-transparent hover:border-gray-500/20",
        isDragging && "opacity-50 scale-105 shadow-2xl"
      )}
      onClick={(e) => {
        e.stopPropagation()
        setActiveFieldId(field.id)
      }}
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

        {/* TOP ACTIONS */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-12 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-1 flex items-center gap-1 z-20"
            >
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
          <label className="text-sm font-bold text-gray-800" style={{ color: customStyles.labelColor }}>
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
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-md pointer-events-none" />
                  <span className="text-sm text-gray-600 font-medium">{field.placeholder || 'I agree'}</span>
                </div>
              ) : (
                field.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 border-2 border-gray-300 flex items-center justify-center pointer-events-none",
                      (field.type === 'radio' || field.type === 'select') ? "rounded-full" : "rounded-md"
                    )} />
                    <span className="text-sm text-gray-600 font-medium">{opt}</span>
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
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">File Upload Area</span>
            </div>
          )}
        </div>
      </div>
    </div>
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

      {/* --- FORM SIDE --- */}
      <div className={cn(
        "flex-1 relative z-10 flex flex-col items-center",
        (isSplit || isSidebar) ? "bg-white lg:bg-transparent lg:shadow-none min-h-full" : "w-full"
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
            (isSplit || isSidebar) ? "bg-white h-full" : "shadow-2xl overflow-hidden"
          )}
        >
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-white">
            {/* Classic Header (Only for Centered Layout) */}
            {!isSplit && !isSidebar && (
              <>
                {form?.cover_image_url && (
                  <div className="w-full bg-gray-200 border-b border-gray-100" style={{ height: customStyles.coverHeight || 240 }}>
                    <img src={form.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div style={{ backgroundColor: customStyles.headerBg, color: customStyles.headerText, textAlign: customStyles.headerAlignment }} className="px-10 py-12">
                  {form?.logo_url && (
                    <div className="mb-6" style={{ textAlign: customStyles.logoAlignment }}>
                      <img src={form.logo_url} alt="Logo" style={{ height: customStyles.logoHeight, borderRadius: customStyles.logoBorderRadius, display: 'inline-block' }} />
                    </div>
                  )}
                  <h1 className="text-4xl font-black mb-4">{form?.title || 'Form Title'}</h1>
                  <p className="text-lg opacity-80">{form?.description || 'Description...'}</p>
                </div>
              </>
            )}

            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between px-8 py-3 bg-gray-50/80 border-b border-gray-100 backdrop-blur-sm sticky top-0 z-30">
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                <button onClick={() => setBuilderViewMode('all')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all", builderViewMode === 'all' ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-400")}>All Pages</button>
                <button onClick={() => setBuilderViewMode('single')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all", builderViewMode === 'single' ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-400")}>Single Step</button>
              </div>

              {builderViewMode === 'single' && (
                <div className="flex items-center gap-4">
                  <button disabled={builderActivePage === 0} onClick={() => setBuilderActivePage(Math.max(0, builderActivePage - 1))} className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">Step {builderActivePage + 1} / {pageCount}</div>
                  <button disabled={builderActivePage === pageCount - 1} onClick={() => setBuilderActivePage(Math.min(pageCount - 1, builderActivePage + 1))} className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                </div>
              )}
            </div>

            {/* Field Area */}
            <div className="p-10 space-y-12 flex-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {Array.from({ length: pageCount }).map((_, pIdx) => {
                  const isActive = builderViewMode === 'all' || builderActivePage === pIdx
                  if (!isActive) return null
                  const pageFields = fields.filter(f => f.pageIndex === pIdx)
                  return (
                    <div key={pIdx} className="space-y-4 relative">
                      <div className="flex items-center justify-between mb-6 group/page">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-100">{pIdx + 1}</div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Page {pIdx + 1}</h4>
                        </div>
                        {pageCount > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); removePage(pIdx) }} className="opacity-0 group-hover/page:opacity-100 px-3 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all">Delete Page</button>
                        )}
                      </div>
                      <SortableContext items={pageFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        {pageFields.length === 0 ? (
                          <div className="py-10 border-2 border-dashed border-indigo-50/50 bg-indigo-50/10 rounded-2xl flex flex-col items-center justify-center text-indigo-300">
                            <p className="text-[10px] font-bold uppercase tracking-widest">Empty Page</p>
                          </div>
                        ) : (
                          pageFields.map((field) => (
                            <SortableFieldItem key={field.id} field={field} />
                          ))
                        )}
                      </SortableContext>
                      {pIdx < pageCount - 1 && builderViewMode === 'all' && <div className="absolute -bottom-10 left-4 w-px h-8 bg-gray-100" />}
                    </div>
                  )
                })}
              </DndContext>

              <div className="flex justify-center pt-4">
                <button onClick={(e) => { e.stopPropagation(); addPage() }} className="flex items-center gap-2 px-6 py-3 bg-white border border-dashed border-gray-300 rounded-2xl text-xs font-bold text-indigo-600 hover:border-indigo-400 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Add New Page Break
                </button>
              </div>

              {fields.length > 0 && (
                <div className="pt-8 mt-4 border-t border-gray-100">
                  <button disabled className="w-full py-4 rounded-xl text-white font-bold text-lg opacity-80 cursor-not-allowed shadow-lg shadow-indigo-100" style={{ backgroundColor: customStyles.accentColor }}>
                    {formSettings.submitButtonText || 'Submit Form'}
                  </button>
                </div>
              )}
            </div>

            {/* Secondary Footer Branding (Only for Centered Layout) */}
            {!isSplit && !isSidebar && customStyles.secondaryImageUrl && (
              <div className="pb-12 opacity-30">
                <img src={customStyles.secondaryImageUrl} alt="Secondary" className="max-h-8 mx-auto" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

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
import { useTheme } from '@/components/ThemeProvider'

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
  const { currentTheme } = useTheme()
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
      style={{ ...style, borderColor: isSelected ? currentTheme.primary : 'transparent' }}
      className={cn(
        "relative rounded-2xl border-2 transition-all group bg-transparent",
        isSelected ? "shadow-lg" : "border-transparent",
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
              className="absolute -top-12 right-0 rounded-xl shadow-xl border p-1 flex items-center gap-1 z-20"
              style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
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

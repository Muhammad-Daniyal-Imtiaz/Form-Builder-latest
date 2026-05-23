'use client'

import React, { useState } from 'react'
import { Bot, GitBranch, Loader2, Palette, PlusCircle, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { useBuilder } from './BuilderContext'
import { useTheme } from '@/components/ThemeProvider'
import { CustomStyles, FieldType, FormField, FormSettings } from './types'

const FIELD_TYPES: FieldType[] = ['text', 'email', 'number', 'textarea', 'select', 'multiselect', 'radio', 'checkbox', 'file', 'multifile', 'rating']

function normalizeField(field: any, index: number): FormField {
  const type = FIELD_TYPES.includes(field?.type) ? field.type : 'text'
  const options = ['select', 'multiselect', 'radio', 'checkbox'].includes(type)
    ? Array.isArray(field.options) && field.options.length > 0
      ? field.options.map((option: any) => String(option))
      : ['Option 1', 'Option 2']
    : null

  return {
    id: String(field?.id || `field_${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
    label: String(field?.label || `Question ${index + 1}`),
    type,
    required: Boolean(field?.required),
    placeholder: field?.placeholder ? String(field.placeholder) : '',
    options,
    fileMode: field?.fileMode === 'link' ? 'link' : field?.fileMode === 'upload' ? 'upload' : undefined,
    logicRules: Array.isArray(field?.logicRules)
      ? field.logicRules.map((rule: any, ruleIndex: number) => ({
          id: String(rule?.id || `rule_${index + 1}_${ruleIndex + 1}`),
          condition: ['equals', 'not_equals', 'contains'].includes(rule?.condition) ? rule.condition : 'equals',
          value: String(rule?.value || ''),
          action: ['show', 'hide', 'jump_to'].includes(rule?.action) ? rule.action : 'show',
          targetId: String(rule?.targetId || ''),
        }))
      : [],
    pageIndex: Number.isFinite(Number(field?.pageIndex)) ? Math.max(0, Number(field.pageIndex)) : 0,
    fieldBg: field?.fieldBg,
    fieldTextColor: field?.fieldTextColor,
  }
}

export function AIFormEditorModal() {
  const {
    form,
    fields,
    customStyles,
    formSettings,
    setFields,
    updateFormDetails,
    updateStyles,
    updateFormSettings,
  } = useBuilder()
  const { currentTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [model, setModel] = useState('gemini-2.5-flash')
  const [editPrompt, setEditPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fieldStyle: React.CSSProperties = {
    backgroundColor: currentTheme.bg,
    borderColor: currentTheme.border,
    color: currentTheme.text,
  }

  const quickPrompt = (text: string) => {
    setEditPrompt((prev) => `${prev}${prev ? '\n' : ''}${text}`)
  }

  const applyAIEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPrompt.trim() || !form) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/edit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          editPrompt,
          currentForm: {
            title: form.title,
            description: form.description,
            fields,
            customStyles,
            settings: formSettings,
          },
        }),
      })

      const raw = await res.text()
      let data: any
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        throw new Error(`AI editor returned ${res.status}. Check Cloudflare logs for /api/ai/edit-form.`)
      }
      if (!res.ok) throw new Error(data.error || 'AI edit failed')

      const nextFields = Array.isArray(data.fields)
        ? data.fields.map((field: any, index: number) => normalizeField(field, index))
        : fields

      updateFormDetails({
        title: data.title || form.title,
        description: data.description ?? form.description,
      })
      setFields(nextFields)
      if (data.customStyles && typeof data.customStyles === 'object') {
        updateStyles(data.customStyles as Partial<CustomStyles>)
      }
      if (data.settings && typeof data.settings === 'object') {
        updateFormSettings(data.settings as Partial<FormSettings>)
      }

      setOpen(false)
      setEditPrompt('')
    } catch (err: any) {
      setError(err.message || 'AI edit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm"
        style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}55`, backgroundColor: `${currentTheme.primary}12` }}
      >
        <Wand2 className="w-4 h-4" />
        AI Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={applyAIEdit}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[2rem] border p-6 shadow-2xl"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border }}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ color: currentTheme.text }}>AI Edit Existing Form</h3>
                  <p className="text-sm font-medium" style={{ color: currentTheme.textMuted }}>
                    Add fields, remove questions, redesign styling, reorder pages, and create conditional logic.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-full" style={{ color: currentTheme.textMuted }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}

            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <button
                type="button"
                onClick={() => setModel('gemini-2.5-flash')}
                className="p-4 rounded-xl text-left border-2 transition-all"
                style={{ borderColor: model === 'gemini-2.5-flash' ? currentTheme.primary : currentTheme.border, backgroundColor: model === 'gemini-2.5-flash' ? `${currentTheme.primary}12` : currentTheme.bg }}
              >
                <span className="block text-sm font-black" style={{ color: currentTheme.text }}>Gemini 2.5 Flash</span>
                <span className="block text-xs mt-1" style={{ color: currentTheme.textMuted }}>Fast, cost-effective edits</span>
              </button>
              <button
                type="button"
                onClick={() => setModel('gemini-2.5-pro')}
                className="p-4 rounded-xl text-left border-2 transition-all"
                style={{ borderColor: model === 'gemini-2.5-pro' ? currentTheme.primary : currentTheme.border, backgroundColor: model === 'gemini-2.5-pro' ? `${currentTheme.primary}12` : currentTheme.bg }}
              >
                <span className="block text-sm font-black" style={{ color: currentTheme.text }}>Gemini 2.5 Pro</span>
                <span className="block text-xs mt-1" style={{ color: currentTheme.textMuted }}>Best for design, logic, and multi-page edits</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
              <button type="button" onClick={() => quickPrompt('Add a phone number field after email and make it required.')} className="rounded-xl border p-3 text-left text-xs font-bold" style={fieldStyle}><PlusCircle className="w-4 h-4 mb-2" />Add field</button>
              <button type="button" onClick={() => quickPrompt('Remove fields that are not necessary and keep the form concise.')} className="rounded-xl border p-3 text-left text-xs font-bold" style={fieldStyle}><Trash2 className="w-4 h-4 mb-2" />Remove clutter</button>
              <button type="button" onClick={() => quickPrompt('Redesign this form with a premium modern SaaS style, better colors, spacing, and typography.')} className="rounded-xl border p-3 text-left text-xs font-bold" style={fieldStyle}><Palette className="w-4 h-4 mb-2" />Improve design</button>
              <button type="button" onClick={() => quickPrompt('Add conditional logic: show relevant follow-up fields only when needed.')} className="rounded-xl border p-3 text-left text-xs font-bold" style={fieldStyle}><GitBranch className="w-4 h-4 mb-2" />Add logic</button>
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>What should AI change?</span>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Example: Make this a 2-page job application. Page 1 should collect name, email, phone. Page 2 should collect CV upload, years of experience, and portfolio. Use a clean dark blue split layout. If experience is less than 2 years, show a junior role preference field."
                className="w-full min-h-44 rounded-2xl border-2 p-4 text-sm font-medium outline-none resize-y placeholder:opacity-60"
                style={fieldStyle}
                disabled={loading}
              />
            </label>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="sm:w-40 rounded-2xl border px-5 py-4 text-sm font-black"
                style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editPrompt.trim() || loading}
                className="flex-1 rounded-2xl px-5 py-4 text-sm font-black text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Apply AI Edit
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

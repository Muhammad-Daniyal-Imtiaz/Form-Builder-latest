'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { FormField, CustomStyles, DEFAULT_STYLES, FieldType, FormSettings, DEFAULT_SETTINGS, PRESET_THEMES } from './types'

interface BuilderContextType {
  // Data
  formId: string;
  form: any;
  fields: FormField[];
  customStyles: CustomStyles;
  formSettings: FormSettings;

  // UI State
  loading: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  activeFieldId: string | null; // For DND / Selection
  sidebarTab: 'add' | 'design' | 'settings' | 'share';
  pageCount: number;
  builderViewMode: 'all' | 'single';
  builderActivePage: number;
  builderDeviceView: 'desktop' | 'tablet' | 'mobile';

  // Actions
  setSidebarTab: (tab: 'add' | 'design' | 'settings' | 'share') => void;
  setActiveFieldId: (id: string | null) => void;
  setBuilderViewMode: (mode: 'all' | 'single') => void;
  setBuilderActivePage: (page: number) => void;
  setBuilderDeviceView: (view: 'desktop' | 'tablet' | 'mobile') => void;
  updateFormDetails: (updates: Partial<any>) => void;
  updateStyles: (updates: Partial<CustomStyles>) => void;
  updateFormSettings: (updates: Partial<FormSettings>) => void;
  applyThemePreset: (presetId: string) => void;
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;

  // Field Actions
  addField: (type: FieldType) => void;
  addPage: () => void;
  removePage: (pageIndex: number) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  removeField: (id: string) => void;
  duplicateField: (id: string) => void;

  // Option Actions
  addOption: (fieldId: string) => void;
  updateOption: (fieldId: string, optionIndex: number, value: string) => void;
  removeOption: (fieldId: string, optionIndex: number) => void;

  // Network
  save: () => Promise<void>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined)

export function BuilderProvider({ children, formId }: { children: React.ReactNode; formId: string }) {
  const [form, setForm] = useState<any>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [customStyles, setCustomStyles] = useState<CustomStyles>({ ...DEFAULT_STYLES })
  const [formSettings, setFormSettings] = useState<FormSettings>({ ...DEFAULT_SETTINGS })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'add' | 'design' | 'settings' | 'share'>('add')
  const [builderViewMode, setBuilderViewMode] = useState<'all' | 'single'>('all')
  const [builderActivePage, setBuilderActivePage] = useState(0)
  const [builderDeviceView, setBuilderDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // We use this to debounce auto-saves if we want, but for now manual or on-blur save
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`)
      if (!res.ok) throw new Error('Failed to fetch form')
      const data = await res.json()

      let desc = data.description || ''
      let styles = { ...DEFAULT_STYLES }
      let settings = { ...DEFAULT_SETTINGS }

      // Parse Settings
      if (desc.includes('|||SETTINGS:')) {
        const parts = desc.split('|||SETTINGS:')
        // Settings are at the end, so parts[1] is the JSON
        try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(parts[1]) } } catch { }
        desc = parts[0] // remove settings string from desc block
      }

      // Parse Styles
      if (desc.includes('|||STYLES:')) {
        const parts = desc.split('|||STYLES:')
        try { styles = { ...DEFAULT_STYLES, ...JSON.parse(parts[1]) } } catch { }
        desc = parts[0]
      }

      setForm({ ...data, description: desc })
      setCustomStyles(styles)
      setFormSettings(settings)

      // Ensure all fields have IDs
      const loadedFields = (data.form_fields || []).map((f: any) => ({
        ...f,
        id: f.id || crypto.randomUUID(),
        logicRules: f.logic_rules || f.logicRules || [],
        pageIndex: f.page_index || 0
      }))
      setFields(loadedFields)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    void fetchForm()
  }, [fetchForm])

  const applyThemePreset = useCallback((presetId: string) => {
    const preset = PRESET_THEMES[presetId];
    if (preset) {
      setCustomStyles(prev => ({ ...prev, ...preset }));
    }
  }, []);

  const save = useCallback(async () => {
    if (!form) return

    setSaving(true)
    setError(null)
    try {
      const descPayload = `${form.description || ''}|||STYLES:${JSON.stringify(customStyles)}|||SETTINGS:${JSON.stringify(formSettings)}`

      const formResponse = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: descPayload,
          published: form.published,
          logo_url: form.logo_url,
          cover_image_url: form.cover_image_url
        })
      })
      if (!formResponse.ok) {
        throw new Error('Failed to save form details')
      }

      const fieldsResponse = await fetch(`/api/forms/${formId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })

      if (!fieldsResponse.ok) {
        throw new Error('Failed to save fields')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [customStyles, fields, form, formId, formSettings])

  useEffect(() => {
    if (loading || !form) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      save()
    }, 2000) // Auto-save after 2s of inactivity
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [customStyles, fields, form, formSettings, loading, save])


  const addField = useCallback((type: FieldType) => {
    const id = crypto.randomUUID()
    setFields(prev => [...prev, {
      id,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      options: ['select', 'multiselect', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : null,
      placeholder: 'Enter placeholder...',
      logicRules: [],
      pageIndex: prev.length > 0 ? Math.max(...prev.map(f => f.pageIndex)) : 0
    }])
    setActiveFieldId(id)
  }, [])

  const addPage = useCallback(() => {
    setFields(prev => {
      const maxPage = prev.length > 0 ? Math.max(...prev.map(f => f.pageIndex)) : 0
      const id = crypto.randomUUID()
      const newField: FormField = {
        id,
        type: 'text',
        label: 'New Question on New Page',
        required: false,
        options: null,
        placeholder: 'Enter text...',
        logicRules: [],
        pageIndex: maxPage + 1
      }
      return [...prev, newField]
    })
  }, [])

  const removePage = useCallback((pageIdx: number) => {
    setFields(prev => {
      // 1. Remove fields on that page
      // 2. Shift all subsequent pages down by 1
      return prev
        .filter(f => f.pageIndex !== pageIdx)
        .map(f => f.pageIndex > pageIdx ? { ...f, pageIndex: f.pageIndex - 1 } : f)
    })
  }, [])

  const pageCount = useMemo(() => {
    if (fields.length === 0) return 1
    return Math.max(...fields.map(f => f.pageIndex)) + 1
  }, [fields])

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
    setActiveFieldId(null)
  }, [])

  const duplicateField = useCallback((id: string) => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id)
      if (idx === -1) return prev
      const newField = { ...prev[idx], id: crypto.randomUUID() }
      const next = [...prev]
      next.splice(idx + 1, 0, newField)
      setActiveFieldId(newField.id)
      return next
    })
  }, [])

  const addOption = useCallback((fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      const opts = [...(f.options || [])]
      opts.push(`Option ${opts.length + 1}`)
      return { ...f, options: opts }
    }))
  }, [])

  const updateOption = useCallback((fieldId: string, optionIndex: number, value: string) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      const opts = [...(f.options || [])]
      opts[optionIndex] = value
      return { ...f, options: opts }
    }))
  }, [])

  const removeOption = useCallback((fieldId: string, optionIndex: number) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f
      return { ...f, options: (f.options || []).filter((_, i) => i !== optionIndex) }
    }))
  }, [])

  return (
    <BuilderContext.Provider value={{
      formId, form, fields, customStyles, formSettings,
      loading, saving, saved, error, activeFieldId, sidebarTab, pageCount,
      builderViewMode, builderActivePage, builderDeviceView,
      setSidebarTab, setActiveFieldId,
      setBuilderViewMode, setBuilderActivePage, setBuilderDeviceView,
      updateFormDetails: (u) => setForm((p: any) => ({ ...p, ...u })),
      updateStyles: (u) => setCustomStyles(p => ({ ...p, ...u })),
      updateFormSettings: (u) => setFormSettings(p => ({ ...p, ...u })),
      applyThemePreset,
      setFields, addField, addPage, removePage, updateField, removeField, duplicateField,
      addOption, updateOption, removeOption,
      save
    }}>
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilder() {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider')
  return ctx
}
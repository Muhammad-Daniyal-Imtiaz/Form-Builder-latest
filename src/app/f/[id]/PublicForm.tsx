'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useSearchParams } from 'next/navigation'
import { Monitor, Tablet, Smartphone, ChevronDown, Plus, X, Laptop, Mic, MicOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CustomStyles {
  headerBg: string
  headerText: string
  bodyBg: string
  bodyText: string
  accentColor: string
  buttonText: string
  fontFamily: string
  inputBorderColor: string
  inputBg: string
  labelColor: string
  containerWidth: number
  containerPadding: number
  borderRadius: number
  boxShadow: string
  fontSizeBase: number
  fieldSpacing: number
  labelWeight: string
  fontWeight: string
  buttonStyle: 'rounded' | 'pill' | 'square'
  inputVariant: 'outline' | 'filled' | 'underline'
  logoHeight: number
  logoAlignment: 'left' | 'center' | 'right'
  logoBorderRadius: number
  coverHeight: number
  pageBgColor: string
  pageBgImage: string
  pageBgBlur: number
  pageBgOverlayOpacity: number
  formScale: number
  headerAlignment: 'left' | 'center' | 'right'
  coverImageFit: 'cover' | 'contain' | 'fill'
  layout: 'centered' | 'split' | 'sidebar'
  layoutSide: 'left' | 'right'
  secondaryImageUrl: string
  secondaryImageLink: string
}

const DEFAULT_STYLES: CustomStyles = {
  headerBg: '#4f46e5',
  headerText: '#ffffff',
  bodyBg: '#ffffff',
  bodyText: '#111827',
  accentColor: '#4f46e5',
  buttonText: '#ffffff',
  fontFamily: 'Inter',
  inputBorderColor: '#e5e7eb',
  inputBg: '#f9fafb',
  labelColor: '#111827',
  containerWidth: 640,
  containerPadding: 40,
  borderRadius: 16,
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  fontSizeBase: 16,
  fieldSpacing: 32,
  labelWeight: 'bold',
  fontWeight: 'normal',
  buttonStyle: 'rounded',
  inputVariant: 'outline',
  logoHeight: 48,
  logoAlignment: 'left',
  logoBorderRadius: 8,
  coverHeight: 240,
  pageBgColor: '#f3f4f6',
  pageBgImage: '',
  pageBgBlur: 0,
  pageBgOverlayOpacity: 10,
  formScale: 1,
  headerAlignment: 'left',
  coverImageFit: 'cover',
  layout: 'centered',
  layoutSide: 'left',
  secondaryImageUrl: '',
  secondaryImageLink: '',
}

const DEVICES = {
  mobile: [
    { id: 'iphone-14-pro', name: 'iPhone 14 Pro', width: 393, height: 852 },
    { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844 },
    { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667 },
    { id: 'samsung-s23', name: 'Galaxy S23', width: 360, height: 800 },
    { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915 },
    { id: 'iphone-13-mini', name: 'iPhone 13 Mini', width: 375, height: 812 },
    { id: 'samsung-a54', name: 'Galaxy A54', width: 412, height: 915 },
    { id: 'xiaomi-13', name: 'Xiaomi 13', width: 393, height: 851 },
    { id: 'oneplus-11', name: 'OnePlus 11', width: 412, height: 915 },
    { id: 'iphone-12-max', name: 'iPhone 12 Pro Max', width: 428, height: 926 },
  ],
  tablet: [
    { id: 'ipad-pro-12', name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
    { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 834, height: 1194 },
    { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180 },
    { id: 'ipad-mini', name: 'iPad Mini', width: 744, height: 1133 },
    { id: 'tab-s9', name: 'Galaxy Tab S9', width: 800, height: 1280 },
    { id: 'surface-pro-9', name: 'Surface Pro 9', width: 960, height: 1440 },
    { id: 'pixel-tab', name: 'Pixel Tablet', width: 800, height: 1280 },
    { id: 'fire-hd-10', name: 'Fire HD 10', width: 800, height: 1280 },
    { id: 'ipad-9', name: 'iPad (9th gen)', width: 810, height: 1080 },
    { id: 'tab-a8', name: 'Galaxy Tab A8', width: 800, height: 1280 },
  ]
}

interface FormSettings {
  submitButtonText: string;
  thankYouHeadline: string;
  thankYouMessage: string;
  redirectUrl: string;
}

const DEFAULT_SETTINGS: FormSettings = {
  submitButtonText: 'Submit Form',
  thankYouHeadline: 'Thank You!',
  thankYouMessage: 'Your response has been successfully submitted.',
  redirectUrl: '',
}

import DOMPurify from 'dompurify'

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export default function PublicForm({ 
  form, 
  customStyles: rawStyles,
  formSettings: rawSettings
}: { 
  form: any; 
  customStyles?: Partial<CustomStyles>;
  formSettings?: Partial<FormSettings>;
}) {
  // Sanitize helper
  const sanitize = (text: string) => {
    if (typeof window === 'undefined') return text // Server side
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    })
  }

  const [data, setData] = useState<Record<string, any>>({})
  const [files, setFiles] = useState<Record<string, any>>({})
  const [fileModes, setFileModes] = useState<Record<string, 'upload' | 'link'>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [listeningFieldId, setListeningFieldId] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const requiresCaptcha = Boolean(turnstileSiteKey)

  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  
  // Single-View State
  const [activeView, setActiveView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeMobileId, setActiveMobileId] = useState<string>('iphone-14-pro')
  const [activeTabletId, setActiveTabletId] = useState<string>('ipad-pro-11')
  const [dropdownOpen, setDropdownOpen] = useState<'mobile' | 'tablet' | null>(null)

  const cs: CustomStyles = { ...DEFAULT_STYLES, ...rawStyles }

  // Parse description to strip out metadata tags if they exist
  let displayDescription = form.description || ''
  if (displayDescription.includes('|||SETTINGS:')) {
    displayDescription = displayDescription.split('|||SETTINGS:')[0]
  }
  if (displayDescription.includes('|||STYLES:')) {
    displayDescription = displayDescription.split('|||STYLES:')[0]
  }
  displayDescription = displayDescription.trim()
  const settings: FormSettings = { ...DEFAULT_SETTINGS, ...rawSettings }

  const fields = form.form_fields || []
  const maxPage = fields.length > 0 ? Math.max(...fields.map((f: any) => f.page_index || 0)) : 0
  const isLastPage = currentPage === maxPage

  const currentPageFields = fields.filter((f: any) => (f.page_index || 0) === currentPage)

  // --- LOGIC ENGINE ---
  const isFieldTargetOfShowRule = (targetId: string) => {
    return form.form_fields?.some((f: any) => {
      const rules = f.logicRules || f.logic_rules;
      return rules?.some((r: any) => r.action === 'show' && r.targetId === targetId);
    });
  };

  const evaluateCondition = (ruleValue: string, actualValue: any, condition: string) => {
    if (actualValue === undefined || actualValue === null) actualValue = '';
    const rVal = String(ruleValue).toLowerCase().trim();
    
    if (Array.isArray(actualValue)) {
      const sVals = actualValue.map((v: string) => String(v).toLowerCase().trim());
      if (condition === 'equals') return sVals.includes(rVal);
      if (condition === 'not_equals') return !sVals.includes(rVal);
      if (condition === 'contains') return sVals.some(v => v.includes(rVal));
    } else {
      const sVal = String(actualValue).toLowerCase().trim();
      if (condition === 'equals') return sVal === rVal;
      if (condition === 'not_equals') return sVal !== rVal;
      if (condition === 'contains') return sVal.includes(rVal);
    }
    return false;
  };

  const isFieldVisible = (fieldId: string) => {
    let visible = true;
    
    if (isFieldTargetOfShowRule(fieldId)) {
      visible = false;
    }

    form.form_fields?.forEach((sourceField: any) => {
        const sourceVal = data[sourceField.id || sourceField.label];
        if (sourceVal !== undefined && sourceVal !== '') {
          const rules = sourceField.logicRules || sourceField.logic_rules;
          rules?.forEach((rule: any) => {
              if (rule.targetId === fieldId) {
                  const isMet = evaluateCondition(rule.value, sourceVal, rule.condition);
                  if (isMet) {
                      if (rule.action === 'show') visible = true;
                      if (rule.action === 'hide') visible = false;
                  }
              }
          });
        }
    });

    return visible;
  };

  const executeJumpLogic = (fieldId: string, value: any) => {
    const sourceField = form.form_fields?.find((f: any) => (f.id || f.label) === fieldId);
    if (!sourceField || !sourceField.logicRules) return;

    for (const rule of sourceField.logicRules) {
        if (rule.action === 'jump_to' && evaluateCondition(rule.value, value, rule.condition)) {
            setTimeout(() => {
                const el = document.getElementById(`field-${rule.targetId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.4s ease-in-out';
                    el.style.boxShadow = `0 0 0 4px ${cs.accentColor}40`;
                    setTimeout(() => { el.style.boxShadow = 'none'; }, 2000);
                }
            }, 150);
            return;
        }
    }
  };

  const fontUrl = cs.fontFamily !== 'Inter' && cs.fontFamily !== 'Georgia'
    ? `https://fonts.googleapis.com/css2?family=${cs.fontFamily.replace(' ', '+')}:wght@400;500;600;700;800&display=swap`
    : null

  const handleInputChange = (fieldId: string, value: any) => {
    setData(prev => ({ ...prev, [fieldId]: value }))
    executeJumpLogic(fieldId, value)
  }

  const stopVoiceInput = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListeningFieldId(null)
  }

  const startVoiceInput = (fieldId: string) => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Chrome and Edge work best.')
      return
    }

    if (recognitionRef.current) stopVoiceInput()

    const recognition: BrowserSpeechRecognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript
      }
      if (!transcript.trim()) return
      setData(prev => {
        const currentValue = prev[fieldId] || ''
        const nextValue = `${currentValue}${currentValue ? ' ' : ''}${transcript}`.trim()
        setTimeout(() => executeJumpLogic(fieldId, nextValue), 0)
        return { ...prev, [fieldId]: nextValue }
      })
    }
    recognition.onerror = () => stopVoiceInput()
    recognition.onend = () => setListeningFieldId(null)
    recognitionRef.current = recognition
    setListeningFieldId(fieldId)
    recognition.start()
  }

  const VoiceButton = ({ fieldId }: { fieldId: string }) => (
    <button
      type="button"
      onClick={() => listeningFieldId === fieldId ? stopVoiceInput() : startVoiceInput(fieldId)}
      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all"
      style={{
        backgroundColor: listeningFieldId === fieldId ? `${cs.accentColor}22` : `${cs.bodyText}10`,
        color: listeningFieldId === fieldId ? cs.accentColor : cs.bodyText,
      }}
      aria-label={listeningFieldId === fieldId ? 'Stop voice input' : 'Start voice input'}
    >
      {listeningFieldId === fieldId ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setData(prev => {
      const currentVal = prev[fieldId] || []
      const newVal = checked ? [...currentVal, option] : currentVal.filter((v: string) => v !== option);
      setTimeout(() => executeJumpLogic(fieldId, newVal), 0)
      return { ...prev, [fieldId]: newVal }
    })
  }

  const isFieldMissing = (field: any) => {
    const key = field.id || field.label
    const value = data[key]
    if (field.type === 'checkbox' && !field.options?.length) return value !== true
    if (value === undefined || value === null) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  }

  const handleFileChange = async (fieldId: string, fileList: FileList, isMultiple: boolean) => {
    setLoading(true)
    setError('')
    try {
      const uploadedFiles: any[] = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('formId', form.id)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload.error || 'File upload failed.')
        uploadedFiles.push(payload)
      }
      if (isMultiple) {
        const currentFiles = files[fieldId] || []
        const newFiles = [...currentFiles, ...uploadedFiles]
        setFiles(prev => ({ ...prev, [fieldId]: newFiles }))
        handleInputChange(fieldId, newFiles)
      } else {
        setFiles(prev => ({ ...prev, [fieldId]: uploadedFiles[0] }))
        handleInputChange(fieldId, uploadedFiles[0])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    const missingFields = currentPageFields.filter((f: any) => {
      const key = f.id || f.label
      return f.required && isFieldVisible(key) && isFieldMissing(f)
    })
    if (missingFields.length > 0) {
      setError(`Required: ${missingFields[0].label}`)
      return
    }
    setError('')
    if (currentPage < maxPage) {
      setCurrentPage(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const missingFields = currentPageFields.filter((f: any) => {
      const key = f.id || f.label
      return f.required && isFieldVisible(key) && isFieldMissing(f)
    })
    if (missingFields.length > 0) {
      setError(`Required: ${missingFields[0].label}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const activeData: Record<string, any> = {}
      fields.forEach((f: any) => {
        const key = f.id || f.label
        if (isFieldVisible(key) && data[key] !== undefined) activeData[key] = data[key]
      })
      let uploadedFilesArray: any[] = []
      Object.keys(files).forEach(key => {
        if (isFieldVisible(key)) {
          const fileData = files[key]
          if (Array.isArray(fileData)) uploadedFilesArray = [...uploadedFilesArray, ...fileData]
          else uploadedFilesArray.push(fileData)
        }
      })
      const res = await fetch(`/api/forms/${form.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: activeData, files: uploadedFilesArray, captchaToken: turnstileToken }),
      })
      if (!res.ok) throw new Error('Submission failed')
      if (settings.redirectUrl) window.location.href = settings.redirectUrl
      else setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      turnstileRef.current?.reset()
      setTurnstileToken('')
    }
  }

  const baseInputStyle: React.CSSProperties = {
    border: `1.5px solid ${cs.inputBorderColor}`,
    background: cs.inputBg,
    color: cs.bodyText,
    fontFamily: 'inherit',
    outline: 'none',
    display: 'block',
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '1em',
    transition: 'all 0.15s',
  }

  const getInternalInputStyle = (): React.CSSProperties => {
    const base = { ...baseInputStyle }
    if (cs.inputVariant === 'filled') {
      base.border = 'none'
      base.backgroundColor = `${cs.inputBorderColor}22`
    } else if (cs.inputVariant === 'underline') {
      base.border = 'none'
      base.borderRadius = '0'
      base.borderBottom = `2px solid ${cs.inputBorderColor}`
      base.paddingLeft = '4px'
      base.paddingRight = '4px'
      base.backgroundColor = 'transparent'
    }
    return base
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: cs.labelWeight === 'bold' ? 700 : cs.labelWeight === 'semibold' ? 600 : 400,
    fontSize: '0.95em',
    marginBottom: '0.5rem',
    color: cs.labelColor,
    fontFamily: 'inherit',
  }

  const btnRadius = cs.buttonStyle === 'pill' ? '9999px' : cs.buttonStyle === 'square' ? '0px' : '0.75rem'

  const isSplit = cs.layout === 'split'
  const isSidebar = cs.layout === 'sidebar'
  const side = cs.layoutSide || 'left'

  // --- RENDER FORM COMPONENT ---
  const FormContent = ({ isInsideFrame = false, forceMobileLayout = false }: { isInsideFrame?: boolean, forceMobileLayout?: boolean }) => {
    const rowClass = forceMobileLayout ? 'flex-col' : 'md:flex-row flex-col'
    const leftWidthClass = forceMobileLayout ? 'w-full' : (isSplit ? 'md:w-1/2 w-full' : 'md:w-[320px] md:shrink-0 w-full')
    const rightAlignClass = forceMobileLayout ? 'items-center' : (isSplit || isSidebar ? 'md:justify-start items-center' : 'items-center')

    if (submitted) {
      return (
        <div style={{ background: cs.bodyBg, fontFamily: `"${cs.fontFamily}", sans-serif`, padding: `${cs.containerPadding * 1.5}px 40px`, textAlign: 'center' }} className="animate-in fade-in zoom-in duration-500 min-h-full flex flex-col justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: cs.bodyText }}>{settings.thankYouHeadline}</h2>
          <p className="text-lg opacity-70 leading-relaxed" style={{ color: cs.bodyText }}>{settings.thankYouMessage}</p>
        </div>
      )
    }

    return (
      <div className={`${isInsideFrame ? 'min-h-full h-full' : 'min-h-screen'} w-full transition-colors duration-500 flex ${isSplit || isSidebar ? rowClass : 'flex-col items-center justify-center p-4 md:p-8'}`} 
        style={{ 
          backgroundColor: cs.pageBgColor,
          fontFamily: `"${cs.fontFamily}", sans-serif`,
          backgroundImage: cs.pageBgImage ? `url(${cs.pageBgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: cs.bodyText 
        }}>
        
        {fontUrl && <link rel="stylesheet" href={fontUrl} />}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${cs.accentColor}40; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${cs.accentColor}60; }
          ::placeholder { color: ${cs.bodyText} !important; opacity: 0.5 !important; }
        `}</style>

        {cs.pageBgImage && <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${(cs.pageBgOverlayOpacity || 0) / 100})`, backdropFilter: `blur(${cs.pageBgBlur || 0}px)`, zIndex: 0 }} />}

        {(isSplit || isSidebar) && (
          <div className={`${leftWidthClass} relative ${isInsideFrame ? 'min-h-[200px]' : 'min-h-[300px]'} flex flex-col justify-between p-8 md:p-12 z-10 ${side === 'right' ? (forceMobileLayout ? 'border-b' : 'md:order-last md:border-l border-b') : (forceMobileLayout ? 'border-b' : 'md:border-r border-b')} border-white/10`}
            style={{ background: isSplit ? (form.cover_image_url ? `url(${form.cover_image_url}) center/cover no-repeat` : cs.headerBg) : cs.headerBg, color: cs.headerText }}>
            <div className="relative z-10">
              {form.logo_url && <div className="mb-10"><img src={form.logo_url} alt="Logo" style={{ height: `${cs.logoHeight || 48}px`, borderRadius: `${cs.logoBorderRadius || 0}px` }} /></div>}
              <h1 className="text-3xl md:text-5xl font-black mb-4" dangerouslySetInnerHTML={{ __html: sanitize(form.title) }} />
              <p className="text-lg opacity-80 max-w-xl" dangerouslySetInnerHTML={{ __html: sanitize(displayDescription) }} />
            </div>
          </div>
        )}

        <div className={`flex-1 relative z-10 flex flex-col ${rightAlignClass}`}>
          <div className={`w-full flex-1 flex flex-col ${isSplit || isSidebar ? 'bg-white shadow-none' : ''}`} style={{ maxWidth: (isSplit || isSidebar) ? 'none' : `${cs.containerWidth}px` }}>
            <div className={`w-full max-w-4xl mx-auto p-8 md:p-16 ${isSplit || isSidebar ? 'bg-white h-full overflow-y-auto custom-scrollbar' : 'rounded-[2rem] shadow-2xl overflow-hidden'}`}
              style={{ backgroundColor: isSplit || isSidebar ? '#fff' : cs.bodyBg, borderRadius: isSplit || isSidebar ? '0' : `${cs.borderRadius}px`, boxShadow: isSplit || isSidebar ? 'none' : cs.boxShadow, transform: `scale(${cs.formScale || 1})`, transformOrigin: 'top center' }}>
              {!isSplit && !isSidebar && (
                <div className="mb-12 pb-10 px-10 pt-10" style={{ textAlign: cs.headerAlignment, backgroundColor: cs.headerBg, color: cs.headerText }}>
                  <h1 className="text-4xl font-black mb-3" dangerouslySetInnerHTML={{ __html: sanitize(form.title) }} />
                  <p className="text-lg opacity-80" dangerouslySetInnerHTML={{ __html: sanitize(displayDescription) }} />
                </div>
              )}
              {error && <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="overflow-hidden relative min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div key={currentPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: `${cs.fieldSpacing}px` }}>
                    {currentPageFields.map((field: any) => {
                      const fieldKey = field.id || field.label
                      if (!isFieldVisible(fieldKey)) return null
                      return (
                        <div key={fieldKey} className="space-y-2">
                          <label style={{ ...labelStyle, color: field.fieldTextColor || cs.labelColor }} dangerouslySetInnerHTML={{ __html: sanitize(field.label) + (field.required ? ` *` : '') }} />
                  {field.type === 'text' && (
                    <div className="relative">
                      <input
                        type="text"
                        value={data[fieldKey] || ''}
                        placeholder={field.placeholder || ''}
                        style={{ ...getInternalInputStyle(), paddingRight: '3rem' }}
                        onChange={e => handleInputChange(fieldKey, e.target.value)}
                      />
                      <VoiceButton fieldId={fieldKey} />
                    </div>
                  )}
                  {field.type === 'email' && (
                    <div className="relative">
                      <input
                        type="email"
                        value={data[fieldKey] || ''}
                        placeholder={field.placeholder || ''}
                        style={{ ...getInternalInputStyle(), paddingRight: '3rem' }}
                        onChange={e => handleInputChange(fieldKey, e.target.value)}
                      />
                      <VoiceButton fieldId={fieldKey} />
                    </div>
                  )}
                  {field.type === 'number' && <input type="number" value={data[fieldKey] || ''} placeholder={field.placeholder || ''} style={getInternalInputStyle()} onChange={e => handleInputChange(fieldKey, e.target.value)} />}
                  {field.type === 'textarea' && (
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={data[fieldKey] || ''}
                        placeholder={field.placeholder || ''}
                        style={{ ...getInternalInputStyle(), resize: 'vertical', paddingRight: '3rem' }}
                        onChange={e => handleInputChange(fieldKey, e.target.value)}
                      />
                      <div className="absolute right-0 top-6">
                        <VoiceButton fieldId={fieldKey} />
                      </div>
                    </div>
                  )}
                          {field.type === 'select' && <select style={getInternalInputStyle()} onChange={e => handleInputChange(fieldKey, e.target.value)}><option value="">Select...</option>{field.options?.map((o: string, i: number) => <option key={i} value={o}>{o}</option>)}</select>}
                          {field.type === 'radio' && <div className="space-y-2">{field.options?.map((o: string, i: number) => <label key={i} className="flex items-center gap-3 p-3 border-2 rounded-xl" style={{ borderColor: cs.inputBorderColor }}><input type="radio" name={fieldKey} value={o} onChange={e => handleInputChange(fieldKey, e.target.value)} />{o}</label>)}</div>}
                          {field.type === 'checkbox' && (field.options?.length ? <div className="space-y-2">{field.options.map((o: string, i: number) => <label key={i} className="flex items-center gap-3 p-3 border-2 rounded-xl" style={{ borderColor: cs.inputBorderColor }}><input type="checkbox" onChange={e => handleCheckboxChange(fieldKey, o, e.target.checked)} />{o}</label>)}</div> : <label className="flex items-center gap-3 p-3 border-2 rounded-xl" style={{ borderColor: cs.inputBorderColor }}><input type="checkbox" onChange={e => handleInputChange(fieldKey, e.target.checked)} /> {field.placeholder || 'I agree'}</label>)}
                          {field.type === 'rating' && <div className="flex gap-2">{[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => handleInputChange(fieldKey, s)} style={{ color: (data[fieldKey] || 0) >= s ? cs.accentColor : '#ccc' }}><Smartphone className="w-8 h-8" /></button>)}</div>}
                        </div>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>
                <div className="pt-8 mt-4 flex gap-4">
                  {currentPage > 0 && <button type="button" onClick={handleBack} className="flex-1 py-4 font-bold border-2" style={{ color: cs.bodyText, borderColor: cs.inputBorderColor, borderRadius: btnRadius }}>Back</button>}
                  <button type={isLastPage ? "submit" : "button"} onClick={isLastPage ? undefined : handleNext} className="flex-[2] py-4 font-bold" style={{ background: cs.accentColor, color: cs.buttonText, borderRadius: btnRadius }}>{isLastPage ? (loading ? '...' : (settings.submitButtonText || 'Submit')) : 'Next'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- DEVICE FRAME COMPONENT ---
  const DeviceFrame = ({ device, children }: { device: any, children: React.ReactNode }) => {
    const isMobile = device.width < 500;
    const SCALE = isMobile ? 0.8 : 0.65;
    
    return (
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/10 rounded-full border border-white/20 shadow-lg backdrop-blur-md">
          <span className="text-xs font-black text-white uppercase tracking-widest">{device.name}</span>
        </div>
        
        <div className="relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] rounded-[3.5rem]" style={{ width: device.width, height: device.height, transform: `scale(${SCALE})`, transformOrigin: 'top center', marginBottom: `-${device.height * (1 - SCALE)}px` }}>
          <div className="absolute inset-0 bg-gray-950 rounded-[3.5rem] border-[14px] border-gray-900 ring-[8px] ring-gray-800/60 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-3xl z-[100] flex items-center justify-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-gray-950" />
               <div className="w-12 h-1.5 bg-gray-950 rounded-full" />
            </div>
            <div className="w-full h-full bg-white overflow-y-auto custom-scrollbar relative">
              {children}
            </div>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-900/40 backdrop-blur-md rounded-full z-[100]" />
          </div>
        </div>
      </div>
    )
  }

  if (!isPreview) return <FormContent />

  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-x-hidden relative transition-colors duration-500",
      activeView !== 'desktop' ? "bg-neutral-950" : "bg-transparent"
    )}>
      {/* Professional Single-View Device Toolbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center p-2 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl gap-1">
        
        <button 
          onClick={() => { setActiveView('desktop'); setDropdownOpen(null); }} 
          className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl transition-all font-bold text-sm", activeView === 'desktop' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
        >
          <Laptop className="w-4 h-4" />
          <span>Desktop</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <div className="relative">
          <button 
            onClick={() => { 
              if (activeView !== 'tablet') setActiveView('tablet');
              setDropdownOpen(dropdownOpen === 'tablet' ? null : 'tablet'); 
            }} 
            className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl transition-all font-bold text-sm", activeView === 'tablet' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
          >
            <Tablet className="w-4 h-4" />
            <span>Tablet</span>
            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform opacity-50", dropdownOpen === 'tablet' && "rotate-180")} />
          </button>
          <AnimatePresence>
            {dropdownOpen === 'tablet' && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 bg-neutral-900 border border-white/10 rounded-[2rem] p-3 shadow-2xl overflow-hidden origin-top">
                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                  {DEVICES.tablet.map(dev => (
                    <button key={dev.id} onClick={() => { setActiveTabletId(dev.id); setActiveView('tablet'); setDropdownOpen(null); }} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left", activeTabletId === dev.id ? "bg-indigo-600 text-white font-bold" : "text-white/60 hover:bg-white/10 font-medium")}>
                      <span className="text-xs">{dev.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <div className="relative">
          <button 
            onClick={() => { 
              if (activeView !== 'mobile') setActiveView('mobile');
              setDropdownOpen(dropdownOpen === 'mobile' ? null : 'mobile'); 
            }} 
            className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl transition-all font-bold text-sm", activeView === 'mobile' ? "bg-white text-indigo-600 shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10")}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile</span>
            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform opacity-50", dropdownOpen === 'mobile' && "rotate-180")} />
          </button>
          <AnimatePresence>
            {dropdownOpen === 'mobile' && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full mt-4 right-0 w-64 bg-neutral-900 border border-white/10 rounded-[2rem] p-3 shadow-2xl overflow-hidden origin-top">
                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                  {DEVICES.mobile.map(dev => (
                    <button key={dev.id} onClick={() => { setActiveMobileId(dev.id); setActiveView('mobile'); setDropdownOpen(null); }} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left", activeMobileId === dev.id ? "bg-indigo-600 text-white font-bold" : "text-white/60 hover:bg-white/10 font-medium")}>
                      <span className="text-xs">{dev.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={cn(
        "flex-1 transition-all duration-500 flex",
        activeView === 'desktop' ? "pt-0 w-full" : "items-center justify-center pt-28 pb-16"
      )}>
        {activeView === 'desktop' && (
           <FormContent />
        )}
        {activeView === 'tablet' && (
           <DeviceFrame device={DEVICES.tablet.find(d => d.id === activeTabletId)}>
             <FormContent isInsideFrame forceMobileLayout />
           </DeviceFrame>
        )}
        {activeView === 'mobile' && (
           <DeviceFrame device={DEVICES.mobile.find(d => d.id === activeMobileId)}>
             <FormContent isInsideFrame forceMobileLayout />
           </DeviceFrame>
        )}
      </div>
      
      {activeView !== 'desktop' && (
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px]" />
      )}
    </div>
  )
}

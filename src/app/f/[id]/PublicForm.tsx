'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

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
  const turnstileRef = useRef<TurnstileInstance>(null)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const requiresCaptcha = Boolean(turnstileSiteKey)

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
  // ----------------------

  const fontUrl = cs.fontFamily !== 'Inter' && cs.fontFamily !== 'Georgia'
    ? `https://fonts.googleapis.com/css2?family=${cs.fontFamily.replace(' ', '+')}:wght@400;500;600;700;800&display=swap`
    : null

  const handleInputChange = (fieldId: string, value: any) => {
    setData(prev => ({ ...prev, [fieldId]: value }))
    executeJumpLogic(fieldId, value)
  }

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

    if (field.type === 'checkbox' && !field.options?.length) {
      return value !== true
    }

    if (value === undefined || value === null) {
      return true
    }

    if (typeof value === 'string') {
      return value.trim() === ''
    }

    if (Array.isArray(value)) {
      return value.length === 0
    }

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
        if (!res.ok) throw new Error(payload.error || 'File upload failed. Please try again.')
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
      setError(`Please fill all required fields before proceeding: ${missingFields[0].label}`)
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
      setError(`Please fill all required fields: ${missingFields[0].label}`)
      return
    }

    setLoading(true)
    setError('')
    try {
      // Filter out hidden fields from submission
      const activeData: Record<string, any> = {}
      fields.forEach((f: any) => {
        const key = f.id || f.label
        if (isFieldVisible(key) && data[key] !== undefined) {
          activeData[key] = data[key]
        }
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
        body: JSON.stringify({ 
          data: activeData, 
          files: uploadedFilesArray,
          captchaToken: turnstileToken 
        }),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Failed to submit form')
      
      if (settings.redirectUrl) {
         window.location.href = settings.redirectUrl
      } else {
         setSubmitted(true)
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      // Reset turnstile on error
      turnstileRef.current?.reset()
      setTurnstileToken('')
    }
  }

  if (submitted) {
    return (
      <div 
        style={{ 
          background: cs.bodyBg, 
          fontFamily: `"${cs.fontFamily}", sans-serif`, 
          padding: `${cs.containerPadding * 1.5}px 40px`, 
          textAlign: 'center' 
        }} 
        className="animate-in fade-in zoom-in duration-500"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-4" style={{ color: cs.bodyText }}>{settings.thankYouHeadline}</h2>
        <p className="text-lg opacity-70 leading-relaxed" style={{ color: cs.bodyText }}>{settings.thankYouMessage}</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-8 text-sm font-semibold opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: cs.bodyText }}
        >
          Submit another response
        </button>
      </div>
    )
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

  // Layout Logic 
  const isSplit = cs.layout === 'split'
  const isSidebar = cs.layout === 'sidebar'
  const side = cs.layoutSide || 'left'

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col ${isSplit || isSidebar ? 'lg:flex-row' : 'items-center justify-center p-4 md:p-8'}`} 
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
        body { margin: 0; background: ${cs.pageBgColor}; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${cs.accentColor}40; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${cs.accentColor}60; }
        
        ::placeholder {
          color: ${cs.bodyText} !important;
          opacity: 0.5 !important;
        }
        select option {
          background-color: ${cs.pageBgColor.toLowerCase() === '#0a0a0a' ? '#171717' : '#ffffff'} !important;
          color: ${cs.pageBgColor.toLowerCase() === '#0a0a0a' ? '#ffffff' : '#000000'} !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: ${cs.pageBgColor.toLowerCase() === '#0a0a0a' ? 'invert(1)' : 'none'};
        }
      `}</style>

      {/* Background Overlay */}
      {cs.pageBgImage && (
        <div className="fixed inset-0 pointer-events-none" style={{ 
          backgroundColor: `rgba(0,0,0,${(cs.pageBgOverlayOpacity || 0) / 100})`,
          backdropFilter: `blur(${cs.pageBgBlur || 0}px)`,
          zIndex: 0
        }} />
      )}

      {/* --- SIDEBAR / SPLIT BRANDING SIDE --- */}
      {(isSplit || isSidebar) && (
        <div className={`w-full ${isSplit ? 'lg:w-1/2' : 'lg:w-[320px] lg:shrink-0'} relative min-h-[300px] lg:min-h-screen flex flex-col justify-between p-8 lg:p-12 z-10 ${side === 'right' ? 'lg:order-last border-l' : 'border-r'} border-white/10`}
          style={{ 
            background: isSplit ? (form.cover_image_url ? `url(${form.cover_image_url}) center/cover no-repeat` : cs.headerBg) : cs.headerBg,
            color: cs.headerText
          }}>
          
          {isSplit && form.cover_image_url && (
            <div className="absolute inset-0 bg-black/30 z-0" />
          )}

          <div className="relative z-10">
            {form.logo_url && (
              <div className="mb-10" style={{ 
                textAlign: cs.logoAlignment || 'left',
              }}>
                <img 
                  src={form.logo_url} 
                  alt="Logo" 
                  style={{ 
                    height: `${cs.logoHeight || 48}px`,
                    borderRadius: `${cs.logoBorderRadius || 0}px`,
                    display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
              </div>
            )}

            <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4" style={{ textAlign: cs.headerAlignment }} dangerouslySetInnerHTML={{ __html: sanitize(form.title) }} />
            <p className="text-lg opacity-80 leading-relaxed max-w-xl" style={{ textAlign: cs.headerAlignment }} dangerouslySetInnerHTML={{ __html: sanitize(displayDescription) }} />
          </div>

          <div className="relative z-10 mt-12">
            {cs.secondaryImageUrl && (
              <div className="pt-8 border-t border-white/20">
                {cs.secondaryImageLink ? (
                  <a href={cs.secondaryImageLink} target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform">
                    <img src={cs.secondaryImageUrl} alt="Secondary Branding" className="max-h-12 opacity-80 hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <img src={cs.secondaryImageUrl} alt="Secondary Branding" className="max-h-12 opacity-60" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MAIN FORM CONTAINER --- */}
      <div className={`flex-1 relative z-10 flex flex-col ${isSplit || isSidebar ? 'justify-start' : 'items-center'}`}>
        {!isSplit && !isSidebar && form.cover_image_url && (
          <div className="w-full mb-8 relative overflow-hidden rounded-2xl shadow-xl" 
            style={{ 
              height: `${cs.coverHeight || 240}px`,
              maxWidth: `${cs.containerWidth}px`
            }}>
            <img 
              src={form.cover_image_url} 
              alt="Cover" 
              className="w-full h-full"
              style={{ objectFit: cs.coverImageFit || 'cover' }}
            />
          </div>
        )}

        <div className={`w-full flex-1 flex flex-col ${isSplit || isSidebar ? 'bg-white lg:bg-transparent lg:shadow-none' : ''} transition-all duration-700`}
          style={{ 
            maxWidth: (isSplit || isSidebar) ? 'none' : `${cs.containerWidth}px`,
          }}>
          
          <div className={`w-full max-w-4xl mx-auto p-8 lg:p-16 ${isSplit || isSidebar ? 'bg-white h-full overflow-y-auto custom-scrollbar' : 'rounded-[2rem] shadow-2xl overflow-hidden'}`}
            style={{
              backgroundColor: isSplit || isSidebar ? '#fff' : cs.bodyBg,
              borderRadius: isSplit || isSidebar ? '0' : `${cs.borderRadius}px`,
              boxShadow: isSplit || isSidebar ? 'none' : cs.boxShadow,
              transform: `scale(${cs.formScale || 1})`,
              transformOrigin: 'top center',
            }}>
            
            {/* Header for Centered layout */}
            {!isSplit && !isSidebar && (
              <div className="mb-12 border-b border-gray-100 pb-10" style={{ textAlign: cs.headerAlignment }}>
                {form.logo_url && (
                  <div className="mb-8" style={{ 
                    textAlign: cs.logoAlignment || 'left',
                  }}>
                    <img 
                      src={form.logo_url} 
                      alt="Logo" 
                      style={{ 
                        height: `${cs.logoHeight || 48}px`,
                        borderRadius: `${cs.logoBorderRadius || 0}px`,
                        display: 'inline-block',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }} 
                    />
                  </div>
                )}
                <h1 className="text-4xl font-black tracking-tight mb-3" style={{ color: cs.bodyText }} dangerouslySetInnerHTML={{ __html: sanitize(form.title) }} />
                <p className="text-lg opacity-60 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: sanitize(displayDescription) }} />
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-[0.9em] animate-in slide-in-from-top duration-300">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-red-800">Please correct the following</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {maxPage > 0 && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-10 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentPage + 1) / (maxPage + 1)) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="h-full"
                  style={{ background: cs.accentColor }}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="overflow-hidden relative min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', gap: `${cs.fieldSpacing}px` }}
                >
                  {currentPageFields.map((field: any, index: number) => {
                    const fieldKey = field.id || field.label
                    if (!isFieldVisible(fieldKey)) return null;

                    return (
                      <div
                        key={fieldKey}
                        id={`field-${fieldKey}`}
                        className="space-y-2 rounded-xl transition-all duration-300"
                        style={field.fieldBg ? {
                          backgroundColor: field.fieldBg,
                          padding: '16px',
                          borderRadius: '12px',
                        } : undefined}
                      >
                        <label
                          style={{
                            ...labelStyle,
                            color: field.fieldTextColor || cs.labelColor,
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitize(field.label) + (field.required ? `<span style="color: ${cs.accentColor}" class="ml-1.5">*</span>` : '') }}
                        />

                        {field.type === 'text' && (
                          <input type="text" placeholder={field.placeholder || ''}
                            onChange={e => handleInputChange(fieldKey, e.target.value)}
                            style={getInternalInputStyle()}
                      onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                      onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                    />
                  )}

                  {field.type === 'email' && (
                    <input type="email" placeholder={field.placeholder || 'name@example.com'}
                      onChange={e => handleInputChange(fieldKey, e.target.value)}
                      style={getInternalInputStyle()}
                      onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                      onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                    />
                  )}

                  {field.type === 'number' && (
                    <input type="number" placeholder={field.placeholder || ''}
                      onChange={e => handleInputChange(fieldKey, Number(e.target.value))}
                      style={getInternalInputStyle()}
                      onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                      onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea rows={4} placeholder={field.placeholder || ''}
                      onChange={e => handleInputChange(fieldKey, e.target.value)}
                      style={{ ...getInternalInputStyle(), resize: 'vertical' }}
                      onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                      onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                    />
                  )}

                  {field.type === 'select' && (
                    <div className="relative">
                      <select 
                        onChange={e => handleInputChange(fieldKey, e.target.value)}
                        style={{ ...getInternalInputStyle(), appearance: 'none' }}
                        defaultValue=""
                        onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                        onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                      >
                        <option value="" disabled>Select an option...</option>
                        {field.options?.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={{ color: cs.accentColor }}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  )}

                  {field.type === 'multiselect' && (
                    <div>
                      <select multiple 
                        onChange={e => {
                          const selected = Array.from(e.target.selectedOptions, o => o.value)
                          handleInputChange(fieldKey, selected)
                        }}
                        style={{ ...getInternalInputStyle(), minHeight: '130px' }}
                        onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                        onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                      >
                        {field.options?.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                      <p className="text-xs mt-1.5 opacity-60" style={{ color: cs.bodyText }}>Hold Ctrl / Cmd to select multiple</p>
                    </div>
                  )}

                  {field.type === 'radio' && (
                    <div className="space-y-2.5 mt-1">
                      {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all" style={{ border: `1.5px solid ${cs.inputBorderColor}`, background: cs.inputBg }}>
                          <input type="radio" name={fieldKey} value={opt} 
                            onChange={e => handleInputChange(fieldKey, e.target.value)}
                            className="w-4 h-4" style={{ accentColor: cs.accentColor }}
                          />
                          <span style={{ color: cs.bodyText, fontFamily: 'inherit' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && field.options?.length ? (
                    <div className="space-y-2.5 mt-1">
                      {field.options?.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all" style={{ border: `1.5px solid ${cs.inputBorderColor}`, background: cs.inputBg }}>
                          <input type="checkbox" value={opt}
                            onChange={e => handleCheckboxChange(fieldKey, opt, e.target.checked)}
                            className="w-4 h-4 rounded" style={{ accentColor: cs.accentColor }}
                          />
                          <span style={{ color: cs.bodyText, fontFamily: 'inherit' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <label
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                      style={{ border: `1.5px solid ${cs.inputBorderColor}`, background: cs.inputBg }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(data[fieldKey])}
                        onChange={e => handleInputChange(fieldKey, e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: cs.accentColor }}
                      />
                      <span style={{ color: cs.bodyText, fontFamily: 'inherit' }}>
                        {field.placeholder || 'I agree'}
                      </span>
                    </label>
                  ) : null}

                  {field.type === 'rating' && (
                    <div className="flex items-center gap-2 py-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button
                           key={star}
                           type="button"
                           onClick={() => handleInputChange(fieldKey, star)}
                           className="transition-all hover:scale-110 active:scale-95"
                           style={{ 
                             color: (data[fieldKey] || 0) >= star ? cs.accentColor : `${cs.bodyText}20`
                           }}
                         >
                           <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                         </button>
                       ))}
                       {(data[fieldKey] || 0) > 0 && (
                         <span className="ml-3 text-sm font-bold opacity-60" style={{ color: cs.bodyText }}>{data[fieldKey]} / 5</span>
                       )}
                    </div>
                  )}

                  {['file', 'multifile'].includes(field.type) && (() => {
                    const mode = fileModes[fieldKey] || 'upload'
                    return (
                      <div>
                        {/* Toggle */}
                        <div className="flex bg-gray-100/80 rounded-lg p-1 w-fit mb-3 border border-gray-200" style={{ background: cs.inputBg }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFileModes({ ...fileModes, [fieldKey]: 'upload' })
                              handleInputChange(fieldKey, files[fieldKey]) 
                            }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                            style={{ color: mode === 'upload' ? cs.accentColor : cs.bodyText }}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFileModes({ ...fileModes, [fieldKey]: 'link' })
                              handleInputChange(fieldKey, null) 
                            }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'link' ? 'bg-white shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                            style={{ color: mode === 'link' ? cs.accentColor : cs.bodyText }}
                          >
                            Paste Link
                          </button>
                        </div>

                        {mode === 'upload' ? (
                          <label className="flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
                            style={{ borderColor: files[fieldKey] ? cs.accentColor : cs.inputBorderColor, background: files[fieldKey] ? cs.accentColor + '0d' : cs.inputBg }}>
                            <div className="flex flex-col items-center justify-center text-center px-6">
                              {files[fieldKey] ? (
                                <>
                                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: cs.accentColor }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm font-semibold" style={{ color: cs.accentColor }}>
                                    {Array.isArray(files[fieldKey]) ? `${files[fieldKey].length} files attached` : files[fieldKey].fileName}
                                  </p>
                                  {field.type === 'multifile' && <p className="text-xs mt-1 opacity-60" style={{ color: cs.bodyText }}>Click to add more</p>}
                                </>
                              ) : (
                                <>
                                  <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: cs.bodyText }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p className="text-sm" style={{ color: cs.bodyText }}>
                                    <span className="font-bold" style={{ color: cs.accentColor }}>Click to upload</span> {field.type === 'multifile' ? 'multiple files' : 'a file'}
                                  </p>
                                  <p className="text-xs mt-1 opacity-50" style={{ color: cs.bodyText }}>PNG, JPG, PDF up to 50MB</p>
                                </>
                              )}
                            </div>
                            <input type="file" className="hidden" multiple={field.type === 'multifile'} 
                              onChange={e => { if (e.target.files?.length) handleFileChange(fieldKey, e.target.files, field.type === 'multifile') }}
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none" style={{ color: cs.bodyText, opacity: 0.4 }}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            </div>
                            <input 
                              type="url" 
                              placeholder="https://drive.google.com/..."
                              value={typeof data[fieldKey] === 'string' ? data[fieldKey] : ''}
                              onChange={e => handleInputChange(fieldKey, e.target.value)}
                              style={{ ...getInternalInputStyle(), paddingLeft: '2.75rem' }}
                              onFocus={e => { e.target.style.borderColor = cs.accentColor }}
                              onBlur={e => { e.target.style.borderColor = cs.inputBorderColor }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>

        {isLastPage && requiresCaptcha && (
          <div className="flex justify-center mt-12 mb-6 w-full">
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => {
                setError('Security check failed. Please refresh and try again.')
                setTurnstileToken('')
              }}
              onExpire={() => setTurnstileToken('')}
            />
          </div>
        )}

        {/* Navigation Controls */}
        <div className="pt-8 mt-4 flex gap-4" style={{ 
          borderTop: isLastPage ? 'none' : `1px solid ${cs.inputBorderColor}40` 
        }}>
          {currentPage > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex-1 py-4 px-6 text-lg font-bold transition-all hover:bg-gray-50 active:scale-[0.99] border-2"
              style={{ color: cs.bodyText, borderColor: cs.inputBorderColor, borderRadius: btnRadius }}
            >
              Back
            </button>
          )}
          
          {isLastPage ? (
            <button
              type="submit"
              disabled={loading || (requiresCaptcha && !turnstileToken)}
              className="flex-[2] py-4 px-6 text-lg font-bold transition-all disabled:opacity-50 hover:opacity-95 active:scale-[0.99] shadow-lg"
              style={{ background: cs.accentColor, color: cs.buttonText, fontFamily: 'inherit', borderRadius: btnRadius }}
            >
              {loading ? 'Submitting...' : (settings.submitButtonText || 'Submit Form')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] py-4 px-6 text-lg font-bold transition-all hover:opacity-95 active:scale-[0.99] shadow-lg"
              style={{ background: cs.accentColor, color: cs.buttonText, fontFamily: 'inherit', borderRadius: btnRadius }}
            >
              Next Step
            </button>
          )}
        </div>
            </form>
          </div>
          
          {/* Secondary Footer Branding for centered layout */}
          {!isSplit && !isSidebar && cs.secondaryImageUrl && (
            <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
               {cs.secondaryImageLink ? (
                  <a href={cs.secondaryImageLink} target="_blank" rel="noopener noreferrer">
                    <img src={cs.secondaryImageUrl} alt="Secondary Branding" className="max-h-12 mx-auto" />
                  </a>
                ) : (
                  <img src={cs.secondaryImageUrl} alt="Secondary Branding" className="max-h-12 mx-auto" />
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

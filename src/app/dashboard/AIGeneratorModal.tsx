'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  GitBranch,
  ImagePlus,
  Layers3,
  Loader2,
  Mic,
  MicOff,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

type SpeechRecognitionConstructor = new () => SpeechRecognition

type SpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  )
}

export default function AIGeneratorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [logicPrompt, setLogicPrompt] = useState('')
  const [model, setModel] = useState('gemma-4-26b-a4b-it')
  const [imagePreview, setImagePreview] = useState('')
  const [pageCount, setPageCount] = useState(1)
  const [includeLogic, setIncludeLogic] = useState(false)
  const [styleDirection, setStyleDirection] = useState('minimal premium SaaS')
  const [businessGoal, setBusinessGoal] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [requiredFields, setRequiredFields] = useState('')
  const [submitButtonText, setSubmitButtonText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [listeningTarget, setListeningTarget] = useState<'prompt' | 'logic' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const router = useRouter()
  const { currentTheme } = useTheme()

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListeningTarget(null)
  }

  const startListening = (target: 'prompt' | 'logic') => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Chrome and Edge work best.')
      return
    }

    if (recognitionRef.current) stopListening()

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }

      if (!transcript.trim()) return

      if (target === 'prompt') {
        setPrompt((prev) => `${prev}${prev ? ' ' : ''}${transcript}`.trim())
      } else {
        setLogicPrompt((prev) => `${prev}${prev ? ' ' : ''}${transcript}`.trim())
        setIncludeLogic(true)
      }
    }
    recognition.onerror = () => stopListening()
    recognition.onend = () => setListeningTarget(null)
    recognitionRef.current = recognition
    setListeningTarget(target)
    recognition.start()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setModel('gemma-4-31b-it')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const buildPrompt = () => {
    const corePrompt = prompt.trim() || 'Analyze the provided image and create a production-ready digital form.'
    const details = [
      corePrompt,
      businessGoal && `Business goal: ${businessGoal}`,
      targetAudience && `Target audience: ${targetAudience}`,
      requiredFields && `Required fields guidance: ${requiredFields}`,
      includeLogic && logicPrompt && `Conditional logic requirements: ${logicPrompt}`,
      pageCount > 1 && `Use exactly ${pageCount} pages.`,
      submitButtonText && `Submit button text: ${submitButtonText}`,
    ].filter(Boolean)

    return details.join('\n')
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim() && !imagePreview) return
    setLoading(true)
    setError('')
    stopListening()

    try {
      let imageBase64 = ''
      let imageMimeType = ''

      if (imagePreview) {
        const parts = imagePreview.split(',')
        const match = parts[0]?.match(/:(.*?);/)
        if (parts.length === 2 && match) {
          imageMimeType = match[1]
          imageBase64 = parts[1]
        }
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(),
          model,
          imageBase64,
          imageMimeType,
          options: {
            pageCount,
            includeLogic,
            logicPrompt,
            styleDirection,
            businessGoal,
            targetAudience,
            requiredFields,
            submitButtonText,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate form')

      const createRes = await fetch('/api/import-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonString: JSON.stringify(data) }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) {
        const details = Array.isArray(createData.details)
          ? createData.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ')
          : createData.details
        throw new Error(details || createData.error || 'Failed to save generated form')
      }

      setIsOpen(false)
      router.push(`/dashboard/forms/${createData.formId || createData.id}/edit`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const micButton = (target: 'prompt' | 'logic') => (
    <button
      type="button"
      onClick={() => listeningTarget === target ? stopListening() : startListening(target)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
      style={{
        borderColor: listeningTarget === target ? currentTheme.primary : currentTheme.border,
        backgroundColor: listeningTarget === target ? `${currentTheme.primary}22` : currentTheme.card,
        color: listeningTarget === target ? currentTheme.primary : currentTheme.textMuted,
      }}
      title={listeningTarget === target ? 'Stop voice input' : 'Start voice input'}
    >
      {listeningTarget === target ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl bg-violet-600 text-white"
      >
        <Sparkles className="w-4 h-4 mr-2" strokeWidth={3} />
        Generate with AI
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border, borderWidth: '1px' }}
          >
            <button
              onClick={() => { stopListening(); setIsOpen(false) }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: currentTheme.textMuted }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6 pr-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black" style={{ color: currentTheme.text }}>AI Form Flow Studio</h3>
                <p className="text-sm font-medium" style={{ color: currentTheme.textMuted }}>
                  Generate forms from text, voice, images, and conditional logic.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setModel('gemma-4-26b-a4b-it')}
                  className={`p-4 rounded-xl text-left border-2 transition-all ${model === 'gemma-4-26b-a4b-it' ? 'border-violet-600 bg-violet-50/50' : 'border-transparent bg-gray-50'}`}
                >
                  <span className="block text-sm font-black mb-1" style={{ color: currentTheme.text }}>Gemma 4 26B</span>
                  <span className="block text-[10px] font-medium" style={{ color: currentTheme.textMuted }}>Fast text-to-form generation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModel('gemma-4-31b-it')}
                  className={`p-4 rounded-xl text-left border-2 transition-all ${model === 'gemma-4-31b-it' ? 'border-violet-600 bg-violet-50/50' : 'border-transparent bg-gray-50'}`}
                >
                  <span className="block text-sm font-black mb-1" style={{ color: currentTheme.text }}>Gemma 4 31B</span>
                  <span className="block text-[10px] font-medium" style={{ color: currentTheme.textMuted }}>Best for images, voice prompts, and logic</span>
                </button>
              </div>

              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>Prompt</label>
                      {micButton('prompt')}
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Example: Create a minimalist job application form with Full Name, Email Address, and CV Upload. Use a split layout, dark blue accent, and Inter typography."
                      className="w-full h-36 p-4 rounded-2xl bg-gray-50 border-2 outline-none transition-colors text-sm font-medium resize-none"
                      style={{ borderColor: prompt ? currentTheme.border : 'transparent', color: currentTheme.text }}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: currentTheme.text }}>
                        <GitBranch className="w-4 h-4" />
                        Conditions
                      </label>
                      {micButton('logic')}
                    </div>
                    <textarea
                      value={logicPrompt}
                      onChange={(e) => { setLogicPrompt(e.target.value); setIncludeLogic(Boolean(e.target.value.trim())) }}
                      placeholder="Example: If employment type equals Freelancer, show Portfolio URL. If role contains Engineer, show GitHub Profile."
                      className="w-full h-24 p-4 rounded-2xl bg-gray-50 border-2 outline-none transition-colors text-sm font-medium resize-none"
                      style={{ borderColor: includeLogic ? currentTheme.border : 'transparent', color: currentTheme.text }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>
                    Image-to-Form
                  </label>
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:bg-violet-50/50" style={{ borderColor: currentTheme.border }}>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
                      <ImagePlus className="w-7 h-7 mb-2 text-violet-500" />
                      <span className="text-xs font-medium" style={{ color: currentTheme.textMuted }}>
                        Upload a sketch, screenshot, or scanned form
                      </span>
                    </label>
                  ) : (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 shadow-inner" style={{ borderColor: currentTheme.border }}>
                      <img src={imagePreview} alt="Uploaded form reference" className="w-full h-full object-cover opacity-90" />
                      <button
                        type="button"
                        onClick={() => setImagePreview('')}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setModel('gemma-4-31b-it'); startListening('prompt') }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                    disabled={loading}
                  >
                    <Mic className="w-4 h-4" />
                    Voice to Form with 31B
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                style={{ color: currentTheme.primary }}
              >
                <Settings2 className="w-4 h-4" />
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-2xl border" style={{ borderColor: currentTheme.border, backgroundColor: `${currentTheme.bg}55` }}>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Pages</span>
                    <input type="number" min={1} max={8} value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Style</span>
                    <input value={styleDirection} onChange={(e) => setStyleDirection(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Submit Text</span>
                    <input value={submitButtonText} onChange={(e) => setSubmitButtonText(e.target.value)} placeholder="Apply Now" className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Business Goal</span>
                    <input value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value)} placeholder="Qualify candidates" className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Audience</span>
                    <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Job applicants" className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: currentTheme.textMuted }}>Required Fields</span>
                    <input value={requiredFields} onChange={(e) => setRequiredFields(e.target.value)} placeholder="Name, email, CV" className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="md:col-span-2 lg:col-span-3 flex items-center gap-3 text-sm font-bold" style={{ color: currentTheme.text }}>
                    <input type="checkbox" checked={includeLogic} onChange={(e) => setIncludeLogic(e.target.checked)} style={{ accentColor: currentTheme.primary }} />
                    Generate conditional logic rules
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={(!prompt.trim() && !imagePreview) || loading}
                className="w-full flex items-center justify-center py-4 rounded-2xl font-black text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating production form...
                  </>
                ) : (
                  <>
                    <Layers3 className="w-5 h-5 mr-2" />
                    Generate Form Flow
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

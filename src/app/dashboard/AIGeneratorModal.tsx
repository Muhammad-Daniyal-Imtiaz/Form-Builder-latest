'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Loader2, Bot } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function AIGeneratorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('gemma-4-26b-a4b-it')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { currentTheme } = useTheme()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to generate form')
        }
        throw new Error(`Server Error (${res.status}): Please ensure your API key is configured and try again.`)
      }

      const data = await res.json()

      const createRes = await fetch('/api/import-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonString: JSON.stringify(data) })
      })

      const createData = await createRes.json()

      if (!createRes.ok) {
        if (createData.details) {
          const details = Array.isArray(createData.details) 
            ? createData.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')
            : JSON.stringify(createData.details)
          throw new Error(`Validation Error: ${details}`)
        }
        throw new Error(createData.error || 'Failed to save generated form')
      }

      setIsOpen(false)
      router.push(`/dashboard/forms/${createData.formId}/edit`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
            className="w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: currentTheme.card, borderColor: currentTheme.border, borderWidth: '1px' }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: currentTheme.textMuted }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black" style={{ color: currentTheme.text }}>AI Form Generator</h3>
                <p className="text-sm font-medium" style={{ color: currentTheme.textMuted }}>Powered by Gemini API</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>Model Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModel('gemma-4-26b-a4b-it')}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${model === 'gemma-4-26b-a4b-it' ? 'border-violet-600 bg-violet-50/50' : 'border-transparent bg-gray-50'}`}
                  >
                    <span className="block text-sm font-black mb-1" style={{ color: currentTheme.text }}>Gemma 4 26B</span>
                    <span className="block text-[10px] font-medium" style={{ color: currentTheme.textMuted }}>Fast & Efficient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModel('gemma-4-31b-it')}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${model === 'gemma-4-31b-it' ? 'border-violet-600 bg-violet-50/50' : 'border-transparent bg-gray-50'}`}
                  >
                    <span className="block text-sm font-black mb-1" style={{ color: currentTheme.text }}>Gemma 4 31B</span>
                    <span className="block text-[10px] font-medium" style={{ color: currentTheme.textMuted }}>Most Capable</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your form (e.g. 'Create a dark mode product feedback form with a 5-star rating and file upload for screenshots...')"
                  className="w-full h-32 p-4 rounded-2xl bg-gray-50 border-2 outline-none transition-colors text-sm font-medium resize-none"
                  style={{ 
                    borderColor: prompt ? currentTheme.border : 'transparent',
                    color: currentTheme.text
                  }}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className="w-full flex items-center justify-center py-4 rounded-2xl font-black text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Form'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, X, Loader2, Bot, ImagePlus, Trash2 } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function AIGeneratorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('gemma-4-26b-a4b-it')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { currentTheme } = useTheme()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setModel('gemma-4-31b-it') // Auto-select the best model for vision
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalPrompt = prompt.trim() || (imagePreview ? "Analyze this image and create a detailed digital form based on its contents." : "")
    if (!finalPrompt) return

    setLoading(true)
    setError('')

    try {
      let imageBase64 = '';
      let imageMimeType = '';
      if (imagePreview) {
        const parts = imagePreview.split(',');
        if (parts.length === 2) {
          const match = parts[0].match(/:(.*?);/);
          if (match) {
            imageMimeType = match[1];
            imageBase64 = parts[1];
          }
        }
      }

      const requestBody: any = { prompt: finalPrompt, model }
      if (imageBase64) {
        requestBody.imageBase64 = imageBase64
        requestBody.imageMimeType = imageMimeType
      }

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
                <label className="text-xs font-black uppercase tracking-widest flex items-center justify-between" style={{ color: currentTheme.text }}>
                  <span>Image-to-Form (Optional)</span>
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shadow-sm">New Vision AI!</span>
                </label>
                
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:bg-violet-50/50" style={{ borderColor: currentTheme.border }}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={loading} />
                    <ImagePlus className="w-6 h-6 mb-2 text-violet-500" />
                    <span className="text-xs font-medium" style={{ color: currentTheme.textMuted }}>
                      Upload a sketch, PDF, or screenshot
                    </span>
                  </label>
                ) : (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 shadow-inner" style={{ borderColor: currentTheme.border }}>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest" style={{ color: currentTheme.text }}>Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={imagePreview ? "Add extra instructions (e.g. 'Make it a dark theme with rounded corners')" : "Describe your form (e.g. 'Create a dark mode product feedback form...')"}
                  className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-2 outline-none transition-colors text-sm font-medium resize-none"
                  style={{ 
                    borderColor: prompt ? currentTheme.border : 'transparent',
                    color: currentTheme.text
                  }}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={(!prompt.trim() && !imagePreview) || loading}
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

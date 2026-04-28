'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TEMPLATES, Template, TemplateCategory } from '@/lib/templates'
import ImportFormModal from '@/components/ImportFormModal'


export default function NewFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null) // ID of template being loaded
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<TemplateCategory | 'All'>('All')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)


  const handleCreateForm = async (template?: Template) => {
    const templateId = template?.id || 'blank'
    setLoading(templateId)
    setError('')

    try {
      // 1. Create the Form
      const formTitle = template ? template.name : 'Untitled Form'
      const formDesc = template ? template.description : ''
      
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formTitle, 
          description: formDesc 
        }),
      })

      const formData = await res.json()
      if (!res.ok) throw new Error(formData.error || 'Failed to create form')

      // 2. If template, add the fields
      if (template && template.fields.length > 0) {
        // Special serialization for styles if provided
        if (template.customStyles) {
             const stylePayload = `${formDesc}|||STYLES:${JSON.stringify(template.customStyles)}`
             await fetch(`/api/forms/${formData.id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ description: stylePayload }),
             })
        }

        const fieldsRes = await fetch(`/api/forms/${formData.id}/fields`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: template.fields }),
        })
        if (!fieldsRes.ok) throw new Error('Failed to populate template fields')
      }

      // 3. Redirect to editor
      router.push(`/dashboard/forms/${formData.id}/edit`)
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  const handleImportForm = async (jsonString: string) => {
    setLoading('import')
    setError('')

    try {
      const res = await fetch('/api/import-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonString }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.details) {
          // If Zod error, show details
          const details = Array.isArray(data.details) 
            ? data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')
            : JSON.stringify(data.details)
          throw new Error(`Validation Error: ${details}`)
        }
        throw new Error(data.error || 'Failed to import form')
      }

      // Redirect to editor
      router.push(`/dashboard/forms/${data.id}/edit`)
    } catch (err: any) {
      console.error('Import Error:', err)
      setError(err.message)
      setLoading(null)
    }
  }


  const filteredTemplates = filter === 'All' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === filter)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Top Bar */}
       <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Select a Template</h1>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-white text-indigo-600 px-5 py-2 rounded-xl font-bold border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all text-sm flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Import JSON
                </button>
                <button 
                    onClick={() => handleCreateForm()}
                    disabled={!!loading}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {loading === 'blank' ? 'Creating...' : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Start Blank
                        </>
                    )}
                </button>
            </div>

       </div>

       <div className="max-w-7xl w-full mx-auto p-6 md:p-10 flex-1">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-in fade-in slide-in-from-top-1">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          <div className="mb-10">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Build your form in seconds</h2>
              <p className="text-gray-500 font-medium">Choose from 20+ world-class business templates designed to convert.</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
              {['All', 'Business', 'Marketing', 'Feedback', 'Health', 'Education', 'Real Estate', 'E-commerce', 'IT', 'HR', 'Creative'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${filter === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
                  >
                      {cat}
                  </button>
              ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {/* Blank Card */}
              <button
                onClick={() => handleCreateForm()}
                disabled={!!loading}
                className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all text-center aspect-[4/5] overflow-hidden"
              >
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-500">
                    <svg className="w-8 h-8 text-gray-300 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 underline decoration-gray-200 underline-offset-4 decoration-2">Blank Form</h3>
                  <p className="text-sm text-gray-500 font-medium px-4 leading-relaxed">Start from zero and design your unique flow.</p>
                  
                  {loading === 'blank' && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                      </div>
                  )}
              </button>

              {/* Template Cards */}
              {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateForm(template)}
                    disabled={!!loading}
                    className="group relative flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 transition-all text-left aspect-[4/5] overflow-hidden"
                  >
                      <div className="p-8 flex-1 flex flex-col">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm transition-all group-hover:rotate-6 group-hover:scale-110 duration-500 ${
                              template.category === 'Business' ? 'bg-indigo-100 text-indigo-600' :
                              template.category === 'Marketing' ? 'bg-amber-100 text-amber-600' :
                              template.category === 'Feedback' ? 'bg-emerald-100 text-emerald-600' :
                              template.category === 'Health' ? 'bg-sky-100 text-sky-600' :
                              'bg-pink-100 text-pink-600'
                          }`}>
                              {template.icon === 'briefcase' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
                              {template.icon === 'star' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>}
                              {template.icon === 'calendar' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                              {template.icon === 'help' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                              {template.icon === 'chart' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-indigo-100">{template.category}</span>
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{template.fields.length} Fields</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                          <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-3 mb-6">{template.description}</p>
                      </div>
                      <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-600 transition-all duration-500">
                          <span className="text-sm font-black text-gray-900 group-hover:text-white transition-colors duration-300">Use this Template</span>
                          <svg className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>

                      {loading === template.id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-30">
                            <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                  </button>
              ))}
          </div>
        </div>

        <ImportFormModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportForm}
          loading={loading === 'import'}
        />
    </div>
  )
}
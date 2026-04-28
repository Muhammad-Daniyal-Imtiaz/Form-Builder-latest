'use client'

import { useState } from 'react'
import ImportFormModal from '@/components/builder/ImportFormModal'
import { useRouter } from 'next/navigation'

export default function ImportButton() {
  const [showImportModal, setShowImportModal] = useState(false)
  const router = useRouter()

  const handleImport = async (jsonString: string) => {
    try {
      const response = await fetch('/api/import-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonString }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import form')
      }

      const data = await response.json()
      alert('Form imported successfully!')
      setShowImportModal(false)
      router.refresh()
      
      // Optionally redirect to the new form
      if (data.formId) {
        router.push(`/dashboard/forms/${data.formId}/edit`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert(error instanceof Error ? error.message : 'Import failed')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowImportModal(true)}
        className="inline-flex items-center bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-all active:scale-95"
      >
        <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
        </svg>
        Import JSON
      </button>

      <ImportFormModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  )
}

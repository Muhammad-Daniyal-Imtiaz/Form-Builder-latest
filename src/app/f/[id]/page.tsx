import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import PublicForm from './PublicForm'
import { DEFAULT_STYLES, DEFAULT_SETTINGS } from '@/components/builder/types'

export const revalidate = 0

export default async function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [form] = await db.select().from(forms).where(eq(forms.id, id))
  if (!form) notFound()

  if (!form.published) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Form Not Available</h2>
          <p className="text-gray-500 text-sm">This form is currently unpublished or no longer accepting responses.</p>
        </div>
      </div>
    )
  }

  const fields = await db.select().from(formFields).where(eq(formFields.formId, id)).orderBy(asc(formFields.order))

  let displayDescription = form.description || ''
  let customStyles = { ...DEFAULT_STYLES }
  let formSettings = { ...DEFAULT_SETTINGS }

  if (displayDescription.includes('|||SETTINGS:')) {
    const parts = displayDescription.split('|||SETTINGS:')
    try { formSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(parts[1]) } } catch { }
    displayDescription = parts[0]
  }

  if (displayDescription.includes('|||STYLES:')) {
    const parts = displayDescription.split('|||STYLES:')
    try { customStyles = { ...DEFAULT_STYLES, ...JSON.parse(parts[1]) } } catch { }
    displayDescription = parts[0]
  }

  const formWithFields = { ...form, form_fields: fields }

  return <PublicForm form={formWithFields} customStyles={customStyles} formSettings={formSettings} />
}

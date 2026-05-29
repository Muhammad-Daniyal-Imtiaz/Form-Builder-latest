import { NextResponse } from 'next/server'
import { db } from '@/db'
import { forms, formFields } from '@/db/schema'
import { getAuthUserId, AuthError } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { FormSchema, normalizeFieldForPersistence } from '@/lib/form-import-schema'
import { validateAndSanitizeFormData } from '@/lib/proto-sanitize'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slugId(value: string, fallback: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80)
  return slug || fallback
}

function prepareAiFormData(input: any) {
  const prepared = { ...input, name: input.name || input.title || 'AI Generated Form', fields: Array.isArray(input.fields) ? input.fields : [] }
  const idByOriginal = new Map<string, string>()
  const idByLabel = new Map<string, string>()

  prepared.fields = prepared.fields.map((field: any, index: number) => {
    const originalId = typeof field.id === 'string' ? field.id : ''
    const generatedId = UUID_REGEX.test(originalId) ? originalId : crypto.randomUUID()
    if (originalId) idByOriginal.set(originalId, generatedId)
    idByOriginal.set(slugId(originalId || field.label || '', `field_${index + 1}`), generatedId)
    if (field.label) idByLabel.set(String(field.label).toLowerCase().trim(), generatedId)
    return { ...field, id: generatedId, pageIndex: Number.isInteger(field.pageIndex) ? field.pageIndex : field.page_index ?? 0, logicRules: Array.isArray(field.logicRules) ? field.logicRules : Array.isArray(field.logic_rules) ? field.logic_rules : [] }
  })

  prepared.fields = prepared.fields.map((field: any) => ({
    ...field,
    logicRules: field.logicRules.map((rule: any, index: number) => {
      const targetLookup = String(rule.targetId || rule.targetLabel || rule.target || '')
      const targetId = idByOriginal.get(targetLookup) || idByLabel.get(targetLookup.toLowerCase().trim()) || targetLookup
      return { id: rule.id || `${field.id}_rule_${index + 1}`, condition: rule.condition || 'equals', value: String(rule.value ?? ''), action: rule.action || 'show', targetId }
    }).filter((rule: any) => rule.targetId),
  }))

  return prepared
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId()
    const body = await req.json()
    const { jsonString } = body

    if (!jsonString) return NextResponse.json({ error: 'JSON string is required' }, { status: 400 })

    let parsedData: any
    try { parsedData = JSON.parse(jsonString) } catch { return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 }) }

    const sanitizedData = validateAndSanitizeFormData(prepareAiFormData(parsedData))
    const validationResult = FormSchema.safeParse(sanitizedData)

    if (!validationResult.success) return NextResponse.json({ error: 'Invalid form data', details: validationResult.error.issues }, { status: 400 })

    const formData = validationResult.data
    let description = formData.description || ''
    if (formData.customStyles) description += `|||STYLES:${JSON.stringify(formData.customStyles)}`
    if (formData.settings) description += `|||SETTINGS:${JSON.stringify(formData.settings)}`

    const formId = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.insert(forms).values({
      id: formId,
      userId,
      title: formData.name,
      description,
      logoUrl: (formData as any).logo_url || null,
      coverImageUrl: (formData as any).cover_image_url || null,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    if (formData.fields.length > 0) {
      const fieldsToInsert = formData.fields.map((field, index) => {
        const normalized = normalizeFieldForPersistence(field, index)
        return { id: normalized.id, formId, label: normalized.label, type: normalized.type, required: normalized.required, placeholder: normalized.placeholder, options: normalized.options, logicRules: normalized.logicRules, pageIndex: normalized.pageIndex, order: normalized.order }
      })
      await db.insert(formFields).values(fieldsToInsert)
    }

    return NextResponse.json({ message: 'Form imported successfully', id: formId, formId })
  } catch (error: any) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    console.error('Import form error:', error)
    return NextResponse.json({ error: error.message || 'Invalid form data' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'

import {
  FormSchema,
  normalizeFieldForPersistence,
} from '@/lib/form-import-schema'
import { validateAndSanitizeFormData } from '@/lib/proto-sanitize'
import { createClient } from '@/utils/supabase/server'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slugId(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)

  return slug || fallback
}

function prepareAiFormData(input: any) {
  const prepared = {
    ...input,
    name: input.name || input.title || 'AI Generated Form',
    fields: Array.isArray(input.fields) ? input.fields : [],
  }

  const idByOriginal = new Map<string, string>()
  const idByLabel = new Map<string, string>()

  prepared.fields = prepared.fields.map((field: any, index: number) => {
    const originalId = typeof field.id === 'string' ? field.id : ''
    const generatedId = UUID_REGEX.test(originalId)
      ? originalId
      : crypto.randomUUID()

    if (originalId) idByOriginal.set(originalId, generatedId)
    idByOriginal.set(slugId(originalId || field.label || '', `field_${index + 1}`), generatedId)
    if (field.label) idByLabel.set(String(field.label).toLowerCase().trim(), generatedId)

    return {
      ...field,
      id: generatedId,
      pageIndex: Number.isInteger(field.pageIndex) ? field.pageIndex : field.page_index ?? 0,
      logicRules: Array.isArray(field.logicRules)
        ? field.logicRules
        : Array.isArray(field.logic_rules)
          ? field.logic_rules
          : [],
    }
  })

  prepared.fields = prepared.fields.map((field: any) => ({
    ...field,
    logicRules: field.logicRules.map((rule: any, index: number) => {
      const targetLookup = String(rule.targetId || rule.targetLabel || rule.target || '')
      const targetId =
        idByOriginal.get(targetLookup) ||
        idByLabel.get(targetLookup.toLowerCase().trim()) ||
        targetLookup

      return {
        id: rule.id || `${field.id}_rule_${index + 1}`,
        condition: rule.condition || 'equals',
        value: String(rule.value ?? ''),
        action: rule.action || 'show',
        targetId,
      }
    }).filter((rule: any) => rule.targetId),
  }))

  return prepared
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { jsonString } = body

    if (!jsonString) {
      return NextResponse.json({ error: 'JSON string is required' }, { status: 400 })
    }

    let parsedData: any
    try {
      parsedData = JSON.parse(jsonString)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    const sanitizedData = validateAndSanitizeFormData(prepareAiFormData(parsedData))
    const validationResult = FormSchema.safeParse(sanitizedData)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const formData = validationResult.data
    let description = formData.description || ''

    if (formData.customStyles) {
      description += `|||STYLES:${JSON.stringify(formData.customStyles)}`
    }

    if (formData.settings) {
      description += `|||SETTINGS:${JSON.stringify(formData.settings)}`
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        title: formData.name,
        description,
        user_id: user.id,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (formError) {
      console.error('Supabase insert error:', formError)
      return NextResponse.json({ error: 'Failed to save form' }, { status: 500 })
    }

    const fieldsToInsert = formData.fields.map((field, index) => {
      const normalized = normalizeFieldForPersistence(field, index)

      return {
        id: normalized.id,
        form_id: form.id,
        label: normalized.label,
        type: normalized.type,
        required: normalized.required,
        placeholder: normalized.placeholder,
        options: normalized.options,
        logic_rules: normalized.logicRules,
        page_index: normalized.pageIndex,
        order: normalized.order,
      }
    })

    if (fieldsToInsert.length > 0) {
      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert)

      if (fieldsError) {
        console.error('Fields insert error:', fieldsError)
        return NextResponse.json({ error: 'Failed to save generated fields' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'Form imported successfully',
      id: form.id,
      formId: form.id,
    })
  } catch (error: any) {
    console.error('Import form error:', error)
    return NextResponse.json(
      { error: error.message || 'Invalid form data' },
      { status: 400 }
    )
  }
}

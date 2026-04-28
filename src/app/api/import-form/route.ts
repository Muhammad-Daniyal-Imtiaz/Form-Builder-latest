import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import {
  FormSchema,
  normalizeFieldForPersistence,
} from '@/lib/form-import-schema'
import { validateAndSanitizeFormData } from '@/lib/proto-sanitize'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jsonString } = body

    if (!jsonString) {
      return NextResponse.json({ error: 'JSON string is required' }, { status: 400 })
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    const sanitizedData = validateAndSanitizeFormData(parsedData)
    const validationResult = FormSchema.safeParse(sanitizedData)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid form data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const formTitle = validatedData.name
    const formDesc = validatedData.description || ''

    let descPayload = formDesc
    if (validatedData.customStyles && Object.keys(validatedData.customStyles).length > 0) {
      descPayload += `|||STYLES:${JSON.stringify(validatedData.customStyles)}`
    }
    if (validatedData.settings && Object.keys(validatedData.settings).length > 0) {
      descPayload += `|||SETTINGS:${JSON.stringify(validatedData.settings)}`
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        user_id: user.id,
        title: formTitle,
        description: descPayload,
        logo_url: validatedData.logo_url,
        cover_image_url: validatedData.cover_image_url,
        published: false
      })
      .select()
      .single()

    if (formError) throw formError

    const generatedIdMap = new Map<string, string>()
    validatedData.fields.forEach((field) => {
      if (!field.id) {
        return
      }

      generatedIdMap.set(
        field.id,
        UUID_REGEX.test(field.id) ? field.id : crypto.randomUUID()
      )
    })

    const fieldsToInsert = validatedData.fields.map((field, index) => {
      const persistedId = field.id
        ? generatedIdMap.get(field.id) ?? crypto.randomUUID()
        : crypto.randomUUID()

      const normalizedField = normalizeFieldForPersistence(field, index)
      const normalizedLogicRules = normalizedField.logicRules.map((rule) => ({
        ...rule,
        id: rule.id && UUID_REGEX.test(rule.id) ? rule.id : crypto.randomUUID(),
        targetId: generatedIdMap.get(rule.targetId) || rule.targetId,
      }))

      return {
        id: persistedId,
        form_id: form.id,
        label: normalizedField.label,
        type: normalizedField.type,
        required: normalizedField.required,
        placeholder: normalizedField.placeholder,
        options: normalizedField.options,
        logic_rules: normalizedLogicRules,
        page_index: normalizedField.pageIndex,
        order: normalizedField.order,
      }
    })

    const { error: fieldsError } = await supabase
      .from('form_fields')
      .insert(fieldsToInsert)

    if (fieldsError) throw fieldsError

    return NextResponse.json({ 
      message: 'Form imported successfully',
      id: form.id 
    }, { status: 201 })

  } catch (error: any) {
    console.error('Import form error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

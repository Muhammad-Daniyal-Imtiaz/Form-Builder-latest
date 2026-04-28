import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { FormSchema } from '@/lib/form-import-schema'
import { validateAndSanitizeFormData } from '@/lib/proto-sanitize'

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
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    // 1. Sanitize for prototype pollution
    const sanitizedData = validateAndSanitizeFormData(parsedData)

    // 2. Validate against schema
    const validatedData = FormSchema.parse(sanitizedData)

    // 3. Create the Form
    const formTitle = validatedData.name
    const formDesc = validatedData.description || ''
    
    // Serialize styles and settings into description (matching BuilderContext format)
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

    // 4. Add fields
    const fieldsToInsert = validatedData.fields.map((field, index) => ({
      form_id: form.id,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || null,
      options: 'options' in field ? field.options : null,
      order: index
    }))

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
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid form data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

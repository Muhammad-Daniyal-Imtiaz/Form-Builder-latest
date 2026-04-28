import { NextResponse } from 'next/server'

import {
  FieldsPayloadSchema,
  normalizeFieldForPersistence,
} from '@/lib/form-import-schema'
import { createClient } from '@/utils/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const parsedFields = FieldsPayloadSchema.safeParse(body.fields)

    if (!parsedFields.success) {
      return NextResponse.json(
        {
          error: 'Invalid field payload',
          details: parsedFields.error.issues,
        },
        { status: 400 }
      )
    }

    const normalizedFields = parsedFields.data.map((field, index) => {
      const normalizedField = normalizeFieldForPersistence(field, index)

      return {
        id: field.id ?? crypto.randomUUID(),
        form_id: id,
        label: normalizedField.label,
        type: normalizedField.type,
        required: normalizedField.required,
        options: normalizedField.options,
        placeholder: normalizedField.placeholder,
        order: normalizedField.order,
        logic_rules: normalizedField.logicRules,
        page_index: normalizedField.pageIndex,
      }
    })

    const { error: deleteError } = await supabase
      .from('form_fields')
      .delete()
      .eq('form_id', id)

    if (deleteError) {
      console.error('Error deleting old fields:', deleteError)
      return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 })
    }

    if (normalizedFields.length > 0) {
      const { error: insertError } = await supabase
        .from('form_fields')
        .insert(normalizedFields)

      if (insertError) {
        console.error('Error inserting new fields:', insertError)
        return NextResponse.json({ error: 'Failed to save new fields' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT fields error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

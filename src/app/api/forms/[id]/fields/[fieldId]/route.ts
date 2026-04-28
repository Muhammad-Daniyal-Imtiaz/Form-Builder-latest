import { NextResponse } from 'next/server'

import { FieldSchema, normalizeFieldForPersistence } from '@/lib/form-import-schema'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
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

    const { data: form } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!form || form.user_id !== user.id) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const fieldBody = await request.json()
    const parsedField = FieldSchema.safeParse(fieldBody)

    if (!parsedField.success) {
      return NextResponse.json(
        { error: 'Invalid field payload', details: parsedField.error.issues },
        { status: 400 }
      )
    }

    const { data: maxOrder } = await supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', id)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const normalizedField = normalizeFieldForPersistence(
      parsedField.data,
      maxOrder ? maxOrder.order + 1 : 0
    )

    const { data: field, error } = await supabase
      .from('form_fields')
      .insert({
        id: parsedField.data.id ?? crypto.randomUUID(),
        form_id: id,
        label: normalizedField.label,
        type: normalizedField.type,
        required: normalizedField.required,
        options: normalizedField.options,
        placeholder: normalizedField.placeholder,
        order: normalizedField.order,
        logic_rules: normalizedField.logicRules,
        page_index: normalizedField.pageIndex,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    console.error('POST field error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

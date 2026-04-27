import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify form ownership
        const { data: form, error: formError } = await supabase
            .from('forms')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (formError || !form) {
            return NextResponse.json({ error: 'Form not found or unauthorized' }, { status: 404 })
        }

        const { fields } = await request.json()

        // Validate fields format
        if (!Array.isArray(fields)) {
            return NextResponse.json({ error: 'Fields must be an array' }, { status: 400 })
        }

        // First, delete existing fields
        const { error: deleteError } = await supabase
            .from('form_fields')
            .delete()
            .eq('form_id', id)

        if (deleteError) {
            console.error('Error deleting old fields:', deleteError)
            return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 })
        }

        // Then, insert new fields with updated orders
        if (fields.length > 0) {
            const newFields = fields.map((field: any, index: number) => ({
                id: field.id || crypto.randomUUID(), // Generate UUID if missing
                form_id: id,
                label: field.label || 'Untitled Field',
                type: field.type || 'text',
                required: field.required || false,
                options: field.options || null,
                placeholder: field.placeholder || null,
                logic_rules: field.logicRules || null, // Map the camelCase payload to snake_case DB column
                order: index,
                page_index: field.pageIndex || 0
            }))

            const { error: insertError } = await supabase
                .from('form_fields')
                .insert(newFields)

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

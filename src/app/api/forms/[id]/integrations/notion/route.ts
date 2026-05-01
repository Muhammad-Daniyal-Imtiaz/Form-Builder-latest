import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { encrypt, decrypt } from '@/utils/encryption'
import { syncSubmissionToNotion, syncMultipleSubmissionsToNotion } from '@/lib/notion'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: form, error } = await supabase
      .from('forms')
      .select('notion_api_key, notion_database_id, notion_enabled')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      apiKey: form?.notion_api_key ? '********' : null,
      databaseId: form?.notion_database_id ? await decrypt(form.notion_database_id) : null,
      isEnabled: form?.notion_enabled
    })
  } catch (err) {
    console.error('Notion GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. UPDATE CONFIG
    if (action === 'update') {
      const { apiKey, databaseId, enabled } = body
      const updateData: any = {
        notion_enabled: enabled
      }
      
      if (apiKey && apiKey !== '********') {
        updateData.notion_api_key = await encrypt(apiKey)
      }
      
      if (databaseId && databaseId !== '********') {
        updateData.notion_database_id = await encrypt(databaseId)
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // 2. DISCONNECT
    if (action === 'disconnect') {
      const { error } = await supabase
        .from('forms')
        .update({
          notion_api_key: null,
          notion_database_id: null,
          notion_enabled: false
        })
        .eq('id', id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // 3. SYNC EXISTING
    if (action === 'sync-existing') {
      const admin = createAdminClient()
      const { data: unsynced } = await admin
        .from('submissions')
        .select('id')
        .eq('form_id', id)
        .eq('notion_synced', false)

      if (!unsynced || unsynced.length === 0) {
        return NextResponse.json({ message: 'All submissions are already synced.', count: 0 })
      }

      const { count } = await syncMultipleSubmissionsToNotion(id, unsynced.map(s => s.id))
      return NextResponse.json({ 
        success: true, 
        message: `Successfully synced ${count} submissions to Notion!`, 
        count 
      })
    }

    // 4. SEND TEST SAMPLE
    if (action === 'send-test') {
      const testSubmission = {
        id: 'test-sample',
        data: {
          'Full Name': 'Test User',
          'Email': 'test@example.com',
          'Message': 'This is a test submission from your form builder.',
          'Submitted At': new Date().toLocaleString()
        }
      }
      
      const res = await syncSubmissionToNotion(id, testSubmission)
      if (res.success) {
        return NextResponse.json({ success: true, message: 'Test sample sent to Notion!' })
      } else {
        return NextResponse.json({ error: res.error }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Notion POST error:', err)
    return NextResponse.json({ 
      error: err.message || 'Internal server error',
      details: err.toString()
    }, { status: 500 })
  }
}

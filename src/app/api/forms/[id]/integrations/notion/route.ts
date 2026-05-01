import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { encrypt, decrypt } from '@/utils/encryption'
import { syncSubmissionToNotion, syncMultipleSubmissionsToNotion, createDatabaseInNotion, setupNotionDatabase, listAvailableDatabases } from '@/lib/notion'

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
      const { apiKey, databaseId, enabled, setupColumns } = body
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

      if (setupColumns) {
        await setupNotionDatabase(id, apiKey && apiKey !== '********' ? apiKey : undefined, databaseId && databaseId !== '********' ? databaseId : undefined);
      }

      return NextResponse.json({ success: true, message: 'Notion settings updated!' })
    }

    // 1.5 LIST DATABASES
    if (action === 'list-databases') {
      const { apiKey } = body
      if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 400 });
      const result = await listAvailableDatabases(apiKey);
      return NextResponse.json(result);
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
        return NextResponse.json({ success: true, message: 'No unsynced submissions found. All current data is already in Notion!' })
      }

      const result = await syncMultipleSubmissionsToNotion(id, unsynced.map(s => s.id))
      return NextResponse.json({ 
        success: true, 
        message: `Successfully synced ${result.count} submissions to Notion!${ (result as any).failed > 0 ? ` (${ (result as any).failed } failed)` : '' }`,
        count: result.count
      })
    }

    // 4. SEND TEST SAMPLE
    if (action === 'send-test') {
      const admin = createAdminClient()
      const { data: latestSub } = await admin
        .from('submissions')
        .select('*')
        .eq('form_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const testSubmission = latestSub || {
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
        return NextResponse.json({ 
          success: true, 
          message: latestSub ? 'Latest real submission synced to Notion!' : 'Test sample sent to Notion!' 
        })
      } else {
        return NextResponse.json({ error: res.error }, { status: 400 })
      }
    }

    // 5. CREATE DATABASE
    if (action === 'create-database') {
      const { title, parentPageId, notionKey } = body;
      if (!title || !parentPageId) {
        return NextResponse.json({ error: 'Title and Parent Page ID are required' }, { status: 400 });
      }
      
      const result = await createDatabaseInNotion(id, title, parentPageId, notionKey);
      if (result.success) {
        return NextResponse.json({ success: true, databaseId: result.databaseId, message: 'Database created and connected!' });
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
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

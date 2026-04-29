// Trigger redeploy: Fix Google OAuth environment variable typos and improve error handling
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getGoogleAccessToken, createGoogleSheet } from '@/lib/google-sheets';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration, error: intError } = await supabase
      .from('user_integrations')
      .select('email')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('google_sheet_id, google_sheet_name, google_sheet_enabled')
      .eq('id', id)
      .single();

    return NextResponse.json({
      isConnected: !!integration,
      googleEmail: integration?.email,
      sheetId: form?.google_sheet_id,
      sheetName: form?.google_sheet_name,
      isEnabled: form?.google_sheet_enabled
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();
    const { action } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'create') {
      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return NextResponse.json({ error: 'Google account not connected' }, { status: 400 });

      const { data: formData } = await supabase.from('forms').select('title').eq('id', id).single();
      const sheet = await createGoogleSheet(accessToken, `${formData?.title || 'Form'} Submissions`);

      if (sheet) {
        await supabase
          .from('forms')
          .update({
            google_sheet_id: sheet.id,
            google_sheet_name: 'Sheet1',
            google_sheet_enabled: true
          })
          .eq('id', id);
        
        return NextResponse.json({ success: true, sheet });
      } else {
        return NextResponse.json({ error: 'Failed to create Google Sheet. Please ensure you have given the necessary permissions.' }, { status: 500 });
      }
    }

    if (action === 'toggle') {
      const { enabled } = body;
      await supabase.from('forms').update({ google_sheet_enabled: enabled }).eq('id', id);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'disconnect') {
      await supabase.from('forms').update({ 
        google_sheet_id: null, 
        google_sheet_name: null, 
        google_sheet_enabled: false 
      }).eq('id', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'sync-existing') {
      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return NextResponse.json({ error: 'Google account not connected' }, { status: 400 });

      // 1. Get Form Details
      const { data: form } = await supabase
        .from('forms')
        .select('google_sheet_id, google_sheet_name')
        .eq('id', id)
        .single();

      if (!form?.google_sheet_id) return NextResponse.json({ error: 'No sheet connected' }, { status: 400 });

      // 2. Get Fields and ONLY Unsynced Submissions
      const { data: fields } = await supabase.from('form_fields').select('id, label').eq('form_id', id).order('order');
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('form_id', id)
        .eq('google_synced', false)
        .order('submitted_at');

      if (!submissions || submissions.length === 0) return NextResponse.json({ success: true, count: 0, message: 'All caught up!' });

      // 3. Prepare Header Info
      const { getSheetValues, appendToGoogleSheet } = await import('@/lib/google-sheets');
      const existingValues = await getSheetValues(accessToken, form.google_sheet_id, `${form.google_sheet_name || 'Sheet1'}!A1:Z1`);
      
      const payloadRows = [];
      const fieldLabels = fields?.map(f => f.label) || [];
      
      // If sheet is empty, add the header row
      if (existingValues.length === 0) {
        payloadRows.push(['Submission Date', ...fieldLabels]);
      }

      // 4. Map to Rows
      submissions.forEach(sub => {
        const row = [new Date(sub.submitted_at).toLocaleString()];
        fields?.forEach(f => {
          let val = sub.data[f.id] || sub.data[f.label] || '';
          if (Array.isArray(val)) val = val.join(', ');
          row.push(String(val));
        });
        payloadRows.push(row);
      });

      // 5. Push to Google
      const success = await appendToGoogleSheet(accessToken, form.google_sheet_id, form.google_sheet_name || 'Sheet1', payloadRows);

      if (success) {
        // Mark as synced in DB using Admin client
        const admin = await createAdminClient();
        const submissionIds = submissions.map(s => s.id);
        await admin.from('submissions').update({ google_synced: true }).in('id', submissionIds);
      }

      return NextResponse.json({ 
        success, 
        count: submissions.length,
        message: success ? `Successfully synced ${submissions.length} new responses.` : 'Failed to sync to Google Sheets.'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

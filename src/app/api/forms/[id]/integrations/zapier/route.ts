import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/utils/encryption';

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

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('zapier_webhook_url, zapier_enabled')
      .eq('id', id)
      .single();

    if (formError) throw formError;

    return NextResponse.json({
      webhookUrl: form?.zapier_webhook_url ? '********' : null,
      isEnabled: form?.zapier_enabled
    });
  } catch (err) {
    console.error('Zapier GET error:', err);
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

    // UPDATE CONFIG
    if (action === 'update') {
      const { webhookUrl, enabled } = body;
      const updateData: any = {
          zapier_enabled: enabled 
      };
      if (webhookUrl && webhookUrl !== '********') {
          updateData.zapier_webhook_url = await encrypt(webhookUrl);
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // DISCONNECT
    if (action === 'disconnect') {
      const { error } = await supabase
        .from('forms')
        .update({ 
          zapier_webhook_url: null, 
          zapier_enabled: false 
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // BULK SYNC
    if (action === 'sync-existing') {
        const admin = await createAdminClient();
        const { data: form } = await admin
          .from('forms')
          .select('zapier_webhook_url, zapier_enabled, google_sheet_name')
          .eq('id', id)
          .single();
  
        if (!form?.zapier_webhook_url) {
            return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });
        }

        // Fetch fields to map IDs to labels
        const { data: fields } = await admin.from('form_fields').select('id, label').eq('form_id', id).order('order');

        // Get unsynced submissions
        const { data: submissions } = await admin
          .from('submissions')
          .select('*')
          .eq('form_id', id)
          .eq('zapier_synced', false)
          .order('submitted_at');

        if (!submissions || submissions.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'All data already synced!' });
        }

        const results = await Promise.all(submissions.map(async (sub) => {
            try {
                // Map ID data to Label data
                const labelData: Record<string, any> = {};
                if (fields) {
                    fields.forEach(f => {
                        let val = sub.data[f.id] || sub.data[f.label] || '';
                        if (Array.isArray(val)) val = val.join(', ');
                        
                        let key = f.label;
                        let i = 1;
                        while (labelData[key]) {
                            key = `${f.label}_${++i}`;
                        }
                        labelData[key] = val;
                    });
                }

                const actualWebhookUrl = await decrypt(form.zapier_webhook_url!);
                const response = await fetch(actualWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        submission_id: sub.id,
                        form_id: id,
                        form_name: form.google_sheet_name || 'My Form',
                        submitted_at: sub.submitted_at,
                        ...labelData
                    })
                });
                return response.ok;
            } catch (err) {
                console.error('Zapier sync failed for sub:', sub.id, err);
                return false;
            }
        }));

        const successCount = results.filter(Boolean).length;
        
        if (successCount > 0) {
            const syncedIds = submissions.filter((_, i) => results[i]).map(s => s.id);
            const admin = await createAdminClient();
            await admin.from('submissions').update({ zapier_synced: true }).in('id', syncedIds);
        }

        return NextResponse.json({ 
            success: successCount > 0, 
            count: successCount,
            message: `Successfully sent ${successCount} entries to Zapier.`
        });
    }
    // RESET SYNC
    if (action === 'reset-sync') {
        const admin = await createAdminClient();
        const { error } = await admin
          .from('submissions')
          .update({ zapier_synced: false })
          .eq('form_id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Sync status reset successfully.' });
    }

    // SEND TEST SAMPLE
    if (action === 'send-test') {
        const admin = await createAdminClient();
        const { data: form } = await admin
          .from('forms')
          .select('zapier_webhook_url, google_sheet_name')
          .eq('id', id)
          .single();

        if (!form?.zapier_webhook_url) {
            return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });
        }

        const { data: fields } = await admin.from('form_fields').select('id, label').eq('form_id', id).order('order');
        
        const testData: Record<string, any> = {};
        if (fields) {
            fields.forEach(f => {
                testData[f.label] = `Sample ${f.label} data`;
            });
        }

        const actualWebhookUrl = await decrypt(form.zapier_webhook_url);
        const response = await fetch(actualWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                submission_id: 'test_sample_id',
                form_id: id,
                form_name: form.google_sheet_name || 'Test Form',
                submitted_at: new Date().toISOString(),
                is_test: true,
                message: "The webhook is working perfectly!",
                ...testData
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to send test to Zapier' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Test sample sent to Zapier!' });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Zapier POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { createAdminClient } from '@/utils/supabase/server';
import { decrypt } from '@/utils/encryption';

export async function syncSubmissionToNotion(formId: string, submission: any) {
  const adminClient = createAdminClient();

  // 1. Get Form Integration Config
  const { data: form, error: formError } = await adminClient
    .from('forms')
    .select('notion_api_key, notion_database_id, notion_enabled')
    .eq('id', formId)
    .single();

  if (formError || !form || !form.notion_enabled || !form.notion_api_key || !form.notion_database_id) {
    return { success: false, error: 'Notion not enabled or configured' };
  }

  try {
    const apiKey = decrypt(form.notion_api_key);
    const databaseId = decrypt(form.notion_database_id);

    // 2. Prepare Properties
    const properties: any = {};
    const submissionData = submission.data || {};

    // Try to find a good title
    let titleKey = Object.keys(submissionData).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('subject')) || Object.keys(submissionData)[0];
    
    for (const [key, value] of Object.entries(submissionData)) {
      const sanitizedKey = key.replace(/[\[\]]/g, ''); // Notion doesn't like brackets in prop names
      
      if (key === titleKey) {
        properties['Name'] = {
          title: [{ text: { content: String(value || 'Untitled Submission') } }]
        };
      } else {
        properties[sanitizedKey] = {
          rich_text: [{ text: { content: String(value || '') } }]
        };
      }
    }

    // Fallback for Name if not set
    if (!properties['Name']) {
      properties['Name'] = {
        title: [{ text: { content: `Submission ${submission.id.slice(0, 8)}` } }]
      };
    }

    // 3. Send to Notion
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Notion Sync Error:', result);
      return { success: false, error: result.message || 'Notion API error' };
    }

    // 4. Mark as synced
    await adminClient
      .from('submissions')
      .update({ notion_synced: true })
      .eq('id', submission.id);

    return { success: true };
  } catch (err: any) {
    console.error('Notion Sync Exception:', err);
    return { success: false, error: err.message };
  }
}

export async function syncMultipleSubmissionsToNotion(formId: string, submissionIds: string[]) {
  const adminClient = createAdminClient();
  
  const { data: submissions } = await adminClient
    .from('submissions')
    .select('*')
    .in('id', submissionIds);

  if (!submissions || submissions.length === 0) return { count: 0 };

  let successCount = 0;
  for (const sub of submissions) {
    const res = await syncSubmissionToNotion(formId, sub);
    if (res.success) successCount++;
  }

  return { count: successCount };
}

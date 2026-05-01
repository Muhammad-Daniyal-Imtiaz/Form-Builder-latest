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
    const apiKey = await decrypt(form.notion_api_key);
    const databaseId = await decrypt(form.notion_database_id);

    // 2. Fetch Database Schema to check existing columns
    const schemaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!schemaRes.ok) {
       const err = await schemaRes.json();
       return { success: false, error: `Notion Access Error: ${err.message}` };
    }

    const schema = await schemaRes.json();
    const existingProps = Object.keys(schema.properties || {});

    // 3. Prepare Properties & Detect Missing Ones
    const properties: any = {};
    const missingProps: Record<string, any> = {};
    const submissionData = submission.data || {};

    let titleKey = Object.keys(submissionData).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('subject')) || Object.keys(submissionData)[0];
    
    for (const [key, value] of Object.entries(submissionData)) {
      const sanitizedKey = key.replace(/[\[\]]/g, '');
      
      if (key === titleKey) {
        properties['Name'] = { title: [{ text: { content: String(value || 'Untitled') } }] };
      } else {
        properties[sanitizedKey] = { rich_text: [{ text: { content: String(value || '') } }] };
        
        // If property doesn't exist in Notion, prepare to create it
        if (!existingProps.includes(sanitizedKey)) {
          missingProps[sanitizedKey] = { rich_text: {} };
        }
      }
    }

    if (!properties['Name']) {
      properties['Name'] = { title: [{ text: { content: `Submission ${submission.id.slice(0, 8)}` } }] };
    }

    // 4. Auto-Create Missing Columns
    if (Object.keys(missingProps).length > 0) {
      await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: missingProps })
      });
    }

    // 5. Send to Notion
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
      return { success: false, error: result.message || 'Notion API error' };
    }

    // 6. Mark as synced
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

export async function createDatabaseInNotion(formId: string, title: string, parentPageId: string, providedApiKey?: string) {
  const adminClient = createAdminClient();
  
  // 1. Get API Key
  let apiKey = providedApiKey;
  if (!apiKey) {
    const { data: form } = await adminClient.from('forms').select('notion_api_key').eq('id', formId).single();
    if (!form?.notion_api_key) return { success: false, error: 'No API Key found. Please connect your token first.' };
    apiKey = await decrypt(form.notion_api_key);
  }

  const { data: fields } = await adminClient.from('form_fields').select('label').eq('form_id', formId);
  const sanitizedParentId = parentPageId.replace(/-/g, '').trim();

  // 2. Prepare Properties
  const properties: any = {
    'Name': { title: {} }
  };

  if (fields) {
    fields.forEach(field => {
      const sanitizedKey = field.label.replace(/[\[\]]/g, '').trim();
      if (sanitizedKey && sanitizedKey.toLowerCase() !== 'name') {
        properties[sanitizedKey] = { rich_text: {} };
      }
    });
  }

  // 3. Create Database in Notion
  try {
    const res = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { page_id: sanitizedParentId },
        title: [{ text: { content: title || 'Form Submissions' } }],
        properties
      })
    });

    const result = await res.json();
    if (!res.ok) {
       console.error('[Notion Create DB Error]', result);
       return { success: false, error: result.message || 'Failed to create database' };
    }

    // 4. Update Form with the new Database ID
    const newDbId = result.id.replace(/-/g, '');
    await adminClient.from('forms').update({ 
      notion_database_id: await encrypt(newDbId),
      notion_enabled: true 
    }).eq('id', formId);

    return { success: true, databaseId: newDbId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


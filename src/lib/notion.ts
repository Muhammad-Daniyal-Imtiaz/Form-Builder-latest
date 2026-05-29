import { db } from '@/db';
import { forms, submissions, formFields } from '@/db/schema';
import { decrypt, encrypt } from '@/utils/encryption';
import { eq, inArray } from 'drizzle-orm';

export async function syncSubmissionToNotion(formId: string, submission: any) {
  const [form] = await db.select({ notionApiKey: forms.notionApiKey, notionDatabaseId: forms.notionDatabaseId, notionEnabled: forms.notionEnabled }).from(forms).where(eq(forms.id, formId));

  if (!form || !form.notionEnabled || !form.notionApiKey || !form.notionDatabaseId) {
    return { success: false, error: 'Notion not enabled or configured' };
  }

  try {
    const apiKey = await decrypt(form.notionApiKey);
    const databaseId = await decrypt(form.notionDatabaseId);

    const schemaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, { headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28' } });
    if (!schemaRes.ok) {
      const err = await schemaRes.json();
      return { success: false, error: `Notion Access Error: ${err.message}` };
    }

    const schema = await schemaRes.json();
    const schemaProps = schema.properties || {};
    const properties: any = {};
    const missingProps: Record<string, any> = {};
    const submissionData = submission.data || {};

    const titleKey = Object.keys(submissionData).find((k) => k.toLowerCase().includes('name') || k.toLowerCase().includes('subject')) || Object.keys(submissionData)[0];

    for (const [key, value] of Object.entries(submissionData)) {
      const sanitizedKey = key.replace(/[\[\]]/g, '');
      const propType = schemaProps[sanitizedKey]?.type;
      if (key === titleKey || sanitizedKey === 'Name') {
        properties['Name'] = { title: [{ text: { content: String(value || 'Untitled') } }] };
      } else if (propType) {
        switch (propType) {
          case 'email': properties[sanitizedKey] = { email: String(value || '') }; break;
          case 'url': properties[sanitizedKey] = { url: String(value || '') }; break;
          case 'number': properties[sanitizedKey] = { number: Number(value) || 0 }; break;
          case 'phone_number': properties[sanitizedKey] = { phone_number: String(value || '') }; break;
          case 'date': properties[sanitizedKey] = { date: { start: new Date(String(value)).toISOString() } }; break;
          case 'checkbox': properties[sanitizedKey] = { checkbox: Boolean(value) }; break;
          case 'select': properties[sanitizedKey] = { select: { name: String(value) } }; break;
          default: properties[sanitizedKey] = { rich_text: [{ text: { content: String(value || '') } }] };
        }
      } else {
        properties[sanitizedKey] = { rich_text: [{ text: { content: String(value || '') } }] };
        missingProps[sanitizedKey] = { rich_text: {} };
      }
    }

    if (!properties['Name']) properties['Name'] = { title: [{ text: { content: `Submission ${submission.id.slice(0, 8)}` } }] };

    if (Object.keys(missingProps).length > 0) {
      await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: missingProps }),
      });
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
    });

    const result = await response.json();
    if (!response.ok) return { success: false, error: result.message || 'Notion API error' };

    if (submission.id && submission.id !== 'test-sample') {
      await db.update(submissions).set({ notionSynced: true }).where(eq(submissions.id, submission.id));
    }
    return { success: true };
  } catch (err: any) {
    console.error('Notion Sync Exception:', err);
    return { success: false, error: err.message };
  }
}

export async function syncMultipleSubmissionsToNotion(formId: string, submissionIds: string[]) {
  const subs = await db.select().from(submissions).where(inArray(submissions.id, submissionIds));
  if (!subs.length) return { count: 0 };

  let successCount = 0; let failCount = 0; const errors: string[] = [];
  for (const sub of subs) {
    const res = await syncSubmissionToNotion(formId, sub);
    if (res.success) { successCount++; } else { failCount++; if (res.error) errors.push(res.error); }
  }
  return { count: successCount, failed: failCount, errors: [...new Set(errors)] };
}

export async function setupNotionDatabase(formId: string, providedApiKey?: string, providedDatabaseId?: string) {
  let apiKey = providedApiKey;
  let databaseId = providedDatabaseId;

  if (!apiKey || !databaseId) {
    const [form] = await db.select({ notionApiKey: forms.notionApiKey, notionDatabaseId: forms.notionDatabaseId }).from(forms).where(eq(forms.id, formId));
    if (!apiKey && form?.notionApiKey) apiKey = await decrypt(form.notionApiKey);
    if (!databaseId && form?.notionDatabaseId) databaseId = await decrypt(form.notionDatabaseId);
  }

  if (!apiKey || !databaseId) return { success: false, error: 'Missing Notion credentials' };

  const schemaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, { headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28' } });
  if (!schemaRes.ok) { const err = await schemaRes.json(); return { success: false, error: `Notion Error: ${err.message}` }; }

  const schema = await schemaRes.json();
  const existingProps = Object.keys(schema.properties || {});
  const fields = await db.select({ label: formFields.label }).from(formFields).where(eq(formFields.formId, formId));
  const missingProps: Record<string, any> = {};

  fields.forEach((field) => {
    const sanitizedKey = field.label.replace(/[\[\]]/g, '').trim();
    if (sanitizedKey && sanitizedKey.toLowerCase() !== 'name' && !existingProps.includes(sanitizedKey)) {
      missingProps[sanitizedKey] = { rich_text: {} };
    }
  });

  if (Object.keys(missingProps).length > 0) {
    const patchRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' }, body: JSON.stringify({ properties: missingProps }) });
    if (!patchRes.ok) return { success: false, error: 'Failed to update Notion properties' };
  }
  return { success: true };
}

export async function createDatabaseInNotion(formId: string, title: string, parentPageId: string, providedApiKey?: string) {
  let apiKey = providedApiKey;
  if (!apiKey) {
    const [form] = await db.select({ notionApiKey: forms.notionApiKey }).from(forms).where(eq(forms.id, formId));
    if (!form?.notionApiKey) return { success: false, error: 'No API Key found.' };
    apiKey = await decrypt(form.notionApiKey);
  }

  const fields = await db.select({ label: formFields.label }).from(formFields).where(eq(formFields.formId, formId));
  const sanitizedParentId = parentPageId.replace(/-/g, '').trim();
  const properties: any = { Name: { title: {} } };
  fields.forEach((field) => {
    const k = field.label.replace(/[\[\]]/g, '').trim();
    if (k && k.toLowerCase() !== 'name') properties[k] = { rich_text: {} };
  });

  try {
    const res = await fetch('https://api.notion.com/v1/databases', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent: { page_id: sanitizedParentId }, title: [{ text: { content: title || 'Form Submissions' } }], properties }),
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.message || 'Failed to create database' };

    const newDbId = result.id.replace(/-/g, '');
    const updatePayload: any = { notionDatabaseId: await encrypt(newDbId), notionEnabled: true };
    if (providedApiKey && providedApiKey !== '********') updatePayload.notionApiKey = await encrypt(providedApiKey);
    await db.update(forms).set(updatePayload).where(eq(forms.id, formId));
    return { success: true, databaseId: newDbId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listAvailableDatabases(apiKey: string) {
  try {
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 100 }),
    });
    if (!response.ok) { const err = await response.json(); return { success: false, error: err.message }; }
    const data = await response.json();
    const databases = data.results.map((db: any) => {
      const titleObj = db.title || db.name || [];
      const title = Array.isArray(titleObj) ? titleObj[0]?.plain_text || titleObj[0]?.text?.content : 'Untitled';
      return { id: db.id.replace(/-/g, ''), title: title || `Database (${db.id.substring(0, 8)})` };
    });
    return { success: true, databases };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

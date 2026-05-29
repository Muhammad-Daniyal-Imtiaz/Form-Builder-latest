import { db } from '@/db';
import { forms } from '@/db/schema';
import { getAuthUserId, AuthError } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/utils/encryption';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();

    const [form] = await db
      .select({ airtableApiKey: forms.airtableApiKey, airtableBaseId: forms.airtableBaseId, airtableTableName: forms.airtableTableName, airtableEnabled: forms.airtableEnabled })
      .from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ apiKey: form.airtableApiKey ? '********' : null, baseId: form.airtableBaseId, tableName: form.airtableTableName, isEnabled: form.airtableEnabled });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();
    const body = await request.json();
    const { action } = body;

    const [formOwner] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));
    if (!formOwner) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    if (action === 'update') {
      const { apiKey, baseId, tableName, enabled } = body;
      const updateData: any = { airtableBaseId: baseId, airtableTableName: tableName, airtableEnabled: enabled };
      if (apiKey && apiKey !== '********') updateData.airtableApiKey = await encrypt(apiKey);
      await db.update(forms).set(updateData).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'disconnect') {
      await db.update(forms).set({ airtableApiKey: null, airtableBaseId: null, airtableTableName: null, airtableEnabled: false }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'sync-existing') {
      const { db: dbImport } = await import('@/db');
      const { forms: formsSchema, formFields, submissions } = await import('@/db/schema');
      const { asc, eq: eqOp, and: andOp } = await import('drizzle-orm');

      const [form] = await db.select().from(formsSchema).where(eqOp(formsSchema.id, id));
      if (!form?.airtableApiKey || !form?.airtableBaseId || !form?.airtableTableName) {
        return NextResponse.json({ error: 'Airtable not fully configured' }, { status: 400 });
      }

      const fields = await db.select({ id: formFields.id, label: formFields.label }).from(formFields).where(eqOp(formFields.formId, id)).orderBy(asc(formFields.order));
      if (!fields.length) return NextResponse.json({ error: 'No fields found in form' }, { status: 400 });

      const actualApiKey = await decrypt(form.airtableApiKey);
      const airtableHeaders = { Authorization: `Bearer ${actualApiKey}`, 'Content-Type': 'application/json' };

      const metaResp = await fetch(`https://api.airtable.com/v0/meta/bases/${form.airtableBaseId}/tables`, { headers: airtableHeaders });
      if (!metaResp.ok) {
        const errData = await metaResp.json();
        return NextResponse.json({ error: `Airtable API Error: ${errData.error?.message || 'Unauthorized'}` }, { status: metaResp.status });
      }

      const { tables } = await metaResp.json();
      let table = tables.find((t: any) => t.name === form.airtableTableName);

      if (!table) {
        const usedNames = new Set(['Submission ID', 'Submitted At']);
        const airtableFields = fields.map((f) => {
          let name = f.label; let counter = 1;
          while (usedNames.has(name)) name = `${f.label} (${++counter})`;
          usedNames.add(name);
          return { name, type: 'multilineText' as const };
        });

        const createResp = await fetch(`https://api.airtable.com/v0/meta/bases/${form.airtableBaseId}/tables`, {
          method: 'POST', headers: airtableHeaders,
          body: JSON.stringify({ name: form.airtableTableName, description: 'Created by Form Builder', fields: [{ name: 'Submission ID', type: 'singleLineText' }, { name: 'Submitted At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } }, ...airtableFields] }),
        });
        if (!createResp.ok) return NextResponse.json({ error: 'Failed to create Airtable table' }, { status: 400 });
        table = await createResp.json();
      }

      const unsyncedSubs = await db.select().from(submissions).where(andOp(eqOp(submissions.formId, id), eqOp(submissions.airtableSynced, false)));
      if (!unsyncedSubs.length) return NextResponse.json({ success: true, count: 0, message: 'All data already synced to Airtable!' });

      const usedNames = new Set(['Submission ID', 'Submitted At']);
      const fieldNameMap: Record<string, string> = {};
      fields.forEach((f) => {
        let name = f.label; let counter = 1;
        while (usedNames.has(name)) name = `${f.label} (${++counter})`;
        usedNames.add(name);
        fieldNameMap[f.id] = name;
      });

      const successIds: string[] = [];
      for (let i = 0; i < unsyncedSubs.length; i += 10) {
        const chunk = unsyncedSubs.slice(i, i + 10);
        const records = chunk.map((sub) => {
          const mappedFields: any = { 'Submission ID': sub.id, 'Submitted At': sub.submittedAt };
          const data = sub.data as Record<string, any>;
          fields.forEach((f) => {
            let val = data[f.id] || data[f.label] || '';
            if (Array.isArray(val)) val = val.join(', ');
            mappedFields[fieldNameMap[f.id]] = String(val);
          });
          return { fields: mappedFields };
        });

        const pushResp = await fetch(`https://api.airtable.com/v0/${form.airtableBaseId}/${table.id}`, { method: 'POST', headers: airtableHeaders, body: JSON.stringify({ records }) });
        if (pushResp.ok) successIds.push(...chunk.map((s) => s.id));
      }

      if (successIds.length > 0) {
        for (const sid of successIds) {
          await db.update(submissions).set({ airtableSynced: true }).where(eqOp(submissions.id, sid));
        }
      }

      return NextResponse.json({ success: successIds.length > 0, count: successIds.length, message: `Successfully synced ${successIds.length} entries to Airtable.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Airtable POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

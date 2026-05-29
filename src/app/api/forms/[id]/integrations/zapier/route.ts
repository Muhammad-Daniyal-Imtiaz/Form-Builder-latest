import { db } from '@/db';
import { forms, submissions, formFields } from '@/db/schema';
import { getAuthUserId, AuthError } from '@/lib/auth';
import { eq, and, asc, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/utils/encryption';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();

    const [form] = await db
      .select({ zapierWebhookUrl: forms.zapierWebhookUrl, zapierEnabled: forms.zapierEnabled })
      .from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ webhookUrl: form.zapierWebhookUrl ? '********' : null, isEnabled: form.zapierEnabled });
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
      const { webhookUrl, enabled } = body;
      const updateData: any = { zapierEnabled: enabled };
      if (webhookUrl && webhookUrl !== '********') updateData.zapierWebhookUrl = await encrypt(webhookUrl);
      await db.update(forms).set(updateData).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'disconnect') {
      await db.update(forms).set({ zapierWebhookUrl: null, zapierEnabled: false }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'sync-existing') {
      const [form] = await db.select().from(forms).where(eq(forms.id, id));
      if (!form?.zapierWebhookUrl) return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });

      const fields = await db.select({ id: formFields.id, label: formFields.label }).from(formFields).where(eq(formFields.formId, id)).orderBy(asc(formFields.order));
      const unsyncedSubs = await db.select().from(submissions).where(and(eq(submissions.formId, id), eq(submissions.zapierSynced, false)));

      if (!unsyncedSubs.length) return NextResponse.json({ success: true, count: 0, message: 'All data already synced!' });

      const actualWebhookUrl = await decrypt(form.zapierWebhookUrl);
      const results = await Promise.all(unsyncedSubs.map(async (sub) => {
        const data = sub.data as Record<string, any>;
        const labelData: Record<string, any> = {};
        fields.forEach((f) => {
          let val = data[f.id] || data[f.label] || '';
          if (Array.isArray(val)) val = val.join(', ');
          let key = f.label; let i = 1;
          while (labelData[key]) key = `${f.label}_${++i}`;
          labelData[key] = val;
        });
        try {
          const res = await fetch(actualWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission_id: sub.id, form_id: id, submitted_at: sub.submittedAt, ...labelData }) });
          return res.ok;
        } catch { return false; }
      }));

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        const syncedIds = unsyncedSubs.filter((_, i) => results[i]).map((s) => s.id);
        for (const sid of syncedIds) await db.update(submissions).set({ zapierSynced: true }).where(eq(submissions.id, sid));
      }

      return NextResponse.json({ success: successCount > 0, count: successCount, message: `Successfully sent ${successCount} entries to Zapier.` });
    }

    if (action === 'reset-sync') {
      const allSubs = await db.select({ id: submissions.id }).from(submissions).where(eq(submissions.formId, id));
      for (const sub of allSubs) await db.update(submissions).set({ zapierSynced: false }).where(eq(submissions.id, sub.id));
      return NextResponse.json({ success: true, message: 'Sync status reset successfully.' });
    }

    if (action === 'send-test') {
      const [form] = await db.select({ zapierWebhookUrl: forms.zapierWebhookUrl, title: forms.title }).from(forms).where(eq(forms.id, id));
      if (!form?.zapierWebhookUrl) return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 });

      const fields = await db.select({ id: formFields.id, label: formFields.label }).from(formFields).where(eq(formFields.formId, id)).orderBy(asc(formFields.order));
      const testData: Record<string, any> = {};
      fields.forEach((f) => { testData[f.label] = `Sample ${f.label} data`; });

      const actualUrl = await decrypt(form.zapierWebhookUrl);
      const res = await fetch(actualUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission_id: 'test_sample_id', form_id: id, form_name: form.title, submitted_at: new Date().toISOString(), is_test: true, message: 'The webhook is working perfectly!', ...testData }) });
      if (!res.ok) return NextResponse.json({ error: 'Failed to send test to Zapier' }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Test sample sent to Zapier!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Zapier POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

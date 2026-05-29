import { db } from '@/db';
import { forms, submissions, formFields, userIntegrations } from '@/db/schema';
import { getAuthUserId, AuthError } from '@/lib/auth';
import { eq, and, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getGoogleAccessToken, createGoogleSheet, getSheetValues, appendToGoogleSheet } from '@/lib/google-sheets';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();

    const [integration] = await db.select({ email: userIntegrations.email }).from(userIntegrations).where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'google')));
    const [form] = await db.select({ googleSheetId: forms.googleSheetId, googleSheetName: forms.googleSheetName, googleSheetEnabled: forms.googleSheetEnabled }).from(forms).where(eq(forms.id, id));

    return NextResponse.json({ isConnected: !!integration, googleEmail: integration?.email, sheetId: form?.googleSheetId, sheetName: form?.googleSheetName, isEnabled: form?.googleSheetEnabled });
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
    if (!formOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'create') {
      const accessToken = await getGoogleAccessToken(userId);
      if (!accessToken) return NextResponse.json({ error: 'Google session expired. Please reconnect.' }, { status: 401 });

      const [formData] = await db.select({ title: forms.title }).from(forms).where(eq(forms.id, id));
      const sheet = await createGoogleSheet(accessToken, `${formData?.title || 'Form'} Submissions`);

      if (sheet) {
        await db.update(forms).set({ googleSheetId: sheet.id, googleSheetName: 'Sheet1', googleSheetEnabled: true }).where(eq(forms.id, id));
        return NextResponse.json({ success: true, sheet });
      }
      return NextResponse.json({ error: 'Failed to create Google Sheet' }, { status: 500 });
    }

    if (action === 'toggle') {
      await db.update(forms).set({ googleSheetEnabled: body.enabled }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'disconnect') {
      await db.update(forms).set({ googleSheetId: null, googleSheetName: null, googleSheetEnabled: false }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'sync-existing') {
      const accessToken = await getGoogleAccessToken(userId);
      if (!accessToken) return NextResponse.json({ error: 'Google session expired. Please reconnect.' }, { status: 401 });

      const [form] = await db.select({ googleSheetId: forms.googleSheetId, googleSheetName: forms.googleSheetName }).from(forms).where(eq(forms.id, id));
      if (!form?.googleSheetId) return NextResponse.json({ error: 'No sheet connected' }, { status: 400 });

      const fields = await db.select({ id: formFields.id, label: formFields.label }).from(formFields).where(eq(formFields.formId, id)).orderBy(asc(formFields.order));
      const unsyncedSubs = await db.select().from(submissions).where(and(eq(submissions.formId, id), eq(submissions.googleSynced, false)));

      if (!unsyncedSubs.length) return NextResponse.json({ success: true, count: 0, message: 'All caught up!' });

      const existingValues = await getSheetValues(accessToken, form.googleSheetId, `${form.googleSheetName || 'Sheet1'}!A1:Z1`);
      const payloadRows: any[][] = [];
      if (existingValues.length === 0) payloadRows.push(['Submission Date', ...fields.map((f) => f.label)]);

      unsyncedSubs.forEach((sub) => {
        const data = sub.data as Record<string, any>;
        const row = [new Date(sub.submittedAt).toLocaleString()];
        fields.forEach((f) => {
          let val = data[f.id] || data[f.label] || '';
          if (Array.isArray(val)) val = val.join(', ');
          row.push(String(val));
        });
        payloadRows.push(row);
      });

      const success = await appendToGoogleSheet(accessToken, form.googleSheetId, form.googleSheetName || 'Sheet1', payloadRows);

      if (success) {
        for (const sub of unsyncedSubs) {
          await db.update(submissions).set({ googleSynced: true }).where(eq(submissions.id, sub.id));
        }
      }

      return NextResponse.json({ success, count: unsyncedSubs.length, message: success ? `Successfully synced ${unsyncedSubs.length} new responses.` : 'Failed to sync.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Google Sheets POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

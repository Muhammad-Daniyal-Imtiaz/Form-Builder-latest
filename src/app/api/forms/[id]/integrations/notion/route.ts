import { db } from '@/db';
import { forms, submissions } from '@/db/schema';
import { getAuthUserId, AuthError } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/utils/encryption';
import { syncSubmissionToNotion, syncMultipleSubmissionsToNotion, createDatabaseInNotion, setupNotionDatabase, listAvailableDatabases } from '@/lib/notion';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();

    const [form] = await db
      .select({ notionApiKey: forms.notionApiKey, notionDatabaseId: forms.notionDatabaseId, notionEnabled: forms.notionEnabled })
      .from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    return NextResponse.json({
      apiKey: form.notionApiKey ? '********' : null,
      databaseId: form.notionDatabaseId ? await decrypt(form.notionDatabaseId) : null,
      isEnabled: form.notionEnabled,
    });
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

    if (action === 'update') {
      const { apiKey, databaseId, enabled, setupColumns } = body;
      const updateData: any = { notionEnabled: enabled };
      if (apiKey && apiKey !== '********') updateData.notionApiKey = await encrypt(apiKey);
      if (databaseId && databaseId !== '********') updateData.notionDatabaseId = await encrypt(databaseId);
      await db.update(forms).set(updateData).where(eq(forms.id, id));

      if (setupColumns) {
        const result = await setupNotionDatabase(id, apiKey !== '********' ? apiKey : undefined, databaseId !== '********' ? databaseId : undefined);
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Notion settings updated!' });
    }

    if (action === 'list-databases') {
      const { apiKey } = body;
      if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 400 });
      const result = await listAvailableDatabases(apiKey);
      return NextResponse.json(result);
    }

    if (action === 'disconnect') {
      await db.update(forms).set({ notionApiKey: null, notionDatabaseId: null, notionEnabled: false }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'sync-existing') {
      const unsynced = await db.select({ id: submissions.id }).from(submissions).where(and(eq(submissions.formId, id), eq(submissions.notionSynced, false)));
      if (!unsynced.length) return NextResponse.json({ success: true, message: 'All current data is already in Notion!' });

      const result = await syncMultipleSubmissionsToNotion(id, unsynced.map((s) => s.id));
      let message = `Successfully synced ${result.count} submissions to Notion!`;
      if ((result as any).failed > 0) message += `\n${(result as any).failed} failed.`;
      return NextResponse.json({ success: true, message, count: result.count });
    }

    if (action === 'send-test') {
      const [latestSub] = await db.select().from(submissions).where(eq(submissions.formId, id)).orderBy(desc(submissions.submittedAt)).limit(1);
      const testSubmission = latestSub || { id: 'test-sample', data: { 'Full Name': 'Test User', Email: 'test@example.com', Message: 'This is a test submission.' } };
      const res = await syncSubmissionToNotion(id, testSubmission);
      if (res.success) return NextResponse.json({ success: true, message: latestSub ? 'Latest real submission synced to Notion!' : 'Test sample sent to Notion!' });
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    if (action === 'create-database') {
      const { title, parentPageId, notionKey } = body;
      if (!title || !parentPageId) return NextResponse.json({ error: 'Title and Parent Page ID are required' }, { status: 400 });
      const result = await createDatabaseInNotion(id, title, parentPageId, notionKey);
      if (result.success) return NextResponse.json({ success: true, databaseId: result.databaseId, message: 'Database created and connected!' });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Notion POST error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

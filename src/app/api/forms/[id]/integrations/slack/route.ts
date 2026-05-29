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
      .select({ slackBotToken: forms.slackBotToken, slackChannelId: forms.slackChannelId, slackChannelName: forms.slackChannelName, slackEnabled: forms.slackEnabled })
      .from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    let channels = [];
    if (form.slackBotToken) {
      try {
        const token = await decrypt(form.slackBotToken);
        const res = await fetch('https://slack.com/api/conversations.list?types=public_channel', { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (d.ok) channels = d.channels.map((c: any) => ({ id: c.id, name: c.name, is_private: c.is_private }));
      } catch { }
    }

    return NextResponse.json({ botToken: form.slackBotToken ? '********' : null, channelId: form.slackChannelId, channelName: form.slackChannelName, isEnabled: form.slackEnabled, availableChannels: channels });
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

    const [form] = await db.select({ id: forms.id, slackBotToken: forms.slackBotToken }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    if (action === 'update') {
      const { botToken, channelId, channelName, enabled } = body;
      const updateData: any = { slackChannelId: channelId, slackChannelName: channelName, slackEnabled: enabled };
      if (botToken && botToken !== '********') updateData.slackBotToken = await encrypt(botToken);
      await db.update(forms).set(updateData).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'create-channel') {
      const { botToken, name } = body;
      let actualToken = botToken;
      if (botToken === '********' && form.slackBotToken) actualToken = await decrypt(form.slackBotToken);

      const slackRes = await fetch('https://slack.com/api/conversations.create', { method: 'POST', headers: { Authorization: `Bearer ${actualToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const slackData = await slackRes.json();
      if (!slackData.ok) return NextResponse.json({ error: `Slack Error: ${slackData.error}` }, { status: 400 });

      const channelId = slackData.channel.id;
      const channelName = slackData.channel.name;
      await fetch('https://slack.com/api/conversations.join', { method: 'POST', headers: { Authorization: `Bearer ${actualToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: channelId }) });
      await db.update(forms).set({ slackChannelId: channelId, slackChannelName: channelName, slackEnabled: true }).where(eq(forms.id, id));
      return NextResponse.json({ success: true, channelId, channelName });
    }

    if (action === 'disconnect') {
      await db.update(forms).set({ slackBotToken: null, slackChannelId: null, slackChannelName: null, slackEnabled: false }).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Slack POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

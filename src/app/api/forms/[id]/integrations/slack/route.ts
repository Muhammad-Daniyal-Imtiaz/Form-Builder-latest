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
      .select('slack_bot_token, slack_channel_id, slack_channel_name, slack_enabled')
      .eq('id', id)
      .single();

    if (formError) throw formError;

    let channels = [];
    if (form?.slack_bot_token) {
        try {
            const actualToken = await decrypt(form.slack_bot_token);
            const slackResp = await fetch('https://slack.com/api/conversations.list?types=public_channel', {
                headers: { 'Authorization': `Bearer ${actualToken}` }
            });
            const slackData = await slackResp.json();
            if (slackData.ok) {
                channels = slackData.channels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    is_private: c.is_private
                }));
            }
        } catch (err) {
            console.error('Failed to fetch Slack channels:', err);
        }
    }

    return NextResponse.json({
      botToken: form?.slack_bot_token ? '********' : null,
      channelId: form?.slack_channel_id,
      channelName: form?.slack_channel_name,
      isEnabled: form?.slack_enabled,
      availableChannels: channels
    });
  } catch (err) {
    console.error('Slack GET error:', err);
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
      const { botToken, channelId, channelName, enabled } = body;
      const updateData: any = {
        slack_channel_id: channelId,
        slack_channel_name: channelName,
        slack_enabled: enabled 
      };
      if (botToken && botToken !== '********') {
        updateData.slack_bot_token = await encrypt(botToken);
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // CREATE CHANNEL
    if (action === 'create-channel') {
        const { botToken, name } = body;
        let actualToken = botToken;
        if (botToken === '********') {
            const { data: dbForm } = await supabase.from('forms').select('slack_bot_token').eq('id', id).single();
            if (dbForm?.slack_bot_token) {
                actualToken = await decrypt(dbForm.slack_bot_token);
            }
        }

        const slackResp = await fetch('https://slack.com/api/conversations.create', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${actualToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        const slackData = await slackResp.json();
        
        if (!slackData.ok) {
            return NextResponse.json({ error: `Slack Error: ${slackData.error}` }, { status: 400 });
        }

        const channelId = slackData.channel.id;
        const channelName = slackData.channel.name;

        // Auto-join the channel to ensure we can post
        await fetch('https://slack.com/api/conversations.join', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${actualToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channel: channelId })
        });

        // Save to database immediately
        await supabase
          .from('forms')
          .update({ 
            slack_channel_id: channelId,
            slack_channel_name: channelName,
            slack_enabled: true 
          })
          .eq('id', id);

        return NextResponse.json({ 
            success: true, 
            channelId,
            channelName
        });
    }

    // DISCONNECT
    if (action === 'disconnect') {
      const { error } = await supabase
        .from('forms')
        .update({ 
          slack_bot_token: null, 
          slack_channel_id: null,
          slack_channel_name: null,
          slack_enabled: false 
        })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Slack POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

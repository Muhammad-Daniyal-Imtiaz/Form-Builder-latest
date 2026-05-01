
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
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
      .select('email_enabled, notification_email, email_app_password, email_to_list, email_host, email_port, email_secure')
      .eq('id', id)
      .single();

    if (formError) throw formError;

    return NextResponse.json({
      isEnabled: form?.email_enabled,
      email: form?.notification_email,
      appPassword: form?.email_app_password ? '********' : '', // Mask for safety
      toList: form?.email_to_list,
      host: form?.email_host,
      port: form?.email_port,
      secure: form?.email_secure
    });
  } catch (err) {
    console.error('Email Integration GET error:', err);
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

    // 1. UPDATE CONFIG
    if (action === 'update') {
      const { email, appPassword, toList, host, port, secure, enabled } = body;

      const updateData: any = {
        notification_email: email,
        email_to_list: toList,
        email_host: host,
        email_port: port,
        email_secure: secure,
        email_enabled: enabled
      };

      // Only update password if it's not the masked placeholder
      if (appPassword && appPassword !== '********') {
        updateData.email_app_password = await encrypt(appPassword);
      }

      const { error } = await supabase
        .from('forms')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // 2. TEST EMAIL
    if (action === 'test-email') {
      const { email, appPassword, host, port, secure, toList } = body;

      // Get password (and toList if not sent) from DB when masked
      let actualPassword = appPassword;
      let actualToList = toList;
      if (appPassword === '********' || !actualToList) {
        const { data: form } = await supabase
          .from('forms')
          .select('email_app_password, email_to_list')
          .eq('id', id)
          .single();
        if (appPassword === '********') actualPassword = form?.email_app_password ? await decrypt(form?.email_app_password) : undefined;
        if (!actualToList) actualToList = form?.email_to_list;
      }

      if (!actualPassword) {
        return NextResponse.json({ error: 'App password is required for test' }, { status: 400 });
      }

      // Resolve recipients: use toList if set, otherwise fall back to sender
      const recipients = actualToList?.trim() || email;

      const transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port: port || 465,
        secure: secure ?? true,
        auth: {
          user: email,
          pass: actualPassword,
        },
      });

      try {
        await transporter.verify();
        await transporter.sendMail({
          from: `"Form Notifications" <${email}>`,
          to: recipients,
          subject: '🛎️ Form Notification Test Email',
          text: 'Success! Your form email notifications are correctly configured.',
          html: '<h1>Success!</h1><p>Your form email notifications are correctly configured.</p>'
        });

        return NextResponse.json({ success: true, message: `Test email sent to ${recipients}` });
      } catch (smErr: any) {
        return NextResponse.json({ error: `SMTP Error: ${smErr.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Email Integration POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

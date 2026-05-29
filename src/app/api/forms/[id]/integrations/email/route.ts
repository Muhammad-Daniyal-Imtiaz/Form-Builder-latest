import { db } from '@/db';
import { forms } from '@/db/schema';
import { getAuthUserId, AuthError } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { encrypt, decrypt } from '@/utils/encryption';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId();

    const [form] = await db
      .select({ emailEnabled: forms.emailEnabled, notificationEmail: forms.notificationEmail, emailAppPassword: forms.emailAppPassword, emailToList: forms.emailToList, emailHost: forms.emailHost, emailPort: forms.emailPort, emailSecure: forms.emailSecure })
      .from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));

    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    return NextResponse.json({ isEnabled: form.emailEnabled, email: form.notificationEmail, appPassword: form.emailAppPassword ? '********' : '', toList: form.emailToList, host: form.emailHost, port: form.emailPort, secure: form.emailSecure });
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

    const [form] = await db.select({ id: forms.id }).from(forms).where(and(eq(forms.id, id), eq(forms.userId, userId)));
    if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

    if (action === 'update') {
      const { email, appPassword, toList, host, port, secure, enabled } = body;
      const updateData: any = { notificationEmail: email, emailToList: toList, emailHost: host, emailPort: port, emailSecure: secure, emailEnabled: enabled };
      if (appPassword && appPassword !== '********') updateData.emailAppPassword = await encrypt(appPassword);
      await db.update(forms).set(updateData).where(eq(forms.id, id));
      return NextResponse.json({ success: true });
    }

    if (action === 'test-email') {
      const { email, appPassword, host, port, secure, toList } = body;
      let actualPassword = appPassword;
      let actualToList = toList;

      if (appPassword === '********' || !actualToList) {
        const [dbForm] = await db.select({ emailAppPassword: forms.emailAppPassword, emailToList: forms.emailToList }).from(forms).where(eq(forms.id, id));
        if (appPassword === '********') actualPassword = dbForm?.emailAppPassword ? await decrypt(dbForm.emailAppPassword) : undefined;
        if (!actualToList) actualToList = dbForm?.emailToList;
      }

      if (!actualPassword) return NextResponse.json({ error: 'App password is required for test' }, { status: 400 });

      const recipients = actualToList?.trim() || email;
      const transporter = nodemailer.createTransport({ host: host || 'smtp.gmail.com', port: port || 465, secure: secure ?? true, auth: { user: email, pass: actualPassword } });

      try {
        await transporter.verify();
        await transporter.sendMail({ from: `"Form Notifications" <${email}>`, to: recipients, subject: '🛎️ Form Notification Test Email', text: 'Success! Your form email notifications are correctly configured.', html: '<h1>Success!</h1><p>Your form email notifications are correctly configured.</p>' });
        return NextResponse.json({ success: true, message: `Test email sent to ${recipients}` });
      } catch (smErr: any) {
        return NextResponse.json({ error: `SMTP Error: ${smErr.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Email Integration POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

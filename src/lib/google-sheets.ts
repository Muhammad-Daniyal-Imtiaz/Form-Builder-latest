import { db } from '@/db';
import { userIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface GoogleToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const [integration] = await db
    .select()
    .from(userIntegrations)
    .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, 'google')));

  if (!integration) return null;

  const isExpired =
    !integration.expiresAt ||
    new Date(integration.expiresAt).getTime() < Date.now() + 5 * 60 * 1000;

  if (!isExpired && integration.accessToken) {
    return integration.accessToken;
  }

  if (!integration.refreshToken) {
    console.error('No refresh token available for user:', userId);
    return null;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
    return null;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data: GoogleToken = await response.json();

    if (!response.ok) {
      console.error('Google token refresh failed:', data);
      if (
        data.error === 'invalid_grant' ||
        data.error_description?.includes('expired') ||
        data.error_description?.includes('revoked')
      ) {
        await db.delete(userIntegrations).where(eq(userIntegrations.id, integration.id));
      }
      return null;
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    await db
      .update(userIntegrations)
      .set({ accessToken: data.access_token, expiresAt, updatedAt: new Date().toISOString() })
      .where(eq(userIntegrations.id, integration.id));

    return data.access_token;
  } catch (err) {
    console.error('Error refreshing Google token:', err);
    return null;
  }
}

export async function appendToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: any[][]
) {
  try {
    const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!response.ok) {
      console.error('Google Sheets append failed:', await response.json());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error appending to Google Sheet:', err);
    return false;
  }
}

export async function createGoogleSheet(accessToken: string, title: string) {
  try {
    const response = await fetch(GOOGLE_SHEETS_API_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title } }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Google Sheets creation failed:', data);
      return null;
    }
    return { id: data.spreadsheetId, url: data.spreadsheetUrl };
  } catch (err) {
    console.error('Error creating Google Sheet:', err);
    return null;
  }
}

export async function getSheetValues(accessToken: string, spreadsheetId: string, range: string) {
  try {
    const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await response.json();
    return data.values || [];
  } catch (err) {
    console.error('Error fetching sheet values:', err);
    return [];
  }
}

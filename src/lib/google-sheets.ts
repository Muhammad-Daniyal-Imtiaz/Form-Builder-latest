import { createAdminClient } from '@/utils/supabase/server';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

interface GoogleToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !integration) return null;

  // Check if token is still valid (with 5 min buffer)
  const isExpired = !integration.expires_at || new Date(integration.expires_at).getTime() < Date.now() + 5 * 60 * 1000;

  if (!isExpired && integration.access_token) {
    return integration.access_token;
  }

  // Need to refresh
  if (!integration.refresh_token) {
    console.error('No refresh token available for user:', userId);
    return null;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from .env.local');
    return null;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data: GoogleToken = await response.json();

    if (!response.ok) {
      console.error('Google token refresh failed:', data);

      // If the token is revoked or expired, delete the integration so the user can reconnect
      if (data.error === 'invalid_grant' || data.error_description?.includes('expired') || data.error_description?.includes('revoked')) {
        console.warn('Google Refresh Token is invalid. Removing integration for user:', userId);
        await supabase
          .from('user_integrations')
          .delete()
          .eq('id', integration.id);
      }

      return null;
    }

    // Save New Token
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    await supabase
      .from('user_integrations')
      .update({
        access_token: data.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    return data.access_token;
  } catch (err) {
    console.error('Error refreshing Google token:', err);
    return null;
  }
}

export async function appendToGoogleSheet(accessToken: string, spreadsheetId: string, sheetName: string, values: any[][]) {
  try {
    const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Google Sheets append failed:', result);
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
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Google Sheets creation failed:', data);
      return null;
    }

    return {
      id: data.spreadsheetId,
      url: data.spreadsheetUrl,
    };
  } catch (err) {
    console.error('Error creating Google Sheet:', err);
    return null;
  }
}

export async function getSheetValues(accessToken: string, spreadsheetId: string, range: string) {
  try {
    const url = `${GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${range}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return data.values || [];
  } catch (err) {
    console.error('Error fetching sheet values:', err);
    return [];
  }
}

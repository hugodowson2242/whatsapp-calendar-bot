import { google } from 'googleapis';
import { saveRefreshToken } from './user-store';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

function getRedirectUri(): string {
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    return `${baseUrl}/auth/callback`;
  }
  const port = parseInt(process.env.PORT || '3001', 10);
  return `http://localhost:${port}/auth/callback`;
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

export function generateAuthUrl(phoneNumber: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: phoneNumber,
  });
}

export async function exchangeCodeForToken(code: string, state: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received. User may have already authorized this app.');
  }

  saveRefreshToken(state, tokens.refresh_token);
}

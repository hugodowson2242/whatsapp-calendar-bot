import { google, type calendar_v3, type docs_v1, type drive_v3, type gmail_v1 } from 'googleapis';

export interface GoogleClients {
  calendar: calendar_v3.Calendar;
  docs: docs_v1.Docs;
  drive: drive_v3.Drive;
  gmail: gmail_v1.Gmail;
}

export function createGoogleClients(refreshToken: string): GoogleClients {
  console.log('[Auth] Creating Google clients', {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRefreshToken: !!refreshToken,
    refreshTokenPrefix: refreshToken?.slice(0, 10) + '...',
  });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    docs: google.docs({ version: 'v1', auth: oauth2Client }),
    drive: google.drive({ version: 'v3', auth: oauth2Client }),
    gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
  };
}

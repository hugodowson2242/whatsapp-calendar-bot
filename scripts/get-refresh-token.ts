import 'dotenv/config';
import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.readonly',
];
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for authorization...');

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('No code received');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Success!</h1><p>You can close this window.</p>');

    console.log('\n✅ Authorization successful!\n');
    console.log('Add this to your .env file:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

    server.close();
    process.exit(0);
  } catch (error) {
    res.writeHead(500);
    res.end('Error exchanging code');
    console.error('Error:', error);
    server.close();
    process.exit(1);
  }
});

server.listen(REDIRECT_PORT);

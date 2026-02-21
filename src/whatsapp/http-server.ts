import http from 'http';
import QRCode from 'qrcode';
import { generateAuthUrl, exchangeCodeForToken } from '../google/oauth-flow';

const PORT = parseInt(process.env.PORT || '3001', 10);

let currentQR: string | null = null;
let isReady = false;

export function setQR(qr: string): void {
  currentQR = qr;
}

export function setReady(): void {
  isReady = true;
  currentQR = null;
}

export function startHttpServer(): void {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname === '/qr') {
      await handleQr(res);
    } else if (url.pathname === '/auth') {
      handleAuth(url, res);
    } else if (url.pathname === '/auth/callback') {
      await handleAuthCallback(url, res);
    } else {
      res.writeHead(302, { Location: '/qr' });
      res.end();
    }
  });

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

async function handleQr(res: http.ServerResponse): Promise<void> {
  if (isReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Already authenticated</h1><p>WhatsApp client is connected.</p>');
    return;
  }
  if (!currentQR) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Waiting for QR code...</h1><p>Refresh in a few seconds.</p>');
    return;
  }
  try {
    const qrImage = await QRCode.toDataURL(currentQR);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>WhatsApp QR</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;flex-direction:column;">
          <h1>Scan with WhatsApp</h1>
          <img src="${qrImage}" style="width:300px;height:300px;" />
          <p>Settings > Linked Devices > Link a Device</p>
        </body>
      </html>
    `);
  } catch {
    res.writeHead(500);
    res.end('Error generating QR');
  }
}

function handleAuth(url: URL, res: http.ServerResponse): void {
  const phone = url.searchParams.get('phone');
  if (!phone) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Missing phone parameter</h1>');
    return;
  }

  const authUrl = generateAuthUrl(phone);
  res.writeHead(302, { Location: authUrl });
  res.end();
}

async function handleAuthCallback(url: URL, res: http.ServerResponse): Promise<void> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Missing code or state</h1>');
    return;
  }

  try {
    await exchangeCodeForToken(code, state);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Success</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;flex-direction:column;">
          <h1>Google account connected!</h1>
          <p>You can close this window and go back to WhatsApp.</p>
        </body>
      </html>
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('OAuth callback error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authentication failed</h1><p>${message}</p>`);
  }
}

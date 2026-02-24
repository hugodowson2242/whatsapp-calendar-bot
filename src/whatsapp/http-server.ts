import http from 'http';
import { generateAuthUrl, exchangeCodeForToken } from '../google/oauth-flow';
import { onMessage } from './on-message';
import { sendWhatsAppMessage } from './cloud-api';

const PORT = parseInt(process.env.PORT || '3000', 10);

export function startHttpServer(): void {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname === '/webhook' && req.method === 'GET') {
      handleWebhookVerification(url, res);
    } else if (url.pathname === '/webhook' && req.method === 'POST') {
      handleWebhookMessage(req, res);
    } else if (url.pathname === '/auth') {
      handleAuth(url, res);
    } else if (url.pathname === '/auth/callback') {
      await handleAuthCallback(url, res);
    } else if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    console.log(`Server listening on ${baseUrl}`);
  });
}

function handleWebhookVerification(url: URL, res: http.ServerResponse): void {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(challenge);
  } else {
    res.writeHead(403);
    res.end('Forbidden');
  }
}

function handleWebhookMessage(req: http.IncomingMessage, res: http.ServerResponse): void {
  // Respond immediately — Meta retries if no 200 within 5 seconds
  res.writeHead(200);
  res.end();

  let rawBody = '';
  req.on('data', (chunk: Buffer) => { rawBody += chunk; });
  req.on('end', () => {
    try {
      const payload = JSON.parse(rawBody);
      const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages;
      if (!Array.isArray(messages)) return;

      for (const msg of messages) {
        if (msg.type !== 'text') continue;
        onMessage(
          { from: msg.from, body: msg.text.body, id: msg.id },
          sendWhatsAppMessage
        ).catch(err => console.error('onMessage error:', err));
      }
    } catch (err) {
      console.error('Webhook parse error:', err);
    }
  });
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

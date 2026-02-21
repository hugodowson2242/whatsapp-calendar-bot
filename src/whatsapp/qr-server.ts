import http from 'http';
import QRCode from 'qrcode';

const QR_PORT = parseInt(process.env.QR_PORT || '3001', 10);

let currentQR: string | null = null;
let isReady = false;

export function setQR(qr: string): void {
  currentQR = qr;
}

export function setReady(): void {
  isReady = true;
  currentQR = null;
}

export function startServer(): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/qr') {
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
              <p>Settings → Linked Devices → Link a Device</p>
            </body>
          </html>
        `);
      } catch {
        res.writeHead(500);
        res.end('Error generating QR');
      }
    } else {
      res.writeHead(302, { Location: '/qr' });
      res.end();
    }
  });

  server.listen(QR_PORT, () => {
    console.log(`QR code available at http://localhost:${QR_PORT}/qr`);
  });
}

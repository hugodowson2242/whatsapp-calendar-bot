import qrcode from 'qrcode-terminal';
import { setQR } from './http-server';

export function onQr(qr: string): void {
  setQR(qr);
  console.log('QR code received. Open the URL above to scan.');
  qrcode.generate(qr, { small: true });
}

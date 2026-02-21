import { setReady } from './qr-server';

export function onReady(): void {
  setReady();
  console.log('WhatsApp client ready!');
}

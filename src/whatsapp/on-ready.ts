import { setReady } from './http-server';

export function onReady(): void {
  setReady();
  console.log('WhatsApp client ready!');
}

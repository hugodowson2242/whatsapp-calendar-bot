import 'dotenv/config';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { startServer } from './whatsapp/qr-server';
import { loadCalendarMap } from './google/calendar-map';
import { onQr } from './whatsapp/on-qr';
import { onReady } from './whatsapp/on-ready';
import { onMessage } from './whatsapp/on-message';

loadCalendarMap();
startServer();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', onQr);
client.on('ready', onReady);
client.on('message_create', (message) => onMessage(message, client.sendMessage.bind(client)));

client.initialize();

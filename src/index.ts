import 'dotenv/config';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { startHttpServer } from './whatsapp/http-server';
import { onQr } from './whatsapp/on-qr';
import { onReady } from './whatsapp/on-ready';
import { onMessage } from './whatsapp/on-message';
import './db';

startHttpServer();

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

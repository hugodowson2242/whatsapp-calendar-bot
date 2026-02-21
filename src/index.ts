import 'dotenv/config';
import { startHttpServer } from './whatsapp/http-server';
import './db';

startHttpServer();

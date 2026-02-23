import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { Executor } from './types';

// Calendar handlers
import * as createEvent from './calendar/create-event';
import * as listEvents from './calendar/list-events';

// Docs handlers
import * as createDoc from './docs/create-doc';
import * as readDoc from './docs/read-doc';
import * as appendDoc from './docs/append-doc';
import * as replaceDoc from './docs/replace-doc';
import * as searchDocs from './docs/search-docs';

// Web handlers
import * as fetchUrl from './web/fetch-url';

// WhatsApp handlers
import * as sendListMessage from './whatsapp/send-list-message';

const handlers = [
  createEvent,
  listEvents,
  createDoc,
  readDoc,
  appendDoc,
  replaceDoc,
  searchDocs,
  fetchUrl,
  sendListMessage,
];

export const TOOLS: Tool[] = handlers.map(h => h.tool);

export const EXECUTORS: Record<string, Executor> = Object.fromEntries(
  handlers.map(h => [h.tool.name, h.executor])
);

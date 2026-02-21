# WhatsApp Personal Assistant

A WhatsApp bot that manages Google Calendar, Google Docs, and fetches web content using natural language. Built with Claude as the AI backbone.

## Features

- **Calendar**: Create events, query upcoming events
- **Docs**: Create, read, append to, and search Google Docs
- **Web**: Fetch and summarize content from URLs
- **Agentic**: Supports sequential tool chaining (e.g., search docs → read the result)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable these APIs:
   - Google Calendar API
   - Google Docs API
   - Google Drive API
4. Create OAuth 2.0 credentials (Desktop app)
5. Run the auth helper to get a refresh token:

```bash
npx tsx scripts/get-refresh-token.ts
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

Optional:
- `TRIGGER_PREFIX` - Message prefix to trigger the bot (default: `:?`)

### 4. Run

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

Scan the QR code with WhatsApp (Settings → Linked Devices → Link a Device).

## Usage

Prefix messages with `:?` (or your configured trigger):

**Calendar:**
```
:?Meeting with John tomorrow at 3pm for 1 hour
:?What's on my calendar tomorrow?
:?Do I have anything scheduled this weekend?
```

**Docs:**
```
:?Create a new doc called "Meeting Notes"
:?Search my docs for "project plan"
:?What's in this doc: 1BxG...abc (document ID)
:?Add "Action item: follow up" to doc 1BxG...abc
```

**Web:**
```
:?Summarize this article: https://example.com/article
:?What's on the homepage of news.ycombinator.com?
```

**Chained operations:**
```
:?Find my doc about the Q1 budget and tell me the total
```
(Bot searches docs, then reads the found document)

## Multi-user Authentication

Each WhatsApp user authenticates with their own Google account. When a user first messages the bot, they receive a link to complete Google OAuth. Their refresh token and calendar preference are stored in a local SQLite database (`bot.db`).

To migrate from the legacy `tokens.json` and `calendar-map.json` files:

```bash
npx tsx scripts/migrate-json-to-sqlite.ts
```

## Architecture

The bot uses an agentic loop pattern:

```
User message
    ↓
┌─→ Call Claude
│       ↓
│   Tool call? ──no──→ Send response to user
│       ↓ yes
│   Execute tool
│       ↓
│   Send result back to Claude
└───────┘
```

This allows Claude to chain multiple tools sequentially to complete complex tasks.

## Project Structure

```
src/
├── index.ts              # Entry point
├── config.ts             # Configuration
├── qr-server.ts          # QR code web server
├── calendar/
│   ├── client.ts         # Google Calendar API
│   ├── errors.ts         # Typed errors
│   └── map.ts            # User → Calendar mapping
├── claude/
│   ├── client.ts         # Anthropic API, tools, system prompt
│   └── conversation-store.ts
├── docs/
│   ├── client.ts         # Google Docs/Drive API
│   └── errors.ts         # Typed errors
├── events/
│   ├── qr.ts             # QR code event
│   ├── ready.ts          # Ready event
│   └── message.ts        # Message handling + agentic loop
└── handlers/
    ├── registry.ts       # Tool executor registry
    ├── types.ts          # Executor types
    ├── create-event.ts   # Calendar: create event
    ├── list-events.ts    # Calendar: list events
    ├── create-doc.ts     # Docs: create document
    ├── read-doc.ts       # Docs: read document
    ├── append-doc.ts     # Docs: append to document
    ├── search-docs.ts    # Docs: search documents
    └── fetch-url.ts      # Web: fetch URL content
```

## Scripts

- `npm start` - Run the bot
- `npm run dev` - Run with auto-reload
- `npm run typecheck` - Type check without emitting

## Adding New Tools

1. Create executor in `src/handlers/` returning `ExecutorResult`
2. Add tool definition to `TOOLS` array in `src/claude/client.ts`
3. Register executor in `src/handlers/registry.ts`

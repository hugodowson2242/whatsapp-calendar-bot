# WhatsApp Personal Assistant

A WhatsApp bot that manages Google Calendar, Google Docs, and fetches web content using natural language. Built with Claude as the AI backbone.

## Features

- **Calendar**: Create events, query upcoming events
- **Docs**: Create, read, append to, and search Google Docs
- **Web**: Fetch and summarize content from URLs
- **Agentic**: Supports sequential tool chaining (e.g., search docs → read the result)

## Local Development

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
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:3001/auth/callback` to Authorized redirect URIs

### 3. WhatsApp Cloud API Setup

1. Go to [Meta Developer Portal](https://developers.facebook.com)
2. Create a new app (type: Business)
3. Add WhatsApp product to your app
4. In WhatsApp > API Setup, note your:
   - Phone number ID
   - Temporary access token (or create a permanent one)

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `WHATSAPP_PHONE_NUMBER_ID` - From Meta Developer Portal
- `WHATSAPP_ACCESS_TOKEN` - From Meta Developer Portal
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Any secret string you choose

Optional:
- `PORT` - Server port (default: `3001`)

### 5. Expose localhost with ngrok

WhatsApp Cloud API requires a public HTTPS URL for webhooks:

```bash
ngrok http 3001
```

Copy the `https://` forwarding URL.

### 6. Configure WhatsApp Webhook

In Meta Developer Portal > WhatsApp > Configuration:
1. Set Callback URL to: `https://<your-ngrok-url>/webhook`
2. Set Verify token to your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Subscribe to `messages` webhook field

### 7. Run

```bash
npm run dev
```

The server starts on `http://localhost:3001`. First message from a user triggers Google OAuth.

## Usage

Just message the bot naturally:

**Calendar:**
```
Meeting with John tomorrow at 3pm for 1 hour
What's on my calendar tomorrow?
Do I have anything scheduled this weekend?
```

**Docs:**
```
Create a new doc called "Meeting Notes"
Search my docs for "project plan"
What's in this doc: 1BxG...abc (document ID)
Add "Action item: follow up" to doc 1BxG...abc
```

**Web:**
```
Summarize this article: https://example.com/article
What's on the homepage of news.ycombinator.com?
```

**Chained operations:**
```
Find my doc about the Q1 budget and tell me the total
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
├── db.ts                 # SQLite database
├── errors.ts             # Error types
├── claude/
│   ├── client.ts         # Anthropic API, tools, system prompt
│   └── conversation-store.ts
├── google/
│   ├── auth.ts           # OAuth2 client creation
│   ├── calendar.ts       # Google Calendar API
│   ├── docs.ts           # Google Docs/Drive API
│   ├── oauth-flow.ts     # OAuth flow helpers
│   └── user-store.ts     # User token storage
├── whatsapp/
│   ├── cloud-api.ts      # WhatsApp Cloud API client
│   ├── http-server.ts    # Webhook + OAuth callback server
│   └── on-message.ts     # Message handling + agentic loop
└── handlers/
    ├── registry.ts       # Tool executor registry
    ├── types.ts          # Executor types
    ├── calendar/         # Calendar tools
    ├── docs/             # Docs tools
    └── web/              # Web fetch tool
```

## Scripts

- `npm start` - Run the bot
- `npm run dev` - Run with auto-reload
- `npm run typecheck` - Type check without emitting

## Adding New Tools

1. Create executor in `src/handlers/` returning `ExecutorResult`
2. Add tool definition to `TOOLS` array in `src/claude/client.ts`
3. Register executor in `src/handlers/registry.ts`

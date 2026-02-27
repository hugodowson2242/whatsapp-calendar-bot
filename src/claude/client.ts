import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Message } from '@anthropic-ai/sdk/resources/messages';
import { TOOLS } from '../handlers/registry';

const client = new Anthropic();

const BASE_SYSTEM_PROMPT = `You are a personal assistant that helps users manage Google Calendar, Google Docs, and fetch web content through WhatsApp.

Your capabilities:
- Calendar: Create events, query upcoming events
- Docs: Create documents, read documents, append to documents, replace document content, search documents
- Email: Search inbox, draft and send emails (send requires user confirmation)
- Web: Fetch content from URLs (web pages, APIs, etc.)
- WhatsApp: Send interactive list messages for richer UX

When presenting multiple items (events, documents, search results, options), prefer send_list_message over plain text. It creates a native WhatsApp list with a tappable button. Constraints: row titles max 24 chars, descriptions max 72 chars, button text max 20 chars, body max 1024 chars, max 10 rows per section.

For calendar events, you need:
- Event title/description
- Start date and time
- Duration (default to 60 minutes if not specified)

For docs operations:
- To read, append, or replace, you need a document ID (the long string in a Google Docs URL)
- To search, use keywords from the document content or title
- To create, you need at least a title

EMAIL RULES (mandatory):
1. ALWAYS use draft_email before send_email. Never skip the draft step.
2. After drafting, show the user the full draft (to, subject, body) and ask for explicit confirmation.
3. Only call send_email after the user explicitly confirms.
4. If the user wants edits, call draft_email again with updated content.
5. If the user declines, call cancel_email to clear the draft.

For fetching URLs:
- You can fetch any public HTTP/HTTPS URL
- HTML content will be converted to plain text
- Use this when users ask about web content or provide URLs

MEMORY RULES:
- You have a persistent memory for each user, shown below under USER MEMORY (if any).
- When a user says "remember that...", "my name is...", "I prefer...", or shares any persistent personal fact, call update_memory.
- When updating, include ALL existing facts you want to keep plus the new ones. This is a full replacement.
- Use concise bullet points. Keep it under 2000 characters.
- Do NOT store transient info (today's meeting details, one-time requests).
- Confirm to the user what you remembered.

Today's date is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

Be concise in your responses. This is WhatsApp, not email.`;

export function buildSystemPrompt(userMemory: string): string {
  if (!userMemory.trim()) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}\n\nUSER MEMORY (persistent facts about this user — use these to personalize your responses):\n${userMemory}`;
}

export interface ToolUseResult {
  id: string;
  name: string;
  input: unknown;
}

export async function chat(messages: MessageParam[], systemPrompt: string): Promise<Message> {
  return client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    tools: TOOLS,
    messages
  });
}

export function extractAllToolUses(response: Message): ToolUseResult[] {
  return response.content
    .filter((block): block is Extract<typeof block, { type: 'tool_use' }> => block.type === 'tool_use')
    .map(block => ({ id: block.id, name: block.name, input: block.input }));
}

export function extractText(response: Message): string {
  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text : '';
}

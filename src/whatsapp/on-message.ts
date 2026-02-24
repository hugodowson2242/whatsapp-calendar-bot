import { chat, extractAllToolUses, extractText } from '../claude/client';
import { conversationStore } from '../claude/conversation-store';
import { EXECUTORS } from '../handlers/registry';
import { getRefreshToken, clearRefreshToken } from '../google/user-store';
import { createGoogleClients } from '../google/auth';
import { isInvalidGrantError } from '../errors';

const MAX_TOOL_CALLS = 10;

// Per-chatId mutex: prevents concurrent message handling for the same user
const chatLocks = new Map<string, Promise<void>>();

function getAuthUrl(phone: string): string {
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    return `${baseUrl}/auth?phone=${encodeURIComponent(phone)}`;
  }
  const port = parseInt(process.env.PORT || '3001', 10);
  return `http://localhost:${port}/auth?phone=${encodeURIComponent(phone)}`;
}

export interface CloudMessage {
  from: string;
  body: string;
}

export async function onMessage(
  message: CloudMessage,
  sendMessage: (chatId: string, text: string) => Promise<unknown>
): Promise<void> {
  const chatId = message.from;

  // Acquire per-chatId lock: queue behind any in-flight handler
  const prev = chatLocks.get(chatId) ?? Promise.resolve();
  let releaseLock!: () => void;
  const curr = prev.then(() => new Promise<void>(resolve => { releaseLock = resolve; }));
  chatLocks.set(chatId, curr);

  try {
    await prev;
    await handleMessage(chatId, message.body, sendMessage);
  } finally {
    releaseLock();
    if (chatLocks.get(chatId) === curr) {
      chatLocks.delete(chatId);
    }
  }
}

async function handleMessage(
  chatId: string,
  userText: string,
  sendMessage: (chatId: string, text: string) => Promise<unknown>
): Promise<void> {
  const refreshToken = getRefreshToken(chatId);
  if (!refreshToken) {
    await sendMessage(chatId, `Please authenticate your Google account first:\n${getAuthUrl(chatId)}`);
    return;
  }

  const google = createGoogleClients(refreshToken);

  try {
    conversationStore.append(chatId, { role: 'user', content: userText });

    let toolCalls = 0;

    while (toolCalls < MAX_TOOL_CALLS) {
      const history = conversationStore.get(chatId);
      const response = await chat(history);
      const toolUses = extractAllToolUses(response);

      // No tool calls — final text response
      if (toolUses.length === 0) {
        const text = extractText(response);
        if (text) {
          conversationStore.append(chatId, { role: 'assistant', content: text });
          sendMessage(chatId, text).catch(console.error);
        }
        break;
      }

      // Validate all tool names before executing any
      for (const toolUse of toolUses) {
        if (!EXECUTORS[toolUse.name]) {
          console.error(`Unknown tool: ${toolUse.name}`);
          sendMessage(chatId, `Unknown tool: ${toolUse.name}`).catch(console.error);
          return;
        }
      }

      // Execute all tools in parallel
      const results = await Promise.all(
        toolUses.map(toolUse =>
          EXECUTORS[toolUse.name]({ toolUse, chatId, google })
            .catch((err): { success: false; error: string; data?: undefined; userMessage?: undefined; done?: undefined } => ({ success: false, error: String(err) }))
        )
      );

      toolCalls += toolUses.length;

      // Append assistant message (with all tool_use blocks) once
      conversationStore.append(chatId, {
        role: 'assistant',
        content: response.content
      });

      // Append all tool_results in a single user message (API requirement)
      conversationStore.append(chatId, {
        role: 'user',
        content: toolUses.map((toolUse, i) => ({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: results[i].success
            ? JSON.stringify(results[i].data)
            : `Error: ${results[i].error}`
        }))
      });

      // Collect any userMessages and send
      const userMessages = results
        .map(r => r.userMessage)
        .filter((m): m is string => !!m);

      if (userMessages.length > 0) {
        sendMessage(chatId, userMessages.join('\n')).catch(console.error);
      }

      if (userMessages.length > 0 || results.some(r => r.done)) {
        break;
      }
    }

    if (toolCalls >= MAX_TOOL_CALLS) {
      sendMessage(chatId, 'Too many operations. Please try a simpler request.').catch(console.error);
    }
  } catch (error) {
    console.error('Error processing message:', error);

    if (isInvalidGrantError(error)) {
      clearRefreshToken(chatId);
      await sendMessage(chatId, `Your Google authentication has expired. Please re-authenticate:\n${getAuthUrl(chatId)}`);
      return;
    }

    await sendMessage(chatId, 'Something went wrong. Please try again.');
  }
}

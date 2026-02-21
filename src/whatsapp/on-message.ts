import { chat, extractToolUse, extractText } from '../claude/client';
import { conversationStore } from '../claude/conversation-store';
import { EXECUTORS } from '../handlers/registry';
import { config } from '../config';
import { getRefreshToken, clearRefreshToken } from '../google/user-store';
import { createGoogleClients } from '../google/auth';
import { isInvalidGrantError } from '../errors';

const MAX_TOOL_CALLS = 10;
const PORT = parseInt(process.env.PORT || '3001', 10);

export interface CloudMessage {
  from: string;
  body: string;
}

export async function onMessage(
  message: CloudMessage,
  sendMessage: (chatId: string, text: string) => Promise<unknown>
): Promise<void> {
  if (!message.body.startsWith(config.triggerPrefix)) return;

  const chatId = message.from;
  const userText = message.body.slice(config.triggerPrefix.length);

  const refreshToken = getRefreshToken(chatId);
  if (!refreshToken) {
    const authUrl = `http://localhost:${PORT}/auth?phone=${encodeURIComponent(chatId)}`;
    await sendMessage(chatId, `Please authenticate your Google account first:\n${authUrl}`);
    return;
  }

  const google = createGoogleClients(refreshToken);

  try {
    conversationStore.append(chatId, { role: 'user', content: userText });

    let toolCalls = 0;

    while (toolCalls < MAX_TOOL_CALLS) {
      const history = conversationStore.get(chatId);
      const response = await chat(history);
      const toolUse = extractToolUse(response);

      if (!toolUse) {
        const text = extractText(response);
        if (text) {
          conversationStore.append(chatId, { role: 'assistant', content: text });
          await sendMessage(chatId, text);
        }
        break;
      }

      const executor = EXECUTORS[toolUse.name];
      if (!executor) {
        console.error(`Unknown tool: ${toolUse.name}`);
        await sendMessage(chatId, `Unknown tool: ${toolUse.name}`);
        break;
      }

      toolCalls++;
      const result = await executor({ toolUse, chatId, google });

      if (result.userMessage) {
        await sendMessage(chatId, result.userMessage);
      }

      conversationStore.append(chatId, {
        role: 'assistant',
        content: response.content
      });

      conversationStore.append(chatId, {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.success
            ? JSON.stringify(result.data)
            : `Error: ${result.error}`
        }]
      });

      if (result.userMessage) {
        break;
      }
    }

    if (toolCalls >= MAX_TOOL_CALLS) {
      await sendMessage(chatId, 'Too many operations. Please try a simpler request.');
    }
  } catch (error) {
    console.error('Error processing message:', error);

    if (isInvalidGrantError(error)) {
      clearRefreshToken(chatId);
      const authUrl = `http://localhost:${PORT}/auth?phone=${encodeURIComponent(chatId)}`;
      await sendMessage(chatId, `Your Google authentication has expired. Please re-authenticate:\n${authUrl}`);
      return;
    }

    await sendMessage(chatId, 'Something went wrong. Please try again.');
  }
}

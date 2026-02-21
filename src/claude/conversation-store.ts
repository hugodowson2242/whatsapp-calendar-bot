import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

class ConversationStore {
  private conversations = new Map<string, MessageParam[]>();
  private timers = new Map<string, NodeJS.Timeout>();

  get(chatId: string): MessageParam[] {
    return this.conversations.get(chatId) || [];
  }

  append(chatId: string, message: MessageParam): void {
    const history = this.get(chatId);
    history.push(message);
    this.conversations.set(chatId, history);
    this.resetTimer(chatId);
  }

  clear(chatId: string): void {
    this.conversations.delete(chatId);
    this.clearTimer(chatId);
  }

  private resetTimer(chatId: string): void {
    this.clearTimer(chatId);
    const timer = setTimeout(() => {
      this.clear(chatId);
    }, TIMEOUT_MS);
    this.timers.set(chatId, timer);
  }

  private clearTimer(chatId: string): void {
    const timer = this.timers.get(chatId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(chatId);
    }
  }
}

export const conversationStore = new ConversationStore();

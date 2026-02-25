import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { clearDraft } from './draft-store';

export const tool: Tool = {
  name: 'cancel_email',
  description: 'Cancels the pending email draft. Use when the user decides not to send.',
  input_schema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  clearDraft(ctx.chatId);
  return { success: true, data: { cancelled: true } };
}

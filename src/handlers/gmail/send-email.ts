import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { getDraft, clearDraft } from './draft-store';
import { sendEmail } from '../../google/gmail';
import { isInvalidGrantError, isInsufficientPermissionsError } from '../../errors';

export const tool: Tool = {
  name: 'send_email',
  description: 'Sends the previously drafted email. Only call this after the user has explicitly confirmed they want to send.',
  input_schema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const draft = getDraft(ctx.chatId);

  if (!draft) {
    return { success: false, error: 'No pending email draft found, or the draft has expired. Use draft_email first.' };
  }

  if (draft.invocationId === ctx.invocationId) {
    return { success: false, error: 'Cannot send an email in the same turn it was drafted. The user must confirm first.' };
  }

  try {
    const result = await sendEmail(
      ctx.google.gmail,
      draft.to,
      draft.subject,
      draft.body,
      draft.threadId ? { threadId: draft.threadId } : undefined
    );

    clearDraft(ctx.chatId);

    return {
      success: true,
      data: { messageId: result.messageId, threadId: result.threadId },
      userMessage: `Email sent to ${draft.to}.`,
    };
  } catch (error) {
    if (isInvalidGrantError(error) || isInsufficientPermissionsError(error)) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to send email: ${message}` };
  }
}

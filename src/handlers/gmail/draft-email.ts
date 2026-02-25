import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { saveDraft } from './draft-store';

interface DraftEmailInput {
  to: string;
  subject: string;
  body: string;
  thread_id?: string;
}

export const tool: Tool = {
  name: 'draft_email',
  description: 'Saves an email draft. After calling this, present the full draft (to, subject, body) to the user and ask for explicit confirmation before calling send_email.',
  input_schema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address'
      },
      subject: {
        type: 'string',
        description: 'Email subject line'
      },
      body: {
        type: 'string',
        description: 'Email body (plain text)'
      },
      thread_id: {
        type: 'string',
        description: 'Gmail thread ID to reply in (optional)'
      }
    },
    required: ['to', 'subject', 'body']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { to, subject, body, thread_id } = ctx.toolUse.input as DraftEmailInput;

  saveDraft(ctx.chatId, {
    to,
    subject,
    body,
    threadId: thread_id,
    invocationId: ctx.invocationId,
    createdAt: Date.now(),
  });

  return {
    success: true,
    data: { to, subject, body, thread_id },
  };
}

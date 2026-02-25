import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { searchEmails } from '../../google/gmail';
import { isInvalidGrantError, isInsufficientPermissionsError } from '../../errors';

interface SearchEmailsInput {
  query: string;
  max_results?: number;
}

export const tool: Tool = {
  name: 'search_emails',
  description: 'Searches the user\'s Gmail inbox. Uses Gmail search syntax (e.g. "from:alice subject:meeting", "newer_than:7d", "is:unread").',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Gmail search query'
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of emails to return (default 5)'
      }
    },
    required: ['query']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { query, max_results } = ctx.toolUse.input as SearchEmailsInput;

  try {
    const results = await searchEmails(ctx.google.gmail, query, max_results ?? 5);
    return { success: true, data: results };
  } catch (error) {
    if (isInvalidGrantError(error) || isInsufficientPermissionsError(error)) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to search emails: ${message}` };
  }
}

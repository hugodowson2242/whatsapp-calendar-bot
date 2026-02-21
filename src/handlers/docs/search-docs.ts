import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { searchDocs } from '../../google/docs';
import { isInvalidGrantError } from '../../errors';

export interface SearchDocsInput {
  query: string;
}

export const tool: Tool = {
  name: 'search_docs',
  description: 'Searches Google Docs by content or title',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find documents'
      }
    },
    required: ['query']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { query } = ctx.toolUse.input as SearchDocsInput;

  try {
    const results = await searchDocs(ctx.google.drive, query);

    return {
      success: true,
      data: results
    };
  } catch (error) {
    if (isInvalidGrantError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to search documents: ${message}`
    };
  }
}

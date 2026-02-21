import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { appendToDoc } from '../../google/docs';
import { isInvalidGrantError } from '../../errors';

export interface AppendDocInput {
  document_id: string;
  text: string;
}

export const tool: Tool = {
  name: 'append_to_doc',
  description: 'Appends text to the end of a Google Doc',
  input_schema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'string',
        description: 'The Google Doc ID (found in the document URL)'
      },
      text: {
        type: 'string',
        description: 'The text to append to the document'
      }
    },
    required: ['document_id', 'text']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { document_id, text } = ctx.toolUse.input as AppendDocInput;

  try {
    await appendToDoc(ctx.google.docs, document_id, text);

    return {
      success: true,
      data: { appended: true },
      userMessage: '✅ Added to document.'
    };
  } catch (error) {
    if (isInvalidGrantError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to append to document: ${message}`
    };
  }
}

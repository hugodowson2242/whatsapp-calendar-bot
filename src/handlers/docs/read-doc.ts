import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { readDoc } from '../../google/docs';

export interface ReadDocInput {
  document_id: string;
}

export const tool: Tool = {
  name: 'read_doc',
  description: 'Reads the content of a Google Doc',
  input_schema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'string',
        description: 'The Google Doc ID (found in the document URL)'
      }
    },
    required: ['document_id']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { document_id } = ctx.toolUse.input as ReadDocInput;

  try {
    const doc = await readDoc(document_id);

    return {
      success: true,
      data: doc
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to read document: ${message}`
    };
  }
}

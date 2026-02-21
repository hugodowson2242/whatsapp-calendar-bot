import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { replaceDocContent } from '../../google/docs';
import { isInvalidGrantError } from '../../errors';

export interface ReplaceDocInput {
  document_id: string;
  content: string;
}

export const tool: Tool = {
  name: 'replace_doc_content',
  description: 'Replaces the entire content of a Google Doc. Use this for transformations like reformatting, converting units, restructuring, or any bulk edit. First read the doc, transform the content, then replace.',
  input_schema: {
    type: 'object',
    properties: {
      document_id: {
        type: 'string',
        description: 'The Google Doc ID (found in the document URL)'
      },
      content: {
        type: 'string',
        description: 'The new content to replace the entire document with'
      }
    },
    required: ['document_id', 'content']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { document_id, content } = ctx.toolUse.input as ReplaceDocInput;

  try {
    await replaceDocContent(ctx.google.docs, document_id, content);

    return {
      success: true,
      data: { replaced: true },
      userMessage: '✅ Document content replaced.'
    };
  } catch (error) {
    if (isInvalidGrantError(error)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to replace document content: ${message}`
    };
  }
}

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { createDoc } from '../../google/docs';

export interface CreateDocInput {
  title: string;
  content?: string;
}

export const tool: Tool = {
  name: 'create_doc',
  description: 'Creates a new Google Doc',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title of the document'
      },
      content: {
        type: 'string',
        description: 'Optional initial content for the document'
      }
    },
    required: ['title']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { title, content } = ctx.toolUse.input as CreateDocInput;

  try {
    const doc = await createDoc(ctx.google.docs, title, content);
    const confirmation = `📝 Document created!\n\n*${doc.title}*\n\n${doc.url}`;

    return {
      success: true,
      data: doc,
      userMessage: confirmation
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create document: ${message}`
    };
  }
}

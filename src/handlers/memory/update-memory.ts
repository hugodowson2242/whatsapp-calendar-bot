import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { setUserMemory } from './store';

const MAX_MEMORY_LENGTH = 2000;

interface UpdateMemoryInput {
  memory: string;
}

export const tool: Tool = {
  name: 'update_memory',
  description:
    "Replaces the user's persistent memory with the provided text. The current memory is shown in the system prompt under USER MEMORY. Call this when the user asks you to remember something, or when you learn persistent facts worth saving (name, timezone, preferences). Always include ALL existing facts you want to keep — this is a full replacement, not an append.",
  input_schema: {
    type: 'object' as const,
    properties: {
      memory: {
        type: 'string',
        description:
          'The complete updated memory text. Max 2000 characters. Use concise bullet points.',
      },
    },
    required: ['memory'],
  },
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { memory } = ctx.toolUse.input as UpdateMemoryInput;

  if (memory.length > MAX_MEMORY_LENGTH) {
    return {
      success: false,
      error: `Memory exceeds ${MAX_MEMORY_LENGTH} character limit (got ${memory.length}). Condense and try again.`,
    };
  }

  setUserMemory(ctx.chatId, memory);

  return {
    success: true,
    data: { length: memory.length, max: MAX_MEMORY_LENGTH },
  };
}

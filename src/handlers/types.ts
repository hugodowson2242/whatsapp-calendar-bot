import type { Tool } from '@anthropic-ai/sdk/resources/messages';

export interface ToolUse {
  id: string;
  name: string;
  input: unknown;
}

export interface ExecutorContext {
  toolUse: ToolUse;
  chatId: string;
}

export interface ExecutorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  userMessage?: string;
}

export type Executor = (ctx: ExecutorContext) => Promise<ExecutorResult>;

export interface ToolDefinition {
  tool: Tool;
  executor: Executor;
}

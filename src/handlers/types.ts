import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { GoogleClients } from '../google/auth';

export interface ToolUse {
  id: string;
  name: string;
  input: unknown;
}

export interface ExecutorContext {
  toolUse: ToolUse;
  chatId: string;
  google: GoogleClients;
  invocationId: string;
}

export interface ExecutorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  userMessage?: string;
  done?: boolean;
}

export type Executor = (ctx: ExecutorContext) => Promise<ExecutorResult>;

export interface ToolDefinition {
  tool: Tool;
  executor: Executor;
}

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';

export interface FetchUrlInput {
  url: string;
}

const MAX_CONTENT_LENGTH = 50000;

export const tool: Tool = {
  name: 'fetch_url',
  description: 'Fetches content from a URL. Use this to read web pages, APIs, or any HTTP resource.',
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must be http or https)'
      }
    },
    required: ['url']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { url } = ctx.toolUse.input as FetchUrlInput;

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        success: false,
        error: 'Only HTTP and HTTPS URLs are supported'
      };
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WhatsApp-Bot/1.0',
        'Accept': 'text/html,application/json,text/plain,*/*'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();

    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated...]';
    }

    if (contentType.includes('text/html')) {
      content = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return {
      success: true,
      data: { url, contentType, content }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch URL: ${message}`
    };
  }
}

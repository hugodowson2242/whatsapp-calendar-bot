import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { sendWhatsAppListMessage } from '../../whatsapp/cloud-api';

interface SendListMessageInput {
  body: string;
  button_text: string;
  sections: {
    title?: string;
    rows: {
      title: string;
      description?: string;
    }[];
  }[];
  header?: string;
  footer?: string;
}

export const tool: Tool = {
  name: 'send_list_message',
  description:
    'Sends a WhatsApp interactive list message. Use instead of plain text when presenting multiple items the user might select from (e.g. calendar events, documents, options). Shows a button that opens a scrollable list.',
  input_schema: {
    type: 'object' as const,
    properties: {
      body: {
        type: 'string',
        description: 'Main message text above the list button. Max 1024 chars.',
      },
      button_text: {
        type: 'string',
        description: 'Button label that opens the list. Max 20 chars. E.g. "View Events"',
      },
      sections: {
        type: 'array',
        description: 'List sections. Each contains rows.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Section header. Required if multiple sections. Max 24 chars.',
            },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Row title. Max 24 chars.',
                  },
                  description: {
                    type: 'string',
                    description: 'Row description. Max 72 chars.',
                  },
                },
                required: ['title'],
              },
            },
          },
          required: ['rows'],
        },
      },
      header: {
        type: 'string',
        description: 'Optional header text. Max 60 chars.',
      },
      footer: {
        type: 'string',
        description: 'Optional footer text. Max 60 chars.',
      },
    },
    required: ['body', 'button_text', 'sections'],
  },
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const input = ctx.toolUse.input as SendListMessageInput;

  try {
    const sections = input.sections.map((section, sIdx) => ({
      title: section.title,
      rows: section.rows.map((row, rIdx) => ({
        id: `row_${sIdx}_${rIdx}`,
        title: row.title.slice(0, 24),
        description: row.description?.slice(0, 72),
      })),
    }));

    await sendWhatsAppListMessage({
      to: ctx.chatId,
      body: input.body.slice(0, 1024),
      buttonText: input.button_text.slice(0, 20),
      sections,
      header: input.header?.slice(0, 60),
      footer: input.footer?.slice(0, 60),
    });

    return { success: true, data: { messageSent: true }, done: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to send list message: ${message}` };
  }
}

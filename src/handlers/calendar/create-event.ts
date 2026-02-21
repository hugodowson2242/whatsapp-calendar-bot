import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { createEvent } from '../../google/calendar';
import { getCalendarId } from '../../google/user-store';

export interface CreateEventInput {
  title: string;
  start_time: string;
  duration_minutes?: number;
  description?: string;
}

export const tool: Tool = {
  name: 'create_calendar_event',
  description: 'Creates a new event on Google Calendar',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title/name of the event'
      },
      start_time: {
        type: 'string',
        description: 'ISO 8601 datetime for when the event starts (e.g., 2024-01-15T14:00:00)'
      },
      duration_minutes: {
        type: 'number',
        description: 'Duration of the event in minutes (default: 60)'
      },
      description: {
        type: 'string',
        description: 'Optional description for the event'
      }
    },
    required: ['title', 'start_time']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { title, start_time, duration_minutes = 60, description = '' } = ctx.toolUse.input as CreateEventInput;

  try {
    const calendarId = getCalendarId(ctx.chatId);
    const eventLink = await createEvent(ctx.google.calendar, title, start_time, duration_minutes, description, calendarId);

    const startDate = new Date(start_time);
    const confirmation = `✅ Event created!\n\n*${title}*\n${startDate.toLocaleString()}\n${duration_minutes} minutes\n\n${eventLink}`;

    return {
      success: true,
      data: { eventLink, title, start_time, duration_minutes },
      userMessage: confirmation
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create event: ${message}`
    };
  }
}

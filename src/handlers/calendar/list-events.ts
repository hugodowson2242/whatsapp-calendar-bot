import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { ExecutorContext, ExecutorResult } from '../types';
import { listEvents } from '../../google/calendar';
import { getCalendarId } from '../../google/calendar-map';

export interface ListEventsInput {
  start_date: string;
  end_date: string;
}

export const tool: Tool = {
  name: 'list_events',
  description: 'Lists calendar events within a time range',
  input_schema: {
    type: 'object',
    properties: {
      start_date: {
        type: 'string',
        description: 'ISO 8601 start datetime (e.g., 2024-01-15T00:00:00)'
      },
      end_date: {
        type: 'string',
        description: 'ISO 8601 end datetime (e.g., 2024-01-16T00:00:00)'
      }
    },
    required: ['start_date', 'end_date']
  }
};

export async function executor(ctx: ExecutorContext): Promise<ExecutorResult> {
  const { start_date, end_date } = ctx.toolUse.input as ListEventsInput;

  try {
    const calendarId = getCalendarId(ctx.chatId);
    const events = await listEvents(ctx.google.calendar, start_date, end_date, calendarId);

    return {
      success: true,
      data: events
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to list events: ${message}`
    };
  }
}

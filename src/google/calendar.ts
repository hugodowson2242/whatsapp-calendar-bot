import type { calendar_v3 } from 'googleapis';
import { ApiError } from '../errors';

export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
}

export async function listEvents(
  calendar: calendar_v3.Calendar,
  timeMin: string,
  timeMax: string,
  calendarId = 'primary'
): Promise<CalendarEvent[]> {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return (response.data.items || []).map(event => ({
      title: event.summary || '(No title)',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || undefined
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(`Failed to list events: ${message}`, 'LIST_FAILED', 'calendar');
  }
}

export async function createEvent(
  calendar: calendar_v3.Calendar,
  title: string,
  startTime: string,
  durationMinutes = 60,
  description = '',
  calendarId = 'primary'
): Promise<string> {
  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    throw new ApiError(`Invalid start time: ${startTime}`, 'INVALID_INPUT', 'calendar');
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const event = {
    summary: title,
    description,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  console.log('[Calendar] Creating event:', { title, startTime, calendarId });

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event
    });

    return response.data.htmlLink || '';
  } catch (error) {
    console.error('[Calendar] createEvent failed:', {
      error,
      status: (error as any).status,
      code: (error as any).code,
      errors: (error as any).errors,
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(`Failed to create event: ${message}`, 'CREATE_FAILED', 'calendar');
  }
}

import { readFileSync } from 'fs';

interface CalendarMap {
  [phoneNumber: string]: string;
}

let calendarMap: CalendarMap = {};

export function loadCalendarMap() {
  try {
    const data = readFileSync('./calendar-map.json', 'utf-8');
    calendarMap = JSON.parse(data);
  } catch {
    // File doesn't exist, use defaults
  }
}

export function getCalendarId(remote: string): string {
  const key = remote.replace('@c.us', '');
  return calendarMap[key] || calendarMap.default || 'primary';
}

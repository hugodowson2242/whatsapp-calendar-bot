import { readFileSync, existsSync } from 'fs';
import db, { generateId } from '../src/db';

const TOKENS_FILE = './tokens.json';
const CALENDAR_MAP_FILE = './calendar-map.json';

type TokenMap = Record<string, string>;
type CalendarMap = Record<string, string>;

let tokens: TokenMap = {};
let calendarMap: CalendarMap = {};

if (existsSync(TOKENS_FILE)) {
  tokens = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
  console.log(`Found ${Object.keys(tokens).length} token(s) in tokens.json`);
} else {
  console.log('No tokens.json found, skipping.');
}

if (existsSync(CALENDAR_MAP_FILE)) {
  calendarMap = JSON.parse(readFileSync(CALENDAR_MAP_FILE, 'utf-8'));
  console.log(`Found ${Object.keys(calendarMap).length} entry/entries in calendar-map.json`);
} else {
  console.log('No calendar-map.json found, skipping.');
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO users (id, phone_number, refresh_token, calendar_id)
  VALUES (?, ?, ?, ?)
`);

const migrate = db.transaction(() => {
  for (const [phone, refreshToken] of Object.entries(tokens)) {
    const calendarId = calendarMap[phone] || 'primary';
    insert.run(generateId(), phone, refreshToken, calendarId);
    console.log(`  Migrated user: ${phone}`);
  }
});

migrate();

console.log('Migration complete.');

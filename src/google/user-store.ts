import db, { generateId } from '../db';

function stripPhone(phoneNumber: string): string {
  return phoneNumber.replace('@c.us', '');
}

export function getRefreshToken(phoneNumber: string): string | null {
  const row = db.prepare('SELECT refresh_token FROM users WHERE phone_number = ?').get(stripPhone(phoneNumber)) as { refresh_token: string } | undefined;
  return row?.refresh_token ?? null;
}

export function saveRefreshToken(phoneNumber: string, refreshToken: string): void {
  const phone = stripPhone(phoneNumber);
  const existing = db.prepare('SELECT id FROM users WHERE phone_number = ?').get(phone) as { id: string } | undefined;

  if (existing) {
    db.prepare("UPDATE users SET refresh_token = ?, updated_at = datetime('now') WHERE phone_number = ?").run(refreshToken, phone);
  } else {
    db.prepare('INSERT INTO users (id, phone_number, refresh_token) VALUES (?, ?, ?)').run(generateId(), phone, refreshToken);
  }
}

export function getCalendarId(phoneNumber: string): string {
  const phone = stripPhone(phoneNumber);
  const row = db.prepare('SELECT calendar_id FROM users WHERE phone_number = ?').get(phone) as { calendar_id: string } | undefined;
  return row?.calendar_id ?? 'primary';
}

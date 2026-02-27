import db, { generateId } from '../db';

function stripPhone(phoneNumber: string): string {
  return phoneNumber.replace('@c.us', '');
}

export function getRefreshToken(phoneNumber: string): string | null {
  const row = db.prepare('SELECT refresh_token FROM auth_tokens WHERE phone_number = ?').get(stripPhone(phoneNumber)) as { refresh_token: string } | undefined;
  return row?.refresh_token ?? null;
}

export function saveRefreshToken(phoneNumber: string, refreshToken: string): void {
  const phone = stripPhone(phoneNumber);

  // Ensure user row exists (permanent record)
  const existing = db.prepare('SELECT id FROM users WHERE phone_number = ?').get(phone) as { id: string } | undefined;
  if (!existing) {
    db.prepare('INSERT INTO users (id, phone_number) VALUES (?, ?)').run(generateId(), phone);
  }

  // Upsert token into auth_tokens (ephemeral)
  db.prepare(`
    INSERT INTO auth_tokens (phone_number, refresh_token) VALUES (?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET refresh_token = excluded.refresh_token, updated_at = datetime('now')
  `).run(phone, refreshToken);
}

export function getCalendarId(phoneNumber: string): string {
  const phone = stripPhone(phoneNumber);
  const row = db.prepare('SELECT calendar_id FROM users WHERE phone_number = ?').get(phone) as { calendar_id: string } | undefined;
  return row?.calendar_id ?? 'primary';
}

export function clearRefreshToken(phoneNumber: string): void {
  const phone = stripPhone(phoneNumber);
  db.prepare('DELETE FROM auth_tokens WHERE phone_number = ?').run(phone);
}

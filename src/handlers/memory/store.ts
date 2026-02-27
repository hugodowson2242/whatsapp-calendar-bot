import db from '../../db';

function stripPhone(phoneNumber: string): string {
  return phoneNumber.replace('@c.us', '');
}

export function getUserMemory(phoneNumber: string): string {
  const phone = stripPhone(phoneNumber);
  const row = db.prepare('SELECT memory FROM users WHERE phone_number = ?').get(phone) as { memory: string } | undefined;
  return row?.memory ?? '';
}

export function setUserMemory(phoneNumber: string, memory: string): void {
  const phone = stripPhone(phoneNumber);
  db.prepare("UPDATE users SET memory = ?, updated_at = datetime('now') WHERE phone_number = ?").run(memory, phone);
}

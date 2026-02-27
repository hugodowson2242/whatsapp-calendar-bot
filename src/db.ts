import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

const DATA_DIR = process.env.DATA_DIR || '/data';

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = join(DATA_DIR, 'bot.db');

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Auth tokens table (ephemeral — can be deleted without losing user data)
db.exec(`
  CREATE TABLE IF NOT EXISTS auth_tokens (
    phone_number TEXT PRIMARY KEY NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

// Check if we need to migrate the old schema
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
const hasRefreshToken = tableInfo.some(col => col.name === 'refresh_token');

if (tableInfo.length === 0) {
  // Fresh DB — create users table with new schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      calendar_id TEXT DEFAULT 'primary',
      memory TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
} else if (hasRefreshToken) {
  // Old DB — migrate: split refresh_token into auth_tokens, add memory
  db.transaction(() => {
    db.exec(`
      INSERT OR IGNORE INTO auth_tokens (phone_number, refresh_token)
      SELECT phone_number, refresh_token FROM users
    `);
    db.exec(`
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        calendar_id TEXT DEFAULT 'primary',
        memory TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      INSERT INTO users_new (id, phone_number, calendar_id, created_at, updated_at)
      SELECT id, phone_number, calendar_id, created_at, updated_at FROM users
    `);
    db.exec(`DROP TABLE users`);
    db.exec(`ALTER TABLE users_new RENAME TO users`);
  })();
} else {
  // Already migrated — add memory column if missing
  try {
    db.exec(`ALTER TABLE users ADD COLUMN memory TEXT DEFAULT ''`);
  } catch {
    // Column already exists
  }
}

export function generateId(): string {
  return randomUUID();
}

export default db;

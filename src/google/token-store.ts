import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKEN_FILE = join(process.cwd(), 'tokens.json');

type TokenMap = Record<string, string>;

let tokens: TokenMap = {};

if (existsSync(TOKEN_FILE)) {
  tokens = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
}

function stripPhone(phoneNumber: string): string {
  return phoneNumber.replace('@c.us', '');
}

export function getRefreshToken(phoneNumber: string): string | null {
  return tokens[stripPhone(phoneNumber)] || null;
}

export function saveRefreshToken(phoneNumber: string, refreshToken: string): void {
  tokens[stripPhone(phoneNumber)] = refreshToken;
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

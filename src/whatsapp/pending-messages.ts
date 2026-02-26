const pendingMessages = new Map<string, string>();

export function setPendingMessage(phone: string, message: string): void {
  pendingMessages.set(phone, message);
}

export function getPendingMessage(phone: string): string | null {
  return pendingMessages.get(phone) ?? null;
}

export function clearPendingMessage(phone: string): void {
  pendingMessages.delete(phone);
}

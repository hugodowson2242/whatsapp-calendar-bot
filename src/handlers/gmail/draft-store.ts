const DRAFT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  invocationId: string;
  createdAt: number;
}

const drafts = new Map<string, EmailDraft>();

export function saveDraft(chatId: string, draft: EmailDraft): void {
  drafts.set(chatId, draft);
}

export function getDraft(chatId: string): EmailDraft | null {
  const draft = drafts.get(chatId);
  if (!draft) return null;
  if (Date.now() - draft.createdAt > DRAFT_TTL_MS) {
    drafts.delete(chatId);
    return null;
  }
  return draft;
}

export function clearDraft(chatId: string): void {
  drafts.delete(chatId);
}

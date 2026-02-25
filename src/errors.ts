export type ErrorCode =
  | 'CREATE_FAILED'
  | 'READ_FAILED'
  | 'UPDATE_FAILED'
  | 'DELETE_FAILED'
  | 'LIST_FAILED'
  | 'SEARCH_FAILED'
  | 'AUTH_FAILED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'NETWORK_ERROR';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly service: 'calendar' | 'docs' | 'web'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isInvalidGrantError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = (error as Error).message || '';
  return message.includes('invalid_grant');
}

export function isInsufficientPermissionsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: number; status?: number; message?: string; errors?: Array<{ reason?: string }> };
  if (err.code === 403 || err.status === 403) return true;
  if (err.errors?.some(e => e.reason === 'insufficientPermissions')) return true;
  const message = (error as Error).message || '';
  return message.includes('insufficientPermissions');
}

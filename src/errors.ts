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

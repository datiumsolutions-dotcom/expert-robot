import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Paginate query params with safe defaults
 */
export function parsePagination(
  query: Record<string, unknown>,
  defaults = { page: 1, limit: 20, maxLimit: 100 },
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Number(query['page']) || defaults.page);
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, Number(query['limit']) || defaults.limit),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build a standardized success response
 */
export function successResponse<T>(
  data: T,
  meta?: { page: number; limit: number; total: number },
): { success: true; data: T; meta?: { page: number; limit: number; total: number; totalPages: number } } {
  if (meta) {
    return {
      success: true,
      data,
      meta: { ...meta, totalPages: Math.ceil(meta.total / meta.limit) },
    };
  }
  return { success: true, data };
}

/**
 * Mask sensitive fields for logging
 */
export function maskSensitive(
  obj: Record<string, unknown>,
  keys = ['password', 'password_hash', 'token', 'secret', 'key'],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      keys.some((key) => k.toLowerCase().includes(key)) ? [k, '***'] : [k, v],
    ),
  );
}

/**
 * Sleep for n milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

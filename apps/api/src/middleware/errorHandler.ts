import type { Request, Response, NextFunction } from 'express';
import { isAppError } from '@loyalty/utils';
import { logger } from '@loyalty/utils';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // Express requires 4-param signature for error handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      logger.error({ message: err.message, stack: err.stack, code: err.code });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.statusCode === 422 &&
          'details' in err && { details: (err as { details: unknown }).details }),
      },
    });
    return;
  }

  // Unexpected / unhandled error
  logger.error({ message: 'Unhandled error', error: err });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

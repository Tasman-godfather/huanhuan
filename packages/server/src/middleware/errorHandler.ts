import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
}

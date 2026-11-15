import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  const safeError = err as Error & { code?: unknown };
  console.error('[SYSTEM ERROR]', {
    name: safeError.name,
    ...(typeof safeError.code === 'string' ? { code: safeError.code } : {})
  });
  
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Doslo je do kriticne greske na serveru.',
    timestamp: new Date().toISOString()
  });
};

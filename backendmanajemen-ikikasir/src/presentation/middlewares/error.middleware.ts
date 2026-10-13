import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError.js';
import { config } from '../../infrastructure/config/env.js';

/**
 * Global Error Handling Middleware
 * Menangkap seluruh error dari layer Controller, Use Case, Repository, dan Service
 * Mengembalikan respon berformat JSON yang konsisten dan informatif bagi klien
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Error yang berasal dari AppError (Domain & Application operational errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  // 2. Error yang tidak terduga (Unhandled System / Runtime Errors)
  console.error('💥 [Unhandled Error]:', err);

  const statusCode = 500;
  const message =
    config.nodeEnv === 'production'
      ? 'Terjadi kesalahan pada internal server.'
      : err.message || 'Terjadi kesalahan pada internal server.';

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
}

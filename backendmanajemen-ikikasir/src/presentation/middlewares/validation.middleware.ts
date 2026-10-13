import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../../domain/errors/AppError.js';

/**
 * Middleware untuk memvalidasi request body menggunakan Zod Schema
 * Dilengkapi try-catch untuk menangani kegagalan validasi input
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedData = await schema.parseAsync(req.body);
      req.body = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Mendukung Zod v4 (issues) maupun Zod v3 (errors)
        const issues = (error as any).issues || (error as any).errors || [];
        const formattedErrors = issues.map((issue: any) => ({
          field: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
          message: issue.message || 'Input tidak valid',
        }));

        const firstMessage = formattedErrors[0]?.message || 'Input data tidak valid.';
        next(new BadRequestError(firstMessage, formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

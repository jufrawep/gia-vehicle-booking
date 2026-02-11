import { Request, Response, NextFunction } from 'express';

/**
 * CUSTOM APPLICATION ERROR CLASS
 * Extends the native Error object to handle operational errors.
 * Operational errors are expected events (like validation failed, 404, etc.)
 * whereas non-operational errors are unexpected bugs.
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * Centralized error management for the entire Express application.
 * It catches errors passed via next() and formats a consistent JSON response.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Default fallback values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // 2. Handle known Operational Errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // 3. Handle External Library Errors (ORM & Validation)
  // Catching Prisma specific errors (e.g., unique constraint violations)
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database integrity error. Please check your data.';
  }

  // Catching Zod schema validation failures
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Input validation failed.';
  }

  // 4. Logging for Monitoring
  // In a real production app, you might use Winston or Pino here.
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', err);
  }

  // 5. Final Response Payload
  // Note: Stack traces are strictly hidden in Production to prevent security leaks.
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * ASYNC HANDLER WRAPPER
 * Higher-order function that eliminates the need for repetitive try-catch blocks.
 * It catches rejected promises and forwards them to the global errorHandler.
 * @param fn - The asynchronous controller function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
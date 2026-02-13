/**
 * @file  error.middleware.ts
 * @desc  Global error handling and async wrapper for GIA Vehicle Booking API.
 *
 * Architecture:
 *   - AppError      — operational errors (known, expected failures)
 *   - errorHandler  — Express global error middleware (must be last in chain)
 *   - asyncHandler  — HOF eliminating try/catch boilerplate in controllers
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.util';

const CTX = 'ErrorMiddleware';

// ─── Custom Error Class ───────────────────────────────────────────────────────

/**
 * Operational error with an HTTP status code.
 *
 * Operational errors = expected failures (404, 400, 403).
 * Non-operational errors = programmer bugs — these bubble up as 500.
 */
export class AppError extends Error {
  statusCode:    number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * Centralized Express error middleware.
 * Catches all errors forwarded via next(err) and returns a consistent JSON response.
 * Must be registered LAST in the Express middleware chain.
 */
export const errorHandler = (
  err:  any,
  _req: Request,
  res:  Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message    = 'Internal Server Error';
  let errors: { field: string; message: string }[] | undefined;

  // ── 1. Operational errors (thrown by controllers) ──────────────────────────
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message    = err.message;
  }

  // ── 2. Prisma known request errors ────────────────────────────────────────
  else if (err.name === 'PrismaClientKnownRequestError' || err.code?.startsWith('P2')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      message = `A record with this ${field} already exists.`;
      errors  = [{ field, message: `This ${field} is already taken.` }];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message    = 'Record not found.';
    } else {
      message = 'Database integrity error. Please check your data.';
    }
  }

  // ── 3. Zod validation errors ───────────────────────────────────────────────
  else if (err instanceof ZodError) {
    statusCode = 400;
    message    = 'Input validation failed.';
    errors     = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
  }

  // ── 4. JWT errors ──────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token. Please log in again.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Your session has expired. Please log in again.';
  }

  // ── 5. Log the error ───────────────────────────────────────────────────────
  if (statusCode >= 500) {
    // Unexpected errors always logged at error level
    logger.error(CTX, message, { stack: err.stack });
  } else {
    // Operational errors logged at warn level (not a bug, just a bad request)
    logger.warn(CTX, message, { statusCode });
  }

  // ── 6. Response ────────────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Stack trace only in development — never leak in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ─── Async Handler ────────────────────────────────────────────────────────────

/**
 * Wraps an async controller function to forward any rejected promise
 * to the global errorHandler via next().
 *
 * Usage:
 *   export const myController = asyncHandler(async (req, res, next) => { ... });
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
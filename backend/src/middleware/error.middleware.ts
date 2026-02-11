import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

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
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // 1. Default fallback values
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR LOG:", err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: { field: string; message: string }[] | undefined = undefined;

  // 2. Handle known Operational Errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // 3. Handle External Library Errors (ORM & Validation)

  // Catching Prisma specific errors (e.g., unique constraint violations)
  if (
    err.name === "PrismaClientKnownRequestError" ||
    err.code?.startsWith("P2")
  ) {
    statusCode = 400;
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      message = `A record with this ${field} already exists.`;
      errors = [{ field, message: `This ${field} is already taken.` }];
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found.";
    } else {
      if (process.env.NODE_ENV === "development") {
        console.error(`Database Error: ${err.message.split("\n").pop()}`);
      }
      message = "Database integrity error. Please check your data.";
    }
  }

  // Catching Zod schema validation failures — returns field-level details
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Input validation failed.";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // Catching JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // 4. Logging for Monitoring
  // In a real production app, you might use Winston or Pino here.
  if (process.env.NODE_ENV === "development") {
    console.error("Error Log:", err);
  }

  // 5. Final Response Payload
  // Note: Stack traces are strictly hidden in Production to prevent security leaks.
  res.status(statusCode).json({
    success: false,
    message,
    // Field-level validation errors (only present when relevant)
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
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

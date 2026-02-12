import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import { AppError } from './error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

/**
 * AUTHENTICATION MIDDLEWARE
 * Verifies the integrity of the JSON Web Token and attaches the user identity to the request object.
 */
export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract Token from the Authorization Header
    // Following the RFC 6750 standard for Bearer Token usage.
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Access denied.', 401));
    }

    // 2. Token Verification
    // Validates the signature and checks for expiration (exp claim).
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // 3. Request Enrichment
    // Attaching the decoded payload to the 'req.user' object for subsequent middlewares.
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // Distinguishes between technical errors and security failures.
    return next(new AppError('Session expired or invalid token. Please log in again.', 401));
  }
};

/**
 * AUTHORIZATION MIDDLEWARE (RBAC)
 * Role-Based Access Control: Restricts route access to specific user roles.
 * @param roles - Spread of authorized strings (e.g., 'admin', 'manager').
 */
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    // Ensures 'protect' middleware has already successfully executed.
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have the required permissions.', 403)
      );
    }
    
    // Access granted: Proceed to the controller.
    next();
  };
};
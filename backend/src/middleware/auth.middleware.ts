/**
 * @file  auth.middleware.ts
 * @desc  Authentication & Authorization middleware for GIA Vehicle Booking API.
 *
 * Middlewares:
 *   protect          — verifies JWT and attaches req.user
 *   restrictTo       — RBAC: allows only specified roles (UPPERCASE)
 *   requirePermission — checks granular admin permission flags
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger.util';

const CTX        = 'AuthMiddleware';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

// ─── protect ──────────────────────────────────────────────────────────────────

/**
 * Verifies the Bearer token from the Authorization header.
 * On success, attaches decoded identity to req.user.
 *
 * req.user.role is always UPPERCASE ('USER' | 'ADMIN') as stored in the JWT.
 */
export const protect = async (
  req:  AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract Bearer token (RFC 6750)
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a valid token.', 401));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = {
      id:          decoded.id,
      email:       decoded.email,
      role:        decoded.role,           // UPPERCASE: 'USER' | 'ADMIN'
      permissions: decoded.permissions || [],
    };

    logger.debug(CTX, 'Token verified', { userId: decoded.id, role: decoded.role });
    next();
  } catch (error) {
    logger.warn(CTX, 'Token verification failed', { error: (error as Error).message });
    return next(new AppError('Session expired or invalid token. Please log in again.', 401));
  }
};

// ─── restrictTo ───────────────────────────────────────────────────────────────

/**
 * Role-Based Access Control guard.
 * Pass UPPERCASE role strings: restrictTo('ADMIN') or restrictTo('USER', 'ADMIN').
 *
 * IMPORTANT: roles must be UPPERCASE ('ADMIN', not 'admin') — matches JWT payload.
 */
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Compare UPPERCASE to UPPERCASE — no .toLowerCase() normalization here
    if (!roles.includes(req.user.role)) {
      logger.warn(CTX, 'Access denied — insufficient role', {
        userId:       req.user.id,
        userRole:     req.user.role,
        requiredRoles: roles,
      });
      return next(new AppError('Forbidden: You do not have the required role.', 403));
    }

    next();
  };
};

// ─── requirePermission ────────────────────────────────────────────────────────

/**
 * Granular permission guard for ADMIN users.
 *
 * Logic:
 *   - Empty permissions array → super-admin → always passes.
 *   - Non-empty → user must have the specific permission.
 *
 * @param permission — 'READ' | 'CREATE' | 'DELETE'
 */
export const requirePermission = (permission: 'READ' | 'CREATE' | 'DELETE') => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const perms = req.user?.permissions || [];

    // Empty array = super-admin: full access granted
    if (perms.length === 0) {
      return next();
    }

    if (!perms.includes(permission)) {
      logger.warn(CTX, 'Permission denied', {
        userId:             req.user?.id,
        requiredPermission: permission,
        userPermissions:    perms,
      });
      return next(new AppError(`Forbidden: Requires ${permission} permission.`, 403));
    }

    next();
  };
};
/**
 * @file  auth.controller.ts
 * @desc  Authentication controller — register, login, getMe.
 *
 * Corrections vs original:
 *   - password_hash → password  (field name aligned with Prisma schema @map)
 *   - login now checks user.status === 'BLOCKED' before verifying password
 *   - role stored and returned UPPERCASE ('USER' | 'ADMIN')
 *   - all DB field names aligned with snake_case schema
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { generateToken } from '../utils/jwt.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { sendWelcomeEmail } from '../services/email.service';
import { logger } from '../utils/logger.util';

const CTX = 'AuthController';

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(2, 'Last name must be at least 2 characters'),
  phone:     z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helper: format user for API response ────────────────────────────────────

function formatUser(user: any) {
  return {
    id:            user.id,
    email:         user.email,
    firstName:     user.first_name,
    lastName:      user.last_name,
    phone:         user.phone         ?? undefined,
    role:          user.role,            // UPPERCASE: 'USER' | 'ADMIN'
    status:        user.status,          // UPPERCASE: 'ACTIVE' | 'BLOCKED'
    permissions:   user.permissions   ?? [],
    isActive:      user.is_active,
    emailVerified: user.email_verified,
    createdAt:     user.created_at,
    updatedAt:     user.updated_at,
  };
}

// ─── register ────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validated = registerSchema.parse(req.body);
    logger.info(CTX, 'Registration attempt', { email: validated.email });

    // Conflict check
    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      logger.warn(CTX, 'Email already registered', { email: validated.email });
      return next(new AppError('A user with this email already exists', 400));
    }

    // Hash password (cost factor 12)
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        email:      validated.email,
        password:   hashedPassword,   // maps to password_hash column
        first_name: validated.firstName,
        last_name:  validated.lastName,
        phone:      validated.phone || null,
        role:       'USER',           // UPPERCASE enum
        status:     'ACTIVE',         // UPPERCASE enum
      },
    });

    const token = generateToken({
      id:          user.id,
      email:       user.email,
      role:        user.role,
      permissions: user.permissions as string[],
    });

    logger.info(CTX, 'User registered', { userId: user.id, email: user.email });

    // Fire-and-forget — email failure must not block the response
    sendWelcomeEmail(user.email, user.first_name).catch(err =>
      logger.error(CTX, 'Welcome email failed', { userId: user.id, error: err.message })
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data:    { user: formatUser(user), token },
    });
  }
);

// ─── login ────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Security: generic error message prevents email enumeration.
 * BLOCKED check returns 403 (suspended) not 401 (unauthorized).
 */
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validated = loginSchema.parse(req.body);
    logger.info(CTX, 'Login attempt', { email: validated.email });

    const user = await prisma.user.findUnique({ where: { email: validated.email } });

    if (!user) {
      logger.warn(CTX, 'Login failed — user not found', { email: validated.email });
      return next(new AppError('Invalid email or password', 401));
    }

    // Check suspension BEFORE password comparison
    if (user.status === 'BLOCKED') {
      logger.warn(CTX, 'Login denied — account blocked', { userId: user.id });
      return next(new AppError('Your account has been suspended. Please contact support.', 403));
    }

    // `user.password` maps to the password_hash column in the DB
    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) {
      logger.warn(CTX, 'Login failed — wrong password', { email: validated.email });
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken({
      id:          user.id,
      email:       user.email,
      role:        user.role,
      permissions: user.permissions as string[],
    });

    logger.info(CTX, 'Login successful', { userId: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data:    { user: formatUser(user), token },
    });
  }
);

// ─── getMe ────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    logger.debug(CTX, 'Profile requested', { userId });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found. Please log in again.', 404));
    }

    res.status(200).json({
      success: true,
      data:    { user: formatUser(user) },
    });
  }
);
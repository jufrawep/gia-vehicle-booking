/**
 * @file  password-reset.controller.ts
 * @desc  Password recovery flow — forgot password + reset with token.
 *
 * Corrections vs original:
 *   - Uses sendPasswordResetEmail() from email.service (dedicated template)
 *   - password field: column name is `password` in DB (stores bcrypt hash)
 *   - Anti-enumeration: same HTTP 200 response whether email exists or not
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { sendPasswordResetEmail } from '../services/email.service';
import prisma from '../utils/prisma.util';
import { logger } from '../utils/logger.util';

const CTX = 'PasswordResetController';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token:       z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── forgotPassword ───────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * Always returns HTTP 200 — prevents attackers from discovering registered emails.
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    logger.info(CTX, 'Password reset requested', { email });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Anti-enumeration: silently ignore unknown emails
      logger.debug(CTX, 'Reset ignored — unknown email', { email });
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.',
      });
    }

    // 256-bit cryptographically secure token
    // NOTE: base64url (no '+', '/', '=', '\x00') — PostgreSQL UTF-8 safe
    const resetToken = crypto.randomBytes(32).toString('base64url');
    const expiresAt  = new Date(Date.now() + 3_600_000); // 1 hour TTL

    // $executeRaw avec paramètres préparés : contourne le bug de sérialisation
    // de prisma.user.update() sur AdminPermission[] (tableau d'enum PostgreSQL)
    // qui injecte des bytes nuls (\x00) dans le UPDATE complet généré par Prisma.
    await prisma.$executeRaw`
      UPDATE users
      SET
        reset_password_token  = ${resetToken}::text,
        reset_password_expiry = ${expiresAt}::timestamptz
      WHERE id    = ${user.id}::uuid
    `;

    // Use the dedicated email template
    await sendPasswordResetEmail(user.email, resetToken, user.first_name, user.id);

    logger.info(CTX, 'Reset email dispatched', { userId: user.id, expiresAt });

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link will be sent.',
    });
  }
);

// ─── resetPassword ────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/reset-password
 * @access  Public
 *
 * Validates token existence AND expiry in one DB query.
 * Atomically sets new password and clears both reset fields.
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    logger.info(CTX, 'Reset password attempt');

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token:  token,
        reset_password_expiry: { gte: new Date() },
      },
    });

    if (!user) {
      logger.warn(CTX, 'Invalid or expired reset token');
      return next(new AppError('The reset token is invalid or has expired.', 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atomic: update password + clear token fields in one operation
    // $executeRaw : même raison que forgotPassword — contourne le bug AdminPermission[]
    await prisma.$executeRaw`
      UPDATE users
      SET
        password              = ${hashedPassword}::text,
        reset_password_token  = NULL,
        reset_password_expiry = NULL
      WHERE id = ${user.id}::uuid
    `;

    logger.info(CTX, 'Password reset successful', { userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in.',
    });
  }
);
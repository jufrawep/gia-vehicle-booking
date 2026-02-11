import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';
import prisma from '../utils/prisma.util';

/**
 * PASSWORD RECOVERY SCHEMAS
 * Enforcing strict validation for sensitive security operations.
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
});

/**
 * @desc    Initiate password recovery process
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    // 1. Validate payload
    const { email } = forgotPasswordSchema.parse(req.body);

    // 2. Lookup user
    const user = await prisma.user.findUnique({ where: { email } });
    
    /**
     * SECURITY BEST PRACTICE: Anti-Enumeration
     * We return a success message even if the user doesn't exist to prevent 
     * malicious actors from discovering registered emails.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.'
      });
    }

    // 3. Token Generation (Using Node's crypto for secure randomness)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // 4. Persistence: Store hashed version or raw token with expiration
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetToken,
        reset_password_expiry: resetTokenExpiry
      }
    });

    // 5. Email Dispatch
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // Using a professional HTML template for better UX
    await sendEmail({
      to: email,
      subject: 'Password Reset Request - GIA Vehicle Booking',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .button { background: #00B4D8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <h2>Password Reset Request</h2>
          <p>Hello ${user.first_name},</p>
          <p>You requested a password reset for your GIA Group account.</p>
          <p>Click the button below to proceed (link valid for 60 minutes):</p>
          <a href="${resetUrl}" class="button">Reset My Password</a>
          <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
          <hr/>
          <p><small>GIA Vehicle Booking Team</small></p>
        </body>
        </html>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Reset link dispatched to your inbox.'
    });
  }
);

/**
 * @desc    Reset password using valid token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Data validation
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // 2. Identify user by token and ensure it hasn't expired (gte: now)
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expiry: { gte: new Date() }
      }
    });

    if (!user) {
      return next(new AppError('The reset token is invalid or has expired.', 400));
    }

    // 3. Security: Hash the new credentials
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 4. Atomic Update: Set new password and clear recovery fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expiry: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully updated. You can now log in.'
    });
  }
);
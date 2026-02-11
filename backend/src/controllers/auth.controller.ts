import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { generateToken } from '../utils/jwt.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { sendWelcomeEmail } from '../services/email.service';

/**
 * AUTHENTICATION SCHEMAS
 * Using Zod for strict request body validation to ensure type safety.
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Data validation via Zod
    const validatedData = registerSchema.parse(req.body);

    // 2. Conflict Check: Ensure user doesn't already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return next(new AppError('A user with this email already exists', 400));
    }

    // 3. Security: Hash password before database persistence (Cost factor: 12)
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // 4. Persistence: Create record with explicit mapping from camelCase (JS) to snake_case (DB)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password_hash: hashedPassword,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || null,
        role: 'user'
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        created_at: true
      }
    });

    // 5. JWT Generation: Include core identity in payload
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 6. Async Background Tasks: Send welcome email without blocking the response
    sendWelcomeEmail(user.email, user.first_name).catch(err =>
      console.error('Email Service Failure:', err)
    );

    // 7. Response: Explicitly format response to maintain frontend-friendly camelCase
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at
        },
        token
      }
    });
  }
);

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = loginSchema.parse(req.body);

    // 1. Lookup user by unique identifier (email)
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    // 2. Generic error message for security (don't leak if email or password is the culprit)
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // 3. Verify identity via cryptographic comparison
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Safe Response: Strip sensitive data (password_hash) and format fields
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        token
      }
    });
  }
);

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires Protect Middleware)
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Identity provided by authentication middleware (protect)
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return next(new AppError('User session not found in database', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone || undefined,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  }
);
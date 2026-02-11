import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { forgotPassword, resetPassword } from '../controllers/password-reset.controller';

const router = Router();

/* ==========================================================================
   PUBLIC AUTH ROUTES
   Endpoints for user onboarding and session management.
   ========================================================================== */

/**
 * @route   POST /api/auth/register
 * @desc    Create a new user account and return a JWT
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return a JWT
 * @access  Public
 */
router.post('/login', login);

/* ==========================================================================
   PASSWORD RECOVERY ROUTES
   ========================================================================== */

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Verify email and send a password reset token via email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Update user password using a valid reset token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/* ==========================================================================
   PROTECTED ACCOUNT ROUTES
   ========================================================================== */

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile based on JWT
 * @access  Private
 */
router.get('/me', protect, getMe);

export default router;
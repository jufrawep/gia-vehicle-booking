/**
 * @file  auth.routes.ts
 * @desc  Authentication routes — public except /me.
 *
 * IMPORTANT route ordering:
 *   All routes are static and distinct — no dynamic parameters.
 *   No ordering conflict exists. Each path is unique.
 *
 * Corrections vs typical implementations:
 *   - Protect middleware explicitly applied only to /me
 *   - Password reset endpoints kept separate from login/register
 */
import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { forgotPassword, resetPassword } from '../controllers/password-reset.controller';

const router = Router();


// ── Public authentication (no token required) ───────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ── Password recovery (public but secured via token in email) ───────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ── Protected routes (valid JWT required) ──────────────────────────────────
router.get('/me', protect, getMe);

export default router;
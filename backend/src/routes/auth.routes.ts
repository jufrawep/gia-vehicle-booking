import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { forgotPassword, resetPassword } from '../controllers/password-reset.controller';

const router = Router();

// Publics Routes 
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Routes 
router.get('/me', protect, getMe);

export default router;

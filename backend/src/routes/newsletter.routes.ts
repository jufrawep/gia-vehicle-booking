import { Router } from 'express';
import { subscribeNewsletter } from '../controllers/newsletter.controller';

const router = Router();

/* ==========================================================================
   PUBLIC MARKETING ROUTES
   ========================================================================== */

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Register a new email for the marketing newsletter
 * @access  Public
 * @payload { email: string }
 */
router.post('/subscribe', subscribeNewsletter);

export default router;
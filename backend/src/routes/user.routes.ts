import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/* ==========================================================================
   USER ACCOUNT ROUTES
   ========================================================================== */

/**
 * @route   GET /api/users/profile
 * @desc    Get the profile data of the currently authenticated user
 * @access  Private
 * @returns {Object} User object (excluding sensitive fields like password)
 */
router.get('/profile', protect, (req: any, res) => {
  res.json({
    success: true,
    data: { 
      user: req.user 
    }
  });
});

export default router;
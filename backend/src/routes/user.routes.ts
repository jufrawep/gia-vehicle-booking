import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', protect, (req: any, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

export default router;

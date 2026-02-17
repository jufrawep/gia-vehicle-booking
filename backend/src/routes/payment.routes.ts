/**
 * @file  routes/payment.routes.ts
 * @desc  Payment routes — JWT required for all endpoints.
 *
 * POST /api/payments/process           → initiate simulated payment
 * GET  /api/payments/:bookingId        → retrieve ticket for a booking
 */

import { Router }             from 'express';
import { processPayment, getPaymentByBooking,getAllPayments,getMyPayments } from '../controllers/payment.controller';
import { protect }            from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Specific routes before dynamic params
router.post('/process',         processPayment);
router.get('/', getAllPayments);
router.get('/my',  getMyPayments);
router.get('/:bookingId',getPaymentByBooking);

export default router;
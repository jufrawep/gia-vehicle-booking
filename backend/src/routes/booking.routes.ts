/**
 * @file  booking.routes.ts
 * @desc  Booking routes — authentication required for all.
 *
 * IMPORTANT route ordering:
 *   Specific paths (/my-bookings, /admin-create, /stats/dashboard)
 *   MUST be declared BEFORE the dynamic /:id pattern.
 *   Otherwise Express matches /:id first and the specific routes never fire.
 *
 * Corrections vs original:
 *   - restrictTo('ADMIN') — UPPERCASE to match JWT role payload
 */

import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
  adminCreateBooking,
} from '../controllers/booking.controller';
import { protect, restrictTo, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All booking routes require a valid JWT
router.use(protect);

// ── Specific named routes (must come before /:id) ────────────────────────────
router.get('/my-bookings',    getMyBookings);
router.post('/admin-create',  restrictTo('ADMIN'), requirePermission('CREATE'), adminCreateBooking);
router.get('/stats/dashboard', restrictTo('ADMIN'), requirePermission('READ'),  getBookingStats);
router.get('/',               restrictTo('ADMIN'), requirePermission('READ'),   getAllBookings);

// ── User booking actions ──────────────────────────────────────────────────────
router.post('/', createBooking);

// ── Dynamic :id routes (must come last) ──────────────────────────────────────
router.get('/:id',         getBookingById);
router.patch('/:id/status', updateBookingStatus);
router.delete('/:id',      restrictTo('ADMIN'), requirePermission('DELETE'), deleteBooking);

export default router;
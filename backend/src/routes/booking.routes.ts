import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getBookingStats
} from '../controllers/booking.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

/**
 * GLOBAL MIDDLEWARE
 * All routes defined in this router require a valid JWT token.
 */
router.use(protect);

/* ==========================================================================
   USER & SHARED ROUTES
   ========================================================================== */

/**
 * @route   POST /api/bookings
 * @desc    Create a new vehicle reservation
 */
router.post('/', createBooking);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Retrieve the booking history for the authenticated user
 */
router.get('/my-bookings', getMyBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get detailed information for a specific booking
 * @note    Access restricted to the owner of the booking or an admin
 */
router.get('/:id', getBookingById);

/**
 * @route   PATCH /api/bookings/:id/status
 * @desc    Update a booking status (Cancel for users, Full control for admins)
 */
router.patch('/:id/status', updateBookingStatus);

/* ==========================================================================
   adminISTRATIVE ROUTES
   ========================================================================== */

/**
 * @route   GET /api/bookings
 * @desc    Retrieve all bookings across the platform with filtering
 * @access  Private (admin Only)
 */
router.get('/', restrictTo('admin'), getAllBookings);

/**
 * @route   GET /api/bookings/stats/dashboard
 * @desc    Get analytical data and KPIs for the admin dashboard
 * @access  Private (admin Only)
 */
router.get('/stats/dashboard', restrictTo('admin'), getBookingStats);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Permanently remove a booking record
 * @access  Private (admin Only)
 */
router.delete('/:id', restrictTo('admin'), deleteBooking);

export default router;
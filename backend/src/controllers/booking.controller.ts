/**
 * @file  booking.controller.ts
 * @desc  Booking lifecycle controller — create, read, update, delete + stats.
 *
 * Corrections vs original:
 *   - total_amount → total_price  (aligned with Prisma schema)
 *   - vehicle.status check: 'AVAILABLE' not 'available'
 *   - All BookingStatus enums UPPERCASE (PENDING, CONFIRMED, CANCELLED, COMPLETED)
 *   - adminCreateBooking: vehicle_id typo fixed, correct field mapping
 *   - RBAC role comparison: 'ADMIN' not 'admin'
 *   - Logs added on all operations
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import { sendBookingConfirmation } from '../services/email.service';
import { logger } from '../utils/logger.util';

const CTX = 'BookingController';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES   = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
// These statuses block a vehicle's date range from new bookings
const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED'] as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const createBookingSchema = z.object({
  vehicleId:       z.string().uuid('vehicleId must be a valid UUID'),
  startDate:       z.string().datetime('startDate must be ISO 8601'),
  endDate:         z.string().datetime('endDate must be ISO 8601'),
  pickupLocation:  z.string().max(255).optional(),
  dropoffLocation: z.string().max(255).optional(),
  notes:           z.string().max(1000).optional(),
});

// ─── Helper: format booking for API response ─────────────────────────────────

function formatBooking(b: any) {
  return {
    id:              b.id,
    userId:          b.user_id,
    vehicleId:       b.vehicle_id,
    startDate:       b.start_date,
    endDate:         b.end_date,
    pickupLocation:  b.pickup_location  ?? undefined,
    dropoffLocation: b.dropoff_location ?? undefined,
    totalDays:       b.total_days,
    totalPrice:      Number(b.total_price),
    status:          b.status,          // UPPERCASE enum
    paymentStatus:   b.payment_status,  // UPPERCASE enum
    notes:           b.notes           ?? undefined,
    createdAt:       b.created_at,
    updatedAt:       b.updated_at,
    ...(b.vehicle && {
      vehicle: {
        id:       b.vehicle.id,
        brand:    b.vehicle.brand,
        model:    b.vehicle.model,
        category: b.vehicle.category,  // UPPERCASE enum
        imageUrl: b.vehicle.image_url ?? undefined,
        status:   b.vehicle.status,    // UPPERCASE enum
      },
    }),
    ...(b.user && {
      user: {
        id:        b.user.id,
        email:     b.user.email,
        firstName: b.user.first_name,
        lastName:  b.user.last_name,
        phone:     b.user.phone ?? undefined,
      },
    }),
  };
}

// ─── createBooking ────────────────────────────────────────────────────────────

/**
 * @route   POST /api/bookings
 * @access  Private — authenticated users
 */
export const createBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId    = req.user!.id;
    const validated = createBookingSchema.parse(req.body);
    const startDate = new Date(validated.startDate);
    const endDate   = new Date(validated.endDate);

    logger.info(CTX, 'Creating booking', { userId, vehicleId: validated.vehicleId });

    if (endDate <= startDate) {
      return next(new AppError('End date must be strictly after start date', 400));
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: validated.vehicleId } });
    if (!vehicle) return next(new AppError('Vehicle not found', 404));

    // Check against the VehicleStatus enum — UPPERCASE
    if (vehicle.status !== 'AVAILABLE') {
      return next(new AppError(`Vehicle is currently ${vehicle.status} and cannot be booked`, 400));
    }

    // Three-case overlap detection algorithm
    const conflicts = await prisma.booking.findMany({
      where: {
        vehicle_id: validated.vehicleId,
        status:     { in: [...BLOCKING_STATUSES] },
        OR: [
          { AND: [{ start_date: { lte: startDate } }, { end_date: { gte: startDate } }] },
          { AND: [{ start_date: { lte: endDate   } }, { end_date: { gte: endDate   } }] },
          { AND: [{ start_date: { gte: startDate } }, { end_date: { lte: endDate   } }] },
        ],
      },
    });

    if (conflicts.length > 0) {
      return next(new AppError('Vehicle is already booked for the selected dates', 409));
    }

    const totalDays  = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);
    const totalPrice = totalDays * Number(vehicle.price_per_day);

    const booking = await prisma.booking.create({
      data: {
        user_id:          userId,
        vehicle_id:       validated.vehicleId,
        start_date:       startDate,
        end_date:         endDate,
        pickup_location:  validated.pickupLocation,
        dropoff_location: validated.dropoffLocation,
        total_days:       totalDays,
        total_price:      totalPrice,   // field is total_price in schema
        status:           'PENDING',    // UPPERCASE enum
        payment_status:   'PENDING',    // UPPERCASE enum
        notes:            validated.notes,
      },
      include: {
        vehicle: true,
        user:    { select: { id: true, email: true, first_name: true, last_name: true } },
      },
    });

    logger.info(CTX, 'Booking created', { bookingId: booking.id, userId, totalDays, totalPrice });

    // Fire-and-forget confirmation email
    const bookingUser = (booking as any).user;
    sendBookingConfirmation(bookingUser.email, {
      bookingId:   booking.id,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      startDate:   startDate.toLocaleDateString('fr-FR'),
      endDate:     endDate.toLocaleDateString('fr-FR'),
      totalPrice,
      userId,
    }).catch(err => logger.error(CTX, 'Confirmation email failed', { bookingId: booking.id, error: err.message }));

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data:    { booking: formatBooking(booking) },
    });
  }
);

// ─── getMyBookings ────────────────────────────────────────────────────────────

/**
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
export const getMyBookings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    logger.debug(CTX, 'Fetching user bookings', { userId });

    const bookings = await prisma.booking.findMany({
      where:   { user_id: userId },
      include: { vehicle: true },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      data:    { bookings: bookings.map(formatBooking), count: bookings.length },
    });
  }
);

// ─── getAllBookings ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/bookings
 * @access  Private — ADMIN + READ
 */
export const getAllBookings = asyncHandler(
  async (req: Request, res: Response) => {
    // Normalize to UPPERCASE — accept 'pending' or 'PENDING' from query params
    const rawStatus   = typeof req.query.status    === 'string' ? req.query.status.toUpperCase()   : undefined;
    const rawVehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId              : undefined;

    const statusFilter = rawStatus && VALID_STATUSES.includes(rawStatus as any)
      ? rawStatus as typeof VALID_STATUSES[number]
      : undefined;

    logger.debug(CTX, 'Admin fetching bookings', { statusFilter, vehicleId: rawVehicleId });

    const bookings = await prisma.booking.findMany({
      where: {
        ...(statusFilter   && { status:     statusFilter  }),
        ...(rawVehicleId   && { vehicle_id: rawVehicleId  }),
      },
      include: {
        user:    { select: { id: true, email: true, first_name: true, last_name: true, phone: true } },
        vehicle: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      data:    { bookings: bookings.map(formatBooking), count: bookings.length },
    });
  }
);

// ─── getBookingById ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/bookings/:id
 * @access  Private — Owner OR ADMIN
 */
export const getBookingById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const userId   = req.user!.id;
    const userRole = req.user!.role;  // 'USER' | 'ADMIN' — UPPERCASE from JWT

    const booking = await prisma.booking.findUnique({
      where:   { id },
      include: {
        user:    { select: { id: true, email: true, first_name: true, last_name: true, phone: true } },
        vehicle: true,
      },
    });

    if (!booking) return next(new AppError('Booking not found', 404));

    // RBAC: UPPERCASE comparison
    if (userRole !== 'ADMIN' && booking.user_id !== userId) {
      return next(new AppError('You are not authorized to view this booking', 403));
    }

    res.status(200).json({
      success: true,
      data:    { booking: formatBooking(booking) },
    });
  }
);

// ─── updateBookingStatus ──────────────────────────────────────────────────────

/**
 * @route   PATCH /api/bookings/:id/status
 * @access  Private — Owner can only CANCEL; ADMIN can set any status
 */
export const updateBookingStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const userId   = req.user!.id;
    const userRole = req.user!.role;

    // Accept both 'pending' and 'PENDING' from client
    const rawStatus = typeof req.body.status === 'string'
      ? req.body.status.toUpperCase()
      : undefined;

    if (!rawStatus || !VALID_STATUSES.includes(rawStatus as any)) {
      return next(new AppError(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`, 400));
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return next(new AppError('Booking not found', 404));

    if (userRole !== 'ADMIN' && booking.user_id !== userId) {
      return next(new AppError('Permission denied', 403));
    }

    // Regular users can only cancel their own booking
    if (userRole !== 'ADMIN' && rawStatus !== 'CANCELLED') {
      return next(new AppError('Users can only cancel their own bookings', 403));
    }

    const updated = await prisma.booking.update({
      where:   { id },
      data:    { status: rawStatus as any },
      include: {
        vehicle: true,
        user:    { select: { id: true, email: true, first_name: true, last_name: true } },
      },
    });

    logger.info(CTX, 'Booking status updated', {
      bookingId: id,
      from:      booking.status,
      to:        rawStatus,
      by:        userId,
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${rawStatus}`,
      data:    { booking: formatBooking(updated) },
    });
  }
);

// ─── deleteBooking ────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/bookings/:id
 * @access  Private — ADMIN + DELETE
 */
export const deleteBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Booking not found', 404));

    await prisma.booking.delete({ where: { id } });

    logger.warn(CTX, 'Booking deleted', { bookingId: id, adminId: req.user!.id });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  }
);

// ─── getBookingStats ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/bookings/stats/dashboard
 * @access  Private — ADMIN + READ
 */
export const getBookingStats = asyncHandler(
  async (_req: Request, res: Response) => {
    logger.debug(CTX, 'Computing dashboard stats');

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      revenueAgg,
      totalVehicles,
      availableVehicles,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING'   } }),   // UPPERCASE
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),   // UPPERCASE
      prisma.booking.aggregate({
        _sum:  { total_price: true },
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),   // UPPERCASE
    ]);

    const recentBookings = await prisma.booking.findMany({
      take:    10,
      orderBy: { created_at: 'desc' },
      include: {
        user:    { select: { first_name: true, last_name: true, email: true } },
        vehicle: { select: { brand: true, model: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        availableVehicles,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue:   Number(revenueAgg._sum.total_price ?? 0),
        recentBookings: recentBookings.map(formatBooking),
      },
    });
  }
);

// ─── adminCreateBooking ───────────────────────────────────────────────────────

/**
 * @route   POST /api/bookings/admin-create
 * @access  Private — ADMIN + CREATE
 *
 * Creates a CONFIRMED booking on behalf of any registered user.
 */
export const adminCreateBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminId = req.user!.id;
    const { vehicleId, userId, startDate, endDate, pickupLocation, dropoffLocation, notes } = req.body;

    logger.info(CTX, 'Admin creating booking', { adminId, userId, vehicleId });

    if (!vehicleId || !userId || !startDate || !endDate) {
      return next(new AppError('vehicleId, userId, startDate and endDate are required', 400));
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format. Use ISO 8601.', 400));
    }
    if (end <= start) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Validate both references in parallel
    const [vehicle, user] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!vehicle) return next(new AppError('Vehicle not found', 404));
    if (!user)    return next(new AppError('User not found', 404));

    // Conflict detection
    const conflicts = await prisma.booking.findMany({
      where: {
        vehicle_id: vehicleId,   // FIXED: was 'vehicle_id,' (comma-separated typo)
        status:     { in: [...BLOCKING_STATUSES] },
        OR: [
          { AND: [{ start_date: { lte: start } }, { end_date: { gte: start } }] },
          { AND: [{ start_date: { lte: end   } }, { end_date: { gte: end   } }] },
          { AND: [{ start_date: { gte: start } }, { end_date: { lte: end   } }] },
        ],
      },
    });

    if (conflicts.length > 0) {
      return next(new AppError('Vehicle is already booked for these dates', 409));
    }

    const totalDays  = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
    const totalPrice = totalDays * Number(vehicle.price_per_day);

    const booking = await prisma.booking.create({
      data: {
        user_id:          userId,
        vehicle_id:       vehicleId,
        start_date:       start,
        end_date:         end,
        pickup_location:  pickupLocation,
        dropoff_location: dropoffLocation,
        total_days:       totalDays,
        total_price:      totalPrice,
        status:           'CONFIRMED',   // Admin bookings are pre-confirmed
        payment_status:   'PENDING',
        notes,
      },
      include: {
        vehicle: { select: { id: true, brand: true, model: true } },
        user:    { select: { id: true, email: true, first_name: true, last_name: true } },
      },
    });

    logger.info(CTX, 'Admin booking created', { bookingId: booking.id, userId, totalDays, totalPrice });

    res.status(201).json({
      success: true,
      message: 'Booking created by admin',
      data:    { booking: formatBooking(booking) },
    });
  }
);
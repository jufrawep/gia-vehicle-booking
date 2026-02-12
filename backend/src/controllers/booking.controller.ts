import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import { sendBookingConfirmation } from '../services/email.service';

/**
 * VALIDATION SCHEMA
 * Ensures all booking requests adhere to strict date and format rules before hitting the DB.
 */
const createBookingSchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional()
});

/**
 * CREATE BOOKING (Core Transaction)
 * Handles the complete lifecycle of a new reservation:
 * 1. Validates dates (End > Start).
 * 2. Checks vehicle availability (Status + Overlapping dates).
 * 3. Calculates total price based on daily rate.
 * 4. Persists data and triggers async email confirmation.
 */
export const createBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const validatedData = createBookingSchema.parse(req.body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Logical Validation: Time continuity
    if (endDate <= startDate) {
      return next(
        new AppError('End date must be after start date', 400)
      );
    }

    // Resource Validation: Vehicle existence
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId }
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (vehicle.status !== 'available') {
      return next(new AppError('This vehicle is currently unavailable', 400));
    }

    // CONFLICT DETECTION ENGINE
    // Checks if the requested dates overlap with any existing confirmed or IN_PROGRESS bookings.
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        vehicle_id: validatedData.vehicleId,
        status: { in: ['confirmed', 'in_progress'] },
        OR: [
          // Case 1: New booking is inside an existing booking
          {
            AND: [
              { start_date: { lte: startDate } },
              { end_date: { gte: startDate } }
            ]
          },
          // Case 2: New booking surrounds an existing booking
          {
            AND: [
              { start_date: { lte: endDate } },
              { end_date: { gte: endDate } }
            ]
          },
          // Case 3: Existing booking is inside the new booking
          {
            AND: [
              { start_date: { gte: startDate } },
              { end_date: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      return next(
        new AppError('This vehicle is already booked for these dates', 409)
      );
    }

    // Financial Calculation
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalAmount = Number(vehicle.daily_rate) * days;

    // Transaction Persistence
    const booking = await prisma.booking.create({
      data: {
        user_id: userId,
        vehicle_id: validatedData.vehicleId,
        start_date: startDate,
        end_date: endDate,
        pickup_location: validatedData.pickupLocation,
        dropoff_location: validatedData.dropoffLocation,
        total_days: days,
        total_amount: totalAmount,
        status: 'pending',
        notes: validatedData.notes
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Notification Service (Fire and Forget)
    // We don't await this to keep the API response fast.
    sendBookingConfirmation(booking.user.email, {
      bookingId: booking.id,
      vehicleName: `${booking.vehicle.brand} ${booking.vehicle.model}`,
      startDate: startDate.toLocaleDateString('fr-FR'),
      endDate: endDate.toLocaleDateString('fr-FR'),
      totalPrice: Number(totalAmount)
    }).catch(err => console.error('Email sending error:', err));

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          ...booking,
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalPrice: booking.total_amount,
          userId: booking.user_id,
          vehicleId: booking.vehicle_id
        }
      }
    });
  }
);

/**
 * GET USER HISTORY
 * Retrieves all bookings associated with the currently authenticated user.
 */
export const getMyBookings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const bookings = await prisma.booking.findMany({
      where: { user_id: userId },
      include: {
        vehicle: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Data Transformation (snake_case DB -> camelCase API)
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      startDate: booking.start_date,
      endDate: booking.end_date,
      totalPrice: booking.total_amount,
      userId: booking.user_id,
      vehicleId: booking.vehicle_id,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));

    res.status(200).json({
      success: true,
      data: { bookings: formattedBookings, count: formattedBookings.length }
    });
  }
);

/**
 * admin: GET ALL BOOKINGS
 * Allows filtering by status and vehicle ID for administrative oversight.
 */
export const getAllBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined;

    const filters: any = {};

    if (status) filters.status = status;
    if (vehicleId) filters.vehicle_id = vehicleId;

    const bookings = await prisma.booking.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        },
        vehicle: true
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedBookings = bookings.map(booking => ({
      ...booking,
      startDate: booking.start_date,
      endDate: booking.end_date,
      totalPrice: booking.total_amount,
      userId: booking.user_id,
      vehicleId: booking.vehicle_id,
      user: {
        ...booking.user,
        firstName: booking.user.first_name,
        lastName: booking.user.last_name
      }
    }));

    res.status(200).json({
      success: true,
      data: { bookings: formattedBookings, count: formattedBookings.length }
    });
  }
);

/**
 * GET BOOKING BY ID
 * Security Check: Ensures only the OWNER of the booking or an admin can view the details.
 */
export const getBookingById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true
          }
        },
        vehicle: true
      }
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // RBAC: Access Control Check
    if (userRole !== 'admin' && booking.user_id !== userId) {
      return next(
        new AppError('You do not have permission to view this booking', 403)
      );
    }

    const userData = booking as any;
    const formattedBooking = {
      ...booking,
      startDate: booking.start_date,
      endDate: booking.end_date,
      totalPrice: booking.total_amount,
      userId: booking.user_id,
      vehicleId: booking.vehicle_id,
      user: userData.user ? {
        ...userData.user,
        firstName: userData.user.first_name,
        lastName: userData.user.last_name
      } : null
    };

    res.status(200).json({
      success: true,
      data: { booking: formattedBooking }
    });
  }
);

/**
 * UPDATE BOOKING STATUS
 * Handles state transitions (e.g., pending -> confirmed).
 * Constraints:
 * - Regular Users: Can only set status to 'cancelled'.
 * - admins: Can set any status.
 */
export const updateBookingStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const status = typeof req.body.status === 'string' ? req.body.status : undefined;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validate enum integrity
    if (typeof status !== 'string' || !['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'].includes(status)) {
      return next(new AppError('Invalid booking status', 400));
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) return next(new AppError('Booking not found', 404));

    // Permission Check
    if (userRole !== 'admin' && booking.user_id !== userId) {
      return next(new AppError('Permission denied', 403));
    }

    // Role-Based Logic Constraints
    if (userRole !== 'admin' && status !== 'cancelled') {
      return next(new AppError('Users can only cancel their own bookings', 403));
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    const userData = updatedBooking as any;
    const formattedBooking = {
      ...updatedBooking,
      startDate: updatedBooking.start_date,
      endDate: updatedBooking.end_date,
      totalPrice: updatedBooking.total_amount,
      userId: updatedBooking.user_id,
      vehicleId: updatedBooking.vehicle_id,
      user: userData.user ? {
        ...userData.user,
        firstName: userData.user.first_name,
        lastName: userData.user.last_name
      } : null
    };

    res.status(200).json({
      success: true,
      message: 'Booking status updated',
      data: { booking: formattedBooking }
    });
  }
);

/**
 * DELETE BOOKING (admin Only)
 * Permanently removes a booking record from the database.
 */
export const deleteBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Booking ID'
      });
    }

    await prisma.booking.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  }
);

/**
 * admin DASHBOARD ANALYTICS
 * Aggregates key performance indicators (KPIs) for the admin panel.
 * Uses Promise.all to execute multiple database queries in parallel for performance.
 */
export const getBookingStats = asyncHandler(
  async (_req: Request, res: Response) => {
    // Parallel Execution
    const [totalBookings, pendingBookings, confirmedBookings, totalRevenue] =
      await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'pending' } }),
        prisma.booking.count({ where: { status: 'confirmed' } }),
        prisma.booking.aggregate({
          _sum: { total_amount: true },
          where: { status: { in: ['confirmed', 'completed'] } }
        })
      ]);

    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        vehicle: {
          select: { brand: true, model: true }
        }
      }
    });

    // Formatting for Dashboard Table
    const formattedRecentBookings = recentBookings.map(booking => {
      const bookingWithUser = booking as any;
      return {
        ...booking,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalPrice: booking.total_amount,
        user: bookingWithUser.user ? {
          ...bookingWithUser.user,
          firstName: bookingWithUser.user.first_name,
          lastName: bookingWithUser.user.last_name
        } : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue: totalRevenue._sum.total_amount || 0,
        recentBookings: formattedRecentBookings
      }
    });
  }
);
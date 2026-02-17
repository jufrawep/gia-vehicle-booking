/**
 * @file  controllers/payment.controller.ts
 * @desc  Simulated payment processing + ticket generation.
 *
 * Flow:
 *   1. Validate booking exists & is CONFIRMED
 *   2. Check card number (ending in 0002 → decline)
 *   3. Create Payment record with COMPLETED status
 *   4. Update Booking.paymentStatus → COMPLETED
 *   5. Generate ticket JSON with all details
 *   6. Send confirmation email to user
 *   7. Return ticket to frontend
 *
 * Changes:
 *   - Added email confirmation after successful payment
 *   - Created notification record for payment confirmation
 */

import { Response, NextFunction }       from 'express';
import { v4 as uuidv4 }                 from 'uuid';
import prisma                           from '../utils/prisma.util';
import { AppError, asyncHandler }       from '../middleware/error.middleware';
import { AuthRequest }                  from '../types';
import { sendPaymentConfirmation }      from '../services/email.service';
import { logger }                       from '../utils/logger.util';

const CTX = 'PaymentController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Masks a card number: 1234567890123456 → **** **** **** 3456
 */
function maskCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `**** **** **** ${digits.slice(-4)}`;
}

/**
 * Simulated fraud check: cards ending in 0002 are declined
 */
function shouldDecline(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.endsWith('0002');
}

// ══════════════════════════════════════════════════════════════════════════════
// PROCESS PAYMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments/process
 * Body: { bookingId, cardNumber, cardHolder, expiryDate, cvv, paymentMethod }
 *
 * Returns HTTP 402 if payment declined (card ending in 0002).
 * Returns HTTP 201 with ticket if successful.
 */
export const processPayment = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { bookingId, cardNumber, cardHolder, expiryDate, cvv, paymentMethod } = req.body;

    if (!bookingId || !cardNumber || !cardHolder) {
      return next(new AppError('Missing required payment fields', 400));
    }

    // ── 1. Fetch booking with relations ─────────────────────────────────────
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user:    { select: { id: true, first_name: true, last_name: true, email: true } },
        vehicle: { select: { brand: true, model: true, year: true, image_url: true } },
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // ── 2. Security check: owner only ───────────────────────────────────────
    if (booking.user_id !== userId) {
      return next(new AppError('Unauthorized to pay for this booking', 403));
    }

    // ── 3. Business rule: must be CONFIRMED ─────────────────────────────────
    if (booking.status !== 'CONFIRMED') {
      return next(new AppError('Only confirmed bookings can be paid', 400));
    }

    // ── 4. Idempotency: already paid? ───────────────────────────────────────
    const existingPayment = await prisma.payment.findUnique({
      where: { booking_id: bookingId },
    });
    if (existingPayment?.status === 'COMPLETED') {
      return next(new AppError('This booking has already been paid', 409));
    }

    // ── 5. Fraud simulation ─────────────────────────────────────────────────
    if (shouldDecline(cardNumber)) {
      logger.warn(CTX, 'Payment declined (test card)', { bookingId, cardNumber: maskCard(cardNumber) });
      return res.status(402).json({
        success: false,
        message: 'Payment declined by issuer',
      });
    }

    // ── 6. Create or update payment ─────────────────────────────────────────
    const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const cardMasked    = maskCard(cardNumber);
    const now           = new Date();

    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount:           booking.total_price,
            payment_method:   paymentMethod || 'CARD',
            payment_provider: 'SIMULATED',
            transaction_id:   transactionId,
            status:           'COMPLETED',
            metadata: {
              cardMasked,
              cardHolder,
              expiryDate,
              processedAt: now.toISOString(),
            },
            updated_at: now,
          },
        })
      : await prisma.payment.create({
          data: {
            booking_id:       bookingId,
            amount:           booking.total_price,
            payment_method:   paymentMethod || 'CARD',
            payment_provider: 'SIMULATED',
            transaction_id:   transactionId,
            status:           'COMPLETED',
            metadata: {
              cardMasked,
              cardHolder,
              expiryDate,
              processedAt: now.toISOString(),
            },
          },
        });

    // ── 7. Update booking payment status ────────────────────────────────────
    await prisma.booking.update({
      where: { id: bookingId },
      data:  { payment_status: 'COMPLETED' },
    });

    // ── 8. Build ticket ─────────────────────────────────────────────────────
    const ticket = {
      transactionId: payment.transaction_id!,
      paymentId:     payment.id,
      bookingId:     booking.id,
      processedAt:   now.toISOString(),
      customer: {
        name:  `${booking.user.first_name} ${booking.user.last_name}`,
        email: booking.user.email,
      },
      vehicle: {
        label: `${booking.vehicle.brand} ${booking.vehicle.model} ${booking.vehicle.year}`,
        image: booking.vehicle.image_url,
      },
      startDate:     booking.start_date.toISOString(),
      endDate:       booking.end_date.toISOString(),
      totalDays:     booking.total_days,
      amount:        Number(booking.total_price),
      currency:      'FCFA',
      paymentMethod: payment.payment_method,
      cardMasked,
      cardHolder,
      status:        payment.status,
    };

    logger.info(CTX, 'Payment processed successfully', {
      transactionId: payment.transaction_id,
      bookingId,
      amount: Number(booking.total_price),
    });

    // ── 9. Send confirmation email (fire and forget) ────────────────────────
    sendPaymentConfirmation(booking.user.email, {
      userName:      `${booking.user.first_name} ${booking.user.last_name}`,
      userId:        booking.user.id,
      transactionId: payment.transaction_id!,
      vehicleName:   `${booking.vehicle.brand} ${booking.vehicle.model}`,
      startDate:     booking.start_date.toLocaleDateString('fr-FR'),
      endDate:       booking.end_date.toLocaleDateString('fr-FR'),
      totalDays:     booking.total_days,
      amount:        Number(booking.total_price),
      paymentMethod: payment.payment_method,
      cardMasked,
    }).catch(err => {
      logger.error(CTX, 'Failed to send payment confirmation email', { error: err?.message });
    });

    // ── 10. Response ────────────────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data:    { ticket },
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// GET PAYMENT TICKET
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/payments/:bookingId
 * Returns ticket data for a completed payment.
 */
export const getPaymentByBooking = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const bookingId = req.params.bookingId as string;  // ← FIXED: req.params, not req.body
    const userId    = req.user!.id;

    const payment = await prisma.payment.findUnique({
      where:   { booking_id: bookingId },
      include: {
        booking: {
          include: {
            user:    { select: { id: true, first_name: true, last_name: true, email: true } },
            vehicle: { select: { brand: true, model: true, year: true, image_url: true } },
          },
        },
      },
    });

    if (!payment) {
      return next(new AppError('Payment not found for this booking', 404));
    }

    // Security: owner only
    if (payment.booking.user_id !== userId) {
      return next(new AppError('Unauthorized to view this payment', 403));
    }

    const metadata = payment.metadata as any;

    const ticket = {
      transactionId: payment.transaction_id!,
      paymentId:     payment.id,
      bookingId:     payment.booking.id,
      processedAt:   metadata?.processedAt || payment.created_at.toISOString(),
      customer: {
        name:  `${payment.booking.user.first_name} ${payment.booking.user.last_name}`,
        email: payment.booking.user.email,
      },
      vehicle: {
        label: `${payment.booking.vehicle.brand} ${payment.booking.vehicle.model} ${payment.booking.vehicle.year}`,
        image: payment.booking.vehicle.image_url,
      },
      startDate:     payment.booking.start_date.toISOString(),
      endDate:       payment.booking.end_date.toISOString(),
      totalDays:     payment.booking.total_days,
      amount:        Number(payment.amount),
      currency:      'FCFA',
      paymentMethod: payment.payment_method,
      cardMasked:    metadata?.cardMasked   || '****',
      cardHolder:    metadata?.cardHolder   || 'N/A',
      status:        payment.status,
    };

    res.status(200).json({
      success: true,
      data:    { ticket },
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// GET ALL PAYMENTS (ADMIN ONLY — called by admin dashboard)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/payments
 * Query params: dateFrom, dateTo, status, paymentMethod
 */
export const getAllPayments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { dateFrom, dateTo, status, paymentMethod } = req.query;

    const filters: any = {};

    if (dateFrom) {
      filters.created_at = { ...filters.created_at, gte: new Date(dateFrom as string) };
    }
    if (dateTo) {
      filters.created_at = { ...filters.created_at, lte: new Date(dateTo as string) };
    }
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    if (paymentMethod && typeof paymentMethod === 'string') {
      filters.payment_method = paymentMethod;
    }

    const payments = await prisma.payment.findMany({
      where:   filters,
      include: {
        booking: {
          include: {
            user:    { select: { first_name: true, last_name: true, email: true } },
            vehicle: { select: { brand: true, model: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = payments.map(p => ({
      id:               p.id,
      transactionId:    p.transaction_id,
      amount:           Number(p.amount),
      currency:         'FCFA',
      paymentMethod:    p.payment_method,
      paymentProvider:  p.payment_provider,
      status:           p.status,
      createdAt:        p.created_at.toISOString(),
      booking: {
        id:        p.booking.id,
        customer:  `${p.booking.user.first_name} ${p.booking.user.last_name}`,
        email:     p.booking.user.email,
        vehicle:   `${p.booking.vehicle.brand} ${p.booking.vehicle.model}`,
        startDate: p.booking.start_date.toISOString(),
        endDate:   p.booking.end_date.toISOString(),
      },
    }));

    res.status(200).json({
      success: true,
      data:    { payments: formatted },
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// GET USER PAYMENT
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/me
 * Query params: dateFrom, dateTo, status, paymentMethod
 */
export const getMyPayments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const payments = await prisma.payment.findMany({
      where: {
        booking: { user_id: userId },
      },
      include: {
        booking: {
          include: {
            vehicle: { select: { brand: true, model: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = payments.map(p => ({
      id:            p.id,
      transactionId: p.transaction_id,
      amount:        Number(p.amount),
      currency:      'FCFA',
      paymentMethod: p.payment_method,
      status:        p.status,
      createdAt:     p.created_at.toISOString(),
      booking: {
        id:      p.booking.id,
        vehicle: `${p.booking.vehicle.brand} ${p.booking.vehicle.model}`,
      },
    }));

    res.status(200).json({
      success: true,
      data: { payments: formatted },
    });
  }
);

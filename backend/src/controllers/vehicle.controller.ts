/**
 * @file  vehicle.controller.ts
 * @desc  Fleet management controller — CRUD + availability check.
 *
 * Corrections vs original:
 *   - daily_rate → price_per_day (aligned with Prisma schema)
 *   - registration_number → license_plate (aligned with Prisma schema)
 *   - All enum values UPPERCASE (AVAILABLE, ECONOMY, MANUAL, etc.)
 *   - Accepts mixed-case input, normalizes to UPPERCASE before persistence
 *   - status filter uses VehicleStatus enum ('AVAILABLE' not 'available')
 *   - Logs added on all operations
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger.util';

const CTX = 'VehicleController';

// ─── Enum constants ───────────────────────────────────────────────────────────

const VALID_CATEGORIES    = ['ECONOMY', 'COMFORT', 'LUXURY', 'SUV', 'VAN']        as const;
const VALID_TRANSMISSIONS = ['MANUAL', 'AUTOMATIC']                               as const;
const VALID_FUEL_TYPES    = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']            as const;
const VALID_STATUSES      = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE', 'RENTED'] as const;
// Statuses that block date ranges in the calendar
const BLOCKING_STATUSES   = ['PENDING', 'CONFIRMED']                              as const;

// Accepts any case, normalizes to UPPERCASE for DB storage
const toUpperEnum = (val: string) => val.toUpperCase();

// ─── Validation schema ────────────────────────────────────────────────────────

const createVehicleSchema = z.object({
  brand:           z.string().min(2),
  model:           z.string().min(1),
  year:            z.number().int().min(1900).max(new Date().getFullYear() + 1),
  category:        z.string().transform(toUpperEnum).refine(
    v => VALID_CATEGORIES.includes(v as any),
    { message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }
  ),
  pricePerDay:     z.number().positive(),
  seats:           z.number().int().min(2).max(50),
  transmission:    z.string().transform(toUpperEnum).refine(
    v => VALID_TRANSMISSIONS.includes(v as any),
    { message: `Transmission must be MANUAL or AUTOMATIC` }
  ).optional(),
  fuelType:        z.string().transform(toUpperEnum).refine(
    v => VALID_FUEL_TYPES.includes(v as any),
    { message: `Fuel type must be one of: ${VALID_FUEL_TYPES.join(', ')}` }
  ).optional(),
  imageUrl:        z.string().url().optional().or(z.literal('')),
  features:        z.array(z.string()).optional(),
  description:     z.string().max(2000).optional(),
  licensePlate:    z.string().max(50).optional(),
  location:        z.string().max(255).optional(),
  locationAddress: z.string().max(500).optional(),
});

// ─── Helper: format vehicle for API response ─────────────────────────────────

function formatVehicle(v: any) {
  return {
    id:              v.id,
    brand:           v.brand,
    model:           v.model,
    year:            v.year,
    category:        v.category,          // UPPERCASE enum
    pricePerDay:     Number(v.price_per_day),
    seats:           v.seats,
    transmission:    v.transmission,      // UPPERCASE enum
    fuelType:        v.fuel_type,         // UPPERCASE enum
    imageUrl:        v.image_url        ?? undefined,
    features:        v.features         ?? [],
    description:     v.description      ?? undefined,
    status:          v.status,            // UPPERCASE enum
    isAvailable:     v.is_available,
    licensePlate:    v.license_plate     ?? undefined,
    mileage:         v.mileage           ?? 0,
    location:        v.location          ?? undefined,
    locationAddress: v.location_address  ?? undefined,
    isActive:        v.is_active,
    createdAt:       v.created_at,
    updatedAt:       v.updated_at,
    // Only present when relation was included in the query
    ...(v.bookings && {
      bookings: v.bookings.map((b: any) => ({
        id:        b.id,
        startDate: b.start_date,
        endDate:   b.end_date,
        status:    b.status,   // UPPERCASE enum
      })),
    }),
  };
}

// ─── getAllVehicles ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/vehicles
 * @access  Public
 * @query   category, transmission, fuelType, minPrice, maxPrice, seats, available
 */
export const getAllVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const q = req.query;
    const raw = {
      category:     typeof q.category     === 'string' ? q.category.toUpperCase()     : undefined,
      transmission: typeof q.transmission === 'string' ? q.transmission.toUpperCase() : undefined,
      fuelType:     typeof q.fuelType     === 'string' ? q.fuelType.toUpperCase()     : undefined,
      minPrice:     typeof q.minPrice     === 'string' ? q.minPrice                   : undefined,
      maxPrice:     typeof q.maxPrice     === 'string' ? q.maxPrice                   : undefined,
      seats:        typeof q.seats        === 'string' ? q.seats                      : undefined,
      available:    q.available,
    };

    logger.debug(CTX, 'Fetching vehicles', { filters: raw });

    const vehicles = await prisma.vehicle.findMany({
      where: {
        is_active: true,
        ...(raw.category     && VALID_CATEGORIES.includes(raw.category as any)      && { category:     raw.category     as any }),
        ...(raw.transmission && VALID_TRANSMISSIONS.includes(raw.transmission as any) && { transmission: raw.transmission as any }),
        ...(raw.fuelType     && VALID_FUEL_TYPES.includes(raw.fuelType as any)      && { fuel_type:    raw.fuelType     as any }),
        ...(raw.seats        && { seats: parseInt(raw.seats) }),
        // Filter by AVAILABLE status (UPPERCASE) — not boolean is_available
        ...(raw.available === 'true' && { status: 'AVAILABLE' as const }),
        ...((raw.minPrice || raw.maxPrice) && {
          price_per_day: {
            ...(raw.minPrice && { gte: parseFloat(raw.minPrice) }),
            ...(raw.maxPrice && { lte: parseFloat(raw.maxPrice) }),
          },
        }),
      },
      orderBy: { created_at: 'desc' },
    });

    logger.info(CTX, 'Vehicles fetched', { count: vehicles.length });

    res.status(200).json({
      success: true,
      data:    { vehicles: vehicles.map(formatVehicle), count: vehicles.length },
    });
  }
);

// ─── getVehicleById ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
export const getVehicleById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    logger.debug(CTX, 'Fetching vehicle', { vehicleId: id });

    const vehicle = await prisma.vehicle.findUnique({
      where:   { id },
      include: {
        bookings: {
          // Only include calendar-blocking bookings
          where:  { status: { in: ['PENDING', 'CONFIRMED'] } },
          select: { id: true, start_date: true, end_date: true, status: true },
        },
      },
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    res.status(200).json({
      success: true,
      data:    { vehicle: formatVehicle(vehicle) },
    });
  }
);

// ─── createVehicle ────────────────────────────────────────────────────────────

/**
 * @route   POST /api/vehicles
 * @access  Private — ADMIN + CREATE
 */
export const createVehicle = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const adminId   = req.user!.id;
    const validated = createVehicleSchema.parse(req.body);

    logger.info(CTX, 'Creating vehicle', { adminId, brand: validated.brand, model: validated.model });

    const vehicle = await prisma.vehicle.create({
      data: {
        brand:            validated.brand,
        model:            validated.model,
        year:             validated.year,
        category:         validated.category as any,              // UPPERCASE enum
        price_per_day:    validated.pricePerDay,
        seats:            validated.seats,
        transmission:     (validated.transmission ?? 'MANUAL') as any,  // UPPERCASE enum
        fuel_type:        (validated.fuelType ?? 'PETROL')     as any,  // UPPERCASE enum
        image_url:        validated.imageUrl        || undefined,
        features:         validated.features        || [],
        description:      validated.description     || undefined,
        license_plate:    validated.licensePlate    || undefined,
        location:         validated.location        || undefined,
        location_address: validated.locationAddress || undefined,
        status:           'AVAILABLE',   // New vehicles start AVAILABLE
        is_available:     true,
      },
    });

    logger.info(CTX, 'Vehicle created', { vehicleId: vehicle.id });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data:    { vehicle: formatVehicle(vehicle) },
    });
  }
);

// ─── updateVehicle ────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/vehicles/:id
 * @access  Private — ADMIN + CREATE
 *
 * Partial update — only provided fields are modified.
 * All enum values normalized to UPPERCASE.
 */
export const updateVehicle = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    logger.info(CTX, 'Updating vehicle', { vehicleId: id, adminId: req.user!.id });

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Vehicle not found', 404));

    const body = req.body;
    const data: any = {};

    // Scalar fields
    if (body.brand       !== undefined) data.brand       = body.brand;
    if (body.model       !== undefined) data.model       = body.model;
    if (body.year        !== undefined) data.year        = Number(body.year);
    if (body.seats       !== undefined) data.seats       = Number(body.seats);
    if (body.mileage     !== undefined) data.mileage     = Number(body.mileage);
    if (body.imageUrl    !== undefined) data.image_url   = body.imageUrl || null;
    if (body.description !== undefined) data.description = body.description;
    if (body.features    !== undefined) data.features    = Array.isArray(body.features) ? body.features : JSON.parse(body.features);

    // Enum fields — normalize to UPPERCASE
    if (body.category !== undefined) {
      const v = body.category.toUpperCase();
      if (!VALID_CATEGORIES.includes(v as any)) return next(new AppError(`Invalid category: ${v}`, 400));
      data.category = v;
    }
    if (body.transmission !== undefined) {
      const v = body.transmission.toUpperCase();
      if (!VALID_TRANSMISSIONS.includes(v as any)) return next(new AppError(`Invalid transmission: ${v}`, 400));
      data.transmission = v;
    }
    if (body.fuelType !== undefined) {
      const v = body.fuelType.toUpperCase();
      if (!VALID_FUEL_TYPES.includes(v as any)) return next(new AppError(`Invalid fuelType: ${v}`, 400));
      data.fuel_type = v;
    }
    if (body.status !== undefined) {
      const v = body.status.toUpperCase();
      if (!VALID_STATUSES.includes(v as any)) return next(new AppError(`Invalid status: ${v}`, 400));
      data.status       = v;
      data.is_available = (v === 'AVAILABLE'); // keep legacy flag in sync
    }

    // Price (accept both naming conventions)
    const price = body.pricePerDay ?? body.dailyRate;
    if (price !== undefined) data.price_per_day = parseFloat(price);

    // Location & identification
    const plate = body.licensePlate ?? body.registrationNumber;
    if (plate               !== undefined) data.license_plate    = plate;
    if (body.location       !== undefined) data.location         = body.location;
    if (body.locationAddress !== undefined) data.location_address = body.locationAddress;

    const updated = await prisma.vehicle.update({ where: { id }, data });

    logger.info(CTX, 'Vehicle updated', { vehicleId: id, fields: Object.keys(data) });

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data:    { vehicle: formatVehicle(updated) },
    });
  }
);

// ─── deleteVehicle ────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/vehicles/:id
 * @access  Private — ADMIN + DELETE
 *
 * Guard: blocks deletion if any CONFIRMED or PENDING bookings exist.
 */
export const deleteVehicle = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    logger.warn(CTX, 'Vehicle deletion requested', { vehicleId: id, adminId: req.user!.id });

    const activeCount = await prisma.booking.count({
      where: { vehicle_id: id, status: { in: ['CONFIRMED', 'PENDING'] } },
    });

    if (activeCount > 0) {
      return next(new AppError('Cannot delete a vehicle with active or pending bookings', 400));
    }

    await prisma.vehicle.delete({ where: { id } });

    logger.info(CTX, 'Vehicle deleted', { vehicleId: id });

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  }
);

// ─── checkAvailability ────────────────────────────────────────────────────────

/**
 * @route   GET /api/vehicles/:id/availability?startDate=...&endDate=...
 * @access  Public
 */
export const checkAvailability = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(new AppError('startDate and endDate query params are required', 400));
    }

    const start = new Date(startDate as string);
    const end   = new Date(endDate   as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format. Use ISO 8601.', 400));
    }

    logger.debug(CTX, 'Checking availability', { vehicleId: id, startDate, endDate });

    const conflicts = await prisma.booking.findMany({
      where: {
        vehicle_id: id,
        status:     { in: [...BLOCKING_STATUSES]},
        OR: [
          { AND: [{ start_date: { lte: start } }, { end_date: { gte: start } }] },
          { AND: [{ start_date: { lte: end   } }, { end_date: { gte: end   } }] },
          { AND: [{ start_date: { gte: start } }, { end_date: { lte: end   } }] },
        ],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isAvailable: conflicts.length === 0,
        conflicts:   conflicts.length,
      },
    });
  }
);
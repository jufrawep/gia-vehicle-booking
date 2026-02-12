import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { AuthRequest } from '../types';

/**
 * VALIDATION SCHEMA
 * Uses Zod to enforce strict data types for vehicle creation.
 */
const createVehicleSchema = z.object({
  brand: z.string().min(2),
  model: z.string().min(1),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  category: z.string(),
  dailyRate: z.number().positive(),
  seats: z.number().min(2).max(50),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  imageUrl: z.string().url().optional(),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
  licensePlate: z.string().optional(),
  location: z.string().optional()
});

/**
 * GET ALL VEHICLES
 * Fetches vehicles from the database with dynamic filtering and status checks.
 * Converts database snake_case fields to frontend-friendly camelCase.
 */
export const getAllVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const transmission = typeof req.query.transmission === 'string' ? req.query.transmission : undefined;
    const fuelType = typeof req.query.fuelType === 'string' ? req.query.fuelType : undefined;
    const minPrice = typeof req.query.minPrice === 'string' ? req.query.minPrice : undefined;
    const maxPrice = typeof req.query.maxPrice === 'string' ? req.query.maxPrice : undefined;
    const seats = typeof req.query.seats === 'string' ? req.query.seats : undefined;
    const available = req.query.available;

    const filters: any = {};

    // Apply categorical filters
    if (category) filters.category = category;
    if (transmission) filters.transmission = transmission;
    if (fuelType) filters.fuel_type = fuelType;
    if (seats) filters.seats = parseInt(seats);
    if (available === 'true') filters.status = 'available';

    // Apply numeric range filters for pricing
    if (minPrice) {
      if (!filters.daily_rate) filters.daily_rate = {};
      filters.daily_rate.gte = parseFloat(minPrice);
    }

    if (maxPrice) {
      if (!filters.daily_rate) filters.daily_rate = {};
      filters.daily_rate.lte = parseFloat(maxPrice);
    }

    const vehicles = await prisma.vehicle.findMany({
      where: filters,
      orderBy: { created_at: 'desc' }
    });

    // Data Mapping: Database -> API Response
    const formattedVehicles = vehicles.map(vehicle => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      pricePerDay: vehicle.daily_rate,
      dailyRate: vehicle.daily_rate,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuel_type,
      imageUrl: vehicle.image_url,
      features: vehicle.features,
      status: vehicle.status,
      locationAddress: vehicle.location_address,
      licensePlate: vehicle.registration_number,
      registrationNumber: vehicle.registration_number,
      mileage: vehicle.mileage,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
    }));

    res.status(200).json({
      success: true,
      data: { vehicles: formattedVehicles, count: formattedVehicles.length }
    });
  }
);

/**
 * GET VEHICLE BY ID
 * Retrieves a single vehicle and its active/pending bookings to prevent scheduling conflicts.
 */
export const getVehicleById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['pending', 'confirmed', 'in_progress'] }
          },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true
          }
        }
      }
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    // Comprehensive formatting including nested location object
    const vehicleWithBookings = vehicle as any;
    const formattedVehicle = {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      pricePerDay: vehicle.daily_rate,
      dailyRate: vehicle.daily_rate,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuel_type,
      imageUrl: vehicle.image_url,
      features: vehicle.features,
      status: vehicle.status,
      location: {
        address: vehicle.location_address,
        lat: vehicle.location_lat,
        lng: vehicle.location_lng
      },
      licensePlate: vehicle.registration_number,
      registrationNumber: vehicle.registration_number,
      mileage: vehicle.mileage,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at,
      bookings: vehicleWithBookings.bookings ? vehicleWithBookings.bookings.map((booking: any) => ({
        ...booking,
        startDate: booking.start_date,
        endDate: booking.end_date
      })) : []
    };

    res.status(200).json({
      success: true,
      data: { vehicle: formattedVehicle }
    });
  }
);

/**
 * CREATE VEHICLE (admin Restricted)
 * Validates request body and persists a new vehicle record.
 */
export const createVehicle = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const validatedData = createVehicleSchema.parse(req.body);

    const vehicleData: any = {
      brand: validatedData.brand,
      model: validatedData.model,
      year: validatedData.year,
      category: validatedData.category,
      daily_rate: validatedData.dailyRate,
      seats: validatedData.seats,
      status: 'available'
    };

    // Optional field assignment with type safety checks
    if (validatedData.transmission) vehicleData.transmission = validatedData.transmission;
    if (validatedData.fuelType) vehicleData.fuel_type = validatedData.fuelType;
    if (validatedData.imageUrl) vehicleData.image_url = validatedData.imageUrl;
    if (validatedData.features) vehicleData.features = validatedData.features;
    if (validatedData.licensePlate) vehicleData.registration_number = validatedData.licensePlate;
    if (validatedData.location) vehicleData.location_address = validatedData.location;

    const vehicle = await prisma.vehicle.create({
      data: vehicleData
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: { 
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          pricePerDay: vehicle.daily_rate,
          status: vehicle.status
        } 
      }
    });
  }
);

/**
 * UPDATE VEHICLE (admin Restricted)
 * Partially updates vehicle information. Handles complex field mapping (e.g., licensePlate -> registration_number).
 */
export const updateVehicle = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const updateData = req.body;

    const existingVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!existingVehicle) return next(new AppError('Vehicle not found', 404));

    const vehicleUpdateData: any = {};

    // Map common fields
    if (updateData.brand) vehicleUpdateData.brand = updateData.brand;
    if (updateData.model) vehicleUpdateData.model = updateData.model;
    if (updateData.year) vehicleUpdateData.year = updateData.year;
    if (updateData.category) vehicleUpdateData.category = updateData.category;
    if (updateData.status) vehicleUpdateData.status = updateData.status;
    if (updateData.mileage) vehicleUpdateData.mileage = updateData.mileage;

    // Handle price updates (supports two naming conventions)
    const newRate = updateData.dailyRate ?? updateData.pricePerDay;
    if (newRate !== undefined) vehicleUpdateData.daily_rate = parseFloat(newRate);

    // Handle feature list serialization
    if (updateData.features) {
      vehicleUpdateData.features = Array.isArray(updateData.features) 
        ? JSON.stringify(updateData.features) 
        : updateData.features;
    }

    // Handle location and registration mapping
    if (updateData.licensePlate || updateData.registrationNumber) {
      vehicleUpdateData.registration_number = updateData.licensePlate ?? updateData.registrationNumber;
    }
    if (updateData.locationAddress || updateData.location) {
      vehicleUpdateData.location_address = updateData.locationAddress ?? updateData.location;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: vehicleUpdateData
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle: { id: vehicle.id, brand: vehicle.brand, model: vehicle.model } }
    });
  }
);

/**
 * DELETE VEHICLE (admin Restricted)
 * Safety check: Prevents deletion if the vehicle has active or upcoming bookings.
 */
export const deleteVehicle = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = req.params.id as string;

    const activeBookings = await prisma.booking.count({
      where: {
        vehicle_id: id,
        status: { in: ['confirmed', 'in_progress'] }
      }
    });

    if (activeBookings > 0) {
      return next(new AppError('Cannot delete a vehicle with active bookings', 400));
    }

    await prisma.vehicle.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  }
);

/**
 * CHECK AVAILABILITY
 * Logic: A vehicle is unavailable if any 'confirmed' or 'in_progress' booking 
 * overlaps with the requested date range.
 */
export const checkAvailability = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id as string;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return next(new AppError('Start and end dates are required', 400));
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        vehicle_id: id,
        status: { in: ['confirmed', 'in_progress'] },
        OR: [
          { AND: [{ start_date: { lte: start } }, { end_date: { gte: start } }] },
          { AND: [{ start_date: { lte: end } }, { end_date: { gte: end } }] },
          { AND: [{ start_date: { gte: start } }, { end_date: { lte: end } }] }
        ]
      }
    });

    res.status(200).json({
      success: true,
      data: {
        isAvailable: conflictingBookings.length === 0,
        conflicts: conflictingBookings.length
      }
    });
  }
);
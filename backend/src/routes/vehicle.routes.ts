/**
 * @file  vehicle.routes.ts
 * @desc  Vehicle management routes — public GET, admin-only for modifications.
 *
 * IMPORTANT route ordering:
 *   Static routes (/available, /stats, etc.) would need to come before /:id.
 *   Currently all /:id routes are at the bottom, which is correct for the
 *   existing endpoints. If adding specific routes in the future, place them
 *   BEFORE the /:id pattern.
 *
 * Corrections vs original:
 *   - restrictTo('ADMIN') — UPPERCASE to match JWT role payload
 *   - Added requirePermission checks for granular access control
 *   - Public routes (GET) remain unprotected as intended
 */

import { Router } from 'express';
import {
  getAllVehicles, getVehicleById, createVehicle,
  updateVehicle, deleteVehicle, checkAvailability
} from '../controllers/vehicle.controller';
import { protect, restrictTo, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.get('/:id/availability', checkAvailability);

// Admin-only routes with permission checks
router.post('/', protect, restrictTo('ADMIN'), requirePermission('CREATE'), createVehicle);
router.patch('/:id', protect, restrictTo('ADMIN'), requirePermission('CREATE'), updateVehicle);
router.delete('/:id', protect, restrictTo('ADMIN'), requirePermission('DELETE'), deleteVehicle);

export default router;

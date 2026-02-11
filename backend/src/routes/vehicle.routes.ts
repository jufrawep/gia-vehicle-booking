import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  checkAvailability
} from '../controllers/vehicle.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

/* ==========================================================================
   PUBLIC ROUTES
   Accessible by any visitor (unauthenticated)
   ========================================================================== */

/**
 * @route   GET /api/vehicles
 * @desc    Get list of all vehicles with optional filtering (category, price, etc.)
 * @access  Public
 */
router.get('/', getAllVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get detailed information about a specific vehicle
 * @access  Public
 */
router.get('/:id', getVehicleById);

/**
 * @route   GET /api/vehicles/:id/availability
 * @desc    Check if a vehicle is available for specific dates
 * @access  Public
 */
router.get('/:id/availability', checkAvailability);

/* ==========================================================================
   admin ROUTES
   Restricted to authenticated users with the 'admin' role
   ========================================================================== */

/**
 * Apply protection and role restriction to all routes defined below
 */
router.use(protect);
router.use(restrictTo('admin'));

/**
 * @route   POST /api/vehicles
 * @desc    Register a new vehicle in the fleet
 * @access  Private (admin Only)
 */
router.post('/', createVehicle);

/**
 * @route   PATCH /api/vehicles/:id
 * @desc    Update vehicle details, status, or pricing
 * @access  Private (admin Only)
 */
router.patch('/:id', updateVehicle);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Remove a vehicle from the system
 * @access  Private (admin Only)
 */
router.delete('/:id', deleteVehicle);

export default router;
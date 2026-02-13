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

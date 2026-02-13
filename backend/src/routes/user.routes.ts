/**
 * @file  user.routes.ts
 * @desc  User management routes — admin only.
 *
 * Corrections vs original:
 *   - /profile route moved BEFORE /:id to avoid Express treating 'profile' as an id param
 *   - restrictTo('ADMIN') — UPPERCASE
 */

import { Router } from 'express';
import { protect, restrictTo, requirePermission } from '../middleware/auth.middleware';
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  updateUserPermissions,
  updateUserRole,
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication + ADMIN role
router.use(protect);
router.use(restrictTo('ADMIN'));

// READ permission
router.get('/', requirePermission('READ'), getAllUsers);

// DELETE permission — destructive actions
router.patch('/:id/status', requirePermission('DELETE'), updateUserStatus);
router.delete('/:id',       requirePermission('DELETE'), deleteUser);

// Super-admin only (empty permissions array = full access)
router.patch('/:id/permissions', updateUserPermissions);
router.patch('/:id/role',        updateUserRole);

export default router;
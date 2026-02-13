/**
 * @file  user.controller.ts
 * @desc  User management controller — admin operations.
 *
 * Corrections vs original:
 *   - createdAt → created_at  (aligned with Prisma snake_case schema)
 *   - updatePermissionsSchema parse result was typed as `as string` (bug) — fixed
 *   - Role comparisons use UPPERCASE ('ADMIN' not 'admin')
 *   - Logs added on all operations
 */

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.util';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger.util';

const CTX = 'UserController';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updatePermissionsSchema = z.object({
  permissions: z.array(z.enum(['READ', 'CREATE', 'DELETE'])),
});

// ─── Helper: format user for API response ────────────────────────────────────

function formatUser(u: any) {
  return {
    id:            u.id,
    email:         u.email,
    firstName:     u.first_name,
    lastName:      u.last_name,
    phone:         u.phone          ?? undefined,
    role:          u.role,            // UPPERCASE: 'USER' | 'ADMIN'
    status:        u.status,          // UPPERCASE: 'ACTIVE' | 'BLOCKED'
    permissions:   u.permissions   ?? [],
    isActive:      u.is_active,
    emailVerified: u.email_verified,
    createdAt:     u.created_at,
    // Only present when _count relation was included
    ...(u._count !== undefined && { bookingCount: u._count.bookings }),
  };
}

// ─── getAllUsers ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/users
 * @access  Private — ADMIN + READ
 */
export const getAllUsers = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    logger.debug(CTX, 'Fetching all users');

    const users = await prisma.user.findMany({
      select: {
        id:             true,
        email:          true,
        first_name:     true,
        last_name:      true,
        phone:          true,
        role:           true,
        status:         true,
        permissions:    true,
        is_active:      true,
        email_verified: true,
        created_at:     true,           // FIXED: was createdAt (doesn't exist in schema)
        _count: { select: { bookings: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    logger.info(CTX, 'Users listed', { count: users.length });

    res.status(200).json({
      success: true,
      data:    { users: users.map(formatUser), count: users.length },
    });
  }
);

// ─── updateUserStatus ─────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/users/:id/status
 * @access  Private — ADMIN + DELETE
 */
export const updateUserStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const adminId   = req.user!.id;
    const rawStatus = typeof req.body.status === 'string'
      ? req.body.status.toUpperCase()
      : undefined;

    if (!rawStatus || !['ACTIVE', 'BLOCKED'].includes(rawStatus)) {
      return next(new AppError('Invalid status. Use ACTIVE or BLOCKED', 400));
    }
    if (adminId === id) {
      return next(new AppError('You cannot change your own account status', 400));
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return next(new AppError('User not found', 404));

    const updated = await prisma.user.update({
      where: { id },
      data:  { status: rawStatus as any },
    });

    logger.info(CTX, 'User status updated', { targetId: id, status: rawStatus, by: adminId });

    res.status(200).json({
      success: true,
      message: `User ${rawStatus === 'BLOCKED' ? 'blocked' : 'unblocked'} successfully`,
      data:    { user: formatUser(updated) },
    });
  }
);

// ─── deleteUser ───────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/users/:id
 * @access  Private — ADMIN + DELETE
 */
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const adminId = req.user!.id;

    if (adminId === id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError('User not found', 404));

    await prisma.user.delete({ where: { id } });

    logger.warn(CTX, 'User deleted', { deletedId: id, email: user.email, by: adminId });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  }
);

// ─── updateUserPermissions ────────────────────────────────────────────────────

/**
 * @route   PATCH /api/users/:id/permissions
 * @access  Private — ADMIN (super-admin only)
 *
 * Empty permissions array = super-admin (full access).
 */
export const updateUserPermissions = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const adminId     = req.user!.id;
    // FIXED: was typed as `as string` which is incorrect — parse returns { permissions: [...] }
    const { permissions } = updatePermissionsSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError('User not found', 404));

    // Permissions are only meaningful for ADMIN users
    if (user.role !== 'ADMIN') {
      return next(new AppError('Permissions can only be configured for ADMIN users', 400));
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  { permissions: permissions as any },
    });

    logger.info(CTX, 'Permissions updated', { targetId: id, permissions, by: adminId });

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data:    { user: formatUser(updated) },
    });
  }
);

// ─── updateUserRole ───────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/users/:id/role
 * @access  Private — ADMIN (super-admin only)
 *
 * Demoting to USER automatically clears all permission flags.
 */
export const updateUserRole = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    const adminId = req.user!.id;
    const rawRole = typeof req.body.role === 'string'
      ? req.body.role.toUpperCase()
      : undefined;

    if (!rawRole || !['USER', 'ADMIN'].includes(rawRole)) {
      return next(new AppError('Invalid role. Use USER or ADMIN', 400));
    }
    if (adminId === id) {
      return next(new AppError('You cannot change your own role', 400));
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return next(new AppError('User not found', 404));

    const updated = await prisma.user.update({
      where: { id },
      data:  {
        role: rawRole as any,
        // Clear permissions when demoting to regular user
        permissions: rawRole === 'USER' ? [] : undefined,
      },
    });

    logger.info(CTX, 'User role updated', { targetId: id, from: target.role, to: rawRole, by: adminId });

    res.status(200).json({
      success: true,
      message: `User role updated to ${rawRole}`,
      data:    { user: formatUser(updated) },
    });
  }
);
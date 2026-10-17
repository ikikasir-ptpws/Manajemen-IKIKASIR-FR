import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
  deleteUser,
} from '../controllers/UserController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
} from '../validations/user.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: Mengambil semua data pengguna (dengan filter search, role, status)
 * GET /api/users
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  getAll
);

/**
 * Route: Mengambil detail pengguna berdasarkan ID
 * GET /api/users/:id
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  getById
);

/**
 * Route: Menambah pengguna baru sesuai form frontend
 * POST /api/users
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  validateBody(createUserSchema),
  create
);

/**
 * Route: Mengubah profil/data pengguna
 * PUT /api/users/:id
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  validateBody(updateUserSchema),
  update
);

/**
 * Route: Ubah status aktif/nonaktif pengguna secara cepat
 * PATCH /api/users/:id/status
 */
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  validateBody(toggleUserStatusSchema),
  toggleStatus
);

/**
 * Route: Menghapus pengguna
 * DELETE /api/users/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  deleteUser
);

export default router;

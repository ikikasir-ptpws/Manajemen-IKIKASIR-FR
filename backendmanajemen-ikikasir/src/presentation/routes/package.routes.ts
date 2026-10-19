import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
  deletePackage,
} from '../controllers/PackageController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createPackageSchema,
  updatePackageSchema,
  togglePackageStatusSchema,
} from '../validations/package.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: Mengambil daftar paket langganan (bisa diakses publik untuk landing page, atau dengan filter)
 * GET /api/packages
 */
router.get('/', getAll);

/**
 * Route: Mengambil detail satu paket berdasarkan ID
 * GET /api/packages/:id
 */
router.get('/:id', getById);

/**
 * Route: Menambah paket langganan baru sesuai form frontend
 * POST /api/packages
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(createPackageSchema),
  create
);

/**
 * Route: Memperbarui data paket langganan
 * PUT /api/packages/:id
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(updatePackageSchema),
  update
);

/**
 * Route: Toggle status aktif/nonaktif paket (tampil di landing page)
 * PATCH /api/packages/:id/status
 */
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(togglePackageStatusSchema),
  toggleStatus
);

/**
 * Route: Menghapus paket langganan
 * DELETE /api/packages/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  deletePackage
);

export default router;

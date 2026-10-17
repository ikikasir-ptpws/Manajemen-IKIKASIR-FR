import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteRole,
  getMenuCatalog,
} from '../controllers/RoleController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { createRoleSchema, updateRoleSchema } from '../validations/role.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: Ambil katalog master daftar menu untuk pembuatan switch toggle di frontend
 * GET /api/roles/menus/list
 */
router.get('/menus/list', authenticate, getMenuCatalog);

/**
 * Route: Mengambil semua daftar role hak akses beserta switch izin menu
 * GET /api/roles
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  getAll
);

/**
 * Route: Mengambil detail satu role berdasarkan ID
 * GET /api/roles/:id
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  getById
);

/**
 * Route: Menambah role baru beserta konfigurasi boolean switch menu
 * POST /api/roles
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  validateBody(createRoleSchema),
  create
);

/**
 * Route: Memperbarui nama role, deskripsi, dan switch menu
 * PUT /api/roles/:id
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  validateBody(updateRoleSchema),
  update
);

/**
 * Route: Menghapus role
 * DELETE /api/roles/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  deleteRole
);

export default router;

import { Router } from 'express';
import { RoleController } from '../controllers/RoleController.js';
import { PrismaRoleRepository } from '../../repositories/PrismaRoleRepository.js';
import {
  GetRolesUseCase,
  GetRoleByIdUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetMenuCatalogUseCase,
} from '../../application/usecases/RoleUseCases.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { createRoleSchema, updateRoleSchema } from '../validations/role.validation.js';
import { authenticate, authorizeRoles, authorizeMenuAccess } from '../middlewares/auth.middleware.js';

const router = Router();

// Dependensi
const roleRepository = new PrismaRoleRepository();
const getRolesUseCase = new GetRolesUseCase(roleRepository);
const getRoleByIdUseCase = new GetRoleByIdUseCase(roleRepository);
const createRoleUseCase = new CreateRoleUseCase(roleRepository);
const updateRoleUseCase = new UpdateRoleUseCase(roleRepository);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);
const getMenuCatalogUseCase = new GetMenuCatalogUseCase();

const roleController = new RoleController(
  getRolesUseCase,
  getRoleByIdUseCase,
  createRoleUseCase,
  updateRoleUseCase,
  deleteRoleUseCase,
  getMenuCatalogUseCase
);

/**
 * Route: Ambil katalog master daftar menu untuk pembuatan switch toggle di frontend
 * GET /api/roles/menus/list
 */
router.get('/menus/list', authenticate, roleController.getMenuCatalog);

/**
 * Route: Mengambil semua daftar role hak akses beserta switch izin menu
 * GET /api/roles
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  roleController.getAll
);

/**
 * Route: Mengambil detail satu role berdasarkan ID
 * GET /api/roles/:id
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  roleController.getById
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
  roleController.create
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
  roleController.update
);

/**
 * Route: Menghapus role
 * DELETE /api/roles/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  roleController.delete
);

export default router;

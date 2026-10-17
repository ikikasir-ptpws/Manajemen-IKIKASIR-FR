import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { BcryptPasswordService } from '../../infrastructure/security/BcryptPasswordService.js';
import {
  GetUsersUseCase,
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  ToggleUserStatusUseCase,
  DeleteUserUseCase,
} from '../../application/usecases/UserUseCases.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
} from '../validations/user.validation.js';
import { authenticate, authorizeRoles, authorizeMenuAccess } from '../middlewares/auth.middleware.js';

const router = Router();

// Dependensi
const userRepository = new PrismaUserRepository();
const passwordService = new BcryptPasswordService();

const getUsersUseCase = new GetUsersUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const createUserUseCase = new CreateUserUseCase(userRepository, passwordService);
const updateUserUseCase = new UpdateUserUseCase(userRepository, passwordService);
const toggleUserStatusUseCase = new ToggleUserStatusUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

const userController = new UserController(
  getUsersUseCase,
  getUserByIdUseCase,
  createUserUseCase,
  updateUserUseCase,
  toggleUserStatusUseCase,
  deleteUserUseCase
);

/**
 * Route: Mengambil semua data pengguna (dengan filter search, role, status)
 * GET /api/users
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  userController.getAll
);

/**
 * Route: Mengambil detail pengguna berdasarkan ID
 * GET /api/users/:id
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  userController.getById
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
  userController.create
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
  userController.update
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
  userController.toggleStatus
);

/**
 * Route: Menghapus pengguna
 * DELETE /api/users/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  userController.delete
);

export default router;

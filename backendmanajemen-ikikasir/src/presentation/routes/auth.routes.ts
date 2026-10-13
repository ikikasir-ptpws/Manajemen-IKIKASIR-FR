import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { BcryptPasswordService } from '../../infrastructure/security/BcryptPasswordService.js';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService.js';
import { LoginSuperAdminUseCase } from '../../application/usecases/LoginSuperAdminUseCase.js';
import { LoginSalesUseCase } from '../../application/usecases/LoginSalesUseCase.js';
import { LoginUseCase } from '../../application/usecases/LoginUseCase.js';
import { GetMeUseCase } from '../../application/usecases/GetMeUseCase.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import { loginSchema } from '../validations/auth.validation.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Inisialisasi Dependensi (Dependency Injection)
const userRepository = new PrismaUserRepository();
const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();

const loginSuperAdminUseCase = new LoginSuperAdminUseCase(
  userRepository,
  passwordService,
  tokenService
);
const loginSalesUseCase = new LoginSalesUseCase(
  userRepository,
  passwordService,
  tokenService
);
const loginUseCase = new LoginUseCase(
  userRepository,
  passwordService,
  tokenService
);
const getMeUseCase = new GetMeUseCase(userRepository);

const authController = new AuthController(
  loginSuperAdminUseCase,
  loginSalesUseCase,
  loginUseCase,
  getMeUseCase
);

/**
 * Route: Login Khusus Super Admin
 * URL: POST /api/auth/login/superadmin
 */
router.post('/login/superadmin', validateBody(loginSchema), authController.loginSuperAdmin);

/**
 * Route: Login Khusus Sales (Seles)
 * URL: POST /api/auth/login/sales
 * Alias: POST /api/auth/login/seles (mendukung ejaan 'seles')
 */
router.post('/login/sales', validateBody(loginSchema), authController.loginSales);
router.post('/login/seles', validateBody(loginSchema), authController.loginSales);

/**
 * Route: Login Umum (Otomatis mendeteksi role Super Admin / Sales)
 * URL: POST /api/auth/login
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * Route: Ambil Profil Pengguna Saat Ini
 * URL: GET /api/auth/me
 * Memerlukan Header: Authorization: Bearer <token>
 */
router.get('/me', authenticate, authController.getMe);

export default router;

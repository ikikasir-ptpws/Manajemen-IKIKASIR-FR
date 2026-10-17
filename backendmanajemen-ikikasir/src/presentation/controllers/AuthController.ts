import { Request, Response, NextFunction } from 'express';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { BcryptPasswordService } from '../../infrastructure/security/BcryptPasswordService.js';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService.js';
import { LoginSuperAdminUseCase } from '../../application/usecases/LoginSuperAdminUseCase.js';
import { LoginSalesUseCase } from '../../application/usecases/LoginSalesUseCase.js';
import { LoginUseCase } from '../../application/usecases/LoginUseCase.js';
import { GetMeUseCase } from '../../application/usecases/GetMeUseCase.js';
import { UnauthorizedError } from '../../domain/errors/AppError.js';

// Inisialisasi dependensi di level modul
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

/**
 * Endpoint Login Khusus Super Admin
 * POST /api/auth/login/superadmin
 */
export const loginSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginSuperAdminUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login Super Admin berhasil! Selamat datang kembali.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Login Khusus Sales (Seles)
 * POST /api/auth/login/sales
 */
export const loginSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginSalesUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login Sales berhasil! Selamat bekerja.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Login Umum (Otomatis mendeteksi role akun)
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUseCase.execute({ email, password });

    res.status(200).json({
      success: true,
      message: `Login berhasil sebagai ${result.user.role}!`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Mendapatkan Data Profil User Aktif
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError('Sesi pengguna tidak valid.');
    }

    const profile = await getMeUseCase.execute(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Data profil pengguna berhasil diambil.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// Export objek controller untuk fleksibilitas import
export const AuthController = {
  loginSuperAdmin,
  loginSales,
  login,
  getMe,
};

export default AuthController;

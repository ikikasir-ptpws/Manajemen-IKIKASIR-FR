import { Request, Response, NextFunction } from 'express';
import { LoginSuperAdminUseCase } from '../../application/usecases/LoginSuperAdminUseCase.js';
import { LoginSalesUseCase } from '../../application/usecases/LoginSalesUseCase.js';
import { LoginUseCase } from '../../application/usecases/LoginUseCase.js';
import { GetMeUseCase } from '../../application/usecases/GetMeUseCase.js';
import { UnauthorizedError } from '../../domain/errors/AppError.js';

/**
 * Controller untuk menangani endpoint autentikasi
 */
export class AuthController {
  constructor(
    private readonly loginSuperAdminUseCase: LoginSuperAdminUseCase,
    private readonly loginSalesUseCase: LoginSalesUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase
  ) {}

  /**
   * Endpoint Login Khusus Super Admin
   * POST /api/auth/login/superadmin
   */
  public loginSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.loginSuperAdminUseCase.execute({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login Super Admin berhasil! Selamat datang kembali.',
        data: result,
      });
    } catch (error) {
      // Teruskan ke error handling middleware
      next(error);
    }
  };

  /**
   * Endpoint Login Khusus Sales (Seles)
   * POST /api/auth/login/sales
   */
  public loginSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.loginSalesUseCase.execute({ email, password });

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
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUseCase.execute({ email, password });

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
   * Memerlukan token Bearer JWT yang valid
   */
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Sesi pengguna tidak valid.');
      }

      const profile = await this.getMeUseCase.execute(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Data profil pengguna berhasil diambil.',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };
}

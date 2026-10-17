import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService.js';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError.js';
import { TokenPayload } from '../../domain/interfaces/ITokenService.js';
import { MenuAccessProps } from '../../domain/entities/Role.js';

// Perluas tipe Request dari Express untuk menyertakan user yang terautentikasi
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const tokenService = new JwtTokenService();
const userRepository = new PrismaUserRepository();

/**
 * Middleware Autentikasi JWT
 * Memverifikasi header 'Authorization: Bearer <token>' dan memastikan akun masih aktif
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Header autentikasi (Authorization) tidak ditemukan.');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Format header autentikasi harus berupa: Bearer <token>.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token JWT tidak disertakan.');
    }

    // Verifikasi validitas dan masa berlaku token
    const decodedPayload = tokenService.verifyToken(token);

    // Verifikasi bahwa user pemilik token masih aktif di database
    const user = await userRepository.findById(decodedPayload.id);
    if (!user) {
      throw new UnauthorizedError('Pengguna pemilik token tidak lagi ditemukan dalam sistem.');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Akun Anda telah dinonaktifkan oleh manajemen sistem.');
    }

    // Sematkan payload user ke objek request Express
    req.user = decodedPayload;
    next();
  } catch (error) {
    // Meneruskan error autentikasi ke error middleware
    next(error);
  }
}

/**
 * Normalisasi nama role untuk perbandingan case-insensitive
 */
function normalizeRole(role: string): string {
  return (role || '').toUpperCase().replace(/[\s_-]+/g, '');
}

/**
 * Middleware Otorisasi Berdasarkan Role (Role-Based Access Control / RBAC)
 * Mendukung variasi nama seperti 'SUPERADMIN', 'Super Admin', 'SALES', 'Sales', dll.
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Akses tidak diizinkan. Silakan login terlebih dahulu.');
      }

      const userRoleNormalized = normalizeRole(req.user.role);
      const isAllowed = allowedRoles.some((r) => normalizeRole(r) === userRoleNormalized);

      if (!isAllowed) {
        throw new ForbiddenError(
          `Akses ditolak: Resource ini memerlukan salah satu role berikut: [${allowedRoles.join(', ')}]. Role Anda: '${req.user.role}'.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware Otorisasi Berdasarkan Hak Akses Menu Boolean
 * Mengecek apakah role pengguna memiliki izin aktif pada switch menu tertentu
 */
export function authorizeMenuAccess(menuKey: keyof MenuAccessProps) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Akses tidak diizinkan. Silakan login terlebih dahulu.');
      }

      // Ambil user beserta detail role dan switch boolean akses menu
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedError('Data pengguna tidak ditemukan.');
      }

      // Super Admin selalu memiliki bypass penuh ke semua modul
      if (user.isSuperAdmin()) {
        return next();
      }

      // Cek izin boolean pada switch menu role pengguna
      const menuAccess = user.roleDetail?.menuAccess;
      const hasPermission = Boolean(menuAccess && (menuAccess as any)[menuKey]);

      if (!hasPermission) {
        throw new ForbiddenError(
          `Akses ditolak: Akun role '${user.role}' tidak memiliki izin switch akses ke menu '${String(menuKey)}'.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

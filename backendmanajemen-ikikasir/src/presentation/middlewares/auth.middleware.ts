import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../../infrastructure/security/JwtTokenService.js';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError.js';
import { UserRole } from '../../domain/enums/Role.js';
import { TokenPayload } from '../../domain/interfaces/ITokenService.js';

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
 * Middleware Otorisasi Berdasarkan Role (Role-Based Access Control / RBAC)
 * Contoh: authorizeRoles(UserRole.SUPERADMIN)
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Akses tidak diizinkan. Silakan login terlebih dahulu.');
      }

      const hasRole = allowedRoles.includes(req.user.role);
      if (!hasRole) {
        throw new ForbiddenError(
          `Akses ditolak: Resource ini memerlukan salah satu role berikut: [${allowedRoles.join(', ')}]. Role Anda saat ini: '${req.user.role}'.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

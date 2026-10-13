import { z } from 'zod';
import { UserRole } from '../../domain/enums/Role.js';

/**
 * Schema Validasi untuk Permintaan Login (Super Admin & Sales)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Alamat email wajib diisi.')
    .email('Format alamat email tidak valid (contoh: user@ikikasir.com).'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi.')
    .min(6, 'Kata sandi minimal harus terdiri dari 6 karakter.'),
});

/**
 * Schema Validasi untuk Registrasi User Baru
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal harus terdiri dari 2 karakter.'),
  email: z
    .string()
    .trim()
    .min(1, 'Alamat email wajib diisi.')
    .email('Format alamat email tidak valid.'),
  password: z
    .string()
    .min(6, 'Kata sandi minimal harus terdiri dari 6 karakter.'),
  role: z.enum([
    UserRole.SUPERADMIN,
    UserRole.SALES,
    UserRole.ADMIN,
    UserRole.STAFF,
    UserRole.KASIR,
  ]),
  phone: z.string().optional(),
});

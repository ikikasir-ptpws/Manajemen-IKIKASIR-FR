import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter.'),
  email: z
    .string()
    .trim()
    .min(1, 'Alamat email wajib diisi.')
    .email('Format alamat email tidak valid (contoh: user@ikikasir.com).'),
  password: z
    .string()
    .min(6, 'Kata sandi minimal harus terdiri dari 6 karakter.'),
  role: z
    .string()
    .trim()
    .min(1, 'Role hak akses wajib dipilih.'),
  roleId: z.string().trim().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  phone: z.string().trim().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter.')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Format alamat email tidak valid.')
    .optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
    }),
  role: z.string().trim().optional(),
  roleId: z.string().trim().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  phone: z.string().trim().optional().nullable(),
});

export const toggleUserStatusSchema = z.object({
  status: z.enum(['Active', 'Inactive']).optional(),
});

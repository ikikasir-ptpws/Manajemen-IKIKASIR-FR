import { z } from 'zod';

export const menuAccessSchema = z.object({
  dashboard: z.boolean().optional(),
  manajemenPengguna: z.boolean().optional(),
  manajemenRole: z.boolean().optional(),
  manajemenPromo: z.boolean().optional(),
  kelolaPaket: z.boolean().optional(),
  calonClient: z.boolean().optional(),
  semuaPelanggan: z.boolean().optional(),
  langganan: z.boolean().optional(),
  expired: z.boolean().optional(),
  arusKas: z.boolean().optional(),
  labaRugi: z.boolean().optional(),
  neraca: z.boolean().optional(),
  laporanPenjualan: z.boolean().optional(),
  landingPage: z.boolean().optional(),
});

export const menuCrudPermissionSchema = z.object({
  create: z.boolean().default(false),
  read: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
});

export const rolePermissionsSchema = z.record(z.string(), menuCrudPermissionSchema);

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama role minimal terdiri dari 2 karakter.'),
  description: z.string().trim().optional().nullable(),
  menuAccess: menuAccessSchema.optional(),
  permissions: rolePermissionsSchema.optional(),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama role minimal terdiri dari 2 karakter.')
    .optional(),
  description: z.string().trim().optional().nullable(),
  menuAccess: menuAccessSchema.optional(),
  permissions: rolePermissionsSchema.optional(),
});


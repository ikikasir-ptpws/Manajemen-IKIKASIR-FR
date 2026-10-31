import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama pelanggan minimal terdiri dari 2 karakter.'),
  businessName: z
    .string()
    .trim()
    .min(2, 'Nama usaha / toko minimal terdiri dari 2 karakter.'),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.'),
  phone: z
    .string()
    .trim()
    .min(6, 'Nomor telepon / WhatsApp minimal terdiri dari 6 karakter.'),
  address: z.string().trim().optional(),
  village: z.string().trim().optional(),
  district: z.string().trim().optional(),
  city: z.string().trim().optional(),
  packageId: z.string().trim().optional().nullable(),
  billingCycleMonths: z
    .number()
    .int('Durasi bulan harus berupa bilangan bulat.')
    .min(1, 'Durasi bulan minimal 1 bulan.')
    .optional(),
  paymentMethod: z.string().trim().optional(),
  paymentAmount: z.number().min(0).optional(),
  paymentProofUrl: z.string().trim().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional(),
  paymentStatus: z.string().trim().optional(),
  appUsername: z.string().trim().optional(),
  appPassword: z.string().trim().optional(),
  technicianStatus: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  referralCode: z
    .string()
    .trim()
    .max(40, 'Kode referral terlalu panjang.')
    .optional()
    .or(z.literal('')),
  source: z.string().trim().optional(),
  referralSource: z.string().trim().optional(),
});

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama pelanggan minimal terdiri dari 2 karakter.')
    .optional(),
  businessName: z
    .string()
    .trim()
    .min(2, 'Nama usaha / toko minimal terdiri dari 2 karakter.')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.')
    .optional(),
  phone: z
    .string()
    .trim()
    .min(6, 'Nomor telepon / WhatsApp minimal terdiri dari 6 karakter.')
    .optional(),
  address: z.string().trim().optional(),
  village: z.string().trim().optional(),
  district: z.string().trim().optional(),
  city: z.string().trim().optional(),
  packageId: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  paymentAmount: z.number().min(0).optional(),
  paymentProofUrl: z.string().trim().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional(),
  paymentStatus: z.string().trim().optional(),
  appUsername: z.string().trim().optional(),
  appPassword: z.string().trim().optional(),
  technicianStatus: z.string().trim().optional(),
});

export const renewSubscriptionSchema = z.object({
  packageId: z.string().uuid('ID Paket harus berupa UUID valid.').optional().nullable(),
  billingCycleMonths: z
    .number()
    .int('Durasi bulan harus berupa angka bulat.')
    .min(1, 'Durasi minimal 1 bulan.')
    .optional(),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  customAmount: z.number().min(0, 'Nominal pembayaran tidak boleh negatif.').optional(),
});

export const checkSubscriptionSchema = z.object({
  email: z.string().trim().min(3, 'Parameter email harus disertakan.'),
});

export const simulateExpiredSchema = z.object({
  email: z.string().trim().min(3, 'Email pelanggan harus diisi.'),
  daysAgo: z.number().int().min(1, 'Jumlah hari minimal 1 hari.').optional(),
});

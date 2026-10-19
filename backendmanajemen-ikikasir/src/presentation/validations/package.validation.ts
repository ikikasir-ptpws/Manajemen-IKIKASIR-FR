import { z } from 'zod';

export const createPackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama paket minimal terdiri dari 2 karakter.'),
  description: z.string().trim().optional().nullable(),
  cardSub: z.string().trim().optional().nullable(),
  price: z.number().min(0, 'Harga tidak boleh bernilai negatif.').optional(),
  period: z.string().trim().optional(),
  isConsultation: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  featuresText: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updatePackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama paket minimal terdiri dari 2 karakter.')
    .optional(),
  description: z.string().trim().optional().nullable(),
  cardSub: z.string().trim().optional().nullable(),
  price: z.number().min(0, 'Harga tidak boleh bernilai negatif.').optional(),
  period: z.string().trim().optional(),
  isConsultation: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  featuresText: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const togglePackageStatusSchema = z.object({
  isActive: z.boolean().optional(),
});

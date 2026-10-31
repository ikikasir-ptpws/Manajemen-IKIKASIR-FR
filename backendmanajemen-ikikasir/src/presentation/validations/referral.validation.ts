import { z } from 'zod';

export const requestReferralWithdrawalSchema = z.object({
  amount: z
    .number()
    .positive('Nominal penarikan harus lebih dari Rp 0.')
    .min(1, 'Nominal penarikan minimal Rp 1.'),
  bankOrWallet: z.string().trim().min(2, 'Bank atau e-wallet tujuan wajib dipilih.'),
  accountNumber: z.string().trim().min(4, 'Nomor rekening minimal 4 karakter.'),
  accountHolder: z.string().trim().min(2, 'Nama pemilik rekening wajib diisi.'),
  notes: z.string().trim().optional(),
});

export const updateReferralWithdrawalSchema = z.object({
  status: z.enum(['MENUNGGU_VERIFIKASI', 'SELESAI', 'DITOLAK'], {
    message: 'Status pencairan tidak valid.',
  }),
  notes: z.string().trim().optional(),
});

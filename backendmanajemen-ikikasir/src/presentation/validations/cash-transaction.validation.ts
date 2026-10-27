import { z } from 'zod';

export const createIncomeSchema = z.object({
  date: z.string().trim().min(1, 'Tanggal transaksi wajib diisi.'),
  displayDate: z.string().trim().optional(),
  time: z.string().trim().optional(),
  customer: z.string().trim().min(1, 'Nama pelanggan / sumber pemasukan wajib diisi.'),
  desc: z.string().trim().optional(),
  category: z.string().trim().min(1, 'Kategori pemasukan wajib dipilih.'),
  amount: z.coerce.number().positive('Nominal pemasukan harus lebih besar dari 0.'),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createExpenseSchema = z.object({
  date: z.string().trim().min(1, 'Tanggal pengeluaran wajib diisi.'),
  displayDate: z.string().trim().optional(),
  time: z.string().trim().optional(),
  desc: z.string().trim().min(1, 'Keterangan pengeluaran wajib diisi.'),
  category: z.string().trim().min(1, 'Kategori pengeluaran wajib dipilih.'),
  amount: z.coerce.number().positive('Nominal pengeluaran harus lebih besar dari 0.'),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createCashTransactionSchema = z.object({
  type: z.enum(['masuk', 'keluar'], {
    error: 'Tipe transaksi harus berupa "masuk" atau "keluar".',
  }),
  date: z.string().trim().min(1, 'Tanggal transaksi wajib diisi.'),
  displayDate: z.string().trim().optional(),
  time: z.string().trim().optional(),
  customer: z.string().trim().optional(),
  desc: z.string().trim().optional(),
  category: z.string().trim().min(1, 'Kategori transaksi wajib diisi.'),
  amount: z.coerce.number().positive('Nominal transaksi harus lebih besar dari 0.'),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateCashTransactionSchema = z.object({
  date: z.string().trim().optional(),
  displayDate: z.string().trim().optional(),
  time: z.string().trim().optional(),
  customer: z.string().trim().optional(),
  desc: z.string().trim().optional(),
  category: z.string().trim().optional(),
  amount: z.coerce.number().positive().optional(),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

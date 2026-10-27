import { Router } from 'express';
import {
  getAll,
  getSummary,
  getById,
  createIncome,
  createExpense,
  createTransaction,
  update,
  deleteTransaction,
} from '../controllers/CashTransactionController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createIncomeSchema,
  createExpenseSchema,
  createCashTransactionSchema,
  updateCashTransactionSchema,
} from '../validations/cash-transaction.validation.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Menggunakan optionalAuthenticate agar fleksibel saat testing frontend
router.use(optionalAuthenticate);

/**
 * Route: Mengambil ringkasan metrik arus kas (Total Masuk, Total Keluar, Saldo Bersih)
 * GET /api/cashflow/summary
 */
router.get('/summary', getSummary);

/**
 * Route: Mengambil seluruh daftar transaksi arus kas (dengan filter tanggal, tipe, dan search)
 * GET /api/cashflow
 */
router.get('/', getAll);

/**
 * Route: Mengambil detail satu transaksi arus kas by ID
 * GET /api/cashflow/:id
 */
router.get('/:id', getById);

/**
 * Route: Mencatat pemasukan kas baru
 * POST /api/cashflow/income
 */
router.post(
  '/income',
  validateBody(createIncomeSchema),
  createIncome
);

/**
 * Route: Mencatat pengeluaran kas baru
 * POST /api/cashflow/expense
 */
router.post(
  '/expense',
  validateBody(createExpenseSchema),
  createExpense
);

/**
 * Route: Mencatat transaksi arus kas secara fleksibel (tipe 'masuk' atau 'keluar')
 * POST /api/cashflow
 */
router.post(
  '/',
  validateBody(createCashTransactionSchema),
  createTransaction
);

/**
 * Route: Memperbarui transaksi arus kas
 * PUT /api/cashflow/:id
 */
router.put(
  '/:id',
  validateBody(updateCashTransactionSchema),
  update
);

/**
 * Route: Menghapus transaksi arus kas
 * DELETE /api/cashflow/:id
 */
router.delete('/:id', deleteTransaction);

export default router;

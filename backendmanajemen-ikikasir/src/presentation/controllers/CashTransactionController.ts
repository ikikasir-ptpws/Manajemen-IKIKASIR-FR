import { Request, Response, NextFunction } from 'express';
import { PrismaCashTransactionRepository } from '../../repositories/PrismaCashTransactionRepository.js';
import { CashTransactionUseCases } from '../../application/usecases/CashTransactionUseCases.js';

const cashRepo = new PrismaCashTransactionRepository();
const cashUseCases = new CashTransactionUseCases(cashRepo);

/**
 * Controller: Mengambil daftar transaksi arus kas beserta ringkasan metrik
 * GET /api/cashflow
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const type = (req.query.type as any) || undefined;
    const search = (req.query.search as string) || (req.query.q as string) || undefined;
    const category = (req.query.category as string) || undefined;

    const result = await cashUseCases.getAllTransactions({
      startDate,
      endDate,
      type,
      search,
      category,
    });

    res.status(200).json({
      success: true,
      message: 'Data transaksi arus kas berhasil diambil.',
      data: result.transactions,
      summary: result.summary,
      total: result.transactions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil ringkasan metrik arus kas (Total Masuk, Total Keluar, Saldo Bersih)
 * GET /api/cashflow/summary
 */
export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const summary = await cashUseCases.getSummary({
      startDate,
      endDate,
      search,
    });

    res.status(200).json({
      success: true,
      message: 'Ringkasan metrik arus kas berhasil diambil.',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil detail satu transaksi arus kas berdasarkan ID
 * GET /api/cashflow/:id
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const transaction = await cashUseCases.getTransactionById(id);

    res.status(200).json({
      success: true,
      message: 'Detail transaksi arus kas berhasil diambil.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mencatat transaksi pemasukan kas
 * POST /api/cashflow/income
 */
export const createIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await cashUseCases.createIncome(req.body);

    res.status(201).json({
      success: true,
      message: 'Pemasukan kas berhasil dicatat.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mencatat transaksi pengeluaran kas
 * POST /api/cashflow/expense
 */
export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await cashUseCases.createExpense(req.body);

    res.status(201).json({
      success: true,
      message: 'Pengeluaran kas berhasil dicatat.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mencatat transaksi arus kas secara fleksibel (tipe 'masuk' atau 'keluar')
 * POST /api/cashflow
 */
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await cashUseCases.createTransaction(req.body);

    res.status(201).json({
      success: true,
      message: `${transaction.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} kas berhasil dicatat.`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Memperbarui transaksi arus kas
 * PUT /api/cashflow/:id
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await cashUseCases.updateTransaction(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Transaksi arus kas berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menghapus transaksi arus kas
 * DELETE /api/cashflow/:id
 */
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await cashUseCases.deleteTransaction(id);

    res.status(200).json({
      success: true,
      message: 'Transaksi arus kas berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

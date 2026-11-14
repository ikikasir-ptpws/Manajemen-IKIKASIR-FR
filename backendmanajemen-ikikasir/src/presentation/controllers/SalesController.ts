import { Request, Response, NextFunction } from 'express';
import { SalesUseCases } from '../../application/usecases/SalesUseCases.js';
import { ForbiddenError } from '../../domain/errors/AppError.js';

const salesUseCases = new SalesUseCases();

const ensureSalesOwnsResource = (req: Request, userId: string): void => {
  const role = (req.user?.role || '').toUpperCase().replace(/[\s_-]+/g, '');
  if ((role === 'SALES' || role === 'SELES') && req.user?.id !== userId) {
    throw new ForbiddenError('Sales hanya dapat mengakses data dan saldo miliknya sendiri.');
  }
};

export const listSales = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sales = await salesUseCases.getSalesList();

    res.status(200).json({
      success: true,
      message: 'Daftar sales berhasil diambil.',
      data: sales,
      total: sales.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    ensureSalesOwnsResource(req, userId);
    const dashboard = await salesUseCases.getSalesDashboard(userId);

    res.status(200).json({
      success: true,
      message: 'Dashboard sales berhasil diambil.',
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    ensureSalesOwnsResource(req, userId);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;

    const result = await salesUseCases.getSalesClients(userId, { page, limit, search, status });

    res.status(200).json({
      success: true,
      message: 'Daftar client sales berhasil diambil.',
      data: result.items,
      total: result.total,
      meta: {
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateReferralCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    ensureSalesOwnsResource(req, userId);
    const referralCode = await salesUseCases.generateSalesReferralCode(userId);

    res.status(200).json({
      success: true,
      message: 'Kode referral sales berhasil dibuat.',
      data: { referralCode },
    });
  } catch (error) {
    next(error);
  }
};

export const validateReferralCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = (req.query.code as string) || '';
    const validation = await salesUseCases.validateSalesReferralCode(code);

    res.status(200).json({
      success: true,
      message: validation.message,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

export const requestWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenError('Sesi pengguna tidak valid.');
    const payload = { ...req.body, userId };
    const withdrawal = await salesUseCases.createSalesWithdrawal(payload);

    res.status(201).json({
      success: true,
      message: 'Permintaan penarikan saldo sales berhasil dibuat.',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllWithdrawals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const result = await salesUseCases.getSalesWithdrawals(undefined, { status, search, page, limit });

    res.status(200).json({
      success: true,
      message: 'Daftar penarikan sales berhasil diambil.',
      data: result.items,
      total: result.total,
      summary: result.summary,
      meta: {
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesWithdrawals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    ensureSalesOwnsResource(req, userId);
    const result = await salesUseCases.getSalesWithdrawals(userId);

    res.status(200).json({
      success: true,
      message: 'Riwayat penarikan sales berhasil diambil.',
      data: result.items,
      total: result.total,
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const payload = req.body;
    const processedBy = req.user?.name || 'Super Admin';
    const result = await salesUseCases.confirmSalesWithdrawalPayout(id, payload, processedBy);

    res.status(200).json({
      success: true,
      message: payload.status === 'SELESAI' ? 'Penarikan sales berhasil dikonfirmasi.' : 'Penarikan sales berhasil ditolak.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

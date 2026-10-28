import { Request, Response, NextFunction } from 'express';
import { PrismaFinancialReportRepository } from '../../repositories/PrismaFinancialReportRepository.js';
import { LabaRugiUseCases } from '../../application/usecases/LabaRugiUseCases.js';
import { NeracaUseCases } from '../../application/usecases/NeracaUseCases.js';
import { LaporanPenjualanUseCases } from '../../application/usecases/LaporanPenjualanUseCases.js';

const reportRepo = new PrismaFinancialReportRepository();
const labaRugiUseCases = new LabaRugiUseCases(reportRepo);
const neracaUseCases = new NeracaUseCases(reportRepo, labaRugiUseCases);
const laporanPenjualanUseCases = new LaporanPenjualanUseCases(reportRepo);

/**
 * Helper untuk membaca parameter query periode & pencarian
 */
function readFilter(req: Request) {
  return {
    startDate: (req.query.startDate as string) || undefined,
    endDate: (req.query.endDate as string) || undefined,
    search: (req.query.search as string) || (req.query.q as string) || undefined,
    status: (req.query.status as string) || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
}

/**
 * Controller: Mengambil laporan laba rugi beserta rincian pendapatan & beban
 * GET /api/laporan/laba-rugi
 */
export const getLabaRugi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await labaRugiUseCases.getLabaRugi(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Laporan laba rugi berhasil diambil.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil neraca (balance sheet) beserta rincian aset, kewajiban, dan ekuitas
 * GET /api/laporan/neraca
 */
export const getNeraca = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await neracaUseCases.getNeraca(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Laporan neraca berhasil diambil.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil laporan penjualan beserta ringkasan metrik & paginasi
 * GET /api/laporan/penjualan
 */
export const getLaporanPenjualan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await laporanPenjualanUseCases.getLaporanPenjualan(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Laporan penjualan berhasil diambil.',
      data: result.items,
      summary: result.summary,
      meta: result.meta,
      total: result.meta.total,
    });
  } catch (error) {
    next(error);
  }
};

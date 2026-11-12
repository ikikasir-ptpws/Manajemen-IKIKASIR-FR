import { Request, Response, NextFunction } from 'express';
import { PrismaDashboardRepository } from '../../repositories/PrismaDashboardRepository.js';
import { DashboardUseCases } from '../../application/usecases/DashboardUseCases.js';

const dashboardRepo = new PrismaDashboardRepository();
const dashboardUseCases = new DashboardUseCases(dashboardRepo);

/**
 * Helper untuk membaca parameter query dashboard
 */
function readFilter(req: Request) {
  const toNumber = (value: unknown): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const toDateString = (value: unknown): string | undefined => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return undefined;

    const trimmed = raw.trim();
    // Format tanggal yang dipakai: YYYY-MM-DD
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
  };

  return {
    expiringDays: toNumber(req.query.expiringDays),
    limit: toNumber(req.query.limit),
    chartDays: toNumber(req.query.chartDays),
    chartPoints: toNumber(req.query.chartPoints),
    periodStartDate: toDateString(req.query.startDate),
    periodEndDate: toDateString(req.query.endDate),
  };
}

/**
 * Controller: Mengambil seluruh data dashboard (KPI, pelanggan expired, aktivitas, grafik arus kas)
 * GET /api/dashboard
 */
export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardUseCases.getDashboardData(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Data dashboard berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil ringkasan metrik dashboard
 * GET /api/dashboard/summary
 */
export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await dashboardUseCases.getSummary(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Ringkasan dashboard berhasil diambil.',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil data grafik arus kas untuk dashboard
 * GET /api/dashboard/cashflow-chart
 */
export const getDashboardCashFlowChart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cashFlowChart = await dashboardUseCases.getCashFlowChart(readFilter(req));

    res.status(200).json({
      success: true,
      message: 'Grafik arus kas dashboard berhasil diambil.',
      data: cashFlowChart,
    });
  } catch (error) {
    next(error);
  }
};

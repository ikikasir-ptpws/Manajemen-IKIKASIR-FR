import { Request, Response, NextFunction } from 'express';
import { PrismaCustomerRepository } from '../../repositories/PrismaCustomerRepository.js';
import { PrismaPackageRepository } from '../../repositories/PrismaPackageRepository.js';
import { CustomerUseCases } from '../../application/usecases/CustomerUseCases.js';

const customerRepository = new PrismaCustomerRepository();
const packageRepository = new PrismaPackageRepository();
const customerUseCases = new CustomerUseCases(customerRepository, packageRepository);

/**
 * Endpoint Utama untuk Pengecekan Android:
 * GET /api/subscriptions/check?email=...
 * POST /api/subscriptions/check { email: "..." }
 *
 * Mengembalikan:
 * - canAccess: boolean (true jika aktif, false jika expired/suspended/not_found)
 * - status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'NOT_FOUND'
 * - isExpired: boolean
 * - expiresAt: ISO String
 * - daysRemaining: number
 * - message: Pesan untuk ditampilkan di popup Android jika expired
 */
export const checkSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const emailQuery = (req.query.email as string) || (req.query.id as string) || (req.query.uid as string);
    const emailBody = req.body?.email || req.body?.id || req.body?.uid;
    const emailParams = req.params?.email || req.params?.id;
    const emailHeader = (req.headers['x-user-email'] as string) || (req.headers['x-customer-email'] as string);
    const targetEmailOrId = emailQuery || emailBody || emailParams || emailHeader;

    const result = await customerUseCases.checkSubscription(targetEmailOrId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint Pengujian Cepat Expired:
 * POST /api/subscriptions/simulate-expired { email: "...", daysAgo: 1 }
 *
 * Mengubah masa aktif pelanggan ke masa lalu agar developer/tester
 * bisa langsung melihat popup kadaluarsa di aplikasi Android!
 */
export const simulateExpired = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updated = await customerUseCases.simulateExpired(req.body);

    res.status(200).json({
      success: true,
      message: `[Simulasi Berhasil] Pelanggan '${updated.name}' (${updated.email}) kini berstatus EXPIRED dengan tanggal ${updated.expiresAt}. Pengecekan di Android sekarang akan memunculkan popup kadaluarsa.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { PrismaCustomerRepository } from '../../repositories/PrismaCustomerRepository.js';
import { PrismaReferralRepository } from '../../repositories/PrismaReferralRepository.js';
import { PrismaLeadRepository } from '../../repositories/PrismaLeadRepository.js';
import { ReferralUseCases } from '../../application/usecases/ReferralUseCases.js';

const customerRepository = new PrismaCustomerRepository();
const referralRepository = new PrismaReferralRepository();
const leadRepository = new PrismaLeadRepository();
const referralUseCases = new ReferralUseCases(customerRepository, referralRepository, leadRepository);

/**
 * Ringkasan halaman Referral untuk aplikasi Android (menggunakan email lisensi pelanggan)
 * GET /api/referrals/overview?email=...
 * POST /api/referrals/overview { email: "..." }
 */
export const getClientOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const emailQuery = (req.query.email as string) || (req.query.id as string);
    const emailBody = req.body?.email || req.body?.id;
    const emailHeader = (req.headers['x-user-email'] as string) || (req.headers['x-customer-email'] as string);
    const target = emailQuery || emailBody || emailHeader || req.params.id || 'ikikasir.id@gmail.com';

    const overview = await referralUseCases.getOverview(target);

    res.status(200).json({
      success: true,
      message: 'Data program referral berhasil dimuat.',
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengajukan Calon Client dari aplikasi Android menggunakan kode referral pemilik toko
 * POST /api/referrals/submit-client
 */
export const submitClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await referralUseCases.submitClientByReferral(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pengajuan pencairan saldo komisi referral dari aplikasi Android
 * POST /api/referrals/withdraw
 */
export const clientWithdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const emailHeader = (req.headers['x-user-email'] as string) || (req.headers['x-customer-email'] as string);
    const email = req.body?.email || emailHeader;
    const withdrawal = await referralUseCases.requestWithdrawalByEmail({
      ...req.body,
      email,
    });

    res.status(201).json({
      success: true,
      message: 'Permintaan pencairan referral berhasil diajukan dan menunggu verifikasi finance.',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validasi kode referral yang digunakan client pada halaman Tambah Client
 * GET /api/referrals/validate?code=IKIKASIR-XXXXX
 */
export const validateCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = (req.query.code as string) || (req.params.code as string) || '';
    const result = await referralUseCases.validateReferralCode(code);

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
 * Ringkasan halaman Referral untuk seorang pelanggan
 * GET /api/referrals/customers/:id
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const overview = await referralUseCases.getOverview(id);

    res.status(200).json({
      success: true,
      message: 'Data referral pelanggan berhasil diambil.',
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permintaan pencairan saldo komisi referral
 * POST /api/referrals/customers/:id/withdrawals
 */
export const requestWithdrawal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const withdrawal = await referralUseCases.requestWithdrawal(id, req.body);

    res.status(201).json({
      success: true,
      message: 'Permintaan pencairan referral berhasil dibuat dan menunggu verifikasi finance.',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifikasi pencairan oleh finance
 * PATCH /api/referrals/withdrawals/:id
 */
export const updateWithdrawalStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const withdrawal = await referralUseCases.updateWithdrawalStatus(id, req.body);

    res.status(200).json({
      success: true,
      message: `Status pencairan referral berhasil diperbarui menjadi ${withdrawal.status}.`,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

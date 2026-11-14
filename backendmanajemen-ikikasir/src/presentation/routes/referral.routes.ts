import { Router } from 'express';
import {
  validateCode,
  getOverview,
  getClientOverview,
  submitClient,
  clientWithdraw,
  requestWithdrawal,
  updateWithdrawalStatus,
  getWithdrawals,
  confirmWithdrawal,
  markWithdrawalWaSent,
} from '../controllers/ReferralController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  requestReferralWithdrawalSchema,
  updateReferralWithdrawalSchema,
  confirmWithdrawalSchema,
} from '../validations/referral.validation.js';
import { authenticate, authorizeRoles, authorizeMenuAccess } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Rute Publik / Terbuka untuk Aplikasi Android (menggunakan email lisensi toko / SubscriptionApiConfig.CLIENT_EMAIL):
 */
router.get('/overview', getClientOverview);
router.post('/overview', getClientOverview);
router.get('/client', getClientOverview);
router.post('/submit-client', submitClient);
router.post('/withdraw', clientWithdraw);
router.get('/validate', validateCode);

// Semua rute manajemen referral di bawah memerlukan autentikasi Admin / Super Admin
router.use(authenticate);

/**
 * Route: Validasi kode referral yang dipakai client
 * GET /api/referrals/validate?code=IKIKASIR-XXXXX
 */
router.get(
  '/validate',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateCode
);

/**
 * Route: Mengambil ringkasan halaman Referral (kode, upline, saldo, downline, pencairan)
 * GET /api/referrals/customers/:id
 */
router.get(
  '/customers/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  getOverview
);

/**
 * Route: Membuat permintaan pencairan saldo komisi referral
 * POST /api/referrals/customers/:id/withdrawals
 */
router.post(
  '/customers/:id/withdrawals',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(requestReferralWithdrawalSchema),
  requestWithdrawal
);

/**
 * Route: Memperbarui status pencairan referral (verifikasi finance)
 * PATCH /api/referrals/withdrawals/:id
 */
router.patch(
  '/withdrawals/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'FINANCE', 'Finance'),
  validateBody(updateReferralWithdrawalSchema),
  updateWithdrawalStatus
);

/**
 * Route: Daftar seluruh permintaan pencairan referral (halaman Penarikan Referral)
 * GET /api/referrals/withdrawals?status=&search=&page=&limit=
 */
router.get(
  '/withdrawals',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'FINANCE', 'Finance'),
  authorizeMenuAccess('penarikanReferral'),
  getWithdrawals
);

/**
 * Route: Konfirmasi pembayaran pencairan referral (dana dikirim manual oleh finance)
 * PATCH /api/referrals/withdrawals/:id/payment
 */
router.patch(
  '/withdrawals/:id/payment',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'FINANCE', 'Finance'),
  authorizeMenuAccess('penarikanReferral'),
  validateBody(confirmWithdrawalSchema),
  confirmWithdrawal
);

/**
 * Route: Tandai bukti penarikan sudah dikirim ke pelanggan via WhatsApp
 * POST /api/referrals/withdrawals/:id/wa-sent
 */
router.post(
  '/withdrawals/:id/wa-sent',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'FINANCE', 'Finance'),
  authorizeMenuAccess('penarikanReferral'),
  markWithdrawalWaSent
);

export default router;

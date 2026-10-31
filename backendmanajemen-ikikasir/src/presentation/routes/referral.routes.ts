import { Router } from 'express';
import {
  validateCode,
  getOverview,
  getClientOverview,
  submitClient,
  clientWithdraw,
  requestWithdrawal,
  updateWithdrawalStatus,
} from '../controllers/ReferralController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  requestReferralWithdrawalSchema,
  updateReferralWithdrawalSchema,
} from '../validations/referral.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

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
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
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
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(updateReferralWithdrawalSchema),
  updateWithdrawalStatus
);

export default router;

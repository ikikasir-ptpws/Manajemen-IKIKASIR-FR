import { Router } from 'express';
import {
  checkSubscription,
  simulateExpired,
} from '../controllers/SubscriptionController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  simulateExpiredSchema,
} from '../validations/customer.validation.js';

const router = Router();

/**
 * Route: Pengecekan Status Langganan dari Aplikasi Android
 * GET /api/subscriptions/check?email=user@example.com
 * POST /api/subscriptions/check { email: "user@example.com" }
 *
 * Endpoint ini dapat diakses langsung oleh aplikasi Android (mengirimkan email akun Firebase)
 * Mengembalikan status aktif / expired, sisa hari, dan pesan notifikasi popup.
 */
router.get('/check', checkSubscription);
router.post('/check', checkSubscription);

/**
 * Route: Simulasi Expired (Pengujian Android)
 * POST /api/subscriptions/simulate-expired
 * Body: { email: "user@example.com", daysAgo: 2 }
 *
 * Mengubah tanggal kadaluarsa pelanggan ke masa lampau agar developer/tester
 * bisa langsung menguji tampilan dialog popup kadaluarsa di Android.
 */
router.post('/simulate-expired', validateBody(simulateExpiredSchema), simulateExpired);

export default router;

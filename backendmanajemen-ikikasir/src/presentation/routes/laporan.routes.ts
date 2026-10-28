import { Router } from 'express';
import { getLabaRugi, getNeraca, getLaporanPenjualan } from '../controllers/LaporanController.js';
import { authenticate, authorizeMenuAccess } from '../middlewares/auth.middleware.js';

const router = Router();

// Seluruh data laporan keuangan bersifat sensitif sehingga wajib diakses akun terautentikasi
router.use(authenticate);

/**
 * Route: Mengambil laporan laba rugi
 * GET /api/laporan/laba-rugi
 */
router.get('/laba-rugi', authorizeMenuAccess('labaRugi'), getLabaRugi);

/**
 * Route: Mengambil laporan neraca (balance sheet)
 * GET /api/laporan/neraca
 */
router.get('/neraca', authorizeMenuAccess('neraca'), getNeraca);

/**
 * Route: Mengambil laporan penjualan
 * GET /api/laporan/penjualan
 */
router.get('/penjualan', authorizeMenuAccess('laporanPenjualan'), getLaporanPenjualan);

export default router;

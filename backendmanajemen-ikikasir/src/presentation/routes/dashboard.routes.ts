import { Router } from 'express';
import {
  getDashboard,
  getDashboardSummary,
  getDashboardCashFlowChart,
} from '../controllers/DashboardController.js';
import { authenticate, authorizeMenuAccess } from '../middlewares/auth.middleware.js';

const router = Router();

// Seluruh data dashboard bersifat sensitif sehingga wajib diakses akun terautentikasi
router.use(authenticate);

/**
 * Route: Mengambil seluruh data dashboard
 * GET /api/dashboard
 */
router.get('/', authorizeMenuAccess('dashboard'), getDashboard);

/**
 * Route: Mengambil ringkasan metrik dashboard
 * GET /api/dashboard/summary
 */
router.get('/summary', authorizeMenuAccess('dashboard'), getDashboardSummary);

/**
 * Route: Mengambil data grafik arus kas dashboard
 * GET /api/dashboard/cashflow-chart
 */
router.get('/cashflow-chart', authorizeMenuAccess('dashboard'), getDashboardCashFlowChart);

export default router;

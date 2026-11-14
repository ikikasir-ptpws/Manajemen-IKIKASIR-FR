import { Router } from 'express';
import {
  listSales,
  getSalesDashboard,
  getSalesClients,
  generateReferralCode,
  validateReferralCode,
  requestWithdrawal,
  getAllWithdrawals,
  getSalesWithdrawals,
  confirmWithdrawal,
} from '../controllers/SalesController.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/validate-code', validateReferralCode);

router.use(authenticate);

router.get(
  '/',
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  listSales
);

router.get(
  '/withdrawals',
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  getAllWithdrawals
);

router.post(
  '/withdrawals',
  authorizeRoles('SALES', 'Sales', 'SELES', 'Seles'),
  requestWithdrawal
);

router.get(
  '/:userId/dashboard',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'SALES', 'Sales', 'SELES', 'Seles'),
  getSalesDashboard
);

router.get(
  '/:userId/clients',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'SALES', 'Sales', 'SELES', 'Seles'),
  getSalesClients
);

router.post(
  '/:userId/generate-code',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'SALES', 'Sales', 'SELES', 'Seles'),
  generateReferralCode
);

router.get(
  '/:userId/withdrawals',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'SALES', 'Sales', 'SELES', 'Seles'),
  getSalesWithdrawals
);

router.patch(
  '/withdrawals/:id/confirm',
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  confirmWithdrawal
);

export default router;

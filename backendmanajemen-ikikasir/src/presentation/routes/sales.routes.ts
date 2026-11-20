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
import { authenticate, authorizeRoles, authorizeSalesListRead } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/validate-code', validateReferralCode);

router.use(authenticate);

router.get(
  '/',
  authorizeSalesListRead,
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
  authorizeSalesListRead,
  getSalesDashboard
);

router.get(
  '/:userId/clients',
  authorizeSalesListRead,
  getSalesClients
);

router.post(
  '/:userId/generate-code',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'SALES', 'Sales', 'SELES', 'Seles'),
  generateReferralCode
);

router.get(
  '/:userId/withdrawals',
  authorizeSalesListRead,
  getSalesWithdrawals
);

router.patch(
  '/withdrawals/:id/confirm',
  authorizeRoles('SUPERADMIN', 'Super Admin'),
  confirmWithdrawal
);

export default router;

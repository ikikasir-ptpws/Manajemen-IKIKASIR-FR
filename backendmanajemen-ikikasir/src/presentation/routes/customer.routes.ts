import { Router } from 'express';
import {
  getAll,
  getExpired,
  getById,
  create,
  update,
  renew,
  deleteCustomer,
  getHistories,
} from '../controllers/CustomerController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  renewSubscriptionSchema,
} from '../validations/customer.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Semua rute manajemen pelanggan di bawah memerlukan autentikasi Admin / Super Admin
router.use(authenticate);

/**
 * Route: Mengambil daftar pelanggan kedaluwarsa (Menu Expired)
 * GET /api/customers/expired
 */
router.get('/expired', getExpired);

/**
 * Route: Mengambil daftar seluruh pelanggan
 * GET /api/customers
 */
router.get('/', getAll);

/**
 * Route: Mengambil detail satu pelanggan by ID
 * GET /api/customers/:id
 */
router.get('/:id', getById);

/**
 * Route: Mengambil riwayat pembayaran / invoice langganan pelanggan
 * GET /api/customers/:id/histories
 */
router.get('/:id/histories', getHistories);

/**
 * Route: Mendaftarkan pelanggan baru
 * POST /api/customers
 */
router.post(
  '/',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateBody(createCustomerSchema),
  create
);

/**
 * Route: Memperbarui data profil pelanggan
 * PUT /api/customers/:id
 */
router.put(
  '/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(updateCustomerSchema),
  update
);

/**
 * Route: Memperpanjang masa aktif pelanggan (Renew Subscription)
 * POST /api/customers/:id/renew
 */
router.post(
  '/:id/renew',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateBody(renewSubscriptionSchema),
  renew
);

/**
 * Route: Menghapus pelanggan
 * DELETE /api/customers/:id
 */
router.delete(
  '/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  deleteCustomer
);

export default router;

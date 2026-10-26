import { Router } from 'express';
import {
  getAll,
  getStatistics,
  getById,
  create,
  update,
  updateStatus,
  addFollowUp,
  approve,
  reject,
  deleteLead,
} from '../controllers/LeadController.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  addFollowUpSchema,
  approveLeadSchema,
  rejectLeadSchema,
} from '../validations/lead.validation.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: Mendaftarkan calon client baru (Bisa dari Website/Landing Page publik maupun form admin)
 * POST /api/leads
 */
router.post(
  '/',
  validateBody(createLeadSchema),
  create
);

// Rute di bawah ini memerlukan login autentikasi Admin / Super Admin / Sales
router.use(authenticate);

/**
 * Route: Mengambil metrik statistik calon client
 * GET /api/leads/statistics
 */
router.get('/statistics', getStatistics);

/**
 * Route: Mengambil daftar seluruh calon client (dengan search & filter)
 * GET /api/leads
 */
router.get('/', getAll);

/**
 * Route: Mengambil detail satu calon client by ID
 * GET /api/leads/:id
 */
router.get('/:id', getById);

/**
 * Route: Memperbarui data profil calon client
 * PUT /api/leads/:id
 */
router.put(
  '/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateBody(updateLeadSchema),
  update
);

/**
 * Route: Memperbarui status prospek calon client (New, Contacted, Follow Up, Interested, Converted, Lost)
 * PATCH /api/leads/:id/status
 */
router.patch(
  '/:id/status',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateBody(updateLeadStatusSchema),
  updateStatus
);

/**
 * Route: Menambahkan catatan riwayat follow-up
 * POST /api/leads/:id/follow-up
 */
router.post(
  '/:id/follow-up',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'SALES', 'Sales'),
  validateBody(addFollowUpSchema),
  addFollowUp
);

/**
 * Route: Menyetujui calon client menjadi pelanggan aktif (Convert to Customer)
 * POST /api/leads/:id/approve
 */
router.post(
  '/:id/approve',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin', 'FINANCE', 'Finance'),
  validateBody(approveLeadSchema),
  approve
);

/**
 * Route: Menolak calon client (Status Lost)
 * POST /api/leads/:id/reject
 */
router.post(
  '/:id/reject',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  validateBody(rejectLeadSchema),
  reject
);

/**
 * Route: Menghapus data calon client
 * DELETE /api/leads/:id
 */
router.delete(
  '/:id',
  authorizeRoles('SUPERADMIN', 'Super Admin', 'ADMIN', 'Admin'),
  deleteLead
);

export default router;

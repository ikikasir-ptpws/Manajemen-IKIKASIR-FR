import { Router } from 'express';
import { getAll, create, update, deleteItem } from '../controllers/NeracaItemController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Seluruh operasi pos neraca hanya untuk pengguna terautentikasi
router.use(authenticate);

/**
 * GET /api/neraca-items
 * Ambil semua pos neraca (Aset Tetap, Kewajiban Lancar, Kewajiban JP)
 */
router.get('/', getAll);

/**
 * POST /api/neraca-items
 * Tambah pos neraca baru
 * Body: { group, name, amount, sortOrder? }
 */
router.post('/', create);

/**
 * PUT /api/neraca-items/:id
 * Update pos neraca berdasarkan ID
 * Body: { name?, amount?, sortOrder? }
 */
router.put('/:id', update);

/**
 * DELETE /api/neraca-items/:id
 * Hapus pos neraca berdasarkan ID
 */
router.delete('/:id', deleteItem);

export default router;

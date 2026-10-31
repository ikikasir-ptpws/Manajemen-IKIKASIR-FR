import { Request, Response, NextFunction } from 'express';
import { PrismaNeracaItemRepository } from '../../repositories/PrismaNeracaItemRepository.js';

const repo = new PrismaNeracaItemRepository();

const VALID_GROUPS = ['aset_tetap', 'kewajiban_lancar', 'kewajiban_jangka_panjang'];

/**
 * GET /api/neraca-items
 * Ambil semua pos neraca, dikelompokkan per group
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await repo.findAll();

    // Kelompokkan per group untuk memudahkan konsumsi frontend
    const grouped = {
      aset_tetap: items.filter((i) => i.group === 'aset_tetap'),
      kewajiban_lancar: items.filter((i) => i.group === 'kewajiban_lancar'),
      kewajiban_jangka_panjang: items.filter((i) => i.group === 'kewajiban_jangka_panjang'),
    };

    res.status(200).json({
      success: true,
      message: 'Data pos neraca berhasil diambil.',
      data: items,
      grouped,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/neraca-items
 * Tambah pos neraca baru
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group, name, amount, sortOrder } = req.body;

    if (!group || !VALID_GROUPS.includes(group)) {
      res.status(400).json({
        success: false,
        message: `Group tidak valid. Harus salah satu dari: ${VALID_GROUPS.join(', ')}`,
      });
      return;
    }

    if (!name || String(name).trim() === '') {
      res.status(400).json({ success: false, message: 'Nama pos wajib diisi.' });
      return;
    }

    const amt = Number(amount);
    if (isNaN(amt)) {
      res.status(400).json({ success: false, message: 'Nominal harus berupa angka.' });
      return;
    }

    const item = await repo.create({
      group,
      name: String(name).trim(),
      amount: amt,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Pos neraca berhasil ditambahkan.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/neraca-items/:id
 * Update pos neraca berdasarkan ID
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, amount, sortOrder } = req.body;

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pos neraca tidak ditemukan.' });
      return;
    }

    const updated = await repo.update(id, {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    });

    res.status(200).json({
      success: true,
      message: 'Pos neraca berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/neraca-items/:id
 * Hapus pos neraca berdasarkan ID
 */
export const deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await repo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pos neraca tidak ditemukan.' });
      return;
    }

    await repo.delete(id);

    res.status(200).json({
      success: true,
      message: 'Pos neraca berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

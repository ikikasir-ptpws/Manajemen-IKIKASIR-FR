import { prisma } from '../infrastructure/database/prisma.js';

export interface NeracaItemData {
  id: string;
  group: string;
  name: string;
  amount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNeracaItemDto {
  group: string;
  name: string;
  amount: number;
  sortOrder?: number;
}

export interface UpdateNeracaItemDto {
  name?: string;
  amount?: number;
  sortOrder?: number;
}

export class PrismaNeracaItemRepository {
  private toData(record: any): NeracaItemData {
    return {
      id: record.id,
      group: record.group,
      name: record.name,
      amount: Number(record.amount),
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Ambil semua item neraca, dikelompokkan per group
   */
  async findAll(): Promise<NeracaItemData[]> {
    const records = await prisma.neracaItem.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return records.map((r) => this.toData(r));
  }

  /**
   * Ambil item berdasarkan group tertentu
   */
  async findByGroup(group: string): Promise<NeracaItemData[]> {
    const records = await prisma.neracaItem.findMany({
      where: { group },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return records.map((r) => this.toData(r));
  }

  /**
   * Tambah item neraca baru
   */
  async create(dto: CreateNeracaItemDto): Promise<NeracaItemData> {
    const record = await prisma.neracaItem.create({
      data: {
        group: dto.group,
        name: dto.name.trim(),
        amount: dto.amount,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.toData(record);
  }

  /**
   * Update item neraca berdasarkan ID
   */
  async update(id: string, dto: UpdateNeracaItemDto): Promise<NeracaItemData> {
    const record = await prisma.neracaItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return this.toData(record);
  }

  /**
   * Hapus item neraca berdasarkan ID
   */
  async delete(id: string): Promise<void> {
    await prisma.neracaItem.delete({ where: { id } });
  }

  /**
   * Cek apakah item ada
   */
  async findById(id: string): Promise<NeracaItemData | null> {
    const record = await prisma.neracaItem.findUnique({ where: { id } });
    return record ? this.toData(record) : null;
  }
}

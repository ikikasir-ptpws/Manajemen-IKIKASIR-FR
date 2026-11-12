import { prisma } from '../infrastructure/database/prisma.js';
export class PrismaNeracaItemRepository {
    toData(record) {
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
    async findAll() {
        const records = await prisma.neracaItem.findMany({
            orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        return records.map((r) => this.toData(r));
    }
    /**
     * Ambil item berdasarkan group tertentu
     */
    async findByGroup(group) {
        const records = await prisma.neracaItem.findMany({
            where: { group },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        return records.map((r) => this.toData(r));
    }
    /**
     * Tambah item neraca baru
     */
    async create(dto) {
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
    async update(id, dto) {
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
    async delete(id) {
        await prisma.neracaItem.delete({ where: { id } });
    }
    /**
     * Cek apakah item ada
     */
    async findById(id) {
        const record = await prisma.neracaItem.findUnique({ where: { id } });
        return record ? this.toData(record) : null;
    }
}
//# sourceMappingURL=PrismaNeracaItemRepository.js.map
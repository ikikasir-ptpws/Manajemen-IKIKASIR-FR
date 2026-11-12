import { prisma } from '../infrastructure/database/prisma.js';
import { Package } from '../domain/entities/Package.js';
import { InternalServerError } from '../domain/errors/AppError.js';
export class PrismaPackageRepository {
    mapToDomain(record) {
        return new Package({
            id: record.id,
            name: record.name,
            description: record.description,
            price: record.price,
            period: record.period,
            isConsultation: record.isConsultation,
            features: record.features,
            isActive: record.isActive,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
    async findAll(filter) {
        try {
            const where = {};
            if (filter?.search && filter.search.trim()) {
                const q = filter.search.trim();
                where.OR = [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ];
            }
            if (filter?.isActive !== undefined) {
                where.isActive = filter.isActive;
            }
            const records = await prisma.package.findMany({
                where,
                orderBy: [
                    { price: 'asc' },
                    { createdAt: 'asc' },
                ],
            });
            return records.map((r) => this.mapToDomain(r));
        }
        catch (error) {
            console.error('❌ [PrismaPackageRepository] Gagal mengambil list paket:', error);
            throw new InternalServerError('Terjadi kesalahan saat memuat daftar paket langganan.');
        }
    }
    async findById(id) {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (isUuid) {
                const record = await prisma.package.findUnique({
                    where: { id },
                });
                if (record)
                    return this.mapToDomain(record);
            }
            // Fallback: cari berdasarkan nama paket
            const byName = await prisma.package.findFirst({
                where: { name: { equals: id, mode: 'insensitive' } },
            });
            if (byName)
                return this.mapToDomain(byName);
            return null;
        }
        catch (error) {
            console.error(`❌ [PrismaPackageRepository] Gagal mencari paket ID (${id}):`, error);
            return null;
        }
    }
    async create(data) {
        try {
            const record = await prisma.package.create({
                data: {
                    name: data.name.trim(),
                    description: data.description !== undefined ? data.description : '',
                    price: data.price ?? 0,
                    period: data.period !== undefined ? data.period : '/bulan',
                    isConsultation: Boolean(data.isConsultation),
                    features: data.features ?? [],
                    isActive: data.isActive !== undefined ? data.isActive : true,
                },
            });
            return this.mapToDomain(record);
        }
        catch (error) {
            console.error('❌ [PrismaPackageRepository] Gagal membuat paket baru:', error);
            throw new InternalServerError('Gagal menyimpan paket langganan baru.');
        }
    }
    async update(id, data) {
        try {
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name.trim();
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.price !== undefined)
                updateData.price = data.price;
            if (data.period !== undefined)
                updateData.period = data.period;
            if (data.isConsultation !== undefined)
                updateData.isConsultation = Boolean(data.isConsultation);
            if (data.features !== undefined)
                updateData.features = data.features;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            const record = await prisma.package.update({
                where: { id },
                data: updateData,
            });
            return this.mapToDomain(record);
        }
        catch (error) {
            console.error(`❌ [PrismaPackageRepository] Gagal memperbarui paket ID (${id}):`, error);
            throw new InternalServerError('Gagal memperbarui data paket langganan.');
        }
    }
    async updateStatus(id, isActive) {
        try {
            const record = await prisma.package.update({
                where: { id },
                data: { isActive },
            });
            return this.mapToDomain(record);
        }
        catch (error) {
            console.error(`❌ [PrismaPackageRepository] Gagal toggle status paket ID (${id}):`, error);
            throw new InternalServerError('Gagal mengubah status aktif paket.');
        }
    }
    async delete(id) {
        try {
            await prisma.package.delete({
                where: { id },
            });
        }
        catch (error) {
            console.error(`❌ [PrismaPackageRepository] Gagal menghapus paket ID (${id}):`, error);
            throw new InternalServerError('Gagal menghapus paket langganan.');
        }
    }
}
//# sourceMappingURL=PrismaPackageRepository.js.map
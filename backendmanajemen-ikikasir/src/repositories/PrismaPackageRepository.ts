import { prisma } from '../infrastructure/database/prisma.js';
import {
  IPackageRepository,
  CreatePackageData,
  UpdatePackageData,
  PackageFilter,
} from '../domain/interfaces/IPackageRepository.js';
import { Package } from '../domain/entities/Package.js';
import { InternalServerError } from '../domain/errors/AppError.js';

export class PrismaPackageRepository implements IPackageRepository {
  private mapToDomain(record: any): Package {
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

  public async findAll(filter?: PackageFilter): Promise<Package[]> {
    try {
      const where: any = {};

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
    } catch (error) {
      console.error('❌ [PrismaPackageRepository] Gagal mengambil list paket:', error);
      throw new InternalServerError('Terjadi kesalahan saat memuat daftar paket langganan.');
    }
  }

  public async findById(id: string): Promise<Package | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const record = await prisma.package.findUnique({
          where: { id },
        });
        if (record) return this.mapToDomain(record);
      }

      // Fallback: cari berdasarkan nama paket
      const byName = await prisma.package.findFirst({
        where: { name: { equals: id, mode: 'insensitive' } },
      });
      if (byName) return this.mapToDomain(byName);

      return null;
    } catch (error) {
      console.error(`❌ [PrismaPackageRepository] Gagal mencari paket ID (${id}):`, error);
      return null;
    }
  }

  public async create(data: CreatePackageData): Promise<Package> {
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
    } catch (error) {
      console.error('❌ [PrismaPackageRepository] Gagal membuat paket baru:', error);
      throw new InternalServerError('Gagal menyimpan paket langganan baru.');
    }
  }

  public async update(id: string, data: UpdatePackageData): Promise<Package> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.period !== undefined) updateData.period = data.period;
      if (data.isConsultation !== undefined) updateData.isConsultation = Boolean(data.isConsultation);
      if (data.features !== undefined) updateData.features = data.features;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const record = await prisma.package.update({
        where: { id },
        data: updateData,
      });

      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaPackageRepository] Gagal memperbarui paket ID (${id}):`, error);
      throw new InternalServerError('Gagal memperbarui data paket langganan.');
    }
  }

  public async updateStatus(id: string, isActive: boolean): Promise<Package> {
    try {
      const record = await prisma.package.update({
        where: { id },
        data: { isActive },
      });

      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaPackageRepository] Gagal toggle status paket ID (${id}):`, error);
      throw new InternalServerError('Gagal mengubah status aktif paket.');
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await prisma.package.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`❌ [PrismaPackageRepository] Gagal menghapus paket ID (${id}):`, error);
      throw new InternalServerError('Gagal menghapus paket langganan.');
    }
  }
}

import { prisma } from '../infrastructure/database/prisma.js';
import {
  ICustomerRepository,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerFilter,
  CreateSubscriptionHistoryData,
} from '../domain/interfaces/ICustomerRepository.js';
import { Customer } from '../domain/entities/Customer.js';
import { SubscriptionHistory } from '../domain/entities/SubscriptionHistory.js';
import { InternalServerError } from '../domain/errors/AppError.js';

export class PrismaCustomerRepository implements ICustomerRepository {
  private mapToDomain(record: any): Customer {
    return new Customer({
      id: record.id,
      name: record.name,
      businessName: record.businessName,
      email: record.email,
      phone: record.phone,
      address: record.address,
      packageId: record.packageId,
      packageName: record.package?.name ?? 'Custom',
      packagePrice: record.package?.price ?? 0,
      packagePeriod: record.package?.period ?? '/bulan',
      status: record.status,
      startedAt: record.startedAt,
      expiresAt: record.expiresAt,
      notes: record.notes,
      paymentProofUrl: record.paymentProofUrl ?? '',
      paymentMethod: record.paymentMethod ?? 'QRIS',
      paymentAmount: record.paymentAmount ?? record.package?.price ?? 0,
      paymentDate: record.paymentDate ?? record.startedAt,
      paymentStatus: record.paymentStatus ?? 'PAID',
      appUsername: record.appUsername ?? '',
      appPassword: record.appPassword ?? '',
      technicianStatus: record.technicianStatus ?? 'completed',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  private mapHistoryToDomain(record: any): SubscriptionHistory {
    return new SubscriptionHistory({
      id: record.id,
      customerId: record.customerId,
      packageId: record.packageId,
      packageName: record.packageName,
      amount: record.amount,
      billingCycleMonths: record.billingCycleMonths,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus,
      paymentProofUrl: record.paymentProofUrl ?? '',
      notes: record.notes,
      startedAt: record.startedAt,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    });
  }

  public async findAll(filter?: CustomerFilter): Promise<Customer[]> {
    try {
      const where: any = {};

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { businessName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (filter?.packageId) {
        where.packageId = filter.packageId;
      }

      const records = await prisma.customer.findMany({
        where,
        include: {
          package: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let results = records.map((r) => this.mapToDomain(r));

      // Filter berdasarkan status kalkulasi jika diminta
      if (filter?.status && filter.status !== 'ALL') {
        const targetStatus = filter.status.toUpperCase();
        results = results.filter((c) => c.getComputedStatus() === targetStatus);
      }

      return results;
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil data pelanggan: ${(error as Error).message}`);
    }
  }

  public async findById(id: string): Promise<Customer | null> {
    try {
      const record = await prisma.customer.findUnique({
        where: { id },
        include: { package: true },
      });

      return record ? this.mapToDomain(record) : null;
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil data pelanggan berdasarkan ID: ${(error as Error).message}`);
    }
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    try {
      const record = await prisma.customer.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { package: true },
      });

      return record ? this.mapToDomain(record) : null;
    } catch (error) {
      throw new InternalServerError(`Gagal mencari pelanggan berdasarkan email: ${(error as Error).message}`);
    }
  }

  public async create(data: CreateCustomerData): Promise<Customer> {
    try {
      const record = await prisma.customer.create({
        data: {
          name: data.name.trim(),
          businessName: data.businessName.trim(),
          email: data.email.toLowerCase().trim(),
          phone: data.phone.trim(),
          address: data.address ?? '',
          packageId: data.packageId ?? null,
          status: data.status ?? 'ACTIVE',
          startedAt: data.startedAt ?? new Date(),
          expiresAt: data.expiresAt,
          notes: data.notes ?? '',
          paymentProofUrl: data.paymentProofUrl ?? '',
          paymentMethod: data.paymentMethod ?? 'QRIS',
          paymentAmount: data.paymentAmount ?? 0,
          paymentDate: data.paymentDate ?? (data.startedAt ?? new Date()),
          paymentStatus: data.paymentStatus ?? 'PAID',
          appUsername: data.appUsername ?? '',
          appPassword: data.appPassword ?? '',
          technicianStatus: data.technicianStatus ?? 'completed',
        },
        include: { package: true },
      });

      return this.mapToDomain(record);
    } catch (error) {
      throw new InternalServerError(`Gagal menyimpan data pelanggan baru: ${(error as Error).message}`);
    }
  }

  public async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.businessName !== undefined) updateData.businessName = data.businessName.trim();
      if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
      if (data.phone !== undefined) updateData.phone = data.phone.trim();
      if (data.address !== undefined) updateData.address = data.address;
      if (data.packageId !== undefined) updateData.packageId = data.packageId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.paymentProofUrl !== undefined) updateData.paymentProofUrl = data.paymentProofUrl;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.paymentAmount !== undefined) updateData.paymentAmount = data.paymentAmount;
      if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.appUsername !== undefined) updateData.appUsername = data.appUsername;
      if (data.appPassword !== undefined) updateData.appPassword = data.appPassword;
      if (data.technicianStatus !== undefined) updateData.technicianStatus = data.technicianStatus;

      const record = await prisma.customer.update({
        where: { id },
        data: updateData,
        include: { package: true },
      });

      return this.mapToDomain(record);
    } catch (error) {
      throw new InternalServerError(`Gagal memperbarui data pelanggan: ${(error as Error).message}`);
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerError(`Gagal menghapus data pelanggan: ${(error as Error).message}`);
    }
  }

  public async findExpired(search?: string): Promise<Customer[]> {
    try {
      const where: any = {};

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { businessName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ];
      }

      const records = await prisma.customer.findMany({
        where,
        include: { package: true },
        orderBy: {
          expiresAt: 'asc',
        },
      });

      const now = new Date();
      return records
        .map((r) => this.mapToDomain(r))
        .filter((c) => c.isExpired(now) || c.status === 'EXPIRED');
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil daftar pelanggan kedaluwarsa: ${(error as Error).message}`);
    }
  }

  public async addSubscriptionHistory(data: CreateSubscriptionHistoryData): Promise<SubscriptionHistory> {
    try {
      const record = await prisma.subscriptionHistory.create({
        data: {
          customerId: data.customerId,
          packageId: data.packageId ?? null,
          packageName: data.packageName,
          amount: data.amount,
          billingCycleMonths: data.billingCycleMonths,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          paymentProofUrl: data.paymentProofUrl ?? '',
          notes: data.notes ?? '',
          startedAt: data.startedAt,
          expiresAt: data.expiresAt,
        },
      });

      return this.mapHistoryToDomain(record);
    } catch (error) {
      throw new InternalServerError(`Gagal menyimpan riwayat pembayaran langganan: ${(error as Error).message}`);
    }
  }

  public async getSubscriptionHistories(customerId?: string): Promise<SubscriptionHistory[]> {
    try {
      const where: any = {};
      if (customerId) {
        where.customerId = customerId;
      }

      const records = await prisma.subscriptionHistory.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return records.map((r) => this.mapHistoryToDomain(r));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil riwayat pembayaran langganan: ${(error as Error).message}`);
    }
  }
}

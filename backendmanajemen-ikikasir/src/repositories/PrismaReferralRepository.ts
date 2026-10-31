import { prisma } from '../infrastructure/database/prisma.js';
import {
  IReferralRepository,
  CreateReferralCommissionData,
  CreateReferralWithdrawalData,
} from '../domain/interfaces/IReferralRepository.js';
import { ReferralCommission } from '../domain/entities/ReferralCommission.js';
import { ReferralWithdrawal } from '../domain/entities/ReferralWithdrawal.js';
import { InternalServerError } from '../domain/errors/AppError.js';

export class PrismaReferralRepository implements IReferralRepository {
  private toCommissionEntity(record: any): ReferralCommission {
    return new ReferralCommission({
      id: record.id,
      uplineId: record.uplineId,
      downlineId: record.downlineId,
      amount: record.amount,
      status: record.status,
      notes: record.notes ?? '',
      createdAt: record.createdAt,
      activatedAt: record.activatedAt ?? null,
      downlineName: record.downline?.name ?? '',
      downlineBusinessName: record.downline?.businessName ?? '',
      downlinePhone: record.downline?.phone ?? '',
      downlineStatus: record.downline?.status ?? '',
    });
  }

  private toWithdrawalEntity(record: any): ReferralWithdrawal {
    return new ReferralWithdrawal({
      id: record.id,
      customerId: record.customerId,
      amount: record.amount,
      bankOrWallet: record.bankOrWallet ?? '',
      accountNumber: record.accountNumber ?? '',
      accountHolder: record.accountHolder ?? '',
      requestDate: record.requestDate,
      completedDate: record.completedDate ?? null,
      status: record.status,
      notes: record.notes ?? '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public async createCommission(data: CreateReferralCommissionData): Promise<ReferralCommission> {
    try {
      const record = await prisma.referralCommission.create({
        data: {
          uplineId: data.uplineId,
          downlineId: data.downlineId,
          amount: data.amount,
          status: data.status ?? 'MENUNGGU_VERIFIKASI',
          notes: data.notes ?? '',
          activatedAt: data.status === 'AKTIF' ? new Date() : null,
        },
        include: { downline: true },
      });
      return this.toCommissionEntity(record);
    } catch (error) {
      throw new InternalServerError(`Gagal menyimpan komisi referral: ${(error as Error).message}`);
    }
  }

  public async findCommissionByUplineAndDownline(uplineId: string, downlineId: string): Promise<ReferralCommission | null> {
    try {
      const record = await prisma.referralCommission.findUnique({
        where: { uplineId_downlineId: { uplineId, downlineId } },
        include: { downline: true },
      });
      return record ? this.toCommissionEntity(record) : null;
    } catch (error) {
      throw new InternalServerError(`Gagal mencari komisi referral: ${(error as Error).message}`);
    }
  }

  public async findCommissionsByUpline(uplineId: string): Promise<ReferralCommission[]> {
    try {
      const records = await prisma.referralCommission.findMany({
        where: { uplineId },
        include: { downline: true },
        orderBy: { createdAt: 'desc' },
      });
      return records.map((r) => this.toCommissionEntity(r));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil daftar downline referral: ${(error as Error).message}`);
    }
  }

  public async findCommissionsByDownline(downlineId: string): Promise<ReferralCommission[]> {
    try {
      const records = await prisma.referralCommission.findMany({
        where: { downlineId },
        include: { downline: true },
        orderBy: { createdAt: 'desc' },
      });
      return records.map((r) => this.toCommissionEntity(r));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil riwayat referral pelanggan: ${(error as Error).message}`);
    }
  }

  public async updateCommissionStatus(id: string, status: string, notes?: string): Promise<ReferralCommission> {
    try {
      const record = await prisma.referralCommission.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : undefined,
          activatedAt: status === 'AKTIF' ? new Date() : undefined,
        },
        include: { downline: true },
      });
      return this.toCommissionEntity(record);
    } catch (error) {
      throw new InternalServerError(`Gagal memperbarui status komisi referral: ${(error as Error).message}`);
    }
  }

  public async createWithdrawal(data: CreateReferralWithdrawalData): Promise<ReferralWithdrawal> {
    try {
      const record = await prisma.referralWithdrawal.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          bankOrWallet: data.bankOrWallet,
          accountNumber: data.accountNumber,
          accountHolder: data.accountHolder,
          status: data.status ?? 'MENUNGGU_VERIFIKASI',
          notes: data.notes ?? '',
        },
      });
      return this.toWithdrawalEntity(record);
    } catch (error) {
      throw new InternalServerError(`Gagal menyimpan permintaan pencairan referral: ${(error as Error).message}`);
    }
  }

  public async findWithdrawalsByCustomer(customerId: string): Promise<ReferralWithdrawal[]> {
    try {
      const records = await prisma.referralWithdrawal.findMany({
        where: { customerId },
        orderBy: { requestDate: 'desc' },
      });
      return records.map((r) => this.toWithdrawalEntity(r));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil riwayat pencairan referral: ${(error as Error).message}`);
    }
  }

  public async findWithdrawalById(id: string): Promise<ReferralWithdrawal | null> {
    try {
      const record = await prisma.referralWithdrawal.findUnique({ where: { id } });
      return record ? this.toWithdrawalEntity(record) : null;
    } catch (error) {
      throw new InternalServerError(`Gagal mencari permintaan pencairan referral: ${(error as Error).message}`);
    }
  }

  public async updateWithdrawalStatus(id: string, status: string, notes?: string): Promise<ReferralWithdrawal> {
    try {
      const record = await prisma.referralWithdrawal.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : undefined,
          completedDate: status === 'SELESAI' ? new Date() : undefined,
        },
      });
      return this.toWithdrawalEntity(record);
    } catch (error) {
      throw new InternalServerError(`Gagal memperbarui status pencairan referral: ${(error as Error).message}`);
    }
  }
}

import { prisma } from '../../infrastructure/database/prisma.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../domain/errors/AppError.js';

export const SALES_COMMISSION_PER_CLIENT = 15000;
export const SALES_REFERRAL_CODE_PREFIX = 'SALES-';
const SALES_ROLE_NAMES = ['SALES', 'SELES'];

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatDateID = (date?: Date | null): string => {
  if (!date) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
};

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSalesWithdrawalDto {
  userId: string;
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string;
}

export interface ConfirmSalesWithdrawalDto {
  status: 'SELESAI' | 'DITOLAK';
  notes?: string;
  transferReference?: string;
  paymentProofUrl?: string;
  rejectionReason?: string;
}

export interface SalesWithdrawalFilterDto {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Main Use Cases ───────────────────────────────────────────────────────────

export class SalesUseCases {
  /**
   * Daftar semua pengguna dengan role SALES beserta statistik
   */
  async getSalesList() {
    const salesUsers = await prisma.user.findMany({
      where: {
        OR: SALES_ROLE_NAMES.map((role) => ({ role: { equals: role, mode: 'insensitive' } })),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        salesReferralCode: true,
        createdAt: true,
      },
    });

    // Hitung jumlah klien per sales
    const clientCounts = await prisma.customer.groupBy({
      by: ['salesUserId'],
      where: { salesUserId: { not: null } },
      _count: { id: true },
    });

    const clientCountMap = new Map(clientCounts.map((r) => [r.salesUserId!, r._count.id]));

    return salesUsers.map((u) => ({
      ...u,
      totalClients: clientCountMap.get(u.id) ?? 0,
      createdAt: formatDateID(u.createdAt),
    }));
  }

  /**
   * Dashboard untuk sales tertentu: saldo, total klien, total komisi
   */
  async getSalesDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        salesReferralCode: true,
        salesBalance: true,
        salesTotalEarned: true,
        salesTotalWithdrawn: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError(`Pengguna dengan ID '${userId}' tidak ditemukan.`);
    if (!SALES_ROLE_NAMES.includes(user.role.toUpperCase())) {
      throw new BadRequestError('Dashboard ini hanya tersedia untuk pengguna dengan role Sales.');
    }

    const [totalClients, totalLeads] = await Promise.all([
      prisma.customer.count({ where: { salesUserId: userId } }),
      user.salesReferralCode
        ? prisma.lead.count({
            where: { referralCode: { equals: user.salesReferralCode, mode: 'insensitive' } },
          })
        : Promise.resolve(0),
    ]);

    const pendingWithdrawals = await prisma.salesWithdrawal.aggregate({
      where: { userId, status: 'MENUNGGU_VERIFIKASI' },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      ...user,
      totalClients,
      totalLeads,
      pendingWithdrawalAmount: pendingWithdrawals._sum.amount ?? 0,
      pendingWithdrawalCount: pendingWithdrawals._count.id,
      availableBalance: Math.max(
        (user.salesBalance ?? 0) - (pendingWithdrawals._sum.amount ?? 0),
        0
      ),
      createdAt: formatDateID(user.createdAt),
    };
  }

  /**
   * Daftar customer yang diundang oleh sales tertentu
   */
  async getSalesClients(
    userId: string,
    filters?: { search?: string; status?: string; page?: number; limit?: number }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError(`Pengguna dengan ID '${userId}' tidak ditemukan.`);

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;
    const customerWhere: any = { salesUserId: userId };
    const leadWhere: any = {
      referralCode: user.salesReferralCode
        ? { equals: user.salesReferralCode, mode: 'insensitive' }
        : '__NO_SALES_REFERRAL_CODE__',
    };
    if (filters?.status) {
      customerWhere.status = filters.status;
      leadWhere.status = filters.status;
    }
    if (filters?.search) {
      const searchConditions = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
      customerWhere.OR = searchConditions;
      leadWhere.OR = searchConditions;
    }

    const [customers, leads, customerTotal, leadTotal] = await Promise.all([
      prisma.customer.findMany({
        where: customerWhere,
        take: skip + limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          businessName: true,
          email: true,
          phone: true,
          status: true,
          salesReferralCode: true,
          createdAt: true,
          expiresAt: true,
          package: { select: { name: true } },
        },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        take: skip + limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          businessName: true,
          email: true,
          phone: true,
          status: true,
          referralCode: true,
          createdAt: true,
          packageInterest: true,
        },
      }),
      prisma.customer.count({ where: customerWhere }),
      prisma.lead.count({ where: leadWhere }),
    ]);

    const items = [
      ...customers.map((client) => ({
        id: client.id,
        name: client.name,
        businessName: client.businessName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        createdAt: client.createdAt,
        packageName: client.package?.name ?? null,
        source: 'Customer',
        commission: SALES_COMMISSION_PER_CLIENT,
      })),
      ...leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        businessName: lead.businessName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        createdAt: lead.createdAt,
        packageName: lead.packageInterest,
        source: 'Lead',
        commission: 0,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + limit)
      .map((item) => ({
        ...item,
        registeredAt: formatDateID(item.createdAt),
        createdAt: formatDateID(item.createdAt),
      }));

    return {
      items,
      total: customerTotal + leadTotal,
      page,
      limit,
    };
  }

  /**
   * Generate kode referral unik untuk sales (prefix: SALES-)
   */
  async generateSalesReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError(`Pengguna dengan ID '${userId}' tidak ditemukan.`);
    if (!SALES_ROLE_NAMES.includes(user.role.toUpperCase())) {
      throw new BadRequestError('Kode referral sales hanya dapat dibuat untuk pengguna dengan role SALES.');
    }

    if (user.salesReferralCode) return user.salesReferralCode;

    for (let attempt = 0; attempt < 10; attempt++) {
      const randomPart = Math.random()
        .toString(36)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6)
        .padEnd(6, 'X');
      const code = `${SALES_REFERRAL_CODE_PREFIX}${randomPart}`;
      const existing = await prisma.user.findUnique({ where: { salesReferralCode: code } });
      if (!existing) {
        await prisma.user.update({ where: { id: userId }, data: { salesReferralCode: code } });
        return code;
      }
    }

    const fallback = `${SALES_REFERRAL_CODE_PREFIX}${Date.now().toString(36).toUpperCase().slice(-6)}`;
    await prisma.user.update({ where: { id: userId }, data: { salesReferralCode: fallback } });
    return fallback;
  }

  /**
   * Validasi kode referral sales
   */
  async validateSalesReferralCode(code: string) {
    const normalized = (code || '').trim().toUpperCase();

    if (!normalized) {
      return { valid: false, code: normalized, message: 'Kode referral sales wajib diisi.', sales: null };
    }

    const salesUser = await prisma.user.findUnique({
      where: { salesReferralCode: normalized },
      select: { id: true, name: true, email: true, phone: true, isActive: true, salesReferralCode: true },
    });

    if (!salesUser) {
      return {
        valid: false,
        code: normalized,
        message: `Kode referral sales '${normalized}' tidak ditemukan.`,
        sales: null,
      };
    }

    if (!salesUser.isActive) {
      return {
        valid: false,
        code: normalized,
        message: `Akun sales pemilik kode '${normalized}' sudah tidak aktif.`,
        sales: null,
      };
    }

    return {
      valid: true,
      code: normalized,
      message: `Kode referral valid. Client akan terhubung ke sales '${salesUser.name}'.`,
      sales: {
        id: salesUser.id,
        name: salesUser.name,
        email: salesUser.email,
        phone: salesUser.phone,
        salesReferralCode: salesUser.salesReferralCode,
      },
    };
  }

  /**
   * Buat request penarikan saldo sales
   */
  async createSalesWithdrawal(dto: CreateSalesWithdrawalDto) {
    const user = await prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, name: true, salesBalance: true, role: true },
    });

    if (!user) throw new NotFoundError(`Pengguna dengan ID '${dto.userId}' tidak ditemukan.`);

    if (!dto.amount || dto.amount <= 0) throw new BadRequestError('Nominal penarikan harus lebih dari Rp 0.');
    if (!dto.bankOrWallet?.trim()) throw new BadRequestError('Silakan pilih bank atau e-wallet tujuan.');
    if (!dto.accountNumber?.trim() || !dto.accountHolder?.trim()) {
      throw new BadRequestError('Nomor rekening dan nama pemilik rekening wajib diisi.');
    }

    // Hitung saldo tersedia (kurangi yang masih pending)
    const pending = await prisma.salesWithdrawal.aggregate({
      where: { userId: dto.userId, status: 'MENUNGGU_VERIFIKASI' },
      _sum: { amount: true },
    });
    const pendingAmount = pending._sum.amount ?? 0;
    const available = Math.max((user.salesBalance ?? 0) - pendingAmount, 0);

    if (dto.amount > available) {
      throw new BadRequestError(
        `Saldo tidak mencukupi. Saldo tersedia: Rp ${available.toLocaleString('id-ID')}.`
      );
    }

    const withdrawal = await prisma.salesWithdrawal.create({
      data: {
        userId: dto.userId,
        amount: dto.amount,
        bankOrWallet: dto.bankOrWallet.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountHolder: dto.accountHolder.trim(),
        notes: dto.notes?.trim() || 'Penarikan saldo komisi sales',
        status: 'MENUNGGU_VERIFIKASI',
      },
    });

    return {
      ...withdrawal,
      requestDate: formatDateID(withdrawal.requestDate),
      createdAt: formatDateID(withdrawal.createdAt),
    };
  }

  /**
   * Daftar penarikan (semua atau per sales)
   */
  async getSalesWithdrawals(userId?: string, filter?: SalesWithdrawalFilterDto) {
    const page = filter?.page && filter.page > 0 ? filter.page : 1;
    const limit = filter?.limit && filter.limit > 0 ? filter.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (filter?.status) where.status = filter.status;
    if (filter?.search) {
      where.OR = [
        { user: { name: { contains: filter.search, mode: 'insensitive' } } },
        { accountHolder: { contains: filter.search, mode: 'insensitive' } },
        { invoiceNo: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.salesWithdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, salesReferralCode: true },
          },
        },
      }),
      prisma.salesWithdrawal.count({ where }),
    ]);

    const allForSummary = await prisma.salesWithdrawal.findMany({
      where: userId ? { userId } : {},
      select: { status: true, amount: true },
    });

    const summary = {
      pendingCount: allForSummary.filter((w) => w.status === 'MENUNGGU_VERIFIKASI').length,
      pendingAmount: allForSummary.filter((w) => w.status === 'MENUNGGU_VERIFIKASI').reduce((s, w) => s + w.amount, 0),
      paidCount: allForSummary.filter((w) => w.status === 'SELESAI').length,
      paidAmount: allForSummary.filter((w) => w.status === 'SELESAI').reduce((s, w) => s + w.amount, 0),
      rejectedCount: allForSummary.filter((w) => w.status === 'DITOLAK').length,
    };

    return {
      items: items.map((w) => ({
        ...w,
        salesName: w.user.name,
        salesEmail: w.user.email,
        requestDate: formatDateID(w.requestDate),
        completedDate: w.completedDate ? formatDateID(w.completedDate) : null,
        rejectedAt: w.rejectedAt ? formatDateID(w.rejectedAt) : null,
        createdAt: formatDateID(w.createdAt),
      })),
      total,
      page,
      limit,
      summary,
    };
  }

  /**
   * Konfirmasi penarikan oleh superadmin
   */
  async confirmSalesWithdrawalPayout(id: string, dto: ConfirmSalesWithdrawalDto, processedBy = '') {
    const withdrawal = await prisma.salesWithdrawal.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, phone: true, salesBalance: true } } },
    });

    if (!withdrawal) throw new NotFoundError(`Permintaan penarikan sales dengan ID '${id}' tidak ditemukan.`);
    if (withdrawal.status !== 'MENUNGGU_VERIFIKASI') {
      throw new ConflictError(
        `Permintaan penarikan ini sudah berstatus '${withdrawal.status}' dan tidak dapat diproses lagi.`
      );
    }

    if (dto.status === 'DITOLAK') {
      const rejected = await prisma.salesWithdrawal.update({
        where: { id },
        data: {
          status: 'DITOLAK',
          notes: dto.notes,
          rejectionReason: dto.rejectionReason?.trim() || 'Tidak lolos verifikasi',
          rejectedAt: new Date(),
          processedBy,
        },
        include: { user: { select: { id: true, name: true, email: true, salesReferralCode: true } } },
      });

      return {
        ...rejected,
        requestDate: formatDateID(rejected.requestDate),
        completedDate: rejected.completedDate ? formatDateID(rejected.completedDate) : null,
        rejectedAt: rejected.rejectedAt ? formatDateID(rejected.rejectedAt) : null,
        createdAt: formatDateID(rejected.createdAt),
      };
    }

    // SELESAI: generate invoice, kurangi saldo user
    if (!dto.paymentProofUrl?.trim()) {
      throw new BadRequestError('Bukti pembayaran wajib diunggah sebelum penarikan disetujui.');
    }
    const phoneDigits = (withdrawal.user.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      throw new BadRequestError('Nomor WhatsApp Sales belum tersedia atau tidak valid.');
    }

    const invoiceNo = await this.generateWithdrawalInvoiceNo();

    const [updated] = await prisma.$transaction([
      prisma.salesWithdrawal.update({
        where: { id },
        data: {
          status: 'SELESAI',
          notes: dto.notes,
          invoiceNo,
          processedBy,
          transferReference: dto.transferReference?.trim() ?? '',
          paymentProofUrl: dto.paymentProofUrl.trim(),
          completedDate: new Date(),
        },
        include: { user: { select: { id: true, name: true, email: true, salesReferralCode: true } } },
      }),
      prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          salesBalance: { decrement: withdrawal.amount },
          salesTotalWithdrawn: { increment: withdrawal.amount },
        },
      }),
    ]);

    return {
      ...updated,
      requestDate: formatDateID(updated.requestDate),
      completedDate: updated.completedDate ? formatDateID(updated.completedDate) : null,
      createdAt: formatDateID(updated.createdAt),
    };
  }

  /**
   * Hubungkan customer ke sales berdasarkan kode referral sales
   * Komisi: Rp 15.000 per customer aktif
   */
  async bindCustomerToSales(customerId: string, salesReferralCode: string): Promise<void> {
    const normalized = (salesReferralCode || '').trim().toUpperCase();
    if (!normalized) return;

    // Hanya proses kode referral sales (prefix SALES-)
    if (!normalized.startsWith(SALES_REFERRAL_CODE_PREFIX)) return;

    const salesUser = await prisma.user.findUnique({ where: { salesReferralCode: normalized } });
    if (!salesUser) {
      throw new BadRequestError(`Kode referral sales '${normalized}' tidak ditemukan.`);
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError(`Customer dengan ID '${customerId}' tidak ditemukan.`);
    }

    // Jangan rebind jika sudah terikat ke sales yang sama
    if (customer.salesUserId === salesUser.id) return;
    if (customer.salesUserId) {
      throw new ConflictError('Pelanggan sudah terhubung dengan sales lain.');
    }

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          salesReferralCode: normalized,
          salesUserId: salesUser.id,
        },
      }),
      prisma.user.update({
        where: { id: salesUser.id },
        data: {
          salesBalance: { increment: SALES_COMMISSION_PER_CLIENT },
          salesTotalEarned: { increment: SALES_COMMISSION_PER_CLIENT },
        },
      }),
    ]);
  }

  /**
   * Generate nomor invoice penarikan sales yang unik
   */
  private async generateWithdrawalInvoiceNo(): Promise<string> {
    const now = new Date();
    const rawDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    for (let attempt = 0; attempt < 10; attempt++) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `SINV-${rawDate}-${suffix}`;
      const existing = await prisma.salesWithdrawal.findUnique({ where: { invoiceNo: candidate } });
      if (!existing) return candidate;
    }

    return `SINV-${rawDate}-${Date.now().toString().slice(-6)}`;
  }
}

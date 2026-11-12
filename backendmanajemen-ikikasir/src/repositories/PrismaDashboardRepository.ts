import { prisma } from '../infrastructure/database/prisma.js';
import { InternalServerError } from '../domain/errors/AppError.js';
import { IDashboardRepository, DashboardFilter } from '../domain/interfaces/IDashboardRepository.js';
import {
  DashboardActivity,
  DashboardActivityType,
  DashboardCashFlowPoint,
  DashboardCustomerRow,
  DashboardSummary,
} from '../domain/entities/Dashboard.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export class PrismaDashboardRepository implements IDashboardRepository {
  /** Format tanggal menjadi YYYY-MM-DD */
  private formatRawDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Format tanggal menjadi "12 Sep 2026" */
  private formatDisplayDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()] ?? '';
    return `${day} ${month} ${d.getFullYear()}`;
  }

  /** Format waktu menjadi "10:30" */
  private formatTime(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /** Menghitung jarak waktu relatif dalam Bahasa Indonesia */
  private formatRelativeTime(d: Date, now: Date): string {
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} hari yang lalu`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} bulan yang lalu`;

    return `${Math.floor(diffMonths / 12)} tahun yang lalu`;
  }

  /** Menghitung persentase pertumbuhan antara dua nilai */
  private hitungPertumbuhan(nilaiSekarang: number, nilaiSebelumnya: number): number {
    if (nilaiSebelumnya > 0) {
      return Number((((nilaiSekarang - nilaiSebelumnya) / nilaiSebelumnya) * 100).toFixed(1));
    }
    if (nilaiSekarang > 0) return 100;
    return 0;
  }

  /** Mengubah string "YYYY-MM-DD" menjadi Date pada waktu lokal (awal hari) */
  private parseRawDate(raw: string): Date | null {
    const parts = raw.split('-').map((value) => parseInt(value, 10));
    if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) return null;

    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /**
   * Menentukan rentang periode.
   * - Tanpa filter tanggal: memakai default 30 hari terakhir.
   * - Dengan filter tanggal: memakai rentang yang dipilih pengguna (start & end).
   */
  private resolvePeriod(filter?: DashboardFilter): { start: Date; end: Date; hasRange: boolean } {
    const now = new Date();
    const rawStart = filter?.periodStartDate?.trim();
    const rawEnd = filter?.periodEndDate?.trim();

    const parsedStart = rawStart ? this.parseRawDate(rawStart) : null;
    const parsedEnd = rawEnd ? this.parseRawDate(rawEnd) : null;

    if (!parsedStart && !parsedEnd) {
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
        hasRange: false,
      };
    }

    let start: Date;
    let end: Date;

    if (parsedStart && parsedEnd) {
      start = parsedStart;
      end = parsedEnd;
    } else if (parsedStart) {
      start = parsedStart;
      end = now;
    } else {
      // Hanya tanggal akhir yang dipilih: rentang 30 hari sebelum tanggal tersebut
      end = parsedEnd as Date;
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Tanggal akhir mencakup sepanjang hari tersebut
    end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

    // Tukar bila pengguna membalik urutan tanggal
    if (start.getTime() > end.getTime()) {
      const temp = start;
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      end = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), 23, 59, 59, 999);
    }

    return { start, end, hasRange: true };
  }

  /** Menentukan jumlah titik grafik secara otomatis berdasarkan panjang rentang */
  private resolveChartPoints(start: Date, end: Date): number {
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    if (totalDays <= 14) return totalDays;
    return Math.min(60, Math.max(14, Math.round(totalDays / 2)));
  }

  /**
   * Mengambil ringkasan metrik dashboard (KPI, statistik calon client, revenue)
   */
  public async getSummary(filter?: DashboardFilter): Promise<DashboardSummary> {
    try {
      const now = new Date();
      const expiringDays = filter?.expiringDays ?? 14;
      const { start, end } = this.resolvePeriod(filter);

      const expiringLimit = new Date(now.getTime() + expiringDays * 24 * 60 * 60 * 1000);

      const [
        totalCustomers,
        expiringCount,
        expiredCount,
        totalLeads,
        newLeads,
        inProgressLeads,
        convertedLeads,
        rejectedLeads,
        totalHistories,
        paidRevenue,
        currentPeriodCustomers,
        previousPeriodCustomers,
      ] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({
          where: { expiresAt: { gt: now, lte: expiringLimit }, status: { not: 'SUSPENDED' } },
        }),
        prisma.customer.count({
          where: { OR: [{ expiresAt: { lte: now } }, { status: 'EXPIRED' }] },
        }),
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'New' } }),
        prisma.lead.count({ where: { status: { in: ['Contacted', 'Follow Up', 'Interested'] } } }),
        prisma.lead.count({ where: { status: 'Converted' } }),
        prisma.lead.count({ where: { status: 'Lost' } }),
        prisma.subscriptionHistory.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.subscriptionHistory.aggregate({
          where: { paymentStatus: 'PAID', createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.customer.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        prisma.customer.count({
          where: {
            createdAt: {
              gte: new Date(start.getTime() - (end.getTime() - start.getTime())),
              lt: start,
            },
          },
        }),
      ]);

      const pelangganAktif = Math.max(0, totalCustomers - expiredCount);

      return {
        totalPelanggan: totalCustomers,
        pelangganAktif,
        akanExpired: expiringCount,
        pelangganExpired: expiredCount,
        totalLeads,
        newLeads,
        inProgressLeads,
        convertedLeads,
        rejectedLeads,
        totalInvoices: totalHistories,
        totalPaidRevenue: paidRevenue._sum.amount ?? 0,
        pertumbuhanTotalPelanggan: this.hitungPertumbuhan(currentPeriodCustomers, previousPeriodCustomers),
        pertumbuhanPelangganAktif: this.hitungPertumbuhan(currentPeriodCustomers, previousPeriodCustomers),
        periode: {
          startDate: this.formatRawDate(start),
          endDate: this.formatRawDate(end),
        },
      };
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil ringkasan dashboard: ${(error as Error).message}`);
    }
  }

  /**
   * Mengambil daftar pelanggan yang akan expired dalam waktu dekat.
   * Jika filter tanggal dipakai, daftar dibatasi pada pelanggan yang masa aktifnya
   * berakhir di dalam rentang tersebut dan belum expired sampai hari ini.
   */
  public async getExpiringCustomers(filter?: DashboardFilter): Promise<DashboardCustomerRow[]> {
    try {
      const now = new Date();
      const expiringDays = filter?.expiringDays ?? 14;
      const limit = filter?.limit ?? 10;
      const { start, end, hasRange } = this.resolvePeriod(filter);
      const expiringLimit = new Date(now.getTime() + expiringDays * 24 * 60 * 60 * 1000);

      const records = await prisma.customer.findMany({
        where: hasRange
          ? {
              expiresAt: { gt: now, gte: start, lte: end },
              status: { not: 'SUSPENDED' },
            }
          : {
              expiresAt: { gt: now, lte: expiringLimit },
              status: { not: 'SUSPENDED' },
            },
        include: { package: true },
        orderBy: { expiresAt: 'asc' },
        take: limit,
      });

      return records.map((record) => this.mapCustomerRow(record, now));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil daftar pelanggan akan expired: ${(error as Error).message}`);
    }
  }

  /**
   * Mengambil daftar pelanggan yang sudah expired.
   * Jika filter tanggal dipakai, daftar dibatasi pada pelanggan yang masa aktifnya
   * berakhir di dalam rentang tersebut dan sudah melewati tanggal kedaluwarsa.
   */
  public async getExpiredCustomers(filter?: DashboardFilter): Promise<DashboardCustomerRow[]> {
    try {
      const now = new Date();
      const limit = filter?.limit ?? 10;
      const { start, end, hasRange } = this.resolvePeriod(filter);

      // Batas atas: tidak boleh melewati hari ini maupun akhir rentang terpilih
      const expiredUpperBound = now.getTime() < end.getTime() ? now : end;

      const records = await prisma.customer.findMany({
        where: hasRange
          ? {
              expiresAt: { gte: start, lte: expiredUpperBound },
              status: { not: 'SUSPENDED' },
            }
          : {
              OR: [{ expiresAt: { lte: now } }, { status: 'EXPIRED' }],
            },
        include: { package: true },
        orderBy: { expiresAt: 'asc' },
        take: limit,
      });

      return records.map((record) => this.mapCustomerRow(record, now));
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil daftar pelanggan expired: ${(error as Error).message}`);
    }
  }

  /** Mapping record pelanggan menjadi baris tabel dashboard */
  private mapCustomerRow(record: any, now: Date): DashboardCustomerRow {
    const diffMs = record.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = diffDays < 0 || record.status === 'EXPIRED';

    return {
      id: record.id,
      name: record.name,
      businessName: record.businessName || 'Toko',
      packageType: record.package?.name ?? 'Basic',
      expiredDate: this.formatRawDate(record.expiresAt),
      daysLeft: isExpired ? 0 : diffDays,
      daysExpired: isExpired ? Math.abs(diffDays) : 0,
      status: isExpired ? 'expired' : 'expiring',
      phone: record.phone,
      amount: record.paymentAmount ?? record.package?.price ?? 0,
    };
  }

  /**
   * Menyusun aktivitas terbaru dari calon client, pembayaran, peringatan expired, dan follow up.
   * Jika filter tanggal dipakai, hanya aktivitas pada rentang tersebut yang ditampilkan.
   */
  public async getRecentActivities(filter?: DashboardFilter): Promise<DashboardActivity[]> {
    try {
      const now = new Date();
      const limit = filter?.limit ?? 10;
      const expiringDays = filter?.expiringDays ?? 14;
      const { start, end, hasRange } = this.resolvePeriod(filter);
      const expiringLimit = new Date(now.getTime() + expiringDays * 24 * 60 * 60 * 1000);

      const [convertedLeads, recentPayments, expiringCustomers, recentFollowUps] = await Promise.all([
        prisma.lead.findMany({
          where: hasRange
            ? { status: 'Converted', updatedAt: { gte: start, lte: end } }
            : { status: 'Converted' },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        }),
        prisma.subscriptionHistory.findMany({
          where: hasRange ? { createdAt: { gte: start, lte: end } } : {},
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.customer.findMany({
          where: hasRange
            ? { expiresAt: { gte: start, lte: end }, status: { not: 'SUSPENDED' } }
            : {
                expiresAt: { gt: now, lte: expiringLimit },
                status: { not: 'SUSPENDED' },
              },
          orderBy: { expiresAt: 'asc' },
          take: limit,
        }),
        prisma.leadFollowUp.findMany({
          where: hasRange ? { createdAt: { gte: start, lte: end } } : {},
          include: { lead: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      const activities: DashboardActivity[] = [];

      convertedLeads.forEach((lead) => {
        activities.push({
          id: `convert-${lead.id}`,
          title: lead.name,
          description: 'berhasil dikonversi menjadi pelanggan',
          time: this.formatTime(lead.updatedAt),
          relativeTime: this.formatRelativeTime(lead.updatedAt, now),
          type: 'convert',
        });
      });

      recentPayments.forEach((payment) => {
        activities.push({
          id: `payment-${payment.id}`,
          title: 'Pembayaran langganan dari',
          highlightText: payment.customer?.businessName || payment.customer?.name || 'Pelanggan',
          description: `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(payment.amount)}`,
          time: this.formatTime(payment.createdAt),
          relativeTime: this.formatRelativeTime(payment.createdAt, now),
          type: 'payment',
        });
      });

      expiringCustomers.forEach((customer) => {
        const daysLeft = Math.max(
          0,
          Math.ceil((customer.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        );
        activities.push({
          id: `warning-${customer.id}`,
          title: customer.name,
          description: `akan expired dalam ${daysLeft} hari`,
          time: this.formatTime(customer.updatedAt),
          relativeTime: this.formatRelativeTime(customer.updatedAt, now),
          type: 'warning',
        });
      });

      recentFollowUps.forEach((followUp) => {
        activities.push({
          id: `followup-${followUp.id}`,
          title: followUp.lead?.name ?? 'Pelanggan',
          description: 'menambahkan follow up baru',
          time: this.formatTime(followUp.createdAt),
          relativeTime: this.formatRelativeTime(followUp.createdAt, now),
          type: 'followup',
        });
      });

      const priority: Record<DashboardActivityType, number> = {
        convert: 1,
        payment: 2,
        warning: 3,
        followup: 4,
        export: 5,
      };

      return activities
        .sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99))
        .slice(0, limit);
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil aktivitas terbaru dashboard: ${(error as Error).message}`);
    }
  }

  /**
   * Menyusun titik data grafik arus kas (pemasukan, pengeluaran, saldo) untuk periode tertentu.
   * Jika filter tanggal dipakai, grafik mengikuti rentang tanggal yang dipilih pengguna.
   */
  public async getCashFlowChart(filter?: DashboardFilter): Promise<DashboardCashFlowPoint[]> {
    try {
      const now = new Date();
      const chartDays = filter?.chartDays ?? 30;
      const { start, end, hasRange } = this.resolvePeriod(filter);

      // Rentang grafik: mengikuti filter tanggal, atau mundur chartDays hari dari sekarang
      const rangeStart = hasRange ? start : new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000);
      const rangeEnd = hasRange ? end : now;

      const chartPoints = Math.max(
        1,
        filter?.chartPoints ?? (hasRange ? this.resolveChartPoints(rangeStart, rangeEnd) : 14)
      );

      const startRaw = this.formatRawDate(rangeStart);

      const records = await prisma.cashTransaction.findMany({
        where: {
          rawDate: { gte: startRaw, lte: this.formatRawDate(rangeEnd) },
        },
        select: {
          type: true,
          amount: true,
          rawDate: true,
          date: true,
          status: true,
        },
      });

      // Kelompokkan pemasukan & pengeluaran per tanggal
      const daily = new Map<string, { income: number; expense: number }>();
      for (const record of records) {
        const key = record.rawDate || this.formatRawDate(record.date ?? now);
        const entry = daily.get(key) ?? { income: 0, expense: 0 };
        if (record.type === 'masuk') {
          if (!record.status || record.status === 'Selesai') entry.income += record.amount;
        } else if (record.type === 'keluar') {
          entry.expense += record.amount;
        }
        daily.set(key, entry);
      }

      // Susun titik data pada interval reguler (bucket per titik, bukan per tanggal eksak)
      const stepMs =
        chartPoints > 1 ? (rangeEnd.getTime() - rangeStart.getTime()) / (chartPoints - 1) : 0;
      const points: DashboardCashFlowPoint[] = [];
      let runningBalance = 0;

      for (let i = 0; i < chartPoints; i++) {
        const bucketStart = new Date(rangeStart.getTime() + stepMs * i);
        const bucketEnd = new Date(rangeStart.getTime() + stepMs * (i + 1));
        const bucketStartRaw = this.formatRawDate(bucketStart);
        const bucketEndRaw = this.formatRawDate(bucketEnd);

        let income = 0;
        let expense = 0;

        for (const [rawDate, entry] of daily.entries()) {
          // Transaksi masuk bucket jika tanggalnya berada di rentang interval ini
          if (rawDate >= bucketStartRaw && (i === chartPoints - 1 ? rawDate <= bucketEndRaw : rawDate < bucketEndRaw)) {
            income += entry.income;
            expense += entry.expense;
          }
        }

        runningBalance += income - expense;

        points.push({
          label: `${bucketStart.getDate()} ${MONTHS[bucketStart.getMonth()]}`,
          fullDate: this.formatDisplayDate(bucketStart),
          income,
          expense,
          balance: runningBalance,
        });
      }

      return points;
    } catch (error) {
      throw new InternalServerError(`Gagal mengambil data grafik arus kas dashboard: ${(error as Error).message}`);
    }
  }
}

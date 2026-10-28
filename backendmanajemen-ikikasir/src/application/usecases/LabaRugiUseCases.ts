import { IFinancialReportRepository } from '../../domain/interfaces/IFinancialReportRepository.js';
import { LabaRugiReport } from '../../domain/entities/FinancialReport.js';
import { LaporanFilterDto } from '../dtos/laporan.dto.js';

/**
 * Hitung rentang periode sebelumnya berdasarkan periode berjalan.
 * Digunakan untuk membandingkan pertumbuhan pendapatan & beban antar periode.
 */
export function getPreviousPeriod(filter?: LaporanFilterDto): { startDate: string; endDate: string } | null {
  if (!filter?.startDate || !filter?.endDate) {
    return null;
  }

  const curStart = new Date(filter.startDate);
  const curEnd = new Date(filter.endDate);
  const durationMs = Math.max(curEnd.getTime() - curStart.getTime(), 24 * 60 * 60 * 1000);

  const prevEnd = new Date(curStart.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    startDate: formatRawDate(prevStart),
    endDate: formatRawDate(prevEnd),
  };
}

/**
 * Format tanggal menjadi YYYY-MM-DD
 */
export function formatRawDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class LabaRugiUseCases {
  constructor(private reportRepo: IFinancialReportRepository) {}

  /**
   * Menghitung persentase pertumbuhan antara nilai periode berjalan dan periode sebelumnya
   */
  private hitungPertumbuhan(nilaiSekarang: number, nilaiSebelumnya: number): number {
    if (nilaiSebelumnya > 0) {
      return Number((((nilaiSekarang - nilaiSebelumnya) / nilaiSebelumnya) * 100).toFixed(1));
    }
    if (nilaiSekarang > 0) {
      return 100;
    }
    return 0;
  }

  /**
   * Menyusun laporan laba rugi (laba bersih) untuk periode tertentu
   */
  async getLabaRugi(filter?: LaporanFilterDto): Promise<LabaRugiReport> {
    const [pendapatanRaw, bebanRaw] = await Promise.all([
      this.reportRepo.getIncomeByCategory(filter),
      this.reportRepo.getExpenseByCategory(filter),
    ]);

    const pendapatan = pendapatanRaw.map((row) => ({
      name: row.category,
      amount: row.amount,
      jumlahTransaksi: row.jumlahTransaksi,
    }));

    const beban = bebanRaw.map((row) => ({
      name: row.category,
      amount: row.amount,
      jumlahTransaksi: row.jumlahTransaksi,
    }));

    const totalPendapatan = pendapatan.reduce((sum, item) => sum + item.amount, 0);
    const totalBeban = beban.reduce((sum, item) => sum + item.amount, 0);
    const labaBersih = totalPendapatan - totalBeban;
    const marginPersentase =
      totalPendapatan > 0 ? Number(((labaBersih / totalPendapatan) * 100).toFixed(1)) : 0;

    // Bandingkan dengan periode sebelumnya untuk menghitung pertumbuhan
    const previousPeriod = getPreviousPeriod(filter);
    let pertumbuhanPendapatan = 0;
    let pertumbuhanBeban = 0;

    if (previousPeriod) {
      const [prevPendapatanRaw, prevBebanRaw] = await Promise.all([
        this.reportRepo.getIncomeByCategory(previousPeriod),
        this.reportRepo.getExpenseByCategory(previousPeriod),
      ]);

      const prevTotalPendapatan = prevPendapatanRaw.reduce((sum, item) => sum + item.amount, 0);
      const prevTotalBeban = prevBebanRaw.reduce((sum, item) => sum + item.amount, 0);

      pertumbuhanPendapatan = this.hitungPertumbuhan(totalPendapatan, prevTotalPendapatan);
      pertumbuhanBeban = this.hitungPertumbuhan(totalBeban, prevTotalBeban);
    }

    return {
      pendapatan,
      beban,
      summary: {
        totalPendapatan,
        totalBeban,
        labaBersih,
        marginPersentase,
        pertumbuhanPendapatan,
        pertumbuhanBeban,
        jumlahTransaksiPendapatan: pendapatanRaw.reduce((sum, item) => sum + item.jumlahTransaksi, 0),
        jumlahTransaksiBeban: bebanRaw.reduce((sum, item) => sum + item.jumlahTransaksi, 0),
        periode: {
          startDate: filter?.startDate || '',
          endDate: filter?.endDate || formatRawDate(new Date()),
        },
      },
    };
  }
}

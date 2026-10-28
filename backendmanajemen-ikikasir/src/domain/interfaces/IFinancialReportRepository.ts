import { CashTransaction } from '../entities/CashTransaction.js';
import { PenjualanSummary } from '../entities/FinancialReport.js';

/**
 * Filter periode & pencarian untuk seluruh query laporan
 */
export interface LaporanFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Total agregat per kategori transaksi
 */
export interface ReportCategoryTotal {
  category: string;
  amount: number;
  jumlahTransaksi: number;
}

/**
 * Hasil query transaksi penjualan beserta jumlah total data
 */
export interface SalesQueryResult {
  transactions: CashTransaction[];
  total: number;
}

export interface IFinancialReportRepository {
  /**
   * Mengambil total pemasukan (type 'masuk') per kategori pada periode tertentu
   */
  getIncomeByCategory(filter?: LaporanFilter): Promise<ReportCategoryTotal[]>;

  /**
   * Mengambil total pengeluaran (type 'keluar') per kategori pada periode tertentu
   */
  getExpenseByCategory(filter?: LaporanFilter): Promise<ReportCategoryTotal[]>;

  /**
   * Menghitung saldo kas kumulatif (pemasukan dikurangi pengeluaran) sampai tanggal tertentu
   */
  getCashBalance(untilDate?: string): Promise<number>;

  /**
   * Menghitung total piutang usaha dari transaksi pemasukan berstatus Pending
   */
  getReceivableAmount(untilDate?: string): Promise<number>;

  /**
   * Mengambil daftar transaksi penjualan (type 'masuk') dengan filter & paginasi
   */
  findSalesTransactions(filter?: LaporanFilter): Promise<SalesQueryResult>;

  /**
   * Mengambil ringkasan metrik penjualan pada periode tertentu
   */
  getSalesSummary(filter?: LaporanFilter): Promise<PenjualanSummary>;
}

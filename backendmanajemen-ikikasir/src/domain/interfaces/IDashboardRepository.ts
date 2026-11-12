import {
  DashboardActivity,
  DashboardCashFlowPoint,
  DashboardCustomerRow,
  DashboardSummary,
} from '../entities/Dashboard.js';

export interface DashboardFilter {
  /** Berapa hari ke depan pelanggan dianggap "akan expired" (default 14) */
  expiringDays?: number;
  /** Jumlah baris pada daftar pelanggan & aktivitas (default 10) */
  limit?: number;
  /** Rentang periode grafik arus kas (default 30 hari terakhir) */
  chartDays?: number;
  /** Jumlah titik grafik arus kas (default 14) */
  chartPoints?: number;
  /** Periode perhitungan pertumbuhan pelanggan */
  periodStartDate?: string;
  periodEndDate?: string;
}

export interface IDashboardRepository {
  getSummary(filter?: DashboardFilter): Promise<DashboardSummary>;
  getExpiringCustomers(filter?: DashboardFilter): Promise<DashboardCustomerRow[]>;
  getExpiredCustomers(filter?: DashboardFilter): Promise<DashboardCustomerRow[]>;
  getRecentActivities(filter?: DashboardFilter): Promise<DashboardActivity[]>;
  getCashFlowChart(filter?: DashboardFilter): Promise<DashboardCashFlowPoint[]>;
}

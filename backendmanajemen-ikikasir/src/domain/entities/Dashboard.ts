/**
 * Domain Entity: Dashboard
 * Struktur data ringkasan dashboard untuk halaman utama aplikasi manajemen.
 */

export type DashboardActivityType = 'convert' | 'payment' | 'warning' | 'followup' | 'export';

export interface DashboardCustomerRow {
  id: string;
  name: string;
  businessName: string;
  packageType: string;
  expiredDate: string;
  daysLeft: number;
  daysExpired: number;
  status: 'active' | 'expiring' | 'expired';
  phone: string;
  amount: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  highlightText?: string;
  description?: string;
  time: string;
  relativeTime: string;
  type: DashboardActivityType;
}

export interface DashboardCashFlowPoint {
  label: string;
  fullDate: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardSummary {
  totalPelanggan: number;
  pelangganAktif: number;
  akanExpired: number;
  pelangganExpired: number;
  totalLeads: number;
  newLeads: number;
  inProgressLeads: number;
  convertedLeads: number;
  rejectedLeads: number;
  totalInvoices: number;
  totalPaidRevenue: number;
  pertumbuhanTotalPelanggan: number;
  pertumbuhanPelangganAktif: number;
  periode: {
    startDate: string;
    endDate: string;
  };
}

export interface DashboardData {
  summary: DashboardSummary;
  expiringCustomers: DashboardCustomerRow[];
  expiredCustomers: DashboardCustomerRow[];
  activities: DashboardActivity[];
  cashFlowChart: DashboardCashFlowPoint[];
}

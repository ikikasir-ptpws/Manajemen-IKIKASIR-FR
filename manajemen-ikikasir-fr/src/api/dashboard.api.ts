import { httpClient } from './httpClient'
import type {
  DashboardCashFlowPoint,
  DashboardData,
  DashboardSummary
} from '../types/dashboard'

export interface DashboardFilterParams {
  expiringDays?: number
  limit?: number
  chartDays?: number
  chartPoints?: number
  startDate?: string
  endDate?: string
}

export const dashboardApi = {
  /**
   * Mengambil seluruh data dashboard dalam satu kali permintaan:
   * ringkasan KPI, pelanggan akan expired & expired, aktivitas terbaru, dan grafik arus kas.
   */
  getDashboard: (params?: DashboardFilterParams) =>
    httpClient.get<DashboardData>('/dashboard', params),

  getSummary: (params?: DashboardFilterParams) =>
    httpClient.get<DashboardSummary>('/dashboard/summary', params),

  getCashFlowChart: (params?: DashboardFilterParams) =>
    httpClient.get<DashboardCashFlowPoint[]>('/dashboard/cashflow-chart', params)
}

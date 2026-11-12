import { IDashboardRepository } from '../../domain/interfaces/IDashboardRepository.js';
import { DashboardData } from '../../domain/entities/Dashboard.js';
import { DashboardFilterDto } from '../dtos/dashboard.dto.js';

export class DashboardUseCases {
  constructor(private dashboardRepo: IDashboardRepository) {}

  /**
   * Mengambil seluruh data dashboard dalam satu kali pemanggilan:
   * ringkasan KPI, daftar pelanggan akan expired & expired, aktivitas terbaru, dan grafik arus kas.
   */
  async getDashboardData(filter?: DashboardFilterDto): Promise<DashboardData> {
    const [summary, expiringCustomers, expiredCustomers, activities, cashFlowChart] = await Promise.all([
      this.dashboardRepo.getSummary(filter),
      this.dashboardRepo.getExpiringCustomers(filter),
      this.dashboardRepo.getExpiredCustomers(filter),
      this.dashboardRepo.getRecentActivities(filter),
      this.dashboardRepo.getCashFlowChart(filter),
    ]);

    return {
      summary,
      expiringCustomers,
      expiredCustomers,
      activities,
      cashFlowChart,
    };
  }

  /**
   * Mengambil ringkasan metrik dashboard saja
   */
  async getSummary(filter?: DashboardFilterDto) {
    return this.dashboardRepo.getSummary(filter);
  }

  /**
   * Mengambil grafik arus kas dashboard
   */
  async getCashFlowChart(filter?: DashboardFilterDto) {
    return this.dashboardRepo.getCashFlowChart(filter);
  }
}

export class DashboardUseCases {
    dashboardRepo;
    constructor(dashboardRepo) {
        this.dashboardRepo = dashboardRepo;
    }
    /**
     * Mengambil seluruh data dashboard dalam satu kali pemanggilan:
     * ringkasan KPI, daftar pelanggan akan expired & expired, aktivitas terbaru, dan grafik arus kas.
     */
    async getDashboardData(filter) {
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
    async getSummary(filter) {
        return this.dashboardRepo.getSummary(filter);
    }
    /**
     * Mengambil grafik arus kas dashboard
     */
    async getCashFlowChart(filter) {
        return this.dashboardRepo.getCashFlowChart(filter);
    }
}
//# sourceMappingURL=DashboardUseCases.js.map
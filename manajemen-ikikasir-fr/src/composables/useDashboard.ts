import { computed, ref } from 'vue'
import { dashboardApi, type DashboardFilterParams } from '../api'
import type {
  ActivityItem,
  DashboardCashFlowPoint,
  DashboardCustomerRow,
  DashboardSummary
} from '../types/dashboard'

/**
 * Composable dashboard: membungkus api/dashboard.api dengan state loading, error, dan data.
 */
export function useDashboard() {
  const summary = ref<DashboardSummary | null>(null)
  const expiringCustomers = ref<DashboardCustomerRow[]>([])
  const expiredCustomers = ref<DashboardCustomerRow[]>([])
  const activities = ref<ActivityItem[]>([])
  const cashFlowChart = ref<DashboardCashFlowPoint[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboard = async (params?: DashboardFilterParams) => {
    loading.value = true
    error.value = null

    try {
      const res = await dashboardApi.getDashboard(params)

      summary.value = res.data?.summary ?? null
      expiringCustomers.value = res.data?.expiringCustomers ?? []
      expiredCustomers.value = res.data?.expiredCustomers ?? []
      activities.value = res.data?.activities ?? []
      cashFlowChart.value = res.data?.cashFlowChart ?? []
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat data dashboard.'
      summary.value = null
      expiringCustomers.value = []
      expiredCustomers.value = []
      activities.value = []
      cashFlowChart.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchSummary = async (params?: DashboardFilterParams) => {
    loading.value = true
    error.value = null

    try {
      const res = await dashboardApi.getSummary(params)
      summary.value = res.data ?? null
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat ringkasan dashboard.'
    } finally {
      loading.value = false
    }
  }

  const fetchCashFlowChart = async (params?: DashboardFilterParams) => {
    loading.value = true
    error.value = null

    try {
      const res = await dashboardApi.getCashFlowChart(params)
      cashFlowChart.value = res.data ?? []
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat grafik arus kas.'
    } finally {
      loading.value = false
    }
  }

  /** Metrik KPI untuk ditampilkan pada kartu ringkasan */
  const metrics = computed(() => ({
    totalPelanggan: summary.value?.totalPelanggan ?? 0,
    pelangganAktif: summary.value?.pelangganAktif ?? 0,
    akanExpired: summary.value?.akanExpired ?? 0,
    pelangganExpired: summary.value?.pelangganExpired ?? 0
  }))

  const isEmpty = computed(
    () =>
      expiringCustomers.value.length === 0 &&
      expiredCustomers.value.length === 0 &&
      activities.value.length === 0
  )

  return {
    summary,
    expiringCustomers,
    expiredCustomers,
    activities,
    cashFlowChart,
    metrics,
    isEmpty,
    loading,
    error,
    fetchDashboard,
    fetchSummary,
    fetchCashFlowChart
  }
}

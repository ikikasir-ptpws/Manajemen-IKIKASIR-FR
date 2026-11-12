import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useDashboard } from '../composables/useDashboard'
import { dashboardApi } from '../api'

vi.mock('../api', () => ({
  dashboardApi: {
    getDashboard: vi.fn(),
    getSummary: vi.fn(),
    getCashFlowChart: vi.fn(),
  },
}))

const mockedApi = vi.mocked(dashboardApi)

const summaryPayload = {
  totalPelanggan: 10,
  pelangganAktif: 7,
  akanExpired: 2,
  pelangganExpired: 1,
  totalLeads: 5,
  newLeads: 2,
  inProgressLeads: 1,
  convertedLeads: 1,
  rejectedLeads: 1,
  totalInvoices: 4,
  totalPaidRevenue: 1500000,
  pertumbuhanTotalPelanggan: 12.5,
  pertumbuhanPelangganAktif: 8,
  periode: { startDate: '2026-10-13', endDate: '2026-11-12' },
}

const expiringRow = {
  id: 'cus-1',
  name: 'Budi Santoso',
  businessName: 'Toko Berkah',
  packageType: 'Basic',
  expiredDate: '2026-11-20',
  daysLeft: 8,
  daysExpired: 0,
  status: 'expiring' as const,
  phone: '08123456789',
  amount: 500000,
}

const expiredRow = {
  id: 'cus-2',
  name: 'Siti Aisyah',
  businessName: 'Toko Jaya',
  packageType: 'Pro',
  expiredDate: '2026-10-01',
  daysLeft: 0,
  daysExpired: 42,
  status: 'expired' as const,
  phone: '08129876543',
  amount: 1000000,
}

const activityItem = {
  id: 'payment-1',
  title: 'Pembayaran langganan dari',
  highlightText: 'Toko Berkah',
  description: 'Rp 500.000',
  time: '10:30',
  relativeTime: '2 jam yang lalu',
  type: 'payment' as const,
}

const chartPoint = {
  label: '13 Okt',
  fullDate: '13 Okt 2026',
  income: 500000,
  expense: 0,
  balance: 500000,
}

describe('Dashboard Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memuat seluruh data dashboard dan menghitung metrik KPI', async () => {
    mockedApi.getDashboard.mockResolvedValue({
      success: true,
      data: {
        summary: summaryPayload,
        expiringCustomers: [expiringRow],
        expiredCustomers: [expiredRow],
        activities: [activityItem],
        cashFlowChart: [chartPoint],
      },
    } as any)

    const { fetchDashboard, summary, expiringCustomers, expiredCustomers, activities, cashFlowChart, metrics, isEmpty, loading } =
      useDashboard()

    await fetchDashboard()

    expect(mockedApi.getDashboard).toHaveBeenCalledTimes(1)
    expect(summary.value?.totalPelanggan).toBe(10)
    expect(expiringCustomers.value).toHaveLength(1)
    expect(expiredCustomers.value[0].status).toBe('expired')
    expect(activities.value[0].type).toBe('payment')
    expect(cashFlowChart.value[0].income).toBe(500000)

    expect(metrics.value).toEqual({
      totalPelanggan: 10,
      pelangganAktif: 7,
      akanExpired: 2,
      pelangganExpired: 1,
    })
    expect(isEmpty.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('mengirim parameter filter ke API dashboard', async () => {
    mockedApi.getDashboard.mockResolvedValue({
      success: true,
      data: {
        summary: summaryPayload,
        expiringCustomers: [],
        expiredCustomers: [],
        activities: [],
        cashFlowChart: [],
      },
    } as any)

    const { fetchDashboard } = useDashboard()

    await fetchDashboard({ chartDays: 90, expiringDays: 30 })

    expect(mockedApi.getDashboard).toHaveBeenCalledWith({ chartDays: 90, expiringDays: 30 })
  })

  it('mengirim rentang tanggal ke API dashboard', async () => {
    mockedApi.getDashboard.mockResolvedValue({
      success: true,
      data: {
        summary: summaryPayload,
        expiringCustomers: [],
        expiredCustomers: [],
        activities: [],
        cashFlowChart: [],
      },
    } as any)

    const { fetchDashboard } = useDashboard()

    await fetchDashboard({ startDate: '2026-09-01', endDate: '2026-09-30' })

    expect(mockedApi.getDashboard).toHaveBeenCalledWith({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    })
  })

  it('menghapus filter tanggal ketika rentang dikosongkan', async () => {
    mockedApi.getDashboard.mockResolvedValue({
      success: true,
      data: {
        summary: summaryPayload,
        expiringCustomers: [],
        expiredCustomers: [],
        activities: [],
        cashFlowChart: [],
      },
    } as any)

    const { fetchDashboard } = useDashboard()

    await fetchDashboard({ startDate: undefined, endDate: undefined })

    expect(mockedApi.getDashboard).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
    })
  })

  it('menyimpan pesan error dan mengosongkan data saat API gagal', async () => {
    mockedApi.getDashboard.mockRejectedValue(new Error('Gagal memuat data dashboard.'))

    const { fetchDashboard, summary, expiringCustomers, error, loading } = useDashboard()

    await fetchDashboard()

    expect(error.value).toBe('Gagal memuat data dashboard.')
    expect(summary.value).toBeNull()
    expect(expiringCustomers.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('menandai dashboard kosong saat tidak ada data', async () => {
    mockedApi.getDashboard.mockResolvedValue({
      success: true,
      data: {
        summary: summaryPayload,
        expiringCustomers: [],
        expiredCustomers: [],
        activities: [],
        cashFlowChart: [],
      },
    } as any)

    const { fetchDashboard, isEmpty } = useDashboard()

    await fetchDashboard()

    expect(isEmpty.value).toBe(true)
  })
})

import { ref } from 'vue'
import { salesApi } from '../api/sales.api'
import type { SalesDashboard, SalesWithdrawal } from '../types/sales'

export function useSalesDashboard() {
  const dashboard = ref<SalesDashboard | null>(null)
  const withdrawals = ref<SalesWithdrawal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const withdrawalLoading = ref(false)
  const withdrawalError = ref<string | null>(null)

  const fetchDashboard = async (userId: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await salesApi.getSalesDashboard(userId)
      dashboard.value = res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat data dashboard sales.'
      dashboard.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchWithdrawals = async (userId: string) => {
    withdrawalLoading.value = true
    withdrawalError.value = null
    try {
      const res = await salesApi.getSalesWithdrawals(userId)
      withdrawals.value = res.data ?? []
    } catch (err: any) {
      withdrawalError.value = err?.message || 'Gagal memuat riwayat penarikan.'
      withdrawals.value = []
    } finally {
      withdrawalLoading.value = false
    }
  }

  const generateCode = async (userId: string): Promise<string | null> => {
    try {
      const res = await salesApi.generateReferralCode(userId)
      return res.data?.referralCode ?? null
    } catch (err: any) {
      error.value = err?.message || 'Gagal generate kode referral.'
      return null
    }
  }

  const submitWithdrawal = async (payload: {
    userId: string
    amount: number
    bankOrWallet: string
    accountNumber: string
    accountHolder: string
    notes?: string
  }): Promise<boolean> => {
    withdrawalLoading.value = true
    withdrawalError.value = null
    try {
      await salesApi.requestWithdrawal(payload)
      await fetchWithdrawals(payload.userId)
      await fetchDashboard(payload.userId)
      return true
    } catch (err: any) {
      withdrawalError.value = err?.message || 'Gagal mengajukan penarikan.'
      return false
    } finally {
      withdrawalLoading.value = false
    }
  }

  return {
    dashboard,
    withdrawals,
    loading,
    error,
    withdrawalLoading,
    withdrawalError,
    fetchDashboard,
    fetchWithdrawals,
    generateCode,
    submitWithdrawal,
  }
}

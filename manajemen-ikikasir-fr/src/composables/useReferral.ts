import { ref } from 'vue'
import { referralApi } from '../api/referral.api'
import type {
  ReferralOverview,
  ReferralValidation,
  RequestReferralWithdrawalPayload
} from '../types/referral'

/**
 * Composable untuk alur referral (halaman Referral aplikasi IKIKASIR)
 * - Validasi kode referral yang dipakai client saat ditambahkan admin
 * - Ringkasan referral pelanggan (kode, upline, saldo, daftar downline, pencairan)
 */
export function useReferral() {
  const validation = ref<ReferralValidation | null>(null)
  const overview = ref<ReferralOverview | null>(null)
  const isLoading = ref(false)
  const isValidating = ref(false)
  const error = ref<string | null>(null)

  /** Validasi kode referral yang diketik pada form Tambah Client */
  const validateReferralCode = async (code: string): Promise<ReferralValidation | null> => {
    const cleanCode = (code || '').trim().toUpperCase()
    if (!cleanCode) {
      validation.value = null
      error.value = 'Kode referral wajib diisi.'
      return null
    }

    isValidating.value = true
    error.value = null
    try {
      const res = await referralApi.validateCode(cleanCode)
      validation.value = res.data
      if (!res.data?.valid) {
        error.value = res.data?.message || 'Kode referral tidak valid.'
      }
      return res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memvalidasi kode referral.'
      validation.value = null
      return null
    } finally {
      isValidating.value = false
    }
  }

  /** Memuat ringkasan referral seorang pelanggan */
  const fetchOverview = async (customerId: string): Promise<void> => {
    if (!customerId) return

    isLoading.value = true
    error.value = null
    try {
      const res = await referralApi.getOverview(customerId)
      overview.value = res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat data referral pelanggan.'
      overview.value = null
    } finally {
      isLoading.value = false
    }
  }

  /** Permintaan pencairan saldo komisi referral */
  const requestWithdrawal = async (
    customerId: string,
    payload: RequestReferralWithdrawalPayload
  ): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      await referralApi.requestWithdrawal(customerId, payload)
      await fetchOverview(customerId)
      return true
    } catch (err: any) {
      error.value = err?.message || 'Gagal membuat permintaan pencairan referral.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Verifikasi pencairan oleh finance */
  const updateWithdrawalStatus = async (
    id: string,
    status: string,
    notes?: string
  ): Promise<boolean> => {
    isLoading.value = true
    error.value = null
    try {
      await referralApi.updateWithdrawalStatus(id, { status, notes })
      return true
    } catch (err: any) {
      error.value = err?.message || 'Gagal memperbarui status pencairan referral.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const resetValidation = (): void => {
    validation.value = null
    error.value = null
  }

  return {
    validation,
    overview,
    isLoading,
    isValidating,
    error,
    validateReferralCode,
    fetchOverview,
    requestWithdrawal,
    updateWithdrawalStatus,
    resetValidation
  }
}

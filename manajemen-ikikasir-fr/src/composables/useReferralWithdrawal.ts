import { ref, watch } from 'vue'
import { referralApi } from '../api/referral.api'
import type {
  ConfirmWithdrawalPayload,
  ReferralWithdrawalListItem,
  ReferralWithdrawalSummary
} from '../types/referral'

const emptySummary: ReferralWithdrawalSummary = {
  pendingCount: 0,
  pendingAmount: 0,
  paidCount: 0,
  paidAmount: 0,
  rejectedCount: 0
}

/**
 * Composable untuk halaman Penarikan Referral (webbase)
 * - Daftar permintaan pencairan + filter status + pencarian + pagination server-side
 * - Konfirmasi pembayaran (SELESAI) atau penolakan (DITOLAK)
 * - Penandaan bukti penarikan sudah dikirim via WhatsApp
 */
export function useReferralWithdrawal() {
  const items = ref<ReferralWithdrawalListItem[]>([])
  const summary = ref<ReferralWithdrawalSummary>({ ...emptySummary })
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const statusFilter = ref<string>('')
  const searchQuery = ref('')
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const fetchWithdrawals = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await referralApi.getWithdrawals({
        status: statusFilter.value || undefined,
        search: searchQuery.value.trim() || undefined,
        page: currentPage.value,
        limit: pageSize.value
      })

      items.value = Array.isArray(res.data) ? res.data : []
      total.value = typeof res.total === 'number' ? res.total : items.value.length
      summary.value = res.summary ? { ...emptySummary, ...res.summary } : { ...emptySummary }
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat daftar permintaan pencairan referral.'
      items.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /** Konfirmasi pembayaran pencairan (SELESAI) atau tolak pengajuan (DITOLAK) */
  const confirmWithdrawal = async (
    id: string,
    payload: ConfirmWithdrawalPayload
  ): Promise<ReferralWithdrawalListItem | null> => {
    isSubmitting.value = true
    error.value = null
    try {
      const res = await referralApi.confirmWithdrawal(id, payload)
      await fetchWithdrawals()
      return res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memproses konfirmasi pencairan referral.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /** Tandai bukti penarikan sudah dikirim ke pelanggan via WhatsApp */
  const markWaSent = async (id: string): Promise<boolean> => {
    error.value = null
    try {
      await referralApi.markWithdrawalWaSent(id)
      await fetchWithdrawals()
      return true
    } catch (err: any) {
      error.value = err?.message || 'Gagal menandai bukti penarikan sebagai terkirim.'
      return false
    }
  }

  /** Ubah filter status lalu muat ulang data dari halaman pertama */
  const setStatusFilter = async (status: string): Promise<void> => {
    statusFilter.value = status
    currentPage.value = 1
    await fetchWithdrawals()
  }

  /** Ubah halaman / ukuran halaman */
  const setPage = async (page: number, size?: number): Promise<void> => {
    if (typeof size === 'number' && size > 0) pageSize.value = size
    currentPage.value = Math.max(1, page)
    await fetchWithdrawals()
  }

  // Pencarian didebounce agar tidak spam request ke server
  let searchTimer: any = null
  watch(searchQuery, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      currentPage.value = 1
      fetchWithdrawals()
    }, 350)
  })

  return {
    items,
    summary,
    total,
    currentPage,
    pageSize,
    statusFilter,
    searchQuery,
    isLoading,
    isSubmitting,
    error,
    fetchWithdrawals,
    confirmWithdrawal,
    markWaSent,
    setStatusFilter,
    setPage
  }
}

/**
 * Normalisasi nomor telepon Indonesia menjadi format tanpa tanda baca + awalan 62
 */
export function normalizeWaNumber(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '')
  if (!digits) return ''
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}

/**
 * Susun pesan WhatsApp bukti penarikan saldo referral
 */
export function buildWhatsappMessage(item: {
  customerName: string
  amount: number
  invoiceNo?: string | null
  bankOrWallet: string
  accountNumber: string
  accountHolder: string
  completedDate?: string | null
}): string {
  const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })

  const lines = [
    `Halo ${item.customerName || 'Bapak/Ibu'},`,
    '',
    'Pencairan saldo komisi referral Anda telah diproses.',
    '',
    `Nominal pencairan : ${currency.format(item.amount || 0)}`,
    `Nomor invoice      : ${item.invoiceNo || '-'}`,
    `Tanggal bayar      : ${item.completedDate || '-'}`,
    `Transfer ke        : ${item.bankOrWallet || '-'} ${item.accountNumber || '-'} (${item.accountHolder || '-'})`,
    '',
    'Bukti penarikan dapat dicetak dari dashboard IKIKASIR.',
    '',
    'Terima kasih 🙏',
    '- Tim IKIKASIR'
  ]

  return lines.join('\n')
}

import { ref } from 'vue'
import {
  laporanApi,
  type PenjualanMeta,
  type PenjualanReportItem,
  type PenjualanSummary,
  type LaporanFilterParams,
} from '../api/laporan.api'

const EMPTY_SUMMARY: PenjualanSummary = {
  totalPenjualan: 0,
  jumlahTransaksi: 0,
  jumlahTransaksiSelesai: 0,
  jumlahTransaksiPending: 0,
  jumlahTransaksiBatal: 0,
  produkTerjual: 0,
  pelangganUnik: 0,
  rataRataTransaksi: 0,
}

/**
 * Composable untuk memuat Laporan Penjualan dari backend
 */
export function useLaporanPenjualan() {
  const items = ref<PenjualanReportItem[]>([])
  const summary = ref<PenjualanSummary>({ ...EMPTY_SUMMARY })
  const meta = ref<PenjualanMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchPenjualan = async (params?: LaporanFilterParams): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await laporanApi.getPenjualan(params)
      items.value = Array.isArray(res.data) ? res.data : []
      if (res.summary) summary.value = res.summary
      if (res.meta) meta.value = res.meta
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat laporan penjualan dari server.'
      items.value = []
      summary.value = { ...EMPTY_SUMMARY }
      meta.value = { page: 1, limit: params?.limit || 10, total: 0, totalPages: 1 }
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    summary,
    meta,
    isLoading,
    error,
    fetchPenjualan,
  }
}

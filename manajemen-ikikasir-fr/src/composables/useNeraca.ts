import { ref } from 'vue'
import { laporanApi, type NeracaReport, type LaporanFilterParams } from '../api/laporan.api'

/**
 * Composable untuk memuat Laporan Neraca (Balance Sheet) dari backend
 */
export function useNeraca() {
  const report = ref<NeracaReport | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchNeraca = async (params?: LaporanFilterParams): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await laporanApi.getNeraca(params)
      report.value = res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat laporan neraca dari server.'
      report.value = null
    } finally {
      isLoading.value = false
    }
  }

  return {
    report,
    isLoading,
    error,
    fetchNeraca,
  }
}

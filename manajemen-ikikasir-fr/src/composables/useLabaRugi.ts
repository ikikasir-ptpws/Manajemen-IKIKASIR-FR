import { ref } from 'vue'
import { laporanApi, type LabaRugiReport, type LaporanFilterParams } from '../api/laporan.api'

/**
 * Composable untuk memuat Laporan Laba Rugi dari backend
 */
export function useLabaRugi() {
  const report = ref<LabaRugiReport | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchLabaRugi = async (params?: LaporanFilterParams): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      const res = await laporanApi.getLabaRugi(params)
      report.value = res.data
    } catch (err: any) {
      error.value = err?.message || 'Gagal memuat laporan laba rugi dari server.'
      report.value = null
    } finally {
      isLoading.value = false
    }
  }

  return {
    report,
    isLoading,
    error,
    fetchLabaRugi,
  }
}

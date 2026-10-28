import { ref, computed } from 'vue'

export type PeriodePreset = 'semua' | 'hari-ini' | '7-hari' | 'bulan-ini'

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const toISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Composable bersama untuk seluruh halaman laporan keuangan.
 * Menyediakan state rentang tanggal, preset periode, format mata uang,
 * dan helper ekspor CSV.
 */
export function useReportData() {
  // Rentang tanggal laporan. Kosong berarti seluruh periode.
  const startDate = ref('')
  const endDate = ref('')

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const formatDateID = (iso: string): string => {
    if (!iso) return '-'
    const parts = iso.split('-')
    if (parts.length !== 3) return iso
    const month = NAMA_BULAN[Number(parts[1]) - 1] || parts[1]
    return `${parts[2]} ${month} ${parts[0]}`
  }

  const periodeLabel = computed(() => {
    if (!startDate.value && !endDate.value) return 'Semua Periode'
    if (startDate.value && endDate.value) {
      return `${formatDateID(startDate.value)} - ${formatDateID(endDate.value)}`
    }
    if (startDate.value) return `Sejak ${formatDateID(startDate.value)}`
    return `Until ${formatDateID(endDate.value)}`
  })

  /**
   * Mengatur rentang tanggal berdasarkan preset periode
   */
  const setPreset = (preset: PeriodePreset): void => {
    const now = new Date()

    if (preset === 'semua') {
      startDate.value = ''
      endDate.value = ''
      return
    }

    endDate.value = toISO(now)

    if (preset === 'hari-ini') {
      startDate.value = toISO(now)
    } else if (preset === '7-hari') {
      const past = new Date(now)
      past.setDate(past.getDate() - 6)
      startDate.value = toISO(past)
    } else {
      startDate.value = toISO(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }

  /**
   * Mengekspor data laporan ke berkas CSV yang dapat dibuka pada Excel
   */
  const exportCsv = (filename: string, rows: (string | number)[][]): boolean => {
    if (!rows || rows.length === 0) return false

    const escapeCell = (cell: string | number): string =>
      `"${String(cell ?? '').replace(/"/g, '""')}"`

    const csv = rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  }

  return {
    startDate,
    endDate,
    periodeLabel,
    formatCurrency,
    formatDateID,
    setPreset,
    exportCsv,
  }
}

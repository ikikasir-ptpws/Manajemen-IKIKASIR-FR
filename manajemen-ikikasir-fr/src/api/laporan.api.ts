import { httpClient } from './httpClient'

/**
 * Baris item pada laporan (Pendapatan, Beban, Aset, Kewajiban, atau Ekuitas)
 */
export interface ReportLineItem {
  name: string
  amount: number
  jumlahTransaksi?: number
}

export interface LabaRugiSummary {
  totalPendapatan: number
  totalBeban: number
  labaBersih: number
  marginPersentase: number
  pertumbuhanPendapatan: number
  pertumbuhanBeban: number
  jumlahTransaksiPendapatan: number
  jumlahTransaksiBeban: number
  periode: {
    startDate: string
    endDate: string
  }
}

export interface LabaRugiReport {
  pendapatan: ReportLineItem[]
  beban: ReportLineItem[]
  summary: LabaRugiSummary
}

export interface NeracaSummary {
  totalAsetLancar: number
  totalAsetTetap: number
  totalAset: number
  totalKewajibanLancar: number
  totalKewajibanJangkaPanjang: number
  totalKewajiban: number
  totalEkuitas: number
  labaPeriodeBerjalan: number
  selisih: number
  isBalanced: boolean
  periode: {
    startDate: string
    endDate: string
  }
}

export interface NeracaReport {
  asetLancar: ReportLineItem[]
  asetTetap: ReportLineItem[]
  kewajibanLancar: ReportLineItem[]
  kewajibanJangkaPanjang: ReportLineItem[]
  ekuitas: ReportLineItem[]
  summary: NeracaSummary
}

export interface PenjualanItem {
  name: string
  category: string
  qty: number
  price: number
}

export interface PenjualanReportItem {
  id: string
  invoiceNo: string
  date: string
  displayDate: string
  time: string
  customer: string
  items: PenjualanItem[]
  paymentMethod: string
  status: string
  paymentProofUrl: string
  notes: string
}

export interface PenjualanSummary {
  totalPenjualan: number
  jumlahTransaksi: number
  jumlahTransaksiSelesai: number
  jumlahTransaksiPending: number
  jumlahTransaksiBatal: number
  produkTerjual: number
  pelangganUnik: number
  rataRataTransaksi: number
}

export interface PenjualanMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface LaporanFilterParams {
  startDate?: string
  endDate?: string
  search?: string
  status?: string
  page?: number
  limit?: number
}

export const laporanApi = {
  /**
   * Laporan Laba Rugi (Income Statement)
   */
  getLabaRugi: (params?: LaporanFilterParams) =>
    httpClient.get<LabaRugiReport>('/laporan/laba-rugi', params),

  /**
   * Laporan Neraca (Balance Sheet)
   */
  getNeraca: (params?: LaporanFilterParams) =>
    httpClient.get<NeracaReport>('/laporan/neraca', params),

  /**
   * Laporan Penjualan (Sales Report)
   */
  getPenjualan: (params?: LaporanFilterParams) =>
    httpClient.get<PenjualanReportItem[]>('/laporan/penjualan', params),
}

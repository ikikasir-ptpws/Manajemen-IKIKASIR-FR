/**
 * Entitas & tipe domain untuk modul Laporan Keuangan
 * (Laba Rugi, Neraca, dan Laporan Penjualan)
 */

/**
 * Baris item pada laporan (Pendapatan, Beban, Aset, Kewajiban, atau Ekuitas)
 */
export interface ReportLineItem {
  name: string;
  amount: number;
  jumlahTransaksi?: number;
}

/**
 * Ringkasan Laba Rugi untuk satu periode
 */
export interface LabaRugiSummary {
  totalPendapatan: number;
  totalBeban: number;
  labaBersih: number;
  marginPersentase: number;
  pertumbuhanPendapatan: number;
  pertumbuhanBeban: number;
  jumlahTransaksiPendapatan: number;
  jumlahTransaksiBeban: number;
  periode: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Struktur laporan Laba Rugi
 */
export interface LabaRugiReport {
  pendapatan: ReportLineItem[];
  beban: ReportLineItem[];
  summary: LabaRugiSummary;
}

/**
 * Ringkasan Neraca (Balance Sheet) pada satu tanggal
 */
export interface NeracaSummary {
  totalAsetLancar: number;
  totalAsetTetap: number;
  totalAset: number;
  totalKewajibanLancar: number;
  totalKewajibanJangkaPanjang: number;
  totalKewajiban: number;
  totalEkuitas: number;
  labaPeriodeBerjalan: number;
  selisih: number;
  isBalanced: boolean;
  periode: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Struktur laporan Neraca
 */
export interface NeracaReport {
  asetLancar: ReportLineItem[];
  asetTetap: ReportLineItem[];
  kewajibanLancar: ReportLineItem[];
  kewajibanJangkaPanjang: ReportLineItem[];
  ekuitas: ReportLineItem[];
  summary: NeracaSummary;
}

/**
 * Item/baris penjualan pada Laporan Penjualan
 */
export interface PenjualanReportItem {
  id: string;
  invoiceNo: string;
  date: string;
  displayDate: string;
  time: string;
  customer: string;
  items: PenjualanItem[];
  paymentMethod: string;
  status: string;
  paymentProofUrl: string;
  notes: string;
}

/**
 * Detail produk / paket pada satu transaksi penjualan
 */
export interface PenjualanItem {
  name: string;
  category: string;
  qty: number;
  price: number;
}

/**
 * Ringkasan metrik Laporan Penjualan
 */
export interface PenjualanSummary {
  totalPenjualan: number;
  jumlahTransaksi: number;
  jumlahTransaksiSelesai: number;
  jumlahTransaksiPending: number;
  jumlahTransaksiBatal: number;
  produkTerjual: number;
  pelangganUnik: number;
  rataRataTransaksi: number;
}

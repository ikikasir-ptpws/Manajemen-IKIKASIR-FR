/**
 * DTO (Data Transfer Object) untuk modul Laporan Keuangan
 */

export interface LaporanFilterDto {
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LabaRugiResponseDto {
  pendapatan: { name: string; amount: number; jumlahTransaksi: number }[];
  beban: { name: string; amount: number; jumlahTransaksi: number }[];
  summary: {
    totalPendapatan: number;
    totalBeban: number;
    labaBersih: number;
    marginPersentase: number;
    pertumbuhanPendapatan: number;
    pertumbuhanBeban: number;
    jumlahTransaksiPendapatan: number;
    jumlahTransaksiBeban: number;
    periode: { startDate: string; endDate: string };
  };
}

export interface NeracaResponseDto {
  asetLancar: { name: string; amount: number }[];
  asetTetap: { name: string; amount: number }[];
  kewajibanLancar: { name: string; amount: number }[];
  kewajibanJangkaPanjang: { name: string; amount: number }[];
  ekuitas: { name: string; amount: number }[];
  summary: {
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
    periode: { startDate: string; endDate: string };
  };
}

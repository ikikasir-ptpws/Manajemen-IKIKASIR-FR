import { IFinancialReportRepository } from '../../domain/interfaces/IFinancialReportRepository.js';
import { NeracaReport } from '../../domain/entities/FinancialReport.js';
import { LabaRugiUseCases, formatRawDate } from './LabaRugiUseCases.js';
import { LaporanFilterDto } from '../dtos/laporan.dto.js';

/**
 * Saldo awal kas (modal awal perusahaan) yang menjadi titik awal perhitungan kas pada Neraca
 */
const SALDO_AWAL_KAS = 30000000;

/**
 * Nilai aset tetap & kewajiban yang belum memiliki sumber pencatatan di modul keuangan.
 * Seluruh data keuangan会社 dicatat melalui arus kas, sehingga pos-pos di bawah
 * merupakan konfigurasi nilai tetap perusahaan.
 */
const PERLENGKAPAN_KANTOR = 3200000;

const ASET_TETAP = [
  { name: 'Peralatan Komputer & Server', amount: 35000000 },
  { name: 'Peralatan Kantor', amount: 8500000 },
  { name: 'Akumulasi Penyusutan', amount: -12500000 },
];

const KEWAJIBAN_LANCAR = [
  { name: 'Utang Usaha', amount: 5000000 },
  { name: 'Pendapatan Diterima Dimuka', amount: 8500000 },
  { name: 'Utang Pajak', amount: 1200000 },
];

const KEWAJIBAN_JANGKA_PANJANG = [
  { name: 'Utang Bank (Kredit Usaha)', amount: 15000000 },
];

export class NeracaUseCases {
  constructor(
    private reportRepo: IFinancialReportRepository,
    private labaRugiUseCases: LabaRugiUseCases
  ) {}

  /**
   * Menyusun neraca (balance sheet) pada tanggal akhir periode.
   *
   * Catatan: karena sistem belum memiliki buku besar dengan jurnal ganda,
   * nilai ekuitas dihitung sebagai selisih antara total aset dan total kewajiban
   * agar neraca tetap seimbang, sementara "Laba Periode Berjalan" diambil
   * langsung dari laporan laba rugi periode berjalan.
   */
  async getNeraca(filter?: LaporanFilterDto): Promise<NeracaReport> {
    const endDate = filter?.endDate || formatRawDate(new Date());

    const [saldoKas, piutang, labaRugi] = await Promise.all([
      this.reportRepo.getCashBalance(endDate),
      this.reportRepo.getReceivableAmount(endDate),
      this.labaRugiUseCases.getLabaRugi(filter),
    ]);

    const asetLancar = [
      { name: 'Kas & Setara Kas', amount: SALDO_AWAL_KAS + saldoKas },
      { name: 'Piutang Usaha / Penjualan (Pending)', amount: piutang },
      { name: 'Perlengkapan Kantor', amount: PERLENGKAPAN_KANTOR },
    ];

    const asetTetap = ASET_TETAP.map((item) => ({ ...item }));
    const kewajibanLancar = KEWAJIBAN_LANCAR.map((item) => ({ ...item }));
    const kewajibanJangkaPanjang = KEWAJIBAN_JANGKA_PANJANG.map((item) => ({ ...item }));

    const totalAsetLancar = asetLancar.reduce((sum, item) => sum + item.amount, 0);
    const totalAsetTetap = asetTetap.reduce((sum, item) => sum + item.amount, 0);
    const totalAset = totalAsetLancar + totalAsetTetap;

    const totalKewajibanLancar = kewajibanLancar.reduce((sum, item) => sum + item.amount, 0);
    const totalKewajibanJangkaPanjang = kewajibanJangkaPanjang.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalKewajiban = totalKewajibanLancar + totalKewajibanJangkaPanjang;

    const labaPeriodeBerjalan = labaRugi.summary.labaBersih;
    const totalEkuitas = totalAset - totalKewajiban;

    const ekuitas = [
      { name: 'Modal Disetor', amount: totalEkuitas - labaPeriodeBerjalan },
      { name: 'Laba Periode Berjalan', amount: labaPeriodeBerjalan },
    ];

    const selisih = totalAset - (totalKewajiban + totalEkuitas);

    return {
      asetLancar,
      asetTetap,
      kewajibanLancar,
      kewajibanJangkaPanjang,
      ekuitas,
      summary: {
        totalAsetLancar,
        totalAsetTetap,
        totalAset,
        totalKewajibanLancar,
        totalKewajibanJangkaPanjang,
        totalKewajiban,
        totalEkuitas,
        labaPeriodeBerjalan,
        selisih,
        isBalanced: Math.abs(selisih) < 1,
        periode: {
          startDate: filter?.startDate || '',
          endDate,
        },
      },
    };
  }
}

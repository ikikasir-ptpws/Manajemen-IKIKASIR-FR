import { IFinancialReportRepository } from '../../domain/interfaces/IFinancialReportRepository.js';
import { NeracaReport } from '../../domain/entities/FinancialReport.js';
import { LabaRugiUseCases, formatRawDate } from './LabaRugiUseCases.js';
import { LaporanFilterDto } from '../dtos/laporan.dto.js';
import { PrismaNeracaItemRepository } from '../../repositories/PrismaNeracaItemRepository.js';

const neracaItemRepo = new PrismaNeracaItemRepository();

export class NeracaUseCases {
  constructor(
    private reportRepo: IFinancialReportRepository,
    private labaRugiUseCases: LabaRugiUseCases
  ) {}

  /**
   * Menyusun neraca (balance sheet) pada tanggal akhir periode.
   *
   * Sumber data:
   * - Kas & Setara Kas      : dihitung dari total cashflow (masuk settled - keluar)
   * - Piutang               : total pemasukan berstatus Pending
   * - Aset Tetap            : dari tabel neraca_items (group = "aset_tetap")
   * - Kewajiban Lancar      : dari tabel neraca_items (group = "kewajiban_lancar")
   * - Kewajiban Jangka Panjang: dari tabel neraca_items (group = "kewajiban_jangka_panjang")
   * - Ekuitas               : dihitung sebagai Total Aset - Total Kewajiban
   * - Laba Berjalan         : dari laporan laba rugi periode yang sama
   */
  async getNeraca(filter?: LaporanFilterDto): Promise<NeracaReport> {
    const endDate = filter?.endDate || formatRawDate(new Date());

    const [saldoKas, piutang, labaRugi, asetTetapItems, kewajibanLancarItems, kewajibanJPItems] =
      await Promise.all([
        this.reportRepo.getCashBalance(endDate),
        this.reportRepo.getReceivableAmount(endDate),
        this.labaRugiUseCases.getLabaRugi(filter),
        neracaItemRepo.findByGroup('aset_tetap'),
        neracaItemRepo.findByGroup('kewajiban_lancar'),
        neracaItemRepo.findByGroup('kewajiban_jangka_panjang'),
      ]);

    // Aset Lancar: dari cashflow nyata di database
    const asetLancarRaw = [
      { name: 'Kas & Setara Kas', amount: saldoKas },
      { name: 'Piutang Usaha / Penjualan (Pending)', amount: piutang },
    ];
    const asetLancar = asetLancarRaw.filter((item) => item.amount !== 0);

    // Aset Tetap: dari DB (user input)
    const asetTetap = asetTetapItems.map((item) => ({
      name: item.name,
      amount: item.amount,
    }));

    // Kewajiban: dari DB (user input)
    const kewajibanLancar = kewajibanLancarItems.map((item) => ({
      name: item.name,
      amount: item.amount,
    }));
    const kewajibanJangkaPanjang = kewajibanJPItems.map((item) => ({
      name: item.name,
      amount: item.amount,
    }));

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

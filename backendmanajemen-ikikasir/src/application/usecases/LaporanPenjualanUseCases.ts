import { IFinancialReportRepository } from '../../domain/interfaces/IFinancialReportRepository.js';
import { PenjualanReportItem, PenjualanSummary } from '../../domain/entities/FinancialReport.js';
import { LaporanFilterDto, PaginationMetaDto } from '../dtos/laporan.dto.js';

export interface LaporanPenjualanResult {
  items: PenjualanReportItem[];
  summary: PenjualanSummary;
  meta: PaginationMetaDto;
}

export class LaporanPenjualanUseCases {
  constructor(private reportRepo: IFinancialReportRepository) {}

  /**
   * Menyusun laporan penjualan beserta ringkasan metrik & metadata paginasi
   */
  async getLaporanPenjualan(filter?: LaporanFilterDto): Promise<LaporanPenjualanResult> {
    const page = Math.max(1, Number(filter?.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(filter?.limit) || 20));

    const [{ transactions, total }, summary] = await Promise.all([
      this.reportRepo.findSalesTransactions({ ...filter, page, limit }),
      this.reportRepo.getSalesSummary(filter),
    ]);

    const items: PenjualanReportItem[] = transactions.map((trx) => ({
      id: trx.id,
      invoiceNo: trx.invoiceNo || `TRX-${trx.rawDate.replace(/-/g, '')}`,
      date: trx.rawDate,
      displayDate: trx.displayDate,
      time: trx.time,
      customer: trx.customer || 'Pelanggan',
      items: [
        {
          name: trx.desc,
          category: trx.category,
          qty: 1,
          price: trx.amount,
        },
      ],
      paymentMethod: trx.paymentMethod,
      status: trx.status,
      paymentProofUrl: trx.paymentProofUrl,
      notes: trx.notes,
    }));

    return {
      items,
      summary,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

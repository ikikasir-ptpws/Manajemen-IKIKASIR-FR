import { beforeEach, describe, expect, it, vi } from 'vitest';

const findMany = vi.hoisted(() => vi.fn());

vi.mock('../infrastructure/database/prisma.js', () => ({
  prisma: {
    cashTransaction: { findMany },
  },
}));

import { PrismaFinancialReportRepository } from '../repositories/PrismaFinancialReportRepository.js';

describe('Laporan penjualan dengan komisi referral', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('mengurangi komisi referral dari nilai bersih tanpa mengubah total pembayaran', async () => {
    findMany.mockResolvedValue([
      { amount: 250000, referralCommission: 50000, referralSource: 'SALES', status: 'Selesai', customer: 'Klien Sales' },
      { amount: 250000, referralCommission: 0, referralSource: '', status: 'Selesai', customer: 'Klien Kantor' },
      { amount: 250000, referralCommission: 15000, referralSource: 'CUSTOMER', status: 'Selesai', customer: 'Klien Referral Android' },
      { amount: 250000, referralCommission: 50000, referralSource: 'SALES', status: 'Pending', customer: 'Belum Dibayar' },
      { amount: 250000, referralCommission: 50000, referralSource: 'SALES', status: 'Batal', customer: 'Dibatalkan' },
    ]);

    const report = await new PrismaFinancialReportRepository().getSalesSummary();

    expect(report.totalPenjualan).toBe(750000);
    expect(report.totalKomisiSales).toBe(50000);
    expect(report.totalKomisiPelanggan).toBe(15000);
    expect(report.totalKomisiReferral).toBe(65000);
    expect(report.penjualanBersih).toBe(685000);
    expect(report.jumlahTransaksiSelesai).toBe(3);
  });
});

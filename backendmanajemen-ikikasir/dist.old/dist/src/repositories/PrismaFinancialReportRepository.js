import { prisma } from '../infrastructure/database/prisma.js';
import { CashTransaction } from '../domain/entities/CashTransaction.js';
export class PrismaFinancialReportRepository {
    toEntity(record) {
        return new CashTransaction({
            id: record.id,
            type: record.type,
            category: record.category,
            desc: record.desc,
            amount: record.amount,
            date: record.date,
            rawDate: record.rawDate,
            displayDate: record.displayDate,
            time: record.time,
            customer: record.customer,
            paymentMethod: record.paymentMethod,
            paymentProofUrl: record.paymentProofUrl,
            status: record.status,
            invoiceNo: record.invoiceNo,
            notes: record.notes,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
    /**
     * Menyusun klausa where berdasarkan filter periode, status, dan pencarian
     */
    buildWhereClause(filter, baseWhere = {}) {
        const where = { ...baseWhere };
        if (filter?.startDate || filter?.endDate) {
            where.rawDate = {};
            if (filter.startDate) {
                where.rawDate.gte = filter.startDate;
            }
            if (filter.endDate) {
                where.rawDate.lte = filter.endDate;
            }
        }
        if (filter?.status && filter.status !== 'Semua') {
            where.status = filter.status;
        }
        if (filter?.search && filter.search.trim()) {
            const q = filter.search.trim();
            where.OR = [
                { desc: { contains: q, mode: 'insensitive' } },
                { customer: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
                { invoiceNo: { contains: q, mode: 'insensitive' } },
                { paymentMethod: { contains: q, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    /**
     * Status transaksi yang dianggap sudah settled (terhitung sebagai pendapatan)
     */
    settledStatusFilter() {
        return { in: ['Selesai', 'Lunas', 'PAID'] };
    }
    async getIncomeByCategory(filter) {
        const where = this.buildWhereClause(filter, {
            type: 'masuk',
            status: this.settledStatusFilter(),
        });
        const grouped = await prisma.cashTransaction.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            _count: { _all: true },
        });
        return grouped.map((row) => ({
            category: row.category || 'Tanpa Kategori',
            amount: Number(row._sum?.amount || 0),
            jumlahTransaksi: Number(row._count?._all || 0),
        }));
    }
    async getExpenseByCategory(filter) {
        const where = this.buildWhereClause(filter, {
            type: 'keluar',
        });
        const grouped = await prisma.cashTransaction.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            _count: { _all: true },
        });
        return grouped.map((row) => ({
            category: row.category || 'Tanpa Kategori',
            amount: Number(row._sum?.amount || 0),
            jumlahTransaksi: Number(row._count?._all || 0),
        }));
    }
    async getCashBalance(untilDate) {
        const base = {};
        if (untilDate) {
            base.rawDate = { lte: untilDate };
        }
        // Pemasukan hanya dihitung bila transaksinya benar-benar sudah settled (sudah diterima kas)
        const [masuk, keluar] = await Promise.all([
            prisma.cashTransaction.aggregate({
                where: { ...base, type: 'masuk', status: this.settledStatusFilter() },
                _sum: { amount: true },
            }),
            prisma.cashTransaction.aggregate({
                where: { ...base, type: 'keluar' },
                _sum: { amount: true },
            }),
        ]);
        return Number(masuk._sum?.amount || 0) - Number(keluar._sum?.amount || 0);
    }
    async getReceivableAmount(untilDate) {
        const where = {
            type: 'masuk',
            status: 'Pending',
        };
        if (untilDate) {
            where.rawDate = { lte: untilDate };
        }
        const aggregate = await prisma.cashTransaction.aggregate({
            where,
            _sum: { amount: true },
        });
        return Number(aggregate._sum?.amount || 0);
    }
    async findSalesTransactions(filter) {
        const where = this.buildWhereClause(filter, { type: 'masuk' });
        const page = Math.max(1, Number(filter?.page) || 1);
        const limit = Math.max(1, Math.min(200, Number(filter?.limit) || 20));
        const [records, total] = await Promise.all([
            prisma.cashTransaction.findMany({
                where,
                orderBy: [{ rawDate: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.cashTransaction.count({ where }),
        ]);
        return {
            transactions: records.map((r) => this.toEntity(r)),
            total,
        };
    }
    async getSalesSummary(filter) {
        const where = this.buildWhereClause(filter, { type: 'masuk' });
        const records = await prisma.cashTransaction.findMany({
            where,
            select: {
                amount: true,
                status: true,
                customer: true,
            },
        });
        let totalPenjualan = 0;
        let jumlahTransaksi = 0;
        let jumlahTransaksiSelesai = 0;
        let jumlahTransaksiPending = 0;
        let jumlahTransaksiBatal = 0;
        const pelanggan = new Set();
        for (const item of records) {
            jumlahTransaksi++;
            if (item.customer) {
                pelanggan.add(item.customer);
            }
            if (item.status === 'Selesai') {
                totalPenjualan += Number(item.amount || 0);
                jumlahTransaksiSelesai++;
            }
            else if (item.status === 'Pending') {
                jumlahTransaksiPending++;
            }
            else if (item.status === 'Batal') {
                jumlahTransaksiBatal++;
            }
        }
        return {
            totalPenjualan,
            jumlahTransaksi,
            jumlahTransaksiSelesai,
            jumlahTransaksiPending,
            jumlahTransaksiBatal,
            produkTerjual: jumlahTransaksiSelesai,
            pelangganUnik: pelanggan.size,
            rataRataTransaksi: jumlahTransaksiSelesai > 0
                ? Number((totalPenjualan / jumlahTransaksiSelesai).toFixed(2))
                : 0,
        };
    }
}
//# sourceMappingURL=PrismaFinancialReportRepository.js.map
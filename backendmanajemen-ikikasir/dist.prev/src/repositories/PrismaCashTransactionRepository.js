import { prisma } from '../infrastructure/database/prisma.js';
import { CashTransaction } from '../domain/entities/CashTransaction.js';
export class PrismaCashTransactionRepository {
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
    buildWhereClause(filter) {
        const where = {};
        if (filter?.type && filter.type !== 'semua') {
            where.type = filter.type;
        }
        if (filter?.category) {
            where.category = filter.category;
        }
        if (filter?.startDate || filter?.endDate) {
            where.rawDate = {};
            if (filter.startDate) {
                where.rawDate.gte = filter.startDate;
            }
            if (filter.endDate) {
                where.rawDate.lte = filter.endDate;
            }
        }
        if (filter?.search && filter.search.trim()) {
            const q = filter.search.trim();
            where.OR = [
                { desc: { contains: q, mode: 'insensitive' } },
                { customer: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
                { paymentMethod: { contains: q, mode: 'insensitive' } },
                { invoiceNo: { contains: q, mode: 'insensitive' } },
                { rawDate: { contains: q, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    async create(data) {
        const dateObj = data.date ? new Date(data.date) : new Date();
        // Auto format rawDate jika belum ada
        const rawDate = data.rawDate || this.formatRawDate(dateObj);
        const displayDate = data.displayDate || this.formatDisplayDate(dateObj);
        const time = data.time || this.formatTime(dateObj);
        const created = await prisma.cashTransaction.create({
            data: {
                type: data.type,
                category: data.category,
                desc: data.desc,
                amount: data.amount,
                date: dateObj,
                rawDate,
                displayDate,
                time,
                customer: data.customer || '',
                paymentMethod: data.paymentMethod || 'Tunai',
                paymentProofUrl: data.paymentProofUrl || '',
                status: data.status || 'Selesai',
                invoiceNo: data.invoiceNo || '',
                notes: data.notes || '',
            },
        });
        return this.toEntity(created);
    }
    async findById(id) {
        const record = await prisma.cashTransaction.findUnique({
            where: { id },
        });
        return record ? this.toEntity(record) : null;
    }
    async findAll(filter) {
        const where = this.buildWhereClause(filter);
        const records = await prisma.cashTransaction.findMany({
            where,
            orderBy: [
                { rawDate: 'desc' },
                { createdAt: 'desc' },
            ],
        });
        return records.map((r) => this.toEntity(r));
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.date) {
            const d = new Date(data.date);
            updateData.date = d;
            if (!data.rawDate)
                updateData.rawDate = this.formatRawDate(d);
            if (!data.displayDate)
                updateData.displayDate = this.formatDisplayDate(d);
            if (!data.time)
                updateData.time = this.formatTime(d);
        }
        const updated = await prisma.cashTransaction.update({
            where: { id },
            data: updateData,
        });
        return this.toEntity(updated);
    }
    async delete(id) {
        await prisma.cashTransaction.delete({
            where: { id },
        });
        return true;
    }
    async count() {
        return prisma.cashTransaction.count();
    }
    async getSummary(filter) {
        // Ambil data sesuai filter untuk summary
        const where = this.buildWhereClause(filter);
        // Cari transaksi berstatus Selesai (atau semua yang masuk dalam periode)
        const records = await prisma.cashTransaction.findMany({
            where,
            select: {
                type: true,
                amount: true,
                status: true,
            },
        });
        let totalMasuk = 0;
        let totalKeluar = 0;
        let countMasuk = 0;
        let countKeluar = 0;
        for (const item of records) {
            if (item.type === 'masuk') {
                // Hanya hitung pemasukan yang Selesai / Lunas
                if (!item.status || item.status === 'Selesai') {
                    totalMasuk += item.amount;
                    countMasuk++;
                }
            }
            else if (item.type === 'keluar') {
                totalKeluar += item.amount;
                countKeluar++;
            }
        }
        const saldoBersih = totalMasuk - totalKeluar;
        // Hitung periode perbandingan sebelumnya (real comparison period)
        let prevStartDateObj;
        let prevEndDateObj;
        if (filter?.startDate && filter?.endDate) {
            const curStart = new Date(filter.startDate);
            const curEnd = new Date(filter.endDate);
            const durationMs = Math.max(curEnd.getTime() - curStart.getTime(), 24 * 60 * 60 * 1000);
            prevEndDateObj = new Date(curStart.getTime() - 24 * 60 * 60 * 1000);
            prevStartDateObj = new Date(prevEndDateObj.getTime() - durationMs);
        }
        else if (filter?.startDate && !filter?.endDate) {
            const curStart = new Date(filter.startDate);
            prevStartDateObj = new Date(curStart.getFullYear(), curStart.getMonth() - 1, curStart.getDate());
            prevEndDateObj = new Date(curStart.getTime() - 24 * 60 * 60 * 1000);
        }
        else {
            const now = new Date();
            // Default: Bulan sebelumnya penuh
            prevStartDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEndDateObj = new Date(now.getFullYear(), now.getMonth(), 0);
        }
        const prevWhere = {};
        if (filter?.category) {
            prevWhere.category = filter.category;
        }
        prevWhere.rawDate = {
            gte: this.formatRawDate(prevStartDateObj),
            lte: this.formatRawDate(prevEndDateObj),
        };
        const prevRecords = await prisma.cashTransaction.findMany({
            where: prevWhere,
            select: {
                type: true,
                amount: true,
                status: true,
            },
        });
        let prevTotalMasuk = 0;
        let prevTotalKeluar = 0;
        for (const item of prevRecords) {
            if (item.type === 'masuk') {
                if (!item.status || item.status === 'Selesai') {
                    prevTotalMasuk += item.amount;
                }
            }
            else if (item.type === 'keluar') {
                prevTotalKeluar += item.amount;
            }
        }
        // Hitung persentase pertumbuhan real
        let pertumbuhanMasuk = 0;
        if (prevTotalMasuk > 0) {
            pertumbuhanMasuk = Number((((totalMasuk - prevTotalMasuk) / prevTotalMasuk) * 100).toFixed(1));
        }
        else if (totalMasuk > 0) {
            pertumbuhanMasuk = 100;
        }
        else {
            pertumbuhanMasuk = 0;
        }
        let pertumbuhanKeluar = 0;
        if (prevTotalKeluar > 0) {
            pertumbuhanKeluar = Number((((totalKeluar - prevTotalKeluar) / prevTotalKeluar) * 100).toFixed(1));
        }
        else if (totalKeluar > 0) {
            pertumbuhanKeluar = 100;
        }
        else {
            pertumbuhanKeluar = 0;
        }
        return {
            totalMasuk,
            totalKeluar,
            saldoBersih,
            countMasuk,
            countKeluar,
            pertumbuhanMasuk,
            pertumbuhanKeluar,
        };
    }
    formatRawDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    formatDisplayDate(d) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()] || '';
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }
    formatTime(d) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${mins} WIB`;
    }
}
//# sourceMappingURL=PrismaCashTransactionRepository.js.map
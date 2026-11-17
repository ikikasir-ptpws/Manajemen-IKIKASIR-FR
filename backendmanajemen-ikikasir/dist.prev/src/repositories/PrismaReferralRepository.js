import { prisma } from '../infrastructure/database/prisma.js';
import { ReferralCommission } from '../domain/entities/ReferralCommission.js';
import { ReferralWithdrawal } from '../domain/entities/ReferralWithdrawal.js';
import { InternalServerError } from '../domain/errors/AppError.js';
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export class PrismaReferralRepository {
    toCommissionEntity(record) {
        return new ReferralCommission({
            id: record.id,
            uplineId: record.uplineId,
            downlineId: record.downlineId,
            amount: record.amount,
            status: record.status,
            notes: record.notes ?? '',
            createdAt: record.createdAt,
            activatedAt: record.activatedAt ?? null,
            downlineName: record.downline?.name ?? '',
            downlineBusinessName: record.downline?.businessName ?? '',
            downlinePhone: record.downline?.phone ?? '',
            downlineStatus: record.downline?.status ?? '',
        });
    }
    toWithdrawalEntity(record) {
        return new ReferralWithdrawal({
            id: record.id,
            customerId: record.customerId,
            amount: record.amount,
            bankOrWallet: record.bankOrWallet ?? '',
            accountNumber: record.accountNumber ?? '',
            accountHolder: record.accountHolder ?? '',
            requestDate: record.requestDate,
            completedDate: record.completedDate ?? null,
            status: record.status,
            notes: record.notes ?? '',
            invoiceNo: record.invoiceNo ?? null,
            processedBy: record.processedBy ?? '',
            transferReference: record.transferReference ?? '',
            waSentAt: record.waSentAt ?? null,
            rejectionReason: record.rejectionReason ?? '',
            rejectedAt: record.rejectedAt ?? null,
            customerName: record.customer?.name ?? '',
            customerBusinessName: record.customer?.businessName ?? '',
            customerPhone: record.customer?.phone ?? '',
            customerEmail: record.customer?.email ?? '',
            customerReferralCode: record.customer?.referralCode ?? '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
    async createCommission(data) {
        try {
            const record = await prisma.referralCommission.create({
                data: {
                    uplineId: data.uplineId,
                    downlineId: data.downlineId,
                    amount: data.amount,
                    status: data.status ?? 'MENUNGGU_VERIFIKASI',
                    notes: data.notes ?? '',
                    activatedAt: data.status === 'AKTIF' ? new Date() : null,
                },
                include: { downline: true },
            });
            return this.toCommissionEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal menyimpan komisi referral: ${error.message}`);
        }
    }
    async findCommissionByUplineAndDownline(uplineId, downlineId) {
        try {
            const record = await prisma.referralCommission.findUnique({
                where: { uplineId_downlineId: { uplineId, downlineId } },
                include: { downline: true },
            });
            return record ? this.toCommissionEntity(record) : null;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mencari komisi referral: ${error.message}`);
        }
    }
    async findCommissionsByUpline(uplineId) {
        try {
            const records = await prisma.referralCommission.findMany({
                where: { uplineId },
                include: { downline: true },
                orderBy: { createdAt: 'desc' },
            });
            return records.map((r) => this.toCommissionEntity(r));
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil daftar downline referral: ${error.message}`);
        }
    }
    async findCommissionsByDownline(downlineId) {
        try {
            const records = await prisma.referralCommission.findMany({
                where: { downlineId },
                include: { downline: true },
                orderBy: { createdAt: 'desc' },
            });
            return records.map((r) => this.toCommissionEntity(r));
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil riwayat referral pelanggan: ${error.message}`);
        }
    }
    async updateCommissionStatus(id, status, notes) {
        try {
            const record = await prisma.referralCommission.update({
                where: { id },
                data: {
                    status,
                    notes: notes !== undefined ? notes : undefined,
                    activatedAt: status === 'AKTIF' ? new Date() : undefined,
                },
                include: { downline: true },
            });
            return this.toCommissionEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal memperbarui status komisi referral: ${error.message}`);
        }
    }
    async createWithdrawal(data) {
        try {
            const record = await prisma.referralWithdrawal.create({
                data: {
                    customerId: data.customerId,
                    amount: data.amount,
                    bankOrWallet: data.bankOrWallet,
                    accountNumber: data.accountNumber,
                    accountHolder: data.accountHolder,
                    status: data.status ?? 'MENUNGGU_VERIFIKASI',
                    notes: data.notes ?? '',
                },
            });
            return this.toWithdrawalEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal menyimpan permintaan pencairan referral: ${error.message}`);
        }
    }
    async findWithdrawalsByCustomer(customerId) {
        try {
            const records = await prisma.referralWithdrawal.findMany({
                where: { customerId },
                include: { customer: true },
                orderBy: { requestDate: 'desc' },
            });
            return records.map((r) => this.toWithdrawalEntity(r));
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil riwayat pencairan referral: ${error.message}`);
        }
    }
    async findWithdrawalById(id) {
        try {
            const record = await prisma.referralWithdrawal.findUnique({
                where: { id },
                include: { customer: true },
            });
            return record ? this.toWithdrawalEntity(record) : null;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mencari permintaan pencairan referral: ${error.message}`);
        }
    }
    async updateWithdrawalStatus(id, status, notes) {
        try {
            const record = await prisma.referralWithdrawal.update({
                where: { id },
                data: {
                    status,
                    notes: notes !== undefined ? notes : undefined,
                    completedDate: status === 'SELESAI' ? new Date() : undefined,
                },
                include: { customer: true },
            });
            return this.toWithdrawalEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal memperbarui status pencairan referral: ${error.message}`);
        }
    }
    async findWithdrawals(filter) {
        try {
            const where = {};
            if (filter.status && filter.status !== 'ALL') {
                where.status = filter.status;
            }
            if (filter.customerId) {
                where.customerId = filter.customerId;
            }
            if (filter.search && filter.search.trim()) {
                const q = filter.search.trim();
                where.OR = [
                    { accountHolder: { contains: q, mode: 'insensitive' } },
                    { accountNumber: { contains: q, mode: 'insensitive' } },
                    { invoiceNo: { contains: q, mode: 'insensitive' } },
                    { customer: { name: { contains: q, mode: 'insensitive' } } },
                    { customer: { businessName: { contains: q, mode: 'insensitive' } } },
                    { customer: { email: { contains: q, mode: 'insensitive' } } },
                    { customer: { phone: { contains: q, mode: 'insensitive' } } },
                ];
            }
            const page = filter.page && filter.page > 0 ? filter.page : 1;
            const limit = filter.limit && filter.limit > 0 ? filter.limit : 0;
            const [records, total] = await prisma.$transaction([
                prisma.referralWithdrawal.findMany({
                    where,
                    include: { customer: true },
                    orderBy: { requestDate: 'desc' },
                    ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
                }),
                prisma.referralWithdrawal.count({ where }),
            ]);
            return { items: records.map((r) => this.toWithdrawalEntity(r)), total };
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil daftar pencairan referral: ${error.message}`);
        }
    }
    async updateWithdrawal(id, data) {
        try {
            const payload = {};
            if (data.status !== undefined)
                payload.status = data.status;
            if (data.notes !== undefined)
                payload.notes = data.notes;
            if (data.invoiceNo !== undefined)
                payload.invoiceNo = data.invoiceNo;
            if (data.processedBy !== undefined)
                payload.processedBy = data.processedBy;
            if (data.transferReference !== undefined)
                payload.transferReference = data.transferReference;
            if (data.rejectionReason !== undefined)
                payload.rejectionReason = data.rejectionReason;
            if (data.completedDate !== undefined)
                payload.completedDate = data.completedDate;
            if (data.rejectedAt !== undefined)
                payload.rejectedAt = data.rejectedAt;
            if (data.waSentAt !== undefined)
                payload.waSentAt = data.waSentAt;
            const record = await prisma.referralWithdrawal.update({
                where: { id },
                data: payload,
                include: { customer: true },
            });
            return this.toWithdrawalEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal memperbarui data pencairan referral: ${error.message}`);
        }
    }
    async confirmWithdrawalPayout(id, data) {
        try {
            const dateObj = new Date();
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const rawDate = `${year}-${month}-${day}`;
            const displayDate = `${day} ${MONTHS_ID[dateObj.getMonth()]} ${year}`;
            const time = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} WIB`;
            const [record] = await prisma.$transaction([
                prisma.referralWithdrawal.update({
                    where: { id },
                    data: {
                        status: data.status,
                        notes: data.notes !== undefined ? data.notes : undefined,
                        invoiceNo: data.invoiceNo !== undefined ? data.invoiceNo : undefined,
                        processedBy: data.processedBy !== undefined ? data.processedBy : undefined,
                        transferReference: data.transferReference !== undefined ? data.transferReference : undefined,
                        rejectionReason: data.rejectionReason !== undefined ? data.rejectionReason : undefined,
                        completedDate: data.completedDate !== undefined ? data.completedDate : undefined,
                        rejectedAt: data.rejectedAt !== undefined ? data.rejectedAt : undefined,
                    },
                    include: { customer: true },
                }),
                prisma.cashTransaction.create({
                    data: {
                        type: 'keluar',
                        category: 'Pencairan Referral',
                        desc: data.cashDescription,
                        amount: data.cashAmount,
                        date: dateObj,
                        rawDate,
                        displayDate,
                        time,
                        customer: data.cashCustomer,
                        paymentMethod: data.cashPaymentMethod,
                        status: 'Selesai',
                        invoiceNo: data.invoiceNo ?? '',
                        notes: data.cashNotes ?? '',
                    },
                }),
            ]);
            return this.toWithdrawalEntity(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengonfirmasi pembayaran pencairan referral: ${error.message}`);
        }
    }
}
//# sourceMappingURL=PrismaReferralRepository.js.map
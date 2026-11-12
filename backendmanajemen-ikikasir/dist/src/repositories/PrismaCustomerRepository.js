import { prisma } from '../infrastructure/database/prisma.js';
import { Customer } from '../domain/entities/Customer.js';
import { SubscriptionHistory } from '../domain/entities/SubscriptionHistory.js';
import { InternalServerError, ConflictError } from '../domain/errors/AppError.js';
const isUniqueConstraintError = (error) => error?.code === 'P2002';
export class PrismaCustomerRepository {
    mapToDomain(record) {
        return new Customer({
            id: record.id,
            name: record.name,
            businessName: record.businessName,
            email: record.email,
            phone: record.phone,
            address: record.address,
            village: record.village,
            district: record.district,
            city: record.city,
            packageId: record.packageId,
            packageName: record.package?.name ?? 'Custom',
            packagePrice: record.package?.price ?? 0,
            packagePeriod: record.package?.period ?? '/bulan',
            status: record.status,
            startedAt: record.startedAt,
            expiresAt: record.expiresAt,
            notes: record.notes,
            paymentProofUrl: record.paymentProofUrl ?? '',
            paymentMethod: record.paymentMethod ?? 'QRIS',
            paymentAmount: record.paymentAmount ?? record.package?.price ?? 0,
            paymentDate: record.paymentDate ?? record.startedAt,
            paymentStatus: record.paymentStatus ?? 'PAID',
            appUsername: record.appUsername ?? '',
            appPassword: record.appPassword ?? '',
            technicianStatus: record.technicianStatus ?? 'completed',
            referralCode: record.referralCode ?? '',
            referredByCustomerId: record.referredByCustomerId ?? null,
            referredByCustomerName: record.referredByCustomerName ?? '',
            referredByBusinessName: record.referredByBusinessName ?? '',
            referralBoundAt: record.referralBoundAt ?? null,
            referralSource: record.referralSource ?? '',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }
    mapHistoryToDomain(record) {
        return new SubscriptionHistory({
            id: record.id,
            customerId: record.customerId,
            packageId: record.packageId,
            packageName: record.packageName,
            amount: record.amount,
            billingCycleMonths: record.billingCycleMonths,
            paymentMethod: record.paymentMethod,
            paymentStatus: record.paymentStatus,
            paymentProofUrl: record.paymentProofUrl ?? '',
            notes: record.notes,
            startedAt: record.startedAt,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
            customerName: record.customer?.name ?? '',
            businessName: record.customer?.businessName ?? '',
            phone: record.customer?.phone ?? '',
            email: record.customer?.email ?? '',
            address: record.customer?.address ?? '',
        });
    }
    async findAll(filter) {
        try {
            const where = {};
            if (filter?.search && filter.search.trim()) {
                const q = filter.search.trim();
                where.OR = [
                    { name: { contains: q, mode: 'insensitive' } },
                    { businessName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                ];
            }
            if (filter?.packageId) {
                where.packageId = filter.packageId;
            }
            const records = await prisma.customer.findMany({
                where,
                include: {
                    package: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            let results = records.map((r) => this.mapToDomain(r));
            // Filter berdasarkan status kalkulasi jika diminta
            if (filter?.status && filter.status !== 'ALL') {
                const targetStatus = filter.status.toUpperCase();
                results = results.filter((c) => c.getComputedStatus() === targetStatus);
            }
            return results;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil data pelanggan: ${error.message}`);
        }
    }
    async findById(id) {
        try {
            const record = await prisma.customer.findUnique({
                where: { id },
                include: { package: true },
            });
            return record ? this.mapToDomain(record) : null;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil data pelanggan berdasarkan ID: ${error.message}`);
        }
    }
    async findByEmail(email) {
        try {
            const record = await prisma.customer.findUnique({
                where: { email: email.toLowerCase().trim() },
                include: { package: true },
            });
            return record ? this.mapToDomain(record) : null;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mencari pelanggan berdasarkan email: ${error.message}`);
        }
    }
    async findByReferralCode(referralCode) {
        try {
            const record = await prisma.customer.findUnique({
                where: { referralCode: referralCode.trim().toUpperCase() },
                include: { package: true },
            });
            return record ? this.mapToDomain(record) : null;
        }
        catch (error) {
            throw new InternalServerError(`Gagal mencari pelanggan berdasarkan kode referal: ${error.message}`);
        }
    }
    async create(data) {
        try {
            const record = await prisma.customer.create({
                data: {
                    name: data.name.trim(),
                    businessName: data.businessName.trim(),
                    email: data.email.toLowerCase().trim(),
                    phone: data.phone.trim(),
                    address: data.address ?? '',
                    village: data.village ?? '',
                    district: data.district ?? '',
                    city: data.city ?? '',
                    packageId: data.packageId ?? null,
                    status: data.status ?? 'ACTIVE',
                    startedAt: data.startedAt ?? new Date(),
                    expiresAt: data.expiresAt,
                    notes: data.notes ?? '',
                    paymentProofUrl: data.paymentProofUrl ?? '',
                    paymentMethod: data.paymentMethod ?? 'QRIS',
                    paymentAmount: data.paymentAmount ?? 0,
                    paymentDate: data.paymentDate ?? (data.startedAt ?? new Date()),
                    paymentStatus: data.paymentStatus ?? 'PAID',
                    appUsername: data.appUsername ?? '',
                    appPassword: data.appPassword ?? '',
                    technicianStatus: data.technicianStatus ?? 'completed',
                    referralCode: data.referralCode ?? null,
                    referredByCustomerId: data.referredByCustomerId ?? null,
                    referredByCustomerName: data.referredByCustomerName ?? '',
                    referredByBusinessName: data.referredByBusinessName ?? '',
                    referralBoundAt: data.referralBoundAt ?? null,
                    referralSource: data.referralSource ?? '',
                },
                include: { package: true },
            });
            return this.mapToDomain(record);
        }
        catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError('Gagal menyimpan pelanggan baru: email atau kode referral sudah dipakai pelanggan lain.');
            }
            throw new InternalServerError(`Gagal menyimpan data pelanggan baru: ${error.message}`);
        }
    }
    async update(id, data) {
        try {
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name.trim();
            if (data.businessName !== undefined)
                updateData.businessName = data.businessName.trim();
            if (data.email !== undefined)
                updateData.email = data.email.toLowerCase().trim();
            if (data.phone !== undefined)
                updateData.phone = data.phone.trim();
            if (data.address !== undefined)
                updateData.address = data.address;
            if (data.village !== undefined)
                updateData.village = data.village;
            if (data.district !== undefined)
                updateData.district = data.district;
            if (data.city !== undefined)
                updateData.city = data.city;
            if (data.packageId !== undefined)
                updateData.packageId = data.packageId;
            if (data.status !== undefined)
                updateData.status = data.status;
            if (data.expiresAt !== undefined)
                updateData.expiresAt = data.expiresAt;
            if (data.notes !== undefined)
                updateData.notes = data.notes;
            if (data.paymentProofUrl !== undefined)
                updateData.paymentProofUrl = data.paymentProofUrl;
            if (data.paymentMethod !== undefined)
                updateData.paymentMethod = data.paymentMethod;
            if (data.paymentAmount !== undefined)
                updateData.paymentAmount = data.paymentAmount;
            if (data.paymentDate !== undefined)
                updateData.paymentDate = data.paymentDate;
            if (data.paymentStatus !== undefined)
                updateData.paymentStatus = data.paymentStatus;
            if (data.appUsername !== undefined)
                updateData.appUsername = data.appUsername;
            if (data.appPassword !== undefined)
                updateData.appPassword = data.appPassword;
            if (data.technicianStatus !== undefined)
                updateData.technicianStatus = data.technicianStatus;
            if (data.referralCode !== undefined)
                updateData.referralCode = data.referralCode;
            if (data.referredByCustomerId !== undefined)
                updateData.referredByCustomerId = data.referredByCustomerId;
            if (data.referredByCustomerName !== undefined)
                updateData.referredByCustomerName = data.referredByCustomerName;
            if (data.referredByBusinessName !== undefined)
                updateData.referredByBusinessName = data.referredByBusinessName;
            if (data.referralBoundAt !== undefined)
                updateData.referralBoundAt = data.referralBoundAt;
            if (data.referralSource !== undefined)
                updateData.referralSource = data.referralSource;
            const record = await prisma.customer.update({
                where: { id },
                data: updateData,
                include: { package: true },
            });
            return this.mapToDomain(record);
        }
        catch (error) {
            if (isUniqueConstraintError(error)) {
                throw new ConflictError('Gagal memperbarui pelanggan: email atau kode referral sudah dipakai pelanggan lain.');
            }
            throw new InternalServerError(`Gagal memperbarui data pelanggan: ${error.message}`);
        }
    }
    async delete(id) {
        try {
            await prisma.customer.delete({
                where: { id },
            });
        }
        catch (error) {
            throw new InternalServerError(`Gagal menghapus data pelanggan: ${error.message}`);
        }
    }
    async findExpired(search) {
        try {
            const where = {};
            if (search && search.trim()) {
                const q = search.trim();
                where.OR = [
                    { name: { contains: q, mode: 'insensitive' } },
                    { businessName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                ];
            }
            const records = await prisma.customer.findMany({
                where,
                include: { package: true },
                orderBy: {
                    expiresAt: 'asc',
                },
            });
            const now = new Date();
            return records
                .map((r) => this.mapToDomain(r))
                .filter((c) => c.isExpired(now) || c.status === 'EXPIRED');
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil daftar pelanggan kedaluwarsa: ${error.message}`);
        }
    }
    async addSubscriptionHistory(data) {
        try {
            const record = await prisma.subscriptionHistory.create({
                data: {
                    customerId: data.customerId,
                    packageId: data.packageId ?? null,
                    packageName: data.packageName,
                    amount: data.amount,
                    billingCycleMonths: data.billingCycleMonths,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus,
                    paymentProofUrl: data.paymentProofUrl ?? '',
                    notes: data.notes ?? '',
                    startedAt: data.startedAt,
                    expiresAt: data.expiresAt,
                },
            });
            return this.mapHistoryToDomain(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal menyimpan riwayat pembayaran langganan: ${error.message}`);
        }
    }
    async getSubscriptionHistories(customerId) {
        try {
            const where = {};
            if (customerId) {
                where.customerId = customerId;
            }
            const records = await prisma.subscriptionHistory.findMany({
                where,
                include: {
                    customer: true,
                    package: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return records.map((r) => this.mapHistoryToDomain(r));
        }
        catch (error) {
            throw new InternalServerError(`Gagal mengambil riwayat pembayaran langganan: ${error.message}`);
        }
    }
    async updateSubscriptionHistoryStatus(id, paymentStatus) {
        try {
            const record = await prisma.subscriptionHistory.update({
                where: { id },
                data: { paymentStatus },
                include: { customer: true, package: true },
            });
            return this.mapHistoryToDomain(record);
        }
        catch (error) {
            throw new InternalServerError(`Gagal memperbarui status invoice: ${error.message}`);
        }
    }
}
//# sourceMappingURL=PrismaCustomerRepository.js.map
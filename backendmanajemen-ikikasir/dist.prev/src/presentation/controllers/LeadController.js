import { PrismaLeadRepository } from '../../repositories/PrismaLeadRepository.js';
import { PrismaCustomerRepository } from '../../repositories/PrismaCustomerRepository.js';
import { PrismaPackageRepository } from '../../repositories/PrismaPackageRepository.js';
import { PrismaReferralRepository } from '../../repositories/PrismaReferralRepository.js';
import { LeadUseCases } from '../../application/usecases/LeadUseCases.js';
import { ReferralUseCases } from '../../application/usecases/ReferralUseCases.js';
const leadRepository = new PrismaLeadRepository();
const customerRepository = new PrismaCustomerRepository();
const packageRepository = new PrismaPackageRepository();
const referralRepository = new PrismaReferralRepository();
const referralUseCases = new ReferralUseCases(customerRepository, referralRepository, leadRepository);
const leadUseCases = new LeadUseCases(leadRepository, customerRepository, packageRepository, referralRepository, referralUseCases);
export const getAll = async (req, res, next) => {
    try {
        const search = req.query.search || req.query.q;
        const status = req.query.status || undefined;
        const source = req.query.source || undefined;
        const packageInterest = req.query.packageInterest || req.query.package || undefined;
        const packageId = req.query.packageId || undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const referralCode = req.query.referralCode || undefined;
        const referredByCustomerId = req.query.referredByCustomerId || undefined;
        const leads = await leadUseCases.getAllLeads({
            search,
            status,
            source,
            packageInterest,
            packageId,
            startDate,
            endDate,
            referralCode,
            referredByCustomerId,
        });
        res.status(200).json({
            success: true,
            message: 'Daftar calon client berhasil diambil.',
            data: leads,
            total: leads.length,
        });
    }
    catch (error) {
        next(error);
    }
};
export const getStatistics = async (_req, res, next) => {
    try {
        const stats = await leadUseCases.getStatistics();
        res.status(200).json({
            success: true,
            message: 'Statistik calon client berhasil diambil.',
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
};
export const getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const lead = await leadUseCases.getLeadById(id);
        res.status(200).json({
            success: true,
            data: lead,
        });
    }
    catch (error) {
        next(error);
    }
};
export const create = async (req, res, next) => {
    try {
        const newLead = await leadUseCases.createLead(req.body);
        res.status(201).json({
            success: true,
            message: `Calon client '${newLead.name}' (${newLead.businessName}) berhasil didaftarkan.`,
            data: newLead,
        });
    }
    catch (error) {
        next(error);
    }
};
export const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updated = await leadUseCases.updateLead(id, req.body);
        res.status(200).json({
            success: true,
            message: `Data calon client '${updated.name}' berhasil diperbarui.`,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
export const updateStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updated = await leadUseCases.updateLeadStatus(id, req.body);
        res.status(200).json({
            success: true,
            message: `Status calon client berhasil diubah menjadi '${req.body.status}'.`,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
};
export const addFollowUp = async (req, res, next) => {
    try {
        const id = req.params.id;
        const followUp = await leadUseCases.addFollowUp(id, req.body);
        res.status(201).json({
            success: true,
            message: 'Riwayat follow-up berhasil ditambahkan.',
            data: followUp,
        });
    }
    catch (error) {
        next(error);
    }
};
export const approve = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await leadUseCases.approveLead(id, req.body);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const reject = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await leadUseCases.rejectLead(id, req.body);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
export const deleteLead = async (req, res, next) => {
    try {
        const id = req.params.id;
        await leadUseCases.deleteLead(id);
        res.status(200).json({
            success: true,
            message: 'Data calon client berhasil dihapus.',
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=LeadController.js.map
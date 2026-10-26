import { Request, Response, NextFunction } from 'express';
import { PrismaLeadRepository } from '../../repositories/PrismaLeadRepository.js';
import { PrismaCustomerRepository } from '../../repositories/PrismaCustomerRepository.js';
import { PrismaPackageRepository } from '../../repositories/PrismaPackageRepository.js';
import { LeadUseCases } from '../../application/usecases/LeadUseCases.js';

const leadRepository = new PrismaLeadRepository();
const customerRepository = new PrismaCustomerRepository();
const packageRepository = new PrismaPackageRepository();
const leadUseCases = new LeadUseCases(leadRepository, customerRepository, packageRepository);

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || (req.query.q as string);
    const status = (req.query.status as string) || undefined;
    const source = (req.query.source as string) || undefined;
    const packageInterest = (req.query.packageInterest as string) || (req.query.package as string) || undefined;
    const packageId = (req.query.packageId as string) || undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const referralCode = (req.query.referralCode as string) || undefined;
    const referredByCustomerId = (req.query.referredByCustomerId as string) || undefined;

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
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await leadUseCases.getStatistics();

    res.status(200).json({
      success: true,
      message: 'Statistik calon client berhasil diambil.',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const lead = await leadUseCases.getLeadById(id);

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const newLead = await leadUseCases.createLead(req.body);

    res.status(201).json({
      success: true,
      message: `Calon client '${newLead.name}' (${newLead.businessName}) berhasil didaftarkan.`,
      data: newLead,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await leadUseCases.updateLead(id, req.body);

    res.status(200).json({
      success: true,
      message: `Data calon client '${updated.name}' berhasil diperbarui.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await leadUseCases.updateLeadStatus(id, req.body);

    res.status(200).json({
      success: true,
      message: `Status calon client berhasil diubah menjadi '${req.body.status}'.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const followUp = await leadUseCases.addFollowUp(id, req.body);

    res.status(201).json({
      success: true,
      message: 'Riwayat follow-up berhasil ditambahkan.',
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await leadUseCases.approveLead(id, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await leadUseCases.rejectLead(id, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await leadUseCases.deleteLead(id);

    res.status(200).json({
      success: true,
      message: 'Data calon client berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

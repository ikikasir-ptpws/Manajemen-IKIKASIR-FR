import { Request, Response, NextFunction } from 'express';
import { PrismaCustomerRepository } from '../../repositories/PrismaCustomerRepository.js';
import { PrismaPackageRepository } from '../../repositories/PrismaPackageRepository.js';
import { CustomerUseCases } from '../../application/usecases/CustomerUseCases.js';

const customerRepository = new PrismaCustomerRepository();
const packageRepository = new PrismaPackageRepository();
const customerUseCases = new CustomerUseCases(customerRepository, packageRepository);

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || (req.query.q as string);
    const status = (req.query.status as string) || undefined;
    const packageId = (req.query.packageId as string) || undefined;

    const customers = await customerUseCases.getAllCustomers({
      search,
      status,
      packageId,
    });

    res.status(200).json({
      success: true,
      message: 'Daftar pelanggan berhasil diambil.',
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpired = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || (req.query.q as string);
    const expiredList = await customerUseCases.getExpiredCustomers(search);

    res.status(200).json({
      success: true,
      message: 'Daftar pelanggan yang telah kedaluwarsa berhasil diambil.',
      data: expiredList,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await customerUseCases.getCustomerById(id);

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const newCustomer = await customerUseCases.createCustomer(req.body);

    res.status(201).json({
      success: true,
      message: `Pelanggan '${newCustomer.name}' (${newCustomer.businessName}) berhasil didaftarkan.`,
      data: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await customerUseCases.updateCustomer(id, req.body);

    res.status(200).json({
      success: true,
      message: `Data pelanggan '${updated.name}' berhasil diperbarui.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const renew = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const renewed = await customerUseCases.renewSubscription(id, req.body);

    res.status(200).json({
      success: true,
      message: `Masa aktif pelanggan '${renewed.name}' berhasil diperpanjang hingga ${renewed.expiresAt}.`,
      data: renewed,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await customerUseCases.deleteCustomer(id);

    res.status(200).json({
      success: true,
      message: 'Pelanggan berhasil dihapus dari sistem.',
    });
  } catch (error) {
    next(error);
  }
};

export const getHistories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const histories = await customerUseCases.getCustomerHistories(id);

    res.status(200).json({
      success: true,
      data: histories,
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { PrismaPackageRepository } from '../../repositories/PrismaPackageRepository.js';
import {
  GetPackagesUseCase,
  GetPackageByIdUseCase,
  CreatePackageUseCase,
  UpdatePackageUseCase,
  TogglePackageStatusUseCase,
  DeletePackageUseCase,
} from '../../application/usecases/PackageUseCases.js';

// Inisialisasi dependensi di level modul
const packageRepository = new PrismaPackageRepository();
const getPackagesUseCase = new GetPackagesUseCase(packageRepository);
const getPackageByIdUseCase = new GetPackageByIdUseCase(packageRepository);
const createPackageUseCase = new CreatePackageUseCase(packageRepository);
const updatePackageUseCase = new UpdatePackageUseCase(packageRepository);
const togglePackageStatusUseCase = new TogglePackageStatusUseCase(packageRepository);
const deletePackageUseCase = new DeletePackageUseCase(packageRepository);

/**
 * Controller: Mengambil semua paket langganan
 * Mendukung query filter: ?search=... & ?isActive=true/false
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || (req.query.q as string);
    let isActive: boolean | undefined = undefined;

    if (req.query.isActive !== undefined) {
      isActive = req.query.isActive === 'true' || req.query.isActive === '1';
    }

    const packages = await getPackagesUseCase.execute({
      search,
      isActive,
    });

    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil detail satu paket by ID
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const pkg = await getPackageByIdUseCase.execute(id);

    res.status(200).json({
      success: true,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menambah paket langganan baru sesuai form frontend
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pkg = await createPackageUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: `Paket '${pkg.name}' berhasil ditambahkan.`,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Memperbarui paket langganan
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const pkg = await updatePackageUseCase.execute(id, req.body);

    res.status(200).json({
      success: true,
      message: `Paket '${pkg.name}' berhasil diperbarui.`,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengubah status aktif/nonaktif paket (tampil di website)
 */
export const toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : undefined;
    const pkg = await togglePackageStatusUseCase.execute(id, isActive);

    res.status(200).json({
      success: true,
      message: `Status paket '${pkg.name}' berhasil diubah menjadi ${pkg.isActive ? 'Aktif' : 'Nonaktif'}.`,
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menghapus paket langganan
 */
export const deletePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await deletePackageUseCase.execute(id);

    res.status(200).json({
      success: true,
      message: 'Paket langganan berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

export const PackageController = {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
  delete: deletePackage,
};

export default PackageController;

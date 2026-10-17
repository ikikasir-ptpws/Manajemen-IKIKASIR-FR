import { Request, Response, NextFunction } from 'express';
import { PrismaRoleRepository } from '../../repositories/PrismaRoleRepository.js';
import {
  GetRolesUseCase,
  GetRoleByIdUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetMenuCatalogUseCase,
} from '../../application/usecases/RoleUseCases.js';

// Inisialisasi dependensi di level modul
const roleRepository = new PrismaRoleRepository();
const getRolesUseCase = new GetRolesUseCase(roleRepository);
const getRoleByIdUseCase = new GetRoleByIdUseCase(roleRepository);
const createRoleUseCase = new CreateRoleUseCase(roleRepository);
const updateRoleUseCase = new UpdateRoleUseCase(roleRepository);
const deleteRoleUseCase = new DeleteRoleUseCase(roleRepository);
const getMenuCatalogUseCase = new GetMenuCatalogUseCase();

/**
 * Controller: Mengambil semua daftar role
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = (req.query.q as string) || (req.query.search as string);
    const roles = await getRolesUseCase.execute(query);
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil detail satu role by ID
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await getRoleByIdUseCase.execute(id);
    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Membuat role baru beserta switch boolean akses menu
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = await createRoleUseCase.execute(req.body);
    res.status(201).json({
      success: true,
      message: `Role '${role.name}' berhasil dibuat.`,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Memperbarui role dan switch menu
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await updateRoleUseCase.execute(id, req.body);
    res.status(200).json({
      success: true,
      message: `Role '${role.name}' berhasil diperbarui.`,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menghapus role
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteRoleUseCase.execute(id);
    res.status(200).json({
      success: true,
      message: 'Role berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil katalog seluruh menu master untuk switch toggle UI
 */
export const getMenuCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const menus = getMenuCatalogUseCase.execute();
    res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

// Export objek controller untuk fleksibilitas import
export const RoleController = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRole,
  getMenuCatalog,
};

export default RoleController;

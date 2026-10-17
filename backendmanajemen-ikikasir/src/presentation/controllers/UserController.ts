import { Request, Response, NextFunction } from 'express';
import { PrismaUserRepository } from '../../repositories/PrismaUserRepository.js';
import { BcryptPasswordService } from '../../infrastructure/security/BcryptPasswordService.js';
import {
  GetUsersUseCase,
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  ToggleUserStatusUseCase,
  DeleteUserUseCase,
} from '../../application/usecases/UserUseCases.js';

// Inisialisasi dependensi di level modul
const userRepository = new PrismaUserRepository();
const passwordService = new BcryptPasswordService();

const getUsersUseCase = new GetUsersUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const createUserUseCase = new CreateUserUseCase(userRepository, passwordService);
const updateUserUseCase = new UpdateUserUseCase(userRepository, passwordService);
const toggleUserStatusUseCase = new ToggleUserStatusUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

/**
 * Controller: Mengambil semua data pengguna sistem
 */
export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.q as string) || (req.query.search as string);
    const role = req.query.role as string;
    const status = req.query.status as string;

    const users = await getUsersUseCase.execute({
      search,
      role,
      status,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengambil detail satu pengguna berdasarkan ID
 */
export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await getUserByIdUseCase.execute(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menambah pengguna baru sesuai form frontend
 */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await createUserUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: `Pengguna '${user.name}' berhasil ditambahkan.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Memperbarui profil pengguna yang ada
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await updateUserUseCase.execute(id, req.body);

    res.status(200).json({
      success: true,
      message: `Pengguna '${user.name}' berhasil diperbarui.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mengubah status aktif/nonaktif akun secara cepat
 */
export const toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const status = req.body?.status as 'Active' | 'Inactive' | undefined;
    const user = await toggleUserStatusUseCase.execute(id, status);

    res.status(200).json({
      success: true,
      message: `Status pengguna '${user.name}' berhasil diubah menjadi ${user.status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Menghapus pengguna
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    await deleteUserUseCase.execute(id, currentUserId);

    res.status(200).json({
      success: true,
      message: 'Pengguna berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};

// Export objek controller untuk fleksibilitas import
export const UserController = {
  getAll,
  getById,
  create,
  update,
  toggleStatus,
  delete: deleteUser,
};

export default UserController;

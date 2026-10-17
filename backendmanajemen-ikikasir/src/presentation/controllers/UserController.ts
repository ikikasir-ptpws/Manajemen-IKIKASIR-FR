import { Request, Response, NextFunction } from 'express';
import {
  GetUsersUseCase,
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  ToggleUserStatusUseCase,
  DeleteUserUseCase,
} from '../../application/usecases/UserUseCases.js';

export class UserController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly toggleUserStatusUseCase: ToggleUserStatusUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = (req.query.q as string) || (req.query.search as string);
      const role = req.query.role as string;
      const status = req.query.status as string;

      const users = await this.getUsersUseCase.execute({
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

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.getUserByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.createUserUseCase.execute(req.body);

      res.status(201).json({
        success: true,
        message: `Pengguna '${user.name}' berhasil ditambahkan.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.updateUserUseCase.execute(id, req.body);

      res.status(200).json({
        success: true,
        message: `Pengguna '${user.name}' berhasil diperbarui.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const status = req.body?.status as 'Active' | 'Inactive' | undefined;
      const user = await this.toggleUserStatusUseCase.execute(id, status);

      res.status(200).json({
        success: true,
        message: `Status pengguna '${user.name}' berhasil diubah menjadi ${user.status}.`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      await this.deleteUserUseCase.execute(id, currentUserId);

      res.status(200).json({
        success: true,
        message: 'Pengguna berhasil dihapus.',
      });
    } catch (error) {
      next(error);
    }
  };
}

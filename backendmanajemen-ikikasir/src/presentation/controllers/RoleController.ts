import { Request, Response, NextFunction } from 'express';
import {
  GetRolesUseCase,
  GetRoleByIdUseCase,
  CreateRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  GetMenuCatalogUseCase,
} from '../../application/usecases/RoleUseCases.js';

export class RoleController {
  constructor(
    private readonly getRolesUseCase: GetRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly getMenuCatalogUseCase: GetMenuCatalogUseCase
  ) {}

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.query.q as string) || (req.query.search as string);
      const roles = await this.getRolesUseCase.execute(query);
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.getRoleByIdUseCase.execute(id);
      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await this.createRoleUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        message: `Role '${role.name}' berhasil dibuat.`,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.updateRoleUseCase.execute(id, req.body);
      res.status(200).json({
        success: true,
        message: `Role '${role.name}' berhasil diperbarui.`,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteRoleUseCase.execute(id);
      res.status(200).json({
        success: true,
        message: 'Role berhasil dihapus.',
      });
    } catch (error) {
      next(error);
    }
  };

  public getMenuCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const menus = this.getMenuCatalogUseCase.execute();
      res.status(200).json({
        success: true,
        data: menus,
      });
    } catch (error) {
      next(error);
    }
  };
}

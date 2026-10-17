import { MenuAccessProps } from '../../domain/entities/Role.js';

export interface CreateRoleDto {
  name: string;
  description?: string;
  menuAccess?: Partial<MenuAccessProps>;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  menuAccess?: Partial<MenuAccessProps>;
}

export interface RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  menuAccess: MenuAccessProps;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemCatalog {
  key: keyof MenuAccessProps;
  label: string;
  section: string;
  route: string;
  description: string;
}

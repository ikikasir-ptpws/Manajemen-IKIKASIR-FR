import { Role, MenuAccessProps, RolePermissions } from '../entities/Role.js';

export interface CreateRoleData {
  name: string;
  description?: string | null;
  menuAccess?: Partial<MenuAccessProps>;
  permissions?: RolePermissions;
}

export interface UpdateRoleData {
  name?: string;
  description?: string | null;
  menuAccess?: Partial<MenuAccessProps>;
  permissions?: RolePermissions;
}

export interface IRoleRepository {
  /**
   * Mengambil semua role beserta switch akses menu dan jumlah pengguna
   */
  findAll(query?: string): Promise<Role[]>;

  /**
   * Mencari role berdasarkan ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Mencari role berdasarkan nama role unik
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Membuat role baru beserta pengaturan switch akses menu boolean
   */
  create(data: CreateRoleData): Promise<Role>;

  /**
   * Memperbarui data role dan switch akses menu
   */
  update(id: string, data: UpdateRoleData): Promise<Role>;

  /**
   * Menghapus role
   */
  delete(id: string): Promise<void>;

  /**
   * Menghitung berapa user yang saat ini menggunakan role ini
   */
  countUsers(roleId: string): Promise<number>;
}

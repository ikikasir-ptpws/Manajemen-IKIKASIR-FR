import { User } from '../entities/User.js';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  roleId?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  roleId?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: 'Active' | 'Inactive' | string;
}

/**
 * Interface Repository untuk Domain User
 * Menentukan kontrak operasi data tanpa terikat pada teknologi database tertentu
 */
export interface IUserRepository {
  /**
   * Mengambil daftar pengguna dengan filter pencarian, role, dan status
   */
  findAll(filter?: UserFilter): Promise<User[]>;

  /**
   * Mencari pengguna berdasarkan alamat email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Mencari pengguna berdasarkan ID unik (UUID)
   */
  findById(id: string): Promise<User | null>;

  /**
   * Membuat data pengguna baru
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Memperbarui data pengguna yang ada
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Memperbarui status aktif/nonaktif akun pengguna
   */
  updateStatus(id: string, isActive: boolean): Promise<User>;

  /**
   * Memperbarui timestamp login terakhir pengguna
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Menghapus pengguna berdasarkan ID
   */
  delete(id: string): Promise<void>;

  /**
   * Mengecek apakah email sudah terdaftar (opsional exclude ID tertentu untuk operasi edit)
   */
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
}

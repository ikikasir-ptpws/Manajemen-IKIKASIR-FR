import { User } from '../entities/User.js';
import { UserRole } from '../enums/Role.js';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
  isActive?: boolean;
}

/**
 * Interface Repository untuk Domain User
 * Menentukan kontrak operasi data tanpa terikat pada teknologi database tertentu
 */
export interface IUserRepository {
  /**
   * Mencari pengguna berdasarkan alamat email
   * Digunakan pada proses autentikasi login
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Mencari pengguna berdasarkan ID unik (UUID)
   * Digunakan pada middleware autentikasi dan get profile
   */
  findById(id: string): Promise<User | null>;

  /**
   * Membuat data pengguna baru
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Memperbarui timestamp login terakhir pengguna
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Mengecek apakah email sudah terdaftar
   */
  existsByEmail(email: string): Promise<boolean>;
}

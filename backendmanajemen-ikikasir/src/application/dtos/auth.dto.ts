import { SafeUserProps } from '../../domain/entities/User.js';
import { UserRole } from '../../domain/enums/Role.js';

/**
 * DTO Input untuk Login
 */
export interface LoginInputDto {
  email: string;
  password: string;
}

/**
 * DTO Output setelah berhasil login (Simpel: token & user)
 */
export interface AuthResponseDto {
  token: string;
  user: SafeUserProps;
}

/**
 * DTO Input untuk Registrasi User (jika diperlukan untuk seed / admin create)
 */
export interface RegisterInputDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
}

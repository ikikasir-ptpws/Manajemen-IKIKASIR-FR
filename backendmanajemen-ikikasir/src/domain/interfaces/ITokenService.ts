import { UserRole } from '../enums/Role.js';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Kontrak Service JWT (JSON Web Token)
 */
export interface ITokenService {
  /**
   * Menghasilkan JWT token berdasarkan payload pengguna
   */
  generateToken(payload: TokenPayload): string;

  /**
   * Memvalidasi dan mendecode JWT token yang dikirimkan client
   */
  verifyToken(token: string): TokenPayload;
}

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  roleId?: string | null;
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

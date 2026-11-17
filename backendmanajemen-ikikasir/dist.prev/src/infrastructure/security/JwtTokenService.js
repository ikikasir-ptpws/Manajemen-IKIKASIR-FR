import jwt from 'jsonwebtoken';
import { UnauthorizedError, InternalServerError } from '../../domain/errors/AppError.js';
import { config } from '../config/env.js';
/**
 * Implementasi Service JWT (JSON Web Token)
 * Mengimplementasikan kontrak ITokenService dari layer Domain
 */
export class JwtTokenService {
    secretKey;
    expiresIn;
    constructor(secretKey = config.jwt.secret, expiresIn = config.jwt.expiresIn) {
        this.secretKey = secretKey;
        this.expiresIn = expiresIn;
    }
    /**
     * Menghasilkan token JWT bertanda tangan digital dengan payload user
     * Dilengkapi try-catch dan error handling yang terperinci
     */
    generateToken(payload) {
        try {
            const options = {
                expiresIn: this.expiresIn,
            };
            // Buat token JWT dengan algoritma default HS256
            const token = jwt.sign(payload, this.secretKey, options);
            return token;
        }
        catch (error) {
            // Penjelasan error: Kesalahan pembuatan token (misal: format secret key atau options tidak sesuai)
            console.error('❌ [JwtTokenService] Gagal menghasilkan JWT token:', error);
            throw new InternalServerError('Terjadi kesalahan saat membuat token autentikasi.');
        }
    }
    /**
     * Memverifikasi dan mendecode payload dari token JWT
     * Menghandle kondisi token expired atau invalid signature dengan penjelasan yang jelas
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded;
        }
        catch (error) {
            // Penanganan khusus error JWT dari library jsonwebtoken
            if (error instanceof jwt.TokenExpiredError) {
                // Penjelasan: Masa berlaku token telah habis
                throw new UnauthorizedError('Sesi autentikasi telah berakhir. Silakan login kembali.');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                // Penjelasan: Format token rusak, invalid signature, atau telah dimanipulasi
                throw new UnauthorizedError('Token autentikasi tidak valid atau telah dimanipulasi.');
            }
            // Penjelasan: Kegagalan verifikasi lainnya yang tidak terduga
            console.error('❌ [JwtTokenService] Error tak terduga saat verifikasi token:', error);
            throw new UnauthorizedError('Gagal memverifikasi token autentikasi.');
        }
    }
}
//# sourceMappingURL=JwtTokenService.js.map
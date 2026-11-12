import dotenv from 'dotenv';
// Load konfigurasi dari file .env
dotenv.config();
/**
 * Validasi dan penyedia variabel lingkungan (Environment Variables)
 */
export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:alfan123@localhost:5432/db_ikikasir?schema=public',
    jwt: {
        secret: process.env.JWT_SECRET || 'ikikasir_jwt_secret_key_superadmin_sales_2026_safe',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
};
//# sourceMappingURL=env.js.map
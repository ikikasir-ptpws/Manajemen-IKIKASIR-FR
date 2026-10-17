import app from './app.js';
import { config } from './infrastructure/config/env.js';
import { testDatabaseConnection, prisma } from './infrastructure/database/prisma.js';

async function bootstrap() {
  try {
    console.log('🚀 [IKIKASIR Backend] Menjalankan server...');

    // 1. Uji koneksi ke database PostgreSQL
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      console.warn('⚠️ [IKIKASIR Backend] Peringatan: Tidak dapat terhubung ke database. Harap cek koneksi PostgreSQL.');
    }

    // 2. Jalankan HTTP server
    const server = app.listen(config.port, () => {
      console.log('----------------------------------------------------');
      console.log(`⚡ [IKIKASIR Backend] Server aktif berjalan di: http://localhost:${config.port}`);
      console.log(`📡 [Health Check]      http://localhost:${config.port}/api/health`);
      console.log(`🔐 [Auth Super Admin]  POST http://localhost:${config.port}/api/auth/login/superadmin`);
      console.log(`💼 [Auth Sales]        POST http://localhost:${config.port}/api/auth/login/sales`);
      console.log(`🌐 [Auth Umum]         POST http://localhost:${config.port}/api/auth/login`);
      console.log(`👤 [Auth Me Profile]   GET  http://localhost:${config.port}/api/auth/me`);
      console.log(`👥 [Manajemen User]    GET/POST http://localhost:${config.port}/api/users`);
      console.log(`🛡️ [Manajemen Role]    GET/POST http://localhost:${config.port}/api/roles`);
      console.log('----------------------------------------------------');
    });

    // 3. Graceful Shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 [Server] Menerima sinyal ${signal}. Menutup koneksi dengan aman...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('🔌 [Database] Koneksi PostgreSQL ditutup.');
        } catch (err) {
          console.error('❌ [Database] Gagal menutup koneksi database:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('💥 [Bootstrap Error] Gagal memulai aplikasi:', error);
    process.exit(1);
  }
}

// Tangani uncaught exception dan unhandled promise rejection
process.on('uncaughtException', (err) => {
  console.error('💥 [Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [Unhandled Rejection]:', reason);
});

bootstrap();

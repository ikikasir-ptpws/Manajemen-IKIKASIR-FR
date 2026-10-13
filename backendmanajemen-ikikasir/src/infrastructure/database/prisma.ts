import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config/env.js';

/**
 * Inisialisasi Database Connection Pool dan Prisma Client Singleton
 * Menggunakan Prisma ORM 7 dengan PostgreSQL Driver Adapter (@prisma/adapter-pg)
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Konfigurasi driver adapter PostgreSQL
const adapter = new PrismaPg({
  connectionString: config.databaseUrl,
});

// Singleton instance agar koneksi pool tidak dibuat berulang kali
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper untuk menguji konektivitas database saat server mulai berjalan
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Jalankan query sederhana untuk memverifikasi koneksi PostgreSQL
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('✅ [Database] Berhasil terhubung ke database PostgreSQL (ikikasir)');
    return true;
  } catch (error) {
    console.error('❌ [Database] Gagal terhubung ke database PostgreSQL:', error);
    return false;
  }
}

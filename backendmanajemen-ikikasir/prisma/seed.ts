import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { UserRole } from '../src/domain/enums/Role.js';

async function seed() {
  console.log('🌱 [Seeder] Memulai pengisian data awal (seeding)...');

  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // 1. Buat / Perbarui akun Super Admin
    const superAdminEmail = 'superadmin@ikikasir.com';
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existingSuperAdmin) {
      await prisma.user.create({
        data: {
          name: 'Super Admin IKIKASIR',
          email: superAdminEmail,
          password: defaultPasswordHash,
          role: UserRole.SUPERADMIN as any,
          phone: '081234567890',
          isActive: true,
        },
      });
      console.log(`✅ [Seeder] Berhasil membuat akun Super Admin: ${superAdminEmail} (password: password123)`);
    } else {
      console.log(`ℹ️ [Seeder] Akun Super Admin (${superAdminEmail}) sudah ada.`);
    }

    // 2. Buat / Perbarui akun Sales (Seles)
    const salesEmail = 'sales@ikikasir.com';
    const existingSales = await prisma.user.findUnique({
      where: { email: salesEmail },
    });

    if (!existingSales) {
      await prisma.user.create({
        data: {
          name: 'Tim Sales IKIKASIR',
          email: salesEmail,
          password: defaultPasswordHash,
          role: UserRole.SALES as any,
          phone: '089876543210',
          isActive: true,
        },
      });
      console.log(`✅ [Seeder] Berhasil membuat akun Sales: ${salesEmail} (password: password123)`);
    } else {
      console.log(`ℹ️ [Seeder] Akun Sales (${salesEmail}) sudah ada.`);
    }

    console.log('🎉 [Seeder] Selesai! Data awal berhasil disiapkan.');
  } catch (error) {
    console.error('❌ [Seeder] Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

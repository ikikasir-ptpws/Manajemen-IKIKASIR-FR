import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/infrastructure/database/prisma.js';

async function seed() {
  console.log('🌱 [Seeder] Memulai pengisian data awal (seeding)...');

  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    // ==========================================
    // 1. SEED ROLES & MENU ACCESS SWITCHES
    // ==========================================
    console.log('📦 [Seeder] Menyiapkan data role dan hak akses menu switch...');

    // A. Role Super Admin (Semua menu TRUE)
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {
        description: 'Hak akses penuh ke seluruh modul dan pengaturan sistem',
        menuAccess: {
          upsert: {
            create: {
              dashboard: true,
              manajemenPengguna: true,
              manajemenRole: true,
              manajemenPromo: true,
              kelolaPaket: true,
              calonClient: true,
              semuaPelanggan: true,
              langganan: true,
              expired: true,
              arusKas: true,
              labaRugi: true,
              neraca: true,
              laporanPenjualan: true,
              landingPage: true,
            },
            update: {
              dashboard: true,
              manajemenPengguna: true,
              manajemenRole: true,
              manajemenPromo: true,
              kelolaPaket: true,
              calonClient: true,
              semuaPelanggan: true,
              langganan: true,
              expired: true,
              arusKas: true,
              labaRugi: true,
              neraca: true,
              laporanPenjualan: true,
              landingPage: true,
            },
          },
        },
      },
      create: {
        name: 'Super Admin',
        description: 'Hak akses penuh ke seluruh modul dan pengaturan sistem',
        menuAccess: {
          create: {
            dashboard: true,
            manajemenPengguna: true,
            manajemenRole: true,
            manajemenPromo: true,
            kelolaPaket: true,
            calonClient: true,
            semuaPelanggan: true,
            langganan: true,
            expired: true,
            arusKas: true,
            labaRugi: true,
            neraca: true,
            laporanPenjualan: true,
            landingPage: true,
          },
        },
      },
    });
    console.log(`✅ [Seeder] Role '${superAdminRole.name}' siap (Semua switch menu: TRUE).`);

    // B. Role Sales / Seles (Hanya halaman tambah client / calon client yang TRUE)
    const salesRole = await prisma.role.upsert({
      where: { name: 'Sales' },
      update: {
        description: 'Akses khusus sales: Hanya halaman tambah client (calon client)',
        menuAccess: {
          upsert: {
            create: {
              dashboard: false,
              manajemenPengguna: false,
              manajemenRole: false,
              manajemenPromo: false,
              kelolaPaket: false,
              calonClient: true, // Hanya halaman tambah client
              semuaPelanggan: false,
              langganan: false,
              expired: false,
              arusKas: false,
              labaRugi: false,
              neraca: false,
              laporanPenjualan: false,
              landingPage: false,
            },
            update: {
              dashboard: false,
              manajemenPengguna: false,
              manajemenRole: false,
              manajemenPromo: false,
              kelolaPaket: false,
              calonClient: true, // Hanya halaman tambah client
              semuaPelanggan: false,
              langganan: false,
              expired: false,
              arusKas: false,
              labaRugi: false,
              neraca: false,
              laporanPenjualan: false,
              landingPage: false,
            },
          },
        },
      },
      create: {
        name: 'Sales',
        description: 'Akses khusus sales: Hanya halaman tambah client (calon client)',
        menuAccess: {
          create: {
            dashboard: false,
            manajemenPengguna: false,
            manajemenRole: false,
            manajemenPromo: false,
            kelolaPaket: false,
            calonClient: true, // Hanya halaman tambah client
            semuaPelanggan: false,
            langganan: false,
            expired: false,
            arusKas: false,
            labaRugi: false,
            neraca: false,
            laporanPenjualan: false,
            landingPage: false,
          },
        },
      },
    });
    console.log(`✅ [Seeder] Role '${salesRole.name}' siap (Hanya calon client: TRUE, lainnya: FALSE).`);

    // C. Role Admin
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {
        description: 'Pengelolaan operasional penjualan, paket, dan laporan',
      },
      create: {
        name: 'Admin',
        description: 'Pengelolaan operasional penjualan, paket, dan laporan',
        menuAccess: {
          create: {
            dashboard: true,
            manajemenPengguna: false,
            manajemenRole: false,
            manajemenPromo: true,
            kelolaPaket: true,
            calonClient: true,
            semuaPelanggan: true,
            langganan: true,
            expired: true,
            arusKas: true,
            labaRugi: true,
            neraca: true,
            laporanPenjualan: true,
            landingPage: true,
          },
        },
      },
    });

    // D. Role Staff
    const staffRole = await prisma.role.upsert({
      where: { name: 'Staff' },
      update: {
        description: 'Staf operasional pengelolaan data pelanggan dan promo',
      },
      create: {
        name: 'Staff',
        description: 'Staf operasional pengelolaan data pelanggan dan promo',
        menuAccess: {
          create: {
            dashboard: true,
            manajemenPengguna: false,
            manajemenRole: false,
            manajemenPromo: true,
            kelolaPaket: false,
            calonClient: true,
            semuaPelanggan: true,
            langganan: false,
            expired: false,
            arusKas: false,
            labaRugi: false,
            neraca: false,
            laporanPenjualan: true,
            landingPage: true,
          },
        },
      },
    });

    // E. Role Kasir
    const kasirRole = await prisma.role.upsert({
      where: { name: 'Kasir' },
      update: {
        description: 'Akses transaksi kasir dan laporan penjualan harian',
      },
      create: {
        name: 'Kasir',
        description: 'Akses transaksi kasir dan laporan penjualan harian',
        menuAccess: {
          create: {
            dashboard: true,
            manajemenPengguna: false,
            manajemenRole: false,
            manajemenPromo: false,
            kelolaPaket: false,
            calonClient: false,
            semuaPelanggan: false,
            langganan: false,
            expired: false,
            arusKas: false,
            labaRugi: false,
            neraca: false,
            laporanPenjualan: true,
            landingPage: true,
          },
        },
      },
    });

    // ==========================================
    // 2. SEED USERS SESUAI FORM FRONTEND
    // ==========================================
    console.log('👥 [Seeder] Menyiapkan data pengguna awal...');

    const initialUsers = [
      {
        email: 'superadmin@ikikasir.com',
        name: 'Super Admin IKIKASIR',
        role: 'Super Admin',
        roleId: superAdminRole.id,
        phone: '081234567890',
        isActive: true,
      },
      {
        email: 'sales@ikikasir.com',
        name: 'Tim Sales IKIKASIR',
        role: 'Sales',
        roleId: salesRole.id,
        phone: '089876543210',
        isActive: true,
      },
      {
        email: 'budi@ikikasir.com',
        name: 'Budi Santoso',
        role: 'Super Admin',
        roleId: superAdminRole.id,
        phone: '081345678901',
        isActive: true,
      },
      {
        email: 'siti@ikikasir.com',
        name: 'Siti Aisyah',
        role: 'Admin',
        roleId: adminRole.id,
        phone: '081456789012',
        isActive: true,
      },
      {
        email: 'andi@ikikasir.com',
        name: 'Andi Wijaya',
        role: 'Staff',
        roleId: staffRole.id,
        phone: '081567890123',
        isActive: false, // Inactive seperti di form
      },
      {
        email: 'dewi.kasir@ikikasir.com',
        name: 'Dewi Lestari',
        role: 'Kasir',
        roleId: kasirRole.id,
        phone: '081678901234',
        isActive: true,
      },
    ];

    for (const u of initialUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          role: u.role,
          roleId: u.roleId,
          phone: u.phone,
          isActive: u.isActive,
        },
        create: {
          name: u.name,
          email: u.email,
          password: defaultPasswordHash,
          role: u.role,
          roleId: u.roleId,
          phone: u.phone,
          isActive: u.isActive,
        },
      });
      console.log(`👤 [Seeder] User '${u.name}' (${u.email}) [${u.role}] - Status: ${u.isActive ? 'Active' : 'Inactive'}`);
    }

    // ==========================================
    // 3. SEED PACKAGES (KELOLA PAKET FRONTEND)
    // ==========================================
    console.log('📦 [Seeder] Menyiapkan data paket langganan (Kelola Paket)...');

    const initialPackages = [
      {
        name: 'Basic',
        description: 'Cocok untuk usaha kecil, menengah, dan pemula.',
        isConsultation: false,
        price: 250000,
        period: '/bulan',
        features: [
          'Manajemen produk tanpa batas',
          'Transaksi kasir cepat & akurat',
          'Laporan penjualan lengkap',
          'Support bantuan pelanggan',
        ],
        isActive: true,
      },
      {
        name: 'Pro',
        description: 'Solusi lengkap & fitur lanjutan untuk bisnis berkembang.',
        isConsultation: false,
        price: 500000,
        period: '/bulan',
        features: [
          'Semua fitur Basic',
          'Multi kasir & manajemen karyawan',
          'Laporan keuangan & analitik lengkap',
          'Dedicated support & pendampingan 24/7',
        ],
        isActive: true,
      },
      {
        name: 'Custom / IT One',
        description: 'Solusi sistem kasir khusus sesuai alur dan kebutuhan bisnis Anda.',
        isConsultation: true,
        price: 0,
        period: '',
        features: [
          'Semua fitur Basic & Pro',
          'Kustomisasi alur & fitur khusus',
          'Integrasi sistem modul custom',
          'Dedicated support & pendampingan tim',
        ],
        isActive: true,
      },
    ];

    for (const pkg of initialPackages) {
      const existing = await prisma.package.findFirst({
        where: { name: pkg.name },
      });

      if (!existing) {
        await prisma.package.create({
          data: pkg,
        });
        console.log(`📦 [Seeder] Paket baru dibuat: ${pkg.name}`);
      } else {
        await prisma.package.update({
          where: { id: existing.id },
          data: pkg,
        });
        console.log(`📦 [Seeder] Paket diperbarui: ${pkg.name}`);
      }
    }

    console.log('🎉 [Seeder] Selesai! Data role switch, pengguna, dan kelola paket berhasil disiapkan.');
  } catch (error) {
    console.error('❌ [Seeder] Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();

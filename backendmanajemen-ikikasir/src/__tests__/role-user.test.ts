import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('Manajemen Role dan Pengguna API', () => {
  const app = createApp();
  let superAdminToken: string;
  let salesToken: string;
  let testRoleId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Login superadmin untuk mendapatkan token autentikasi
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@ikikasir.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    superAdminToken = res.body.data.token;
  });

  afterAll(async () => {
    // Cleanup data jika ada test id tersisa
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    if (testRoleId) {
      await prisma.role.deleteMany({ where: { id: testRoleId } });
    }
    await prisma.$disconnect();
  });

  describe('1. Manajemen Role API', () => {
    it('GET /api/roles/menus/list - Mengambil daftar katalog master switch menu', async () => {
      const res = await request(app)
        .get('/api/roles/menus/list')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(14);

      const calonClient = res.body.data.find((m: any) => m.key === 'calonClient');
      expect(calonClient).toBeDefined();
      expect(calonClient.label).toContain('Calon Client');
    });

    it('GET /api/roles - Mengambil semua role dan memastikan switch boolean sesuai syarat', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const roles = res.body.data;
      const superAdminRole = roles.find((r: any) => r.name === 'Super Admin');
      expect(superAdminRole).toBeDefined();
      expect(superAdminRole.menuAccess.dashboard).toBe(true);
      expect(superAdminRole.menuAccess.calonClient).toBe(true);
      expect(superAdminRole.menuAccess.manajemenPengguna).toBe(true);

      // Sales memiliki dashboard referral dan halaman calon client.
      const salesRole = roles.find((r: any) => r.name === 'Sales');
      expect(salesRole).toBeDefined();
      expect(salesRole.menuAccess.dashboard).toBe(true);
      expect(salesRole.menuAccess.manajemenPengguna).toBe(false);
      expect(salesRole.menuAccess.manajemenRole).toBe(false);
    });

    it('POST /api/roles - Membuat role baru dengan switch boolean', async () => {
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Supervisor CRM Test',
          description: 'Hanya akses modul CRM',
          menuAccess: {
            calonClient: true,
            semuaPelanggan: true,
            dashboard: false,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Supervisor CRM Test');
      expect(res.body.data.menuAccess.calonClient).toBe(true);
      expect(res.body.data.menuAccess.semuaPelanggan).toBe(true);
      expect(res.body.data.menuAccess.dashboard).toBe(false);

      testRoleId = res.body.data.id;
    });

    it('PUT /api/roles/:id - Memperbarui role dan switch menu', async () => {
      const res = await request(app)
        .put(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Supervisor CRM Test Updated',
          menuAccess: {
            dashboard: true,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Supervisor CRM Test Updated');
      expect(res.body.data.menuAccess.dashboard).toBe(true);
    });

    it('POST /api/roles - Mendukung checklist CRUD per menu (bisa tambah & edit data tanpa hapus data)', async () => {
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Staf Operasional Gudang Test',
          description: 'Bisa tambah dan edit tanpa hapus',
          permissions: {
            kelolaPaket: {
              create: true,
              read: true,
              update: true,
              delete: false,
            },
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.permissions.kelolaPaket.create).toBe(true);
      expect(res.body.data.permissions.kelolaPaket.read).toBe(true);
      expect(res.body.data.permissions.kelolaPaket.update).toBe(true);
      expect(res.body.data.permissions.kelolaPaket.delete).toBe(false);
      expect(res.body.data.menuAccess.kelolaPaket).toBe(true);

      // Cleanup
      await request(app)
        .delete(`/api/roles/${res.body.data.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
    });
  });

  describe('2. Manajemen Pengguna API (Form Sesuai Frontend)', () => {
    it('GET /api/users - Mengambil daftar pengguna', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const user = res.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
    });

    it('POST /api/users - Membuat pengguna baru sesuai form modal frontend', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Dimas Anggara',
          email: 'dimas.test@ikikasir.com',
          role: 'Sales',
          status: 'Active',
          phone: '081234567890',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dimas Anggara');
      expect(res.body.data.role).toBe('Sales');
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.phone).toBe('081234567890');

      testUserId = res.body.data.id;
    });

    it('POST /api/users - Menolak akun Sales tanpa nomor WhatsApp yang valid', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Sales Tanpa Nomor',
          email: 'sales.no-phone.test@ikikasir.com',
          role: 'Sales',
          status: 'Active',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Nomor WhatsApp Sales');
    });

    it('POST /api/auth/login/sales - Login Sales otomatis masuk ke dashboard dengan kode referral', async () => {
      const savedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { salesReferralCode: true },
      });

      expect(savedUser?.salesReferralCode).toMatch(/^SALES-[A-Z0-9]{6}$/);

      const loginRes = await request(app)
        .post('/api/auth/login/sales')
        .send({
          email: 'dimas.test@ikikasir.com',
          password: 'password123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.id).toBe(testUserId);
      salesToken = loginRes.body.data.token;

      const dashboardRes = await request(app)
        .get(`/api/sales/${testUserId}/dashboard`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.body.data.id).toBe(testUserId);
      expect(dashboardRes.body.data.salesReferralCode).toBe(savedUser?.salesReferralCode);
    });

    it('GET /api/sales - List Sales tidak mengembalikan data saldo atau komisi', async () => {
      const res = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const salesUser = res.body.data.find((item: any) => item.id === testUserId);
      expect(salesUser).toBeDefined();
      expect(salesUser).not.toHaveProperty('salesBalance');
      expect(salesUser).not.toHaveProperty('salesTotalEarned');
      expect(salesUser).not.toHaveProperty('salesTotalWithdrawn');
    });

    it('Sales dapat membuka daftar referral dan penarikan sendiri, tetapi tidak dapat membuka CRM', async () => {
      const clientsRes = await request(app)
        .get(`/api/sales/${testUserId}/clients`)
        .set('Authorization', `Bearer ${salesToken}`);
      const withdrawalsRes = await request(app)
        .get(`/api/sales/${testUserId}/withdrawals`)
        .set('Authorization', `Bearer ${salesToken}`);
      const leadsRes = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${salesToken}`);
      const customersRes = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(clientsRes.status).toBe(200);
      expect(withdrawalsRes.status).toBe(200);
      expect(leadsRes.status).toBe(403);
      expect(customersRes.status).toBe(403);
    });

    it('PATCH /api/sales/withdrawals/:id/confirm - Wajib menyimpan bukti sebelum menandai pembayaran selesai', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { salesBalance: 15000 },
      });
      const withdrawal = await prisma.salesWithdrawal.create({
        data: {
          userId: testUserId,
          amount: 15000,
          bankOrWallet: 'BCA',
          accountNumber: '1234567890',
          accountHolder: 'Dimas Anggara',
        },
      });

      const missingProofRes = await request(app)
        .patch(`/api/sales/withdrawals/${withdrawal.id}/confirm`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'SELESAI' });

      expect(missingProofRes.status).toBe(400);
      expect(missingProofRes.body.message).toContain('Bukti pembayaran wajib diunggah');

      const approvedRes = await request(app)
        .patch(`/api/sales/withdrawals/${withdrawal.id}/confirm`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'SELESAI',
          transferReference: 'TRX-SALES-001',
          paymentProofUrl: 'https://api.ikikasir.com/uploads/receipts/sales-proof.jpg',
        });

      expect(approvedRes.status).toBe(200);
      expect(approvedRes.body.data.status).toBe('SELESAI');
      expect(approvedRes.body.data.paymentProofUrl).toContain('/uploads/receipts/sales-proof.jpg');

      const savedWithdrawal = await prisma.salesWithdrawal.findUnique({
        where: { id: withdrawal.id },
        select: { paymentProofUrl: true },
      });
      expect(savedWithdrawal?.paymentProofUrl).toBe('https://api.ikikasir.com/uploads/receipts/sales-proof.jpg');
    });

    it('PATCH /api/users/:id/status - Toggle status akun pengguna', async () => {
      const res = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'Inactive' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Inactive');
      expect(res.body.data.isActive).toBe(false);
    });

    it('PUT /api/users/:id - Mengedit pengguna', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Dimas Anggara S.T.',
          status: 'Active',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Dimas Anggara S.T.');
      expect(res.body.data.status).toBe('Active');
    });

    it('DELETE /api/users/:id - Menghapus pengguna', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      testUserId = '';
    });

    it('DELETE /api/roles/:id - Menghapus role test', async () => {
      const res = await request(app)
        .delete(`/api/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      testRoleId = '';
    });
  });
});

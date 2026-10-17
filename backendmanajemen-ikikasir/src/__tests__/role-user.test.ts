import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('Manajemen Role dan Pengguna API', () => {
  const app = createApp();
  let superAdminToken: string;
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

      // Verifikasi Sales: hanya halaman tambah client (calonClient) yang bernilai TRUE
      const salesRole = roles.find((r: any) => r.name === 'Sales');
      expect(salesRole).toBeDefined();
      expect(salesRole.menuAccess.calonClient).toBe(true);
      expect(salesRole.menuAccess.dashboard).toBe(false);
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
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dimas Anggara');
      expect(res.body.data.role).toBe('Sales');
      expect(res.body.data.status).toBe('Active');

      testUserId = res.body.data.id;
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

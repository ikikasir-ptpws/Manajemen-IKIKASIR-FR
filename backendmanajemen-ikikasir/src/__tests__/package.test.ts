import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('Kelola Paket API (Essential Fields Only)', () => {
  const app = createApp();
  let superAdminToken: string;
  let testPackageId: string;

  beforeAll(async () => {
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
    if (testPackageId) {
      await prisma.package.deleteMany({ where: { id: testPackageId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/packages - Mengambil daftar paket', async () => {
    const res = await request(app).get('/api/packages');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const basic = res.body.data.find((p: any) => p.name === 'Basic');
    expect(basic).toBeDefined();
    expect(basic.price).toBe(250000);
    expect(basic.description).toBeDefined();
    expect(Array.isArray(basic.features)).toBe(true);
  });

  it('POST /api/packages - Menambah paket baru dengan field penting saja', async () => {
    const res = await request(app)
      .post('/api/packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Enterprise VIP',
        description: 'Solusi enterprise dengan server mandiri',
        isConsultation: false,
        price: 1500000,
        period: '/bulan',
        featuresText: 'Dedicated cloud server\nMulti cabang tanpa batas\nAudit log & SLA 99.9%',
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Enterprise VIP');
    expect(res.body.data.description).toBe('Solusi enterprise dengan server mandiri');
    expect(res.body.data.features).toHaveLength(3);
    expect(res.body.data.price).toBe(1500000);

    testPackageId = res.body.data.id;
  });

  it('GET /api/packages/:id - Mengambil detail paket', async () => {
    const res = await request(app).get(`/api/packages/${testPackageId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(testPackageId);
    expect(res.body.data.name).toBe('Enterprise VIP');
  });

  it('PUT /api/packages/:id - Memperbarui paket', async () => {
    const res = await request(app)
      .put(`/api/packages/${testPackageId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Enterprise VIP Plus',
        price: 1750000,
        description: 'Update deskripsi enterprise',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Enterprise VIP Plus');
    expect(res.body.data.price).toBe(1750000);
  });

  it('PATCH /api/packages/:id/status - Toggle status aktif paket', async () => {
    const res = await request(app)
      .patch(`/api/packages/${testPackageId}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);
  });

  it('DELETE /api/packages/:id - Menghapus paket', async () => {
    const res = await request(app)
      .delete(`/api/packages/${testPackageId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    testPackageId = '';
  });
});

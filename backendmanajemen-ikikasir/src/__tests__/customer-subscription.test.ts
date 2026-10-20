import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('API Manajemen Pelanggan & Subscription Check Android', () => {
  const app = createApp();
  let superAdminToken: string;
  let basicPackageId: string;
  let testCustomerId: string;
  const testCustomerEmail = 'toko.berkah.jaya@ikikasir.com';

  beforeAll(async () => {
    // 1. Login sebagai Super Admin untuk mendapatkan JWT token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@ikikasir.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    superAdminToken = res.body.data.token;

    // 2. Ambil paket Basic dari database untuk pengetesan
    const pkgRes = await request(app).get('/api/packages');
    expect(pkgRes.status).toBe(200);
    const basicPkg = pkgRes.body.data.find((p: any) => p.name === 'Basic') || pkgRes.body.data[0];
    expect(basicPkg).toBeDefined();
    basicPackageId = basicPkg.id;

    // 3. Bersihkan data test lama jika ada
    await prisma.subscriptionHistory.deleteMany({
      where: { customer: { email: testCustomerEmail } },
    });
    await prisma.customer.deleteMany({
      where: { email: testCustomerEmail },
    });
  });

  afterAll(async () => {
    // Cleanup data pengetesan
    if (testCustomerId) {
      await prisma.subscriptionHistory.deleteMany({
        where: { customerId: testCustomerId },
      });
      await prisma.customer.deleteMany({
        where: { id: testCustomerId },
      });
    }
    await prisma.$disconnect();
  });

  it('1. POST /api/customers - Pendaftaran Pelanggan Baru dengan Paket Basic', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Haji Ahmad',
        businessName: 'Toko Berkah Jaya',
        email: testCustomerEmail,
        phone: '081234567899',
        address: 'Jl. Ahmad Yani No. 12, Surabaya',
        packageId: basicPackageId,
        billingCycleMonths: 1,
        paymentMethod: 'QRIS',
        notes: 'Pendaftaran kasir baru Android',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testCustomerEmail);
    expect(res.body.data.computedStatus).toBe('ACTIVE');
    expect(res.body.data.isExpired).toBe(false);
    expect(res.body.data.canAccess).toBe(true);
    expect(res.body.data.daysRemaining).toBeGreaterThanOrEqual(28);

    testCustomerId = res.body.data.id;
  });

  it('2. GET /api/subscriptions/check - Pengecekan Android saat Pelanggan AKTIF', async () => {
    const res = await request(app)
      .get(`/api/subscriptions/check?email=${testCustomerEmail}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canAccess).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.isExpired).toBe(false);
    expect(res.body.data.daysRemaining).toBeGreaterThan(0);
    expect(res.body.data.businessName).toBe('Toko Berkah Jaya');
  });

  it('3. GET /api/subscriptions/check - Pengecekan Android untuk email yang belum terdaftar', async () => {
    const res = await request(app)
      .get('/api/subscriptions/check?email=email.belum.terdaftar@gmail.com');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canAccess).toBe(false);
    expect(res.body.data.status).toBe('NOT_FOUND');
    expect(res.body.data.isExpired).toBe(true);
    expect(res.body.data.message).toContain('belum terdaftar');
  });

  it('4. POST /api/subscriptions/simulate-expired - Simulasi Mengubah Masa Aktif ke Masa Lalu (Testing)', async () => {
    const res = await request(app)
      .post('/api/subscriptions/simulate-expired')
      .send({
        email: testCustomerEmail,
        daysAgo: 3, // Expired 3 hari lalu
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.computedStatus).toBe('EXPIRED');
    expect(res.body.data.isExpired).toBe(true);
    expect(res.body.data.canAccess).toBe(false);
  });

  it('5. GET /api/subscriptions/check - Pengecekan Android saat Pelanggan EXPIRED (Aplikasi Terkunci)', async () => {
    const res = await request(app)
      .get(`/api/subscriptions/check?email=${testCustomerEmail}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Kunci untuk Android: canAccess harus FALSE agar memunculkan popup kadaluarsa
    expect(res.body.data.canAccess).toBe(false);
    expect(res.body.data.status).toBe('EXPIRED');
    expect(res.body.data.isExpired).toBe(true);
    expect(res.body.data.daysRemaining).toBe(0);
    expect(res.body.data.message).toContain('telah berakhir');
  });

  it('6. GET /api/customers/expired - Muncul di Daftar Pelanggan Kedaluwarsa Web Manajemen', async () => {
    const res = await request(app)
      .get('/api/customers/expired')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const expiredTarget = res.body.data.find((c: any) => c.email === testCustomerEmail);
    expect(expiredTarget).toBeDefined();
    expect(expiredTarget.isExpired).toBe(true);
    expect(expiredTarget.daysExpired).toBeGreaterThanOrEqual(1);
  });

  it('7. POST /api/customers/:id/renew - Perpanjangan Masa Aktif oleh Admin (Renew Subscription)', async () => {
    const res = await request(app)
      .post(`/api/customers/${testCustomerId}/renew`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        billingCycleMonths: 1, // Tambah 1 bulan lagi
        paymentMethod: 'Transfer BCA',
        notes: 'Perpanjangan oleh pelanggan via WhatsApp',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.computedStatus).toBe('ACTIVE');
    expect(res.body.data.isExpired).toBe(false);
    expect(res.body.data.canAccess).toBe(true);
    expect(res.body.data.daysRemaining).toBeGreaterThanOrEqual(28);
  });

  it('8. GET /api/subscriptions/check - Pengecekan Android setelah diperpanjang kembali AKTIF', async () => {
    const res = await request(app)
      .get(`/api/subscriptions/check?email=${testCustomerEmail}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canAccess).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.isExpired).toBe(false);
  });
});

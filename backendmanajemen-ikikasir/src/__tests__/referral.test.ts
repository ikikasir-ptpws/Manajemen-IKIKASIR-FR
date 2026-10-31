import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('API Referral Pelanggan (Halaman Tambah Client - Sumber Referral)', () => {
  const app = createApp();
  let superAdminToken: string;
  let basicPackageId: string;
  let uplineId: string;
  let downlineId: string;
  let uplineReferralCode: string;
  let withdrawalId: string;

  const uplineEmail = 'referral.upline@ikikasir.test';
  const downlineEmail = 'referral.downline@ikikasir.test';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@ikikasir.com',
        password: 'password123',
      });

    expect(login.status).toBe(200);
    superAdminToken = login.body.data.token;

    const pkgRes = await request(app)
      .get('/api/packages')
      .set('Authorization', `Bearer ${superAdminToken}`);
    const basicPkg = pkgRes.body.data.find((p: any) => p.name === 'Basic') || pkgRes.body.data[0];
    basicPackageId = basicPkg.id;

    // Bersihkan data pengetesan lama
    await prisma.customer.deleteMany({
      where: { email: { in: [uplineEmail, downlineEmail] } },
    });

    // Buat pelanggan upline (pemilik kode referral)
    const uplineRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Budi Hartono',
        businessName: 'Kopi Santai Kenangan',
        email: uplineEmail,
        phone: '081234567890',
        address: 'Jl. Merdeka No. 10',
        village: 'Sukamaju',
        district: 'Cibinong',
        city: 'Kabupaten Bogor',
        packageId: basicPackageId,
        billingCycleMonths: 1,
        paymentMethod: 'QRIS',
      });

    expect(uplineRes.status).toBe(201);
    uplineId = uplineRes.body.data.id;
    uplineReferralCode = uplineRes.body.data.referralCode;
  });

  afterAll(async () => {
    await prisma.customer.deleteMany({
      where: { email: { in: [uplineEmail, downlineEmail] } },
    });
    await prisma.$disconnect();
  });

  it('1. Pelanggan baru otomatis memiliki kode referral', () => {
    expect(uplineReferralCode).toBeTruthy();
    expect(uplineReferralCode.startsWith('IKIKASIR-')).toBe(true);
  });

  it('2. GET /api/referrals/validate - Memvalidasi kode referral yang valid', async () => {
    const res = await request(app)
      .get('/api/referrals/validate')
      .query({ code: uplineReferralCode })
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.upline.name).toBe('Budi Hartono');
    expect(res.body.data.rewardPerActiveUser).toBe(15000);
  });

  it('3. GET /api/referrals/validate - Menolak kode referral yang tidak dikenal', async () => {
    const res = await request(app)
      .get('/api/referrals/validate')
      .query({ code: 'IKIKASIR-TIDAKADA' })
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.upline).toBeNull();
  });

  it('4. POST /api/customers - Client dengan sumber Referral terhubung ke upline', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Siti Rahma',
        businessName: 'Warung Berkah Abadi',
        email: downlineEmail,
        phone: '085711223344',
        address: 'Jl. Melati No. 5',
        village: 'Cibinong',
        district: 'Cibinong',
        city: 'Kabupaten Bogor',
        packageId: basicPackageId,
        billingCycleMonths: 1,
        paymentMethod: 'QRIS',
        source: 'Referral',
        referralCode: uplineReferralCode,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.referredByCustomerId).toBe(uplineId);
    expect(res.body.data.referredByCustomerName).toBe('Budi Hartono');
    expect(res.body.data.referredByBusinessName).toBe('Kopi Santai Kenangan');
    expect(res.body.data.referralBoundAt).toBeTruthy();
    expect(res.body.data.referralCode).toBeTruthy();

    downlineId = res.body.data.id;
  });

  it('5. POST /api/customers - Menolak kode referral yang tidak valid', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Gagal Referral',
        businessName: 'Toko Gagal',
        email: 'referral.gagal@ikikasir.test',
        phone: '089988776655',
        packageId: basicPackageId,
        referralCode: 'IKIKASIR-TIDAKADA',
      });

    expect(res.status).toBe(400);

    await prisma.customer.deleteMany({ where: { email: 'referral.gagal@ikikasir.test' } });
  });

  it('6. GET /api/referrals/customers/:id - Ringkasan halaman Referral upline', async () => {
    const res = await request(app)
      .get(`/api/referrals/customers/${uplineId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.referralCode).toBe(uplineReferralCode);
    expect(res.body.data.referredUsers.length).toBe(1);
    expect(res.body.data.referredUsers[0].ownerName).toBe('Siti Rahma');
    expect(res.body.data.referredUsers[0].isActive).toBe(true);
    expect(res.body.data.totalEarnings).toBe(15000);
    expect(res.body.data.availableBalance).toBe(15000);
  });

  it('7. POST /api/referrals/customers/:id/withdrawals - Melarang pencairan melebihi saldo', async () => {
    const res = await request(app)
      .post(`/api/referrals/customers/${uplineId}/withdrawals`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        amount: 999999,
        bankOrWallet: 'BCA',
        accountNumber: '8230192841',
        accountHolder: 'Budi Hartono',
      });

    expect(res.status).toBe(400);
  });

  it('8. POST + PATCH pencairan referral - Alur verifikasi finance', async () => {
    const createRes = await request(app)
      .post(`/api/referrals/customers/${uplineId}/withdrawals`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        amount: 10000,
        bankOrWallet: 'BCA',
        accountNumber: '8230192841',
        accountHolder: 'Budi Hartono',
        notes: 'Penarikan saldo komisi referral',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('MENUNGGU_VERIFIKASI');
    withdrawalId = createRes.body.data.id;

    const patchRes = await request(app)
      .patch(`/api/referrals/withdrawals/${withdrawalId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'SELESAI' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe('SELESAI');
    expect(patchRes.body.data.completedDate).toBeTruthy();
  });

  it('9. Saldo referral berkurang setelah pencairan selesai', async () => {
    const res = await request(app)
      .get(`/api/referrals/customers/${uplineId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalWithdrawn).toBe(10000);
    expect(res.body.data.availableBalance).toBe(5000);
  });

  it('10. GET /api/referrals/overview - Aplikasi Android menerima data datar + alias object', async () => {
    const res = await request(app)
      .get('/api/referrals/overview')
      .query({ email: uplineEmail });

    expect(res.status).toBe(200);

    // Struktur datar (dipakai frontend webbase & aplikasi Android terbaru)
    expect(res.body.data.referralCode).toBe(uplineReferralCode);
    expect(res.body.data.referredUsers.length).toBe(1);

    // Alias object (aplikasi Android versi lama)
    expect(res.body.data.referralInfo.referralCode).toBe(uplineReferralCode);
    expect(res.body.data.userReferrals.length).toBe(1);
    expect(res.body.data.userReferrals[0].ownerName).toBe('Siti Rahma');
  });

  it('11. POST /api/referrals/submit-client - Calon client dari aplikasi terikat ke pengundang', async () => {
    const res = await request(app)
      .post('/api/referrals/submit-client')
      .send({
        referralCode: uplineReferralCode,
        name: 'Rina',
        businessName: 'Toko Rina',
        phone: '081298765432',
        email: 'referral.calon.client@ikikasir.test',
        notes: 'Diajukan dari aplikasi kasir',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.referralCode).toBe(uplineReferralCode);
    expect(res.body.data.referredBy.id).toBe(uplineId);
    expect(res.body.data.referredBy.name).toBe('Budi Hartono');
    expect(res.body.data.lead.referredByCustomerId).toBe(uplineId);

    await prisma.lead.deleteMany({ where: { email: 'referral.calon.client@ikikasir.test' } });
  });

  it('12. POST /api/referrals/submit-client - Token referral global (email) mendeteksi pengundang', async () => {
    const res = await request(app)
      .post('/api/referrals/submit-client')
      .send({
        // Tanpa referralCode: backend mendeteksi pengundang dari email lisensi (token global di APK)
        userEmail: uplineEmail,
        customerId: uplineId,
        name: 'Dewi',
        businessName: 'Warung Dewi',
        phone: '081255554444',
        email: 'referral.calon.client.email@ikikasir.test',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.referralCode).toBe(uplineReferralCode);
    expect(res.body.data.referredBy.id).toBe(uplineId);

    await prisma.lead.deleteMany({ where: { email: 'referral.calon.client.email@ikikasir.test' } });
  });

  it('13. POST /api/referrals/submit-client - Menolak pengundang yang tidak dikenali', async () => {
    const res = await request(app)
      .post('/api/referrals/submit-client')
      .send({
        referralCode: 'IKIKASIR-TIDAKADA',
        name: 'Gagal',
        businessName: 'Toko Gagal',
        phone: '081200000000',
        email: 'referral.gagal.client@ikikasir.test',
      });

    expect(res.status).toBe(400);
  });
});

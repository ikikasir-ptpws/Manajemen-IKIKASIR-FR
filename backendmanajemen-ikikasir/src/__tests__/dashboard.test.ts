import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../infrastructure/database/prisma.js';

describe('Dashboard API', () => {
  const app = createApp();
  let superAdminToken: string;

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
    await prisma.$disconnect();
  });

  it('GET /api/dashboard - Menolak akses tanpa token', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/dashboard - Mengambil seluruh data dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;

    // Ringkasan KPI
    expect(data.summary).toBeDefined();
    expect(typeof data.summary.totalPelanggan).toBe('number');
    expect(typeof data.summary.pelangganAktif).toBe('number');
    expect(typeof data.summary.akanExpired).toBe('number');
    expect(typeof data.summary.pelangganExpired).toBe('number');
    expect(data.summary.periode.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.summary.periode.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Daftar pelanggan
    expect(Array.isArray(data.expiringCustomers)).toBe(true);
    expect(Array.isArray(data.expiredCustomers)).toBe(true);

    for (const row of data.expiringCustomers) {
      expect(row.id).toBeDefined();
      expect(row.name).toBeDefined();
      expect(row.status).toBe('expiring');
      expect(row.daysLeft).toBeGreaterThan(0);
    }

    for (const row of data.expiredCustomers) {
      expect(row.id).toBeDefined();
      expect(row.name).toBeDefined();
      expect(row.status).toBe('expired');
    }

    // Aktivitas terbaru
    expect(Array.isArray(data.activities)).toBe(true);
    for (const activity of data.activities) {
      expect(activity.id).toBeDefined();
      expect(['convert', 'payment', 'warning', 'followup', 'export']).toContain(
        activity.type,
      );
      expect(activity.relativeTime).toBeDefined();
    }

    // Grafik arus kas
    expect(Array.isArray(data.cashFlowChart)).toBe(true);
    expect(data.cashFlowChart.length).toBeGreaterThan(0);
    for (const point of data.cashFlowChart) {
      expect(point.label).toBeDefined();
      expect(point.fullDate).toBeDefined();
      expect(typeof point.income).toBe('number');
      expect(typeof point.expense).toBe('number');
      expect(typeof point.balance).toBe('number');
    }
  });

  it('GET /api/dashboard/summary - Mengambil ringkasan metrik', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalPelanggan).toBe('number');
    expect(typeof res.body.data.totalPaidRevenue).toBe('number');
  });

  it('GET /api/dashboard/cashflow-chart - Mengambil titik grafik sesuai periode', async () => {
    const res = await request(app)
      .get('/api/dashboard/cashflow-chart?chartDays=90&chartPoints=7')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(7);
  });

  it('GET /api/dashboard - Menerapkan filter rentang tanggal', async () => {
    const res = await request(app)
      .get('/api/dashboard?startDate=2026-09-01&endDate=2026-09-30')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;

    // Periode mengikuti rentang yang diminta
    expect(data.summary.periode.startDate).toBe('2026-09-01');
    expect(data.summary.periode.endDate).toBe('2026-09-30');

    // Grafik mengikuti rentang tersebut (30 hari -> 15 titik)
    expect(data.cashFlowChart.length).toBe(15);
    expect(data.cashFlowChart[0].fullDate).toContain('2026');
    expect(data.cashFlowChart.at(-1).fullDate).toContain('2026');
  });

  it('GET /api/dashboard - Menukar tanggal bila urutannya terbalik', async () => {
    const res = await request(app)
      .get('/api/dashboard?startDate=2026-09-30&endDate=2026-09-01')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.periode.startDate).toBe('2026-09-01');
    expect(res.body.data.summary.periode.endDate).toBe('2026-09-30');
  });

  it('GET /api/dashboard - Mengabaikan format tanggal yang tidak valid', async () => {
    const res = await request(app)
      .get('/api/dashboard?startDate=abc&endDate=xyz')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Kembali ke periode default (30 hari terakhir)
    expect(res.body.data.summary.periode.startDate).not.toBe('abc');
  });

  it('GET /api/dashboard/cashflow-chart - Grafik mengikuti rentang tanggal', async () => {
    const res = await request(app)
      .get('/api/dashboard/cashflow-chart?startDate=2026-11-01&endDate=2026-11-12')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(12);
    expect(res.body.data[0].fullDate).toContain('2026');
  });
});

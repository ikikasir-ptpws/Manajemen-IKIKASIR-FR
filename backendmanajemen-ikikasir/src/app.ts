import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Pastikan .env terbaca sebelum allowedOrigins dihitung
dotenv.config();
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import authRoutes from './presentation/routes/auth.routes.js';
import roleRoutes from './presentation/routes/role.routes.js';
import userRoutes from './presentation/routes/user.routes.js';
import packageRoutes from './presentation/routes/package.routes.js';
import customerRoutes from './presentation/routes/customer.routes.js';
import subscriptionRoutes from './presentation/routes/subscription.routes.js';
import leadRoutes from './presentation/routes/lead.routes.js';
import referralRoutes from './presentation/routes/referral.routes.js';
import uploadRoutes from './presentation/routes/upload.routes.js';
import cashTransactionRoutes from './presentation/routes/cash-transaction.routes.js';
import laporanRoutes from './presentation/routes/laporan.routes.js';
import neracaItemRoutes from './presentation/routes/neraca-items.routes.js';
import dashboardRoutes from './presentation/routes/dashboard.routes.js';
import salesRoutes from './presentation/routes/sales.routes.js';
import { errorHandler } from './presentation/middlewares/error.middleware.js';
import { NotFoundError } from './domain/errors/AppError.js';


const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function getAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const origins = configured.length
    ? configured
    : ['https://ikikasir.com', 'https://www.ikikasir.com'];

  // Di development, izinkan juga frontend Vite lokal
  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    for (const o of DEFAULT_DEV_ORIGINS) {
      if (!origins.includes(o)) origins.push(o);
    }
  }

  return origins;
}

export function createApp(): Application {
  const app = express();
  app.set('trust proxy', 1);
  const allowedOrigins = getAllowedOrigins();

  // Middleware Keamanan & Parser
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
  cors({
    origin: (origin, callback) => {
      // Tanpa header Origin (curl, Postman, server-to-server) tetap diizinkan
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // false = tidak ada header CORS, browser yang memblokir (bukan error 500)
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static File Serving untuk Bukti Pembayaran / Uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(uploadsDir)
  );

  // Endpoint Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'IKIKASIR Backend Manajemen',
      timestamp: new Date().toISOString(),
    });
  });

  // Routing Modul
  app.use('/api/auth', authRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/v1/subscriptions', subscriptionRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/calon-client', leadRoutes);
  app.use('/api/referrals', referralRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/cashflow', cashTransactionRoutes);
  app.use('/api/arus-kas', cashTransactionRoutes);
  app.use('/api/laporan', laporanRoutes);
  app.use('/api/neraca-items', neracaItemRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sales', salesRoutes);

  // Penanganan rute 404 Not Found
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Rute '${req.method} ${req.originalUrl}' tidak ditemukan.`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();

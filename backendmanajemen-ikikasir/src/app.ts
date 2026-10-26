import express, { Application, Request, Response, NextFunction } from 'express';
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
import uploadRoutes from './presentation/routes/upload.routes.js';
import { errorHandler } from './presentation/middlewares/error.middleware.js';
import { NotFoundError } from './domain/errors/AppError.js';

export function createApp(): Application {
  const app = express();

  // Middleware Keamanan & Parser
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: true, // Memungkinkan request dari frontend Vite localhost:5173
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
  app.use('/uploads', express.static(uploadsDir));

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
  app.use('/api/leads', leadRoutes);
  app.use('/api/calon-client', leadRoutes);
  app.use('/api/upload', uploadRoutes);

  // Penanganan rute 404 Not Found
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Rute '${req.method} ${req.originalUrl}' tidak ditemukan.`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './presentation/routes/auth.routes.js';
import roleRoutes from './presentation/routes/role.routes.js';
import userRoutes from './presentation/routes/user.routes.js';
import packageRoutes from './presentation/routes/package.routes.js';
import customerRoutes from './presentation/routes/customer.routes.js';
import subscriptionRoutes from './presentation/routes/subscription.routes.js';
import { errorHandler } from './presentation/middlewares/error.middleware.js';
import { NotFoundError } from './domain/errors/AppError.js';

export function createApp(): Application {
  const app = express();

  // Middleware Keamanan & Parser
  app.use(helmet());
  app.use(
    cors({
      origin: true, // Memungkinkan request dari frontend Vite localhost:5173
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Penanganan rute 404 Not Found
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Rute '${req.method} ${req.originalUrl}' tidak ditemukan.`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp();

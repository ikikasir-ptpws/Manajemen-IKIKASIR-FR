import { Router } from 'express';
import {
  uploadMiddleware,
  uploadPaymentProof,
  uploadBase64Proof,
} from '../controllers/UploadController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: Upload file bukti pembayaran (Multipart/form-data)
 * POST /api/upload/payment-proof
 * POST /api/upload
 */
router.post(
  '/payment-proof',
  authenticate,
  uploadMiddleware.single('file'),
  uploadPaymentProof
);

// Alias rute upload standar
router.post(
  '/',
  authenticate,
  uploadMiddleware.single('file'),
  uploadPaymentProof
);

/**
 * Route: Upload bukti pembayaran format Base64 (JSON)
 * POST /api/upload/base64
 */
router.post('/base64', authenticate, uploadBase64Proof);

export default router;

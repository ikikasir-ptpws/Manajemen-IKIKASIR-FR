import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../../domain/errors/AppError.js';
import { config } from '../../infrastructure/config/env.js';

// Pastikan folder uploads/receipts tersedia
const uploadDir = path.resolve(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer DiskStorage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `proof-${uniqueSuffix}${cleanExt}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Format berkas tidak didukung. Harap unggah berkas gambar (JPG, PNG, atau WEBP).'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10MB
  },
});

/**
 * Controller untuk menangani upload file bukti pembayaran (multipart/form-data)
 * POST /api/upload/payment-proof
 */
export const uploadPaymentProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new BadRequestError('Berkas bukti pembayaran tidak ditemukan dalam request (field: "file" atau "image").');
    }

    const host = req.get('host') || `localhost:${config.port}`;
    const protocol = req.protocol || 'http';
    const filename = req.file.filename;
    const relativePath = `/uploads/receipts/${filename}`;
    const fullUrl = `${protocol}://${host}${relativePath}`;

    res.status(201).json({
      success: true,
      message: 'Berkas bukti pembayaran berhasil diunggah ke storage.',
      data: {
        url: fullUrl,
        relativePath,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller untuk menangani upload bukti pembayaran format Base64 (application/json)
 * POST /api/upload/base64
 */
export const uploadBase64Proof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image, base64, fileName } = req.body;
    const rawData = image || base64;

    if (!rawData || typeof rawData !== 'string') {
      throw new BadRequestError('Data gambar base64 wajib disertakan pada field "image" atau "base64".');
    }

    // Ekstrak ekstensi dari MIME type
    const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = '.jpg';
    let base64Data = rawData;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      base64Data = matches[2];
    } else if (fileName) {
      const parsedExt = path.extname(fileName).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(parsedExt)) {
        ext = parsedExt;
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `proof-${uniqueSuffix}${ext}`;
    const targetPath = path.join(uploadDir, filename);

    await fs.promises.writeFile(targetPath, buffer);

    const host = req.get('host') || `localhost:${config.port}`;
    const protocol = req.protocol || 'http';
    const relativePath = `/uploads/receipts/${filename}`;
    const fullUrl = `${protocol}://${host}${relativePath}`;

    res.status(201).json({
      success: true,
      message: 'Bukti pembayaran Base64 berhasil disimpan ke storage berkas.',
      data: {
        url: fullUrl,
        relativePath,
        filename,
        size: buffer.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

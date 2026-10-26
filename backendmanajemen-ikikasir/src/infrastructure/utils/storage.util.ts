import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';

export const uploadDir = path.resolve(process.cwd(), 'uploads', 'receipts');

// Pastikan direktori upload ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Buat berkas default receipt jika belum ada agar selalu ada gambar fallback dari storage
export const ensureDefaultReceipt = (): string => {
  const defaultPath = path.join(uploadDir, 'default-receipt.svg');
  if (!fs.existsSync(defaultPath)) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
  <rect width="360" height="480" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect width="360" height="70" rx="16" fill="#005baa"/>
  <text x="180" y="44" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">BUKTI RESMI IKI KASIR</text>
  <circle cx="180" cy="120" r="28" fill="#ecfdf5"/>
  <path d="M168 120 l8 8 l16 -16" stroke="#059669" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <text x="180" y="165" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#059669" text-anchor="middle">PEMBAYARAN DIVERIFIKASI</text>
  <text x="180" y="185" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Resmi Diterima oleh Finance</text>
  <line x1="30" y1="205" x2="330" y2="205" stroke="#e2e8f0" stroke-dasharray="4 4"/>
  <text x="35" y="240" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Penyedia Layanan</text>
  <text x="325" y="240" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="end">PT PUNDI MAS BERKAH</text>
  <text x="35" y="275" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Rekening Tujuan</text>
  <text x="325" y="275" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="end">BCA 8735019283</text>
  <text x="35" y="315" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Status Transaksi</text>
  <text x="325" y="315" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#059669" text-anchor="end">LUNAS / BERHASIL</text>
  <line x1="30" y1="350" x2="330" y2="350" stroke="#e2e8f0"/>
  <text x="180" y="390" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">Bukti pembayaran sah terverifikasi di storage sistem.</text>
  <text x="180" y="435" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#005baa" text-anchor="middle">IKIKASIR Multi Outlet Management</text>
</svg>`;
    fs.writeFileSync(defaultPath, svgContent, 'utf8');
  }
  const port = config.port || 5000;
  return `http://localhost:${port}/uploads/receipts/default-receipt.svg`;
};

export const saveProofFileToStorage = (proof?: string | null): string => {
  if (!proof || typeof proof !== 'string' || proof.trim() === '') {
    return ensureDefaultReceipt();
  }

  const trimmed = proof.trim();

  // Jika sudah URL file storage (/uploads/... atau http://.../uploads/...)
  if (trimmed.startsWith('/uploads/') || trimmed.includes('/uploads/')) {
    // Jika relative path, jadikan full URL
    if (trimmed.startsWith('/uploads/')) {
      const port = config.port || 5000;
      return `http://localhost:${port}${trimmed}`;
    }
    return trimmed;
  }

  // Jika berupa base64 image (data:image/...) atau raw base64
  if (trimmed.startsWith('data:image/') || trimmed.length > 200) {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (trimmed.startsWith('data:image/svg+xml;utf8,')) {
        // SVG inline string
        const svgContent = decodeURIComponent(trimmed.replace('data:image/svg+xml;utf8,', ''));
        const filename = `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}.svg`;
        const targetPath = path.join(uploadDir, filename);
        fs.writeFileSync(targetPath, svgContent, 'utf8');
        const port = config.port || 5000;
        return `http://localhost:${port}/uploads/receipts/${filename}`;
      }

      const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = '.jpg';
      let base64Data = trimmed;

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = '.png';
        else if (mime.includes('webp')) ext = '.webp';
        else if (mime.includes('svg')) ext = '.svg';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
        base64Data = matches[2];
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const targetPath = path.join(uploadDir, filename);
      fs.writeFileSync(targetPath, buffer);

      const port = config.port || 5000;
      return `http://localhost:${port}/uploads/receipts/${filename}`;
    } catch (err) {
      console.warn('⚠️ Gagal menyimpan bukti bayar base64 ke disk storage:', err);
      return ensureDefaultReceipt();
    }
  }

  // Jika URL web biasa
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return ensureDefaultReceipt();
};

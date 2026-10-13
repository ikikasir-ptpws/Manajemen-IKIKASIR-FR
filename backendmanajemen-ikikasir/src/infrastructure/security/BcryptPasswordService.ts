import bcrypt from 'bcryptjs';
import { IPasswordService } from '../../domain/interfaces/IPasswordService.js';
import { InternalServerError } from '../../domain/errors/AppError.js';

/**
 * Implementasi Service Password menggunakan library bcryptjs
 * Mengimplementasikan kontrak IPasswordService dari layer Domain
 */
export class BcryptPasswordService implements IPasswordService {
  private readonly saltRounds: number;

  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * Meng-hash kata sandi menjadi string acak terenkripsi (one-way hash)
   * Dilengkapi blok try-catch untuk menangani kegagalan algoritma enkripsi
   */
  public async hash(plainText: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashed = await bcrypt.hash(plainText, salt);
      return hashed;
    } catch (error) {
      // Penjelasan error: Kegagalan saat hashing password, biasanya akibat masalah memori atau input tidak valid
      console.error('❌ [BcryptPasswordService] Error saat hashing password:', error);
      throw new InternalServerError('Gagal mengenkripsi kata sandi pengguna.');
    }
  }

  /**
   * Memverifikasi apakah kata sandi teks biasa sesuai dengan hash yang tersimpan
   * Dilengkapi blok try-catch untuk menangani error saat komparasi string hash
   */
  public async compare(plainText: string, hashed: string): Promise<boolean> {
    try {
      if (!plainText || !hashed) {
        return false;
      }
      return await bcrypt.compare(plainText, hashed);
    } catch (error) {
      // Penjelasan error: Format hash tidak valid atau terjadi kegagalan komparasi
      console.error('❌ [BcryptPasswordService] Error saat membandingkan password:', error);
      throw new InternalServerError('Gagal memverifikasi kata sandi pengguna.');
    }
  }
}

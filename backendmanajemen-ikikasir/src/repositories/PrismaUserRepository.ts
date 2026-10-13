import { prisma } from '../infrastructure/database/prisma.js';
import { IUserRepository, CreateUserData } from '../domain/interfaces/IUserRepository.js';
import { User } from '../domain/entities/User.js';
import { UserRole } from '../domain/enums/Role.js';
import { InternalServerError } from '../domain/errors/AppError.js';

/**
 * Implementasi Repository User Menggunakan Prisma ORM
 * Menjalankan query yang efisien dan clean ke database PostgreSQL
 * Mengimplementasikan kontrak interface IUserRepository
 */
export class PrismaUserRepository implements IUserRepository {
  /**
   * Helper private untuk memetakan (mapping) data database Prisma ke Domain Entity User
   */
  private mapToDomain(record: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role as UserRole,
      phone: record.phone,
      isActive: record.isActive,
      lastLogin: record.lastLogin,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * Mencari user berdasarkan alamat email
   * Query menggunakan klausa findUnique dengan index email yang terindeks unik
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Query bersih mencari satu record berdasarkan index unik email
      const record = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!record) {
        return null;
      }

      return this.mapToDomain(record);
    } catch (error) {
      // Penjelasan error: Kesalahan jaringan atau kegagalan query database saat pencarian email
      console.error(`❌ [PrismaUserRepository] Gagal mencari user berdasarkan email (${email}):`, error);
      throw new InternalServerError('Terjadi kesalahan saat memproses data pengguna di database.');
    }
  }

  /**
   * Mencari user berdasarkan ID UUID unik
   * Query efisien menggunakan findUnique berbasis Primary Key
   */
  public async findById(id: string): Promise<User | null> {
    try {
      const record = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!record) {
        return null;
      }

      return this.mapToDomain(record);
    } catch (error) {
      // Penjelasan error: Kesalahan koneksi atau query saat mencari user by ID
      console.error(`❌ [PrismaUserRepository] Gagal mencari user berdasarkan ID (${id}):`, error);
      throw new InternalServerError('Terjadi kesalahan saat memverifikasi identitas pengguna.');
    }
  }

  /**
   * Menyimpan pengguna baru ke dalam database
   * Menggunakan query prisma.user.create
   */
  public async create(data: CreateUserData): Promise<User> {
    try {
      const normalizedEmail = data.email.toLowerCase().trim();

      const created = await prisma.user.create({
        data: {
          name: data.name.trim(),
          email: normalizedEmail,
          password: data.password,
          role: data.role as any,
          phone: data.phone ?? null,
          isActive: data.isActive ?? true,
        },
      });

      return this.mapToDomain(created);
    } catch (error) {
      // Penjelasan error: Kegagalan insert data ke tabel users
      console.error('❌ [PrismaUserRepository] Gagal membuat data pengguna baru:', error);
      throw new InternalServerError('Gagal mendaftarkan data pengguna ke sistem database.');
    }
  }

  /**
   * Memperbarui field lastLogin saat user berhasil login
   * Menggunakan update query yang ringan dan hanya memperbarui satu kolom timestamp
   */
  public async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      // Penjelasan error: Gagal memperbarui status login terakhir
      // Diberi peringatan tanpa membatalkan sesi login user
      console.warn(`⚠️ [PrismaUserRepository] Gagal mengupdate lastLogin untuk user ID (${id}):`, error);
    }
  }

  /**
   * Memeriksa keberadaan email di database
   * Menggunakan query count yang cepat dan ringan daripada memuat seluruh entitas
   */
  public async existsByEmail(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const count = await prisma.user.count({
        where: {
          email: normalizedEmail,
        },
      });
      return count > 0;
    } catch (error) {
      // Penjelasan error: Kesalahan saat pengecekan duplikasi email
      console.error(`❌ [PrismaUserRepository] Gagal memeriksa duplikasi email (${email}):`, error);
      throw new InternalServerError('Gagal memeriksa ketersediaan alamat email.');
    }
  }
}

import { prisma } from '../infrastructure/database/prisma.js';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  UserFilter,
} from '../domain/interfaces/IUserRepository.js';
import { User } from '../domain/entities/User.js';
import { Role } from '../domain/entities/Role.js';
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
  private mapToDomain(record: any): User {
    let roleDetail: Role | null = null;
    if (record.roleRef) {
      roleDetail = new Role({
        id: record.roleRef.id,
        name: record.roleRef.name,
        description: record.roleRef.description,
        menuAccess: record.roleRef.menuAccess
          ? {
              dashboard: record.roleRef.menuAccess.dashboard,
              manajemenPengguna: record.roleRef.menuAccess.manajemenPengguna,
              manajemenRole: record.roleRef.menuAccess.manajemenRole,
              manajemenPromo: record.roleRef.menuAccess.manajemenPromo,
              kelolaPaket: record.roleRef.menuAccess.kelolaPaket,
              calonClient: record.roleRef.menuAccess.calonClient,
              semuaPelanggan: record.roleRef.menuAccess.semuaPelanggan,
              langganan: record.roleRef.menuAccess.langganan,
              expired: record.roleRef.menuAccess.expired,
              arusKas: record.roleRef.menuAccess.arusKas,
              labaRugi: record.roleRef.menuAccess.labaRugi,
              neraca: record.roleRef.menuAccess.neraca,
              laporanPenjualan: record.roleRef.menuAccess.laporanPenjualan,
              landingPage: record.roleRef.menuAccess.landingPage,
            }
          : undefined,
        createdAt: record.roleRef.createdAt,
        updatedAt: record.roleRef.updatedAt,
      });
    }

    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role,
      roleId: record.roleId,
      roleDetail,
      phone: record.phone,
      isActive: record.isActive,
      lastLogin: record.lastLogin,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /**
   * Mengambil semua daftar pengguna dengan filter opsional
   */
  public async findAll(filter?: UserFilter): Promise<User[]> {
    try {
      const where: any = {};

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { role: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (filter?.role && filter.role !== 'Semua Role') {
        where.OR = [
          { role: { equals: filter.role, mode: 'insensitive' } },
          { roleId: filter.role },
        ];
      }

      if (filter?.status) {
        if (filter.status === 'Active') {
          where.isActive = true;
        } else if (filter.status === 'Inactive') {
          where.isActive = false;
        }
      }

      const records = await prisma.user.findMany({
        where,
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return records.map((r) => this.mapToDomain(r));
    } catch (error) {
      console.error('❌ [PrismaUserRepository] Gagal mengambil list users:', error);
      throw new InternalServerError('Terjadi kesalahan saat memuat daftar pengguna.');
    }
  }

  /**
   * Mencari user berdasarkan alamat email
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const record = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
      });

      if (!record) {
        return null;
      }

      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal mencari user berdasarkan email (${email}):`, error);
      throw new InternalServerError('Terjadi kesalahan saat memproses data pengguna di database.');
    }
  }

  /**
   * Mencari user berdasarkan ID UUID unik
   */
  public async findById(id: string): Promise<User | null> {
    try {
      const record = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
      });

      if (!record) {
        return null;
      }

      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal mencari user berdasarkan ID (${id}):`, error);
      throw new InternalServerError('Terjadi kesalahan saat memverifikasi identitas pengguna.');
    }
  }

  /**
   * Menyimpan pengguna baru ke dalam database
   */
  public async create(data: CreateUserData): Promise<User> {
    try {
      const normalizedEmail = data.email.toLowerCase().trim();

      // Resolve roleId jika hanya nama role yang diberikan
      let roleId = data.roleId ?? null;
      let roleName = data.role.trim();

      if (!roleId) {
        const foundRole = await prisma.role.findFirst({
          where: {
            name: { equals: roleName, mode: 'insensitive' },
          },
        });
        if (foundRole) {
          roleId = foundRole.id;
          roleName = foundRole.name;
        }
      }

      const created = await prisma.user.create({
        data: {
          name: data.name.trim(),
          email: normalizedEmail,
          password: data.password,
          role: roleName,
          roleId,
          phone: data.phone ?? null,
          isActive: data.isActive ?? true,
        },
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
      });

      return this.mapToDomain(created);
    } catch (error) {
      console.error('❌ [PrismaUserRepository] Gagal membuat data pengguna baru:', error);
      throw new InternalServerError('Gagal mendaftarkan data pengguna ke sistem database.');
    }
  }

  /**
   * Memperbarui data pengguna
   */
  public async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const updateData: any = {};

      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      if (data.email !== undefined) {
        updateData.email = data.email.toLowerCase().trim();
      }

      if (data.password !== undefined && data.password.trim() !== '') {
        updateData.password = data.password;
      }

      if (data.phone !== undefined) {
        updateData.phone = data.phone ? data.phone.trim() : null;
      }

      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      if (data.roleId !== undefined || data.role !== undefined) {
        let roleId = data.roleId;
        let roleName = data.role;

        if (roleId) {
          const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
          if (roleRecord) {
            updateData.roleId = roleRecord.id;
            updateData.role = roleRecord.name;
          }
        } else if (roleName) {
          const roleRecord = await prisma.role.findFirst({
            where: { name: { equals: roleName.trim(), mode: 'insensitive' } },
          });
          if (roleRecord) {
            updateData.roleId = roleRecord.id;
            updateData.role = roleRecord.name;
          } else {
            updateData.role = roleName.trim();
          }
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
      });

      return this.mapToDomain(updated);
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal mengupdate user ID (${id}):`, error);
      throw new InternalServerError('Gagal memperbarui data profil pengguna.');
    }
  }

  /**
   * Mengubah status aktif/nonaktif akun pengguna
   */
  public async updateStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        include: {
          roleRef: {
            include: {
              menuAccess: true,
            },
          },
        },
      });

      return this.mapToDomain(updated);
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal mengupdate status user (${id}):`, error);
      throw new InternalServerError('Gagal mengubah status aktif/nonaktif akun pengguna.');
    }
  }

  /**
   * Memperbarui field lastLogin saat user berhasil login
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
      console.warn(`⚠️ [PrismaUserRepository] Gagal mengupdate lastLogin untuk user ID (${id}):`, error);
    }
  }

  /**
   * Menghapus user
   */
  public async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal menghapus user ID (${id}):`, error);
      throw new InternalServerError('Gagal menghapus akun pengguna dari database.');
    }
  }

  /**
   * Memeriksa keberadaan email di database
   */
  public async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const where: any = {
        email: normalizedEmail,
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await prisma.user.count({ where });
      return count > 0;
    } catch (error) {
      console.error(`❌ [PrismaUserRepository] Gagal memeriksa duplikasi email (${email}):`, error);
      throw new InternalServerError('Gagal memeriksa ketersediaan alamat email.');
    }
  }
}

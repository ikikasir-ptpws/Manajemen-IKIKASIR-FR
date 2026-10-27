import { prisma } from '../infrastructure/database/prisma.js';
import { IRoleRepository, CreateRoleData, UpdateRoleData } from '../domain/interfaces/IRoleRepository.js';
import { Role, MenuAccessProps, RolePermissions } from '../domain/entities/Role.js';
import { InternalServerError } from '../domain/errors/AppError.js';

const PERMISSION_TAG = '__PERMISSIONS__:';

function packDescriptionAndPermissions(rawDesc: string | null | undefined, permissions?: RolePermissions): string | null {
  const cleanDesc = (rawDesc || '').split(PERMISSION_TAG)[0].trim();
  if (!permissions || Object.keys(permissions).length === 0) {
    return cleanDesc || null;
  }
  return `${cleanDesc}\n${PERMISSION_TAG}${JSON.stringify(permissions)}`;
}

function unpackDescriptionAndPermissions(combined: string | null | undefined): { description: string | null; permissions?: RolePermissions } {
  if (!combined) {
    return { description: null, permissions: undefined };
  }
  const parts = combined.split(PERMISSION_TAG);
  const cleanDesc = parts[0].trim() || null;
  let permissions: RolePermissions | undefined;
  if (parts.length > 1 && parts[1].trim()) {
    try {
      permissions = JSON.parse(parts[1].trim());
    } catch {
      permissions = undefined;
    }
  }
  return { description: cleanDesc, permissions };
}

export class PrismaRoleRepository implements IRoleRepository {
  /**
   * Helper untuk normalisasi menu access props
   */
  private defaultMenuAccess(input?: Partial<MenuAccessProps> | null): MenuAccessProps {
    return {
      dashboard: Boolean(input?.dashboard),
      manajemenPengguna: Boolean(input?.manajemenPengguna),
      manajemenRole: Boolean(input?.manajemenRole),
      manajemenPromo: Boolean(input?.manajemenPromo),
      kelolaPaket: Boolean(input?.kelolaPaket),
      calonClient: Boolean(input?.calonClient),
      semuaPelanggan: Boolean(input?.semuaPelanggan),
      langganan: Boolean(input?.langganan),
      expired: Boolean(input?.expired),
      arusKas: Boolean(input?.arusKas),
      labaRugi: Boolean(input?.labaRugi),
      neraca: Boolean(input?.neraca),
      laporanPenjualan: Boolean(input?.laporanPenjualan),
      landingPage: Boolean(input?.landingPage),
    };
  }

  /**
   * Helper mapping Prisma record ke Domain Entity Role
   */
  private mapToDomain(record: any): Role {
    const { description, permissions } = unpackDescriptionAndPermissions(record.description);

    const menuAccess: MenuAccessProps = record.menuAccess
      ? {
          dashboard: record.menuAccess.dashboard,
          manajemenPengguna: record.menuAccess.manajemenPengguna,
          manajemenRole: record.menuAccess.manajemenRole,
          manajemenPromo: record.menuAccess.manajemenPromo,
          kelolaPaket: record.menuAccess.kelolaPaket,
          calonClient: record.menuAccess.calonClient,
          semuaPelanggan: record.menuAccess.semuaPelanggan,
          langganan: record.menuAccess.langganan,
          expired: record.menuAccess.expired,
          arusKas: record.menuAccess.arusKas,
          labaRugi: record.menuAccess.labaRugi,
          neraca: record.menuAccess.neraca,
          laporanPenjualan: record.menuAccess.laporanPenjualan,
          landingPage: record.menuAccess.landingPage,
        }
      : this.defaultMenuAccess();

    return new Role({
      id: record.id,
      name: record.name,
      description,
      menuAccess,
      permissions: permissions ?? Role.generateDefaultPermissions(menuAccess),
      userCount: record._count ? record._count.users : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public async findAll(query?: string): Promise<Role[]> {
    try {
      const where: any = {};
      if (query && query.trim()) {
        const q = query.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const records = await prisma.role.findMany({
        where,
        include: {
          menuAccess: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return records.map((r) => this.mapToDomain(r));
    } catch (error) {
      console.error('❌ [PrismaRoleRepository] Gagal mengambil daftar role:', error);
      throw new InternalServerError('Terjadi kesalahan saat memuat data role hak akses.');
    }
  }

  public async findById(id: string): Promise<Role | null> {
    try {
      const record = await prisma.role.findUnique({
        where: { id },
        include: {
          menuAccess: true,
          _count: {
            select: { users: true },
          },
        },
      });

      if (!record) return null;
      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaRoleRepository] Gagal mencari role ID (${id}):`, error);
      throw new InternalServerError('Gagal mengambil informasi detail role.');
    }
  }

  public async findByName(name: string): Promise<Role | null> {
    try {
      const record = await prisma.role.findUnique({
        where: { name: name.trim() },
        include: {
          menuAccess: true,
          _count: {
            select: { users: true },
          },
        },
      });

      if (!record) return null;
      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaRoleRepository] Gagal mencari role by name (${name}):`, error);
      throw new InternalServerError('Gagal memverifikasi nama role.');
    }
  }

  public async create(data: CreateRoleData): Promise<Role> {
    try {
      const menuAccessInput: Partial<MenuAccessProps> = { ...(data.menuAccess || {}) };
      if (data.permissions) {
        for (const key of Role.defaultMenuKeys) {
          const perm = data.permissions[key];
          if (perm) {
            menuAccessInput[key] = Boolean(perm.read || perm.create || perm.update || perm.delete);
          }
        }
      }

      const normalizedAccess = this.defaultMenuAccess(menuAccessInput);
      const packedDesc = packDescriptionAndPermissions(data.description, data.permissions);

      const record = await prisma.role.create({
        data: {
          name: data.name.trim(),
          description: packedDesc,
          menuAccess: {
            create: normalizedAccess,
          },
        },
        include: {
          menuAccess: true,
          _count: {
            select: { users: true },
          },
        },
      });

      return this.mapToDomain(record);
    } catch (error) {
      console.error('❌ [PrismaRoleRepository] Gagal membuat role baru:', error);
      throw new InternalServerError('Gagal menyimpan data role baru.');
    }
  }

  public async update(id: string, data: UpdateRoleData): Promise<Role> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      let existingPermissions: RolePermissions | undefined;
      if (data.description !== undefined || data.permissions !== undefined) {
        const existingRecord = await prisma.role.findUnique({
          where: { id },
          select: { description: true },
        });
        const currentUnpacked = unpackDescriptionAndPermissions(existingRecord?.description);
        existingPermissions = currentUnpacked.permissions;

        const effectivePermissions = data.permissions !== undefined ? data.permissions : existingPermissions;
        const effectiveDesc = data.description !== undefined ? data.description : currentUnpacked.description;

        updateData.description = packDescriptionAndPermissions(effectiveDesc, effectivePermissions);
      }

      const effectivePerms = data.permissions !== undefined ? data.permissions : existingPermissions;
      if (data.menuAccess || effectivePerms) {
        const menuAccessInput: Partial<MenuAccessProps> = { ...(data.menuAccess || {}) };
        if (effectivePerms) {
          for (const key of Role.defaultMenuKeys) {
            const perm = effectivePerms[key];
            if (perm) {
              menuAccessInput[key] = Boolean(perm.read || perm.create || perm.update || perm.delete);
            }
          }
        }
        const normalized = this.defaultMenuAccess(menuAccessInput);
        updateData.menuAccess = {
          upsert: {
            create: normalized,
            update: normalized,
          },
        };
      }

      const record = await prisma.role.update({
        where: { id },
        data: updateData,
        include: {
          menuAccess: true,
          _count: {
            select: { users: true },
          },
        },
      });

      return this.mapToDomain(record);
    } catch (error) {
      console.error(`❌ [PrismaRoleRepository] Gagal mengupdate role ID (${id}):`, error);
      throw new InternalServerError('Gagal memperbarui data role.');
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`❌ [PrismaRoleRepository] Gagal menghapus role ID (${id}):`, error);
      throw new InternalServerError('Gagal menghapus data role.');
    }
  }

  public async countUsers(roleId: string): Promise<number> {
    try {
      const count = await prisma.user.count({
        where: { roleId },
      });
      return count;
    } catch (error) {
      console.error(`❌ [PrismaRoleRepository] Gagal menghitung user role (${roleId}):`, error);
      return 0;
    }
  }
}

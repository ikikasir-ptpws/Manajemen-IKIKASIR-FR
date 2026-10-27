import { IRoleRepository } from '../../domain/interfaces/IRoleRepository.js';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto, MenuItemCatalog } from '../dtos/role.dto.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../domain/errors/AppError.js';
import { MenuAccessProps } from '../../domain/entities/Role.js';

export const MENU_CATALOG: MenuItemCatalog[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    section: 'Utama',
    route: '/',
    description: 'Ringkasan performa dan metrik transaksi keseluruhan',
  },
  {
    key: 'manajemenPengguna',
    label: 'Manajemen Pengguna',
    section: 'MANAJEMEN',
    route: '/manajemen-pengguna',
    description: 'Pengelolaan data pengguna sistem, status aktif, dan password',
  },
  {
    key: 'manajemenRole',
    label: 'Manajemen Role',
    section: 'MANAJEMEN',
    route: '/manajemen-role',
    description: 'Atur nama role, deskripsi, dan switch boolean izin akses menu',
  },
  {
    key: 'manajemenPromo',
    label: 'Manajemen Promo',
    section: 'MANAJEMEN',
    route: '/manajemen-promo',
    description: 'Kelola voucher diskon, promo harga, dan kupon transaksi',
  },
  {
    key: 'kelolaPaket',
    label: 'Kelola Paket',
    section: 'MANAJEMEN',
    route: '/kelola-paket',
    description: 'Pengaturan paket langganan fitur aplikasi kasir',
  },
  {
    key: 'calonClient',
    label: 'Calon Client (Tambah Client)',
    section: 'CRM CLIENT',
    route: '/calon-client',
    description: 'Halaman tambah client prospek dan tindak lanjut penawaran sales',
  },
  {
    key: 'semuaPelanggan',
    label: 'Semua Pelanggan',
    section: 'DATA PELANGGAN',
    route: '/semua-pelanggan',
    description: 'Daftar semua klien dan pelanggan yang terdaftar',
  },
  {
    key: 'langganan',
    label: 'Langganan',
    section: 'DATA PELANGGAN',
    route: '/langganan',
    description: 'Monitoring masa aktif dan tagihan langganan klien',
  },
  {
    key: 'expired',
    label: 'Expired',
    section: 'DATA PELANGGAN',
    route: '/expired',
    description: 'Daftar klien yang masa langganannya telah habis',
  },
  {
    key: 'arusKas',
    label: 'Arus Kas',
    section: 'LAPORAN PENJUALAN',
    route: '/arus-kas',
    description: 'Laporan arus kas kasir dan rekapitulasi keuangan',
  },
  {
    key: 'labaRugi',
    label: 'Laba Rugi',
    section: 'LAPORAN PENJUALAN',
    route: '/laba-rugi',
    description: 'Kalkulasi laba kotor, beban operasional, dan laba bersih',
  },
  {
    key: 'neraca',
    label: 'Neraca',
    section: 'LAPORAN PENJUALAN',
    route: '/neraca',
    description: 'Laporan neraca keuangan aset, kewajiban, dan ekuitas',
  },
  {
    key: 'laporanPenjualan',
    label: 'Laporan Penjualan',
    section: 'LAPORAN PENJUALAN',
    route: '/laporan-harian',
    description: 'Laporan riwayat transaksi penjualan harian kasir',
  },
  {
    key: 'landingPage',
    label: 'Landing Page',
    section: 'LANDING PAGE',
    route: '/landing',
    description: 'Akses ke halaman depan publik profil IKIKASIR',
  },
];

/**
 * Use Case: Mengambil daftar semua role hak akses
 */
export class GetRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(query?: string): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.findAll(query);
    return roles.map((r) => r.toJSON());
  }
}

/**
 * Use Case: Mengambil detail satu role berdasarkan ID
 */
export class GetRoleByIdUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError(`Role dengan ID '${id}' tidak ditemukan.`);
    }
    return role.toJSON();
  }
}

/**
 * Use Case: Membuat role baru
 */
export class CreateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestError('Nama role wajib diisi.');
    }

    // Cek duplikasi nama role
    const existing = await this.roleRepository.findByName(trimmedName);
    if (existing) {
      throw new ConflictError(`Role dengan nama '${trimmedName}' sudah terdaftar.`);
    }

    const created = await this.roleRepository.create({
      name: trimmedName,
      description: dto.description,
      menuAccess: dto.menuAccess,
      permissions: dto.permissions,
    });

    return created.toJSON();
  }
}

/**
 * Use Case: Memperbarui data role dan switch akses menu
 */
export class UpdateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError(`Role dengan ID '${id}' tidak ditemukan.`);
    }

    if (dto.name && dto.name.trim() !== '') {
      const trimmedName = dto.name.trim();
      const existing = await this.roleRepository.findByName(trimmedName);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Role dengan nama '${trimmedName}' sudah digunakan oleh role lain.`);
      }
    }

    const updated = await this.roleRepository.update(id, {
      name: dto.name,
      description: dto.description,
      menuAccess: dto.menuAccess,
      permissions: dto.permissions,
    });
    return updated.toJSON();
  }
}

/**
 * Use Case: Menghapus role
 */
export class DeleteRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  public async execute(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError(`Role dengan ID '${id}' tidak ditemukan.`);
    }

    // Larang menghapus role Super Admin utama
    const normalizedName = role.name.toUpperCase().replace(/\s+/g, '');
    if (normalizedName === 'SUPERADMIN') {
      throw new BadRequestError('Role Super Admin merupakan role sistem inti dan tidak dapat dihapus.');
    }

    // Periksa apakah role masih digunakan oleh pengguna aktif
    const userCount = await this.roleRepository.countUsers(id);
    if (userCount > 0) {
      throw new BadRequestError(
        `Role '${role.name}' tidak dapat dihapus karena masih digunakan oleh ${userCount} pengguna.`
      );
    }

    await this.roleRepository.delete(id);
  }
}

/**
 * Use Case: Mengambil daftar master menu untuk pembuatan switch form di frontend
 */
export class GetMenuCatalogUseCase {
  public execute(): MenuItemCatalog[] {
    return MENU_CATALOG;
  }
}

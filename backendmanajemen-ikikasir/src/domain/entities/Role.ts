export interface MenuAccessProps {
  dashboard: boolean;
  manajemenPengguna: boolean;
  manajemenRole: boolean;
  manajemenPromo: boolean;
  kelolaPaket: boolean;
  calonClient: boolean; // Halaman tambah client / calon client CRM
  semuaPelanggan: boolean;
  langganan: boolean;
  expired: boolean;
  arusKas: boolean;
  labaRugi: boolean;
  neraca: boolean;
  laporanPenjualan: boolean;
  landingPage: boolean;
}

export interface MenuCrudPermission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type RolePermissions = Record<keyof MenuAccessProps | string, MenuCrudPermission>;

export interface RoleProps {
  id: string;
  name: string;
  description?: string | null;
  menuAccess?: MenuAccessProps;
  permissions?: RolePermissions;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Entity: Role
 * Merepresentasikan role hak akses pengguna beserta switch boolean akses menu & izin aksi CRUD
 */
export class Role {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly menuAccess?: MenuAccessProps;
  public readonly permissions: RolePermissions;
  public readonly userCount: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public static defaultMenuKeys: (keyof MenuAccessProps)[] = [
    'dashboard',
    'manajemenPengguna',
    'manajemenRole',
    'manajemenPromo',
    'kelolaPaket',
    'calonClient',
    'semuaPelanggan',
    'langganan',
    'expired',
    'arusKas',
    'labaRugi',
    'neraca',
    'laporanPenjualan',
    'landingPage',
  ];

  constructor(props: RoleProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.menuAccess = props.menuAccess;
    this.permissions = props.permissions ?? Role.generateDefaultPermissions(props.menuAccess);
    this.userCount = props.userCount ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static generateDefaultPermissions(menuAccess?: Partial<MenuAccessProps> | null): RolePermissions {
    const permissions: RolePermissions = {};
    for (const key of Role.defaultMenuKeys) {
      const isEnabled = Boolean(menuAccess?.[key]);
      permissions[key] = {
        create: isEnabled,
        read: isEnabled,
        update: isEnabled,
        delete: isEnabled,
      };
    }
    return permissions;
  }

  /**
   * Mengembalikan representasi JSON aman
   */
  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      menuAccess: this.menuAccess ?? {
        dashboard: false,
        manajemenPengguna: false,
        manajemenRole: false,
        manajemenPromo: false,
        kelolaPaket: false,
        calonClient: false,
        semuaPelanggan: false,
        langganan: false,
        expired: false,
        arusKas: false,
        labaRugi: false,
        neraca: false,
        laporanPenjualan: false,
        landingPage: false,
      },
      permissions: this.permissions,
      userCount: this.userCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}


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

export interface RoleProps {
  id: string;
  name: string;
  description?: string | null;
  menuAccess?: MenuAccessProps;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Entity: Role
 * Merepresentasikan role hak akses pengguna beserta switch boolean akses menu
 */
export class Role {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly menuAccess?: MenuAccessProps;
  public readonly userCount: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: RoleProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.menuAccess = props.menuAccess;
    this.userCount = props.userCount ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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
      userCount: this.userCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

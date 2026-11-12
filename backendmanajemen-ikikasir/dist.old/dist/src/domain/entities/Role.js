/**
 * Domain Entity: Role
 * Merepresentasikan role hak akses pengguna beserta switch boolean akses menu & izin aksi CRUD
 */
export class Role {
    id;
    name;
    description;
    menuAccess;
    permissions;
    userCount;
    createdAt;
    updatedAt;
    static defaultMenuKeys = [
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
        'penarikanReferral',
    ];
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description ?? null;
        this.menuAccess = props.menuAccess;
        this.permissions = props.permissions ?? Role.generateDefaultPermissions(props.menuAccess);
        this.userCount = props.userCount ?? 0;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    static generateDefaultPermissions(menuAccess) {
        const permissions = {};
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
    toJSON() {
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
                penarikanReferral: false,
            },
            permissions: this.permissions,
            userCount: this.userCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
//# sourceMappingURL=Role.js.map
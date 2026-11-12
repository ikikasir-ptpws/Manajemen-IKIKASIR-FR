import { UserRole } from '../enums/Role.js';
/**
 * Domain Entity: User
 * Merepresentasikan model User inti bisnis tanpa ketergantungan pada ORM/framework
 */
export class User {
    id;
    name;
    email;
    password;
    role;
    roleId;
    roleDetail;
    phone;
    isActive;
    lastLogin;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.password = props.password;
        this.role = props.role;
        this.roleId = props.roleId ?? null;
        this.roleDetail = props.roleDetail ?? null;
        this.phone = props.phone ?? null;
        this.isActive = props.isActive;
        this.lastLogin = props.lastLogin ?? null;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    /**
     * Helper status string untuk form frontend ('Active' | 'Inactive')
     */
    get status() {
        return this.isActive ? 'Active' : 'Inactive';
    }
    /**
     * Cek apakah user memiliki role Super Admin
     */
    isSuperAdmin() {
        const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
        return normalized === UserRole.SUPERADMIN || normalized === 'SUPERADMIN';
    }
    /**
     * Cek apakah user memiliki role Sales
     */
    isSales() {
        const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
        return (normalized === UserRole.SALES ||
            normalized === 'SALES' ||
            normalized === 'SELES');
    }
    /**
     * Cek apakah user memiliki role Finance
     */
    isFinance() {
        const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
        return (normalized === UserRole.FINANCE ||
            normalized === 'FINANCE' ||
            normalized === 'KEUANGAN');
    }
    /**
     * Cek apakah user memiliki role Teknisi
     */
    isTeknisi() {
        const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
        return (normalized === UserRole.TEKNISI ||
            normalized === 'TEKNISI' ||
            normalized === 'TECHNICIAN');
    }
    /**
     * Mengembalikan representasi user yang aman (tanpa password hash)
     * untuk dikirimkan kembali ke client response
     */
    toSafeUser() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            roleId: this.roleId,
            roleDetail: this.roleDetail ? this.roleDetail.toJSON() : undefined,
            status: this.status,
            phone: this.phone,
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
//# sourceMappingURL=User.js.map
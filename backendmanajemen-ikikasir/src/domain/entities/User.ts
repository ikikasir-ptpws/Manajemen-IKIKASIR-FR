import { UserRole } from '../enums/Role.js';
import { Role } from './Role.js';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  roleId?: string | null;
  roleDetail?: Role | null;
  phone?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUserProps {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string | null;
  roleDetail?: any;
  status: 'Active' | 'Inactive';
  phone?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Entity: User
 * Merepresentasikan model User inti bisnis tanpa ketergantungan pada ORM/framework
 */
export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly password: string;
  public readonly role: string;
  public readonly roleId?: string | null;
  public readonly roleDetail?: Role | null;
  public readonly phone?: string | null;
  public readonly isActive: boolean;
  public readonly lastLogin?: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserProps) {
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
  public get status(): 'Active' | 'Inactive' {
    return this.isActive ? 'Active' : 'Inactive';
  }

  /**
   * Cek apakah user memiliki role Super Admin
   */
  public isSuperAdmin(): boolean {
    const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
    return normalized === UserRole.SUPERADMIN || normalized === 'SUPERADMIN';
  }

  /**
   * Cek apakah user memiliki role Sales
   */
  public isSales(): boolean {
    const normalized = (this.role || '').toUpperCase().replace(/\s+/g, '');
    return (
      normalized === UserRole.SALES ||
      normalized === 'SALES' ||
      normalized === 'SELES'
    );
  }

  /**
   * Mengembalikan representasi user yang aman (tanpa password hash)
   * untuk dikirimkan kembali ke client response
   */
  public toSafeUser(): SafeUserProps {
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

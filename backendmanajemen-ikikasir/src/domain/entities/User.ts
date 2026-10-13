import { UserRole } from '../enums/Role.js';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
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
  role: UserRole;
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
  public readonly role: UserRole;
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
    this.phone = props.phone;
    this.isActive = props.isActive;
    this.lastLogin = props.lastLogin;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Cek apakah user memiliki role Super Admin
   */
  public isSuperAdmin(): boolean {
    return this.role === UserRole.SUPERADMIN;
  }

  /**
   * Cek apakah user memiliki role Sales
   */
  public isSales(): boolean {
    return this.role === UserRole.SALES;
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
      phone: this.phone,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

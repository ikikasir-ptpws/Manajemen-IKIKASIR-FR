/**
 * Definisi Role Pengguna dalam Sistem Manajemen IKIKASIR
 * Sesuai dengan Enum Role pada skema database PostgreSQL
 */
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  SALES = 'SALES',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  KASIR = 'KASIR',
}

/**
 * Type helper untuk validasi dan pengetikan role
 */
export type RoleType = keyof typeof UserRole;

/**
 * Definisi Role Pengguna dalam Sistem Manajemen IKIKASIR
 * Sesuai dengan Enum Role pada skema database PostgreSQL
 */
export var UserRole;
(function (UserRole) {
    UserRole["SUPERADMIN"] = "SUPERADMIN";
    UserRole["SALES"] = "SALES";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["STAFF"] = "STAFF";
    UserRole["KASIR"] = "KASIR";
    UserRole["FINANCE"] = "FINANCE";
    UserRole["TEKNISI"] = "TEKNISI";
})(UserRole || (UserRole = {}));
//# sourceMappingURL=Role.js.map
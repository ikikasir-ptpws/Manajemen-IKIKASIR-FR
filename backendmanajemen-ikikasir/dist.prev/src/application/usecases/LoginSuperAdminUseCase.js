import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError.js';
/**
 * Use Case: Login Khusus Super Admin
 * Mengelola aturan bisnis proses autentikasi untuk level hak akses Super Admin
 */
export class LoginSuperAdminUseCase {
    userRepository;
    passwordService;
    tokenService;
    constructor(userRepository, passwordService, tokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }
    /**
     * Eksekusi alur login Super Admin
     * Dilengkapi try-catch dan keterangan detail untuk setiap kondisi error bisnis
     */
    async execute(input) {
        try {
            const { email, password } = input;
            // 1. Cari data user di database berdasarkan email
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                // Penjelasan: Pengguna tidak ditemukan, kembalikan pesan generik demi keamanan (mencegah user enumeration)
                throw new UnauthorizedError('Alamat email atau kata sandi tidak valid.');
            }
            // 2. Verifikasi kecocokan kata sandi menggunakan hashing service
            const isPasswordValid = await this.passwordService.compare(password, user.password);
            if (!isPasswordValid) {
                // Penjelasan: Kata sandi yang dimasukkan salah
                throw new UnauthorizedError('Alamat email atau kata sandi tidak valid.');
            }
            // 3. Validasi status akun (harus aktif)
            if (!user.isActive) {
                // Penjelasan: Akun dinonaktifkan oleh manajemen sistem
                throw new ForbiddenError('Akun Anda sedang dinonaktifkan. Silakan hubungi tim dukungan IKIKASIR.');
            }
            // 4. Validasi hak akses khusus: Harus memiliki role SUPERADMIN
            if (!user.isSuperAdmin()) {
                // Penjelasan: User memiliki kredensial valid tetapi rolenya bukan Super Admin (misal: akun Sales mencoba masuk ke portal Super Admin)
                throw new ForbiddenError(`Akses ditolak: Akun ini terdaftar sebagai role '${user.role}', bukan sebagai Super Admin.`);
            }
            // 5. Update status timestamp login terakhir secara asynchronous
            await this.userRepository.updateLastLogin(user.id);
            // 6. Buat JSON Web Token (JWT) dengan payload identitas user
            const token = this.tokenService.generateToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            });
            // 7. Kembalikan token autentikasi beserta data profil user yang aman (tanpa password hash)
            return {
                token,
                user: user.toSafeUser(),
            };
        }
        catch (error) {
            // Meneruskan error domain/app error yang sudah memiliki kode status dan keterangan
            throw error;
        }
    }
}
//# sourceMappingURL=LoginSuperAdminUseCase.js.map
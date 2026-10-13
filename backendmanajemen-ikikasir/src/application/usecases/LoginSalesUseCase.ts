import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { IPasswordService } from '../../domain/interfaces/IPasswordService.js';
import { ITokenService } from '../../domain/interfaces/ITokenService.js';
import { UserRole } from '../../domain/enums/Role.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError.js';
import { LoginInputDto, AuthResponseDto } from '../dtos/auth.dto.js';

/**
 * Use Case: Login Khusus Sales (Seles)
 * Mengelola aturan bisnis proses autentikasi untuk level hak akses Sales
 */
export class LoginSalesUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Eksekusi alur login Sales
   * Dilengkapi try-catch dan keterangan detail untuk setiap kondisi error bisnis
   */
  public async execute(input: LoginInputDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = input;

      // 1. Cari data user di database berdasarkan email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Penjelasan: Pengguna tidak ditemukan, kembalikan pesan generik demi keamanan
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
        throw new ForbiddenError('Akun Sales Anda sedang dinonaktifkan. Silakan hubungi Super Admin.');
      }

      // 4. Validasi hak akses khusus: Harus memiliki role SALES
      if (user.role !== UserRole.SALES) {
        // Penjelasan: User memiliki kredensial valid tetapi rolenya bukan Sales (misal: kasir atau staff)
        throw new ForbiddenError(
          `Akses ditolak: Akun ini terdaftar sebagai role '${user.role}', bukan sebagai Sales.`
        );
      }

      // 5. Update status timestamp login terakhir secara asynchronous
      await this.userRepository.updateLastLogin(user.id);

      // 6. Buat JSON Web Token (JWT) dengan payload identitas sales
      const token = this.tokenService.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // 7. Kembalikan token autentikasi beserta data profil sales yang aman
      return {
        token,
        user: user.toSafeUser(),
      };
    } catch (error) {
      // Meneruskan error domain/app error yang sudah memiliki kode status dan keterangan
      throw error;
    }
  }
}

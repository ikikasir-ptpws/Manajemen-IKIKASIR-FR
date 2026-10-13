import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { IPasswordService } from '../../domain/interfaces/IPasswordService.js';
import { ITokenService } from '../../domain/interfaces/ITokenService.js';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError.js';
import { LoginInputDto, AuthResponseDto } from '../dtos/auth.dto.js';

/**
 * Use Case: Login Umum (Mendukung Super Admin, Sales, dll secara otomatis)
 * Mengautentikasi pengguna berdasarkan email dan password lalu mengembalikan token beserta rolenya
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(input: LoginInputDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = input;

      // 1. Cari user berdasarkan email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Alamat email atau kata sandi tidak valid.');
      }

      // 2. Verifikasi kata sandi
      const isPasswordValid = await this.passwordService.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Alamat email atau kata sandi tidak valid.');
      }

      // 3. Cek status keaktifan akun
      if (!user.isActive) {
        throw new ForbiddenError('Akun Anda saat ini tidak aktif. Silakan hubungi administrator.');
      }

      // 4. Update waktu login terakhir
      await this.userRepository.updateLastLogin(user.id);

      // 5. Generate token JWT
      const token = this.tokenService.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return {
        token,
        user: user.toSafeUser(),
      };
    } catch (error) {
      throw error;
    }
  }
}

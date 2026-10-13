import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors/AppError.js';
import { SafeUserProps } from '../../domain/entities/User.js';

/**
 * Use Case: Mendapatkan data profil akun yang sedang login (Get Current User / Me)
 */
export class GetMeUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string): Promise<SafeUserProps> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('Data pengguna tidak ditemukan di dalam sistem.');
      }

      if (!user.isActive) {
        throw new ForbiddenError('Akun Anda dinonaktifkan.');
      }

      return user.toSafeUser();
    } catch (error) {
      throw error;
    }
  }
}

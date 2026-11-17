import { NotFoundError, ForbiddenError } from '../../domain/errors/AppError.js';
/**
 * Use Case: Mendapatkan data profil akun yang sedang login (Get Current User / Me)
 */
export class GetMeUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new NotFoundError('Data pengguna tidak ditemukan di dalam sistem.');
            }
            if (!user.isActive) {
                throw new ForbiddenError('Akun Anda dinonaktifkan.');
            }
            return user.toSafeUser();
        }
        catch (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=GetMeUseCase.js.map
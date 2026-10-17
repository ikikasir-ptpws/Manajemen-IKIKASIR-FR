import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { IPasswordService } from '../../domain/interfaces/IPasswordService.js';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from '../dtos/user.dto.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../domain/errors/AppError.js';

/**
 * Use Case: Mengambil daftar pengguna sistem dengan filter dan pencarian
 */
export class GetUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(query?: UserQueryDto): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll({
      search: query?.search,
      role: query?.role,
      status: query?.status,
    });

    return users.map((u) => u.toSafeUser());
  }
}

/**
 * Use Case: Mengambil detail satu pengguna berdasarkan ID
 */
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }
    return user.toSafeUser();
  }
}

/**
 * Use Case: Menambahkan pengguna baru sesuai dengan form frontend
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService
  ) {}

  public async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const name = dto.name.trim();
    const email = dto.email.toLowerCase().trim();
    const role = dto.role.trim();

    if (!name) {
      throw new BadRequestError('Nama lengkap pengguna wajib diisi.');
    }

    if (!email) {
      throw new BadRequestError('Alamat email wajib diisi.');
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestError('Format alamat email tidak valid.');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestError('Kata sandi wajib diisi minimal 6 karakter.');
    }

    // Periksa duplikasi email
    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      throw new ConflictError(`Alamat email '${email}' sudah digunakan oleh pengguna lain.`);
    }

    // Hash kata sandi
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Tentukan status aktif (default true jika status !== 'Inactive')
    const isActive = dto.status !== 'Inactive';

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      roleId: dto.roleId,
      phone: dto.phone,
      isActive,
    });

    return user.toSafeUser();
  }
}

/**
 * Use Case: Memperbarui data pengguna yang ada
 */
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService
  ) {}

  public async execute(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const updatePayload: any = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestError('Nama lengkap tidak boleh kosong.');
      }
      updatePayload.name = trimmedName;
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (!normalizedEmail) {
        throw new BadRequestError('Alamat email tidak boleh kosong.');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new BadRequestError('Format alamat email tidak valid.');
      }

      // Cek apakah email sudah dipakai pengguna lain
      const emailExists = await this.userRepository.existsByEmail(normalizedEmail, id);
      if (emailExists) {
        throw new ConflictError(`Email '${normalizedEmail}' telah digunakan oleh akun lain.`);
      }
      updatePayload.email = normalizedEmail;
    }

    if (dto.password && dto.password.trim() !== '') {
      if (dto.password.length < 6) {
        throw new BadRequestError('Kata sandi baru minimal 6 karakter.');
      }
      updatePayload.password = await this.passwordService.hash(dto.password);
    }

    if (dto.role !== undefined) {
      updatePayload.role = dto.role.trim();
    }

    if (dto.roleId !== undefined) {
      updatePayload.roleId = dto.roleId;
    }

    if (dto.phone !== undefined) {
      updatePayload.phone = dto.phone;
    }

    if (dto.status !== undefined) {
      updatePayload.isActive = dto.status === 'Active';
    }

    const updated = await this.userRepository.update(id, updatePayload);
    return updated.toSafeUser();
  }
}

/**
 * Use Case: Mengubah status aktif/nonaktif akun secara instan
 */
export class ToggleUserStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(id: string, status?: 'Active' | 'Inactive'): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const newIsActive = status !== undefined ? status === 'Active' : !user.isActive;
    const updated = await this.userRepository.updateStatus(id, newIsActive);
    return updated.toSafeUser();
  }
}

/**
 * Use Case: Menghapus pengguna
 */
export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(id: string, currentUserId?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    // Larang menghapus diri sendiri saat login
    if (currentUserId && currentUserId === id) {
      throw new BadRequestError('Anda tidak dapat menghapus akun Anda sendiri saat sedang login.');
    }

    await this.userRepository.delete(id);
  }
}

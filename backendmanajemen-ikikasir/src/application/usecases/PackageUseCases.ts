import { IPackageRepository } from '../../domain/interfaces/IPackageRepository.js';
import {
  CreatePackageDto,
  UpdatePackageDto,
  PackageQueryDto,
  PackageResponseDto,
} from '../dtos/package.dto.js';
import { BadRequestError, NotFoundError } from '../../domain/errors/AppError.js';

function parseFeatures(features?: string[], featuresText?: string): string[] {
  if (Array.isArray(features) && features.length > 0) {
    return features.map((f) => f.trim()).filter(Boolean);
  }
  if (typeof featuresText === 'string') {
    return featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Use Case: Mengambil semua paket langganan
 */
export class GetPackagesUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(query?: PackageQueryDto): Promise<PackageResponseDto[]> {
    const packages = await this.packageRepository.findAll({
      search: query?.search,
      isActive: query?.isActive,
    });
    return packages.map((p) => p.toJSON());
  }
}

/**
 * Use Case: Mengambil detail satu paket berdasarkan ID
 */
export class GetPackageByIdUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(id: string): Promise<PackageResponseDto> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundError(`Paket dengan ID '${id}' tidak ditemukan.`);
    }
    return pkg.toJSON();
  }
}

/**
 * Use Case: Membuat paket langganan baru (hanya data penting)
 */
export class CreatePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(dto: CreatePackageDto): Promise<PackageResponseDto> {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestError('Nama paket wajib diisi.');
    }

    const description = (dto.description ?? dto.cardSub ?? '').trim();
    const features = parseFeatures(dto.features, dto.featuresText);
    const isConsultation = Boolean(dto.isConsultation);
    const price = isConsultation ? 0 : (typeof dto.price === 'number' ? dto.price : 0);
    const period = isConsultation ? '' : (dto.period || '/bulan');

    const created = await this.packageRepository.create({
      name,
      description,
      price,
      period,
      isConsultation,
      features,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return created.toJSON();
  }
}

/**
 * Use Case: Memperbarui paket langganan
 */
export class UpdatePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(id: string, dto: UpdatePackageDto): Promise<PackageResponseDto> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundError(`Paket dengan ID '${id}' tidak ditemukan.`);
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestError('Nama paket tidak boleh kosong.');
      }
      updateData.name = trimmed;
    }

    if (dto.description !== undefined || dto.cardSub !== undefined) {
      updateData.description = (dto.description ?? dto.cardSub ?? '').trim();
    }

    if (dto.isConsultation !== undefined) {
      updateData.isConsultation = Boolean(dto.isConsultation);
      if (updateData.isConsultation) {
        updateData.price = 0;
        updateData.period = '';
      }
    }

    if (dto.price !== undefined && !updateData.isConsultation) {
      updateData.price = typeof dto.price === 'number' ? dto.price : 0;
    }

    if (dto.period !== undefined && !updateData.isConsultation) {
      updateData.period = dto.period;
    }

    if (dto.features !== undefined || dto.featuresText !== undefined) {
      updateData.features = parseFeatures(dto.features, dto.featuresText);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const updated = await this.packageRepository.update(id, updateData);
    return updated.toJSON();
  }
}

/**
 * Use Case: Toggle status aktif/nonaktif paket
 */
export class TogglePackageStatusUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(id: string, isActive?: boolean): Promise<PackageResponseDto> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundError(`Paket dengan ID '${id}' tidak ditemukan.`);
    }

    const nextStatus = isActive !== undefined ? isActive : !pkg.isActive;
    const updated = await this.packageRepository.updateStatus(id, nextStatus);
    return updated.toJSON();
  }
}

/**
 * Use Case: Menghapus paket langganan
 */
export class DeletePackageUseCase {
  constructor(private readonly packageRepository: IPackageRepository) {}

  public async execute(id: string): Promise<void> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundError(`Paket dengan ID '${id}' tidak ditemukan.`);
    }

    await this.packageRepository.delete(id);
  }
}

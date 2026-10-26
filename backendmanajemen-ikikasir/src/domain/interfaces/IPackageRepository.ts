import { Package } from '../entities/Package.js';

export interface CreatePackageData {
  name: string;
  description?: string | null;
  price?: number;
  period?: string;
  periodType?: string;
  startDate?: string | null;
  endDate?: string | null;
  isConsultation?: boolean;
  features?: string[];
  isActive?: boolean;
}

export interface UpdatePackageData {
  name?: string;
  description?: string | null;
  price?: number;
  period?: string;
  periodType?: string;
  startDate?: string | null;
  endDate?: string | null;
  isConsultation?: boolean;
  features?: string[];
  isActive?: boolean;
}

export interface PackageFilter {
  search?: string;
  isActive?: boolean;
}

export interface IPackageRepository {
  findAll(filter?: PackageFilter): Promise<Package[]>;
  findById(id: string): Promise<Package | null>;
  create(data: CreatePackageData): Promise<Package>;
  update(id: string, data: UpdatePackageData): Promise<Package>;
  updateStatus(id: string, isActive: boolean): Promise<Package>;
  delete(id: string): Promise<void>;
}

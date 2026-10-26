export interface CreatePackageDto {
  name: string;
  description?: string;
  cardSub?: string; // Alias untuk deskripsi
  price?: number;
  period?: string;
  periodType?: 'bulanan' | 'tahunan' | 'custom' | string;
  startDate?: string | null;
  endDate?: string | null;
  isConsultation?: boolean;
  features?: string[];
  featuresText?: string;
  isActive?: boolean;
}

export interface UpdatePackageDto {
  name?: string;
  description?: string;
  cardSub?: string; // Alias untuk deskripsi
  price?: number;
  period?: string;
  periodType?: 'bulanan' | 'tahunan' | 'custom' | string;
  startDate?: string | null;
  endDate?: string | null;
  isConsultation?: boolean;
  features?: string[];
  featuresText?: string;
  isActive?: boolean;
}

export interface PackageQueryDto {
  search?: string;
  isActive?: boolean;
}

export interface PackageResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  periodType?: string;
  startDate?: string | null;
  endDate?: string | null;
  durationMonths?: number;
  isConsultation: boolean;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

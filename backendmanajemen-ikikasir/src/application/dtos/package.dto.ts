export interface CreatePackageDto {
  name: string;
  description?: string;
  cardSub?: string; // Alias untuk deskripsi
  price?: number;
  period?: string;
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
  isConsultation: boolean;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

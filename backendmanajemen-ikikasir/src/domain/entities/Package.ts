export interface PackageProps {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  period?: string;
  isConsultation?: boolean;
  features?: string[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Entity: Package (Kelola Paket Langganan)
 * Menyimpan data inti paket langganan yang esensial
 */
export class Package {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly price: number;
  public readonly period: string;
  public readonly isConsultation: boolean;
  public readonly features: string[];
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PackageProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? '';
    this.price = props.price ?? 0;
    this.period = props.period ?? '/bulan';
    this.isConsultation = Boolean(props.isConsultation);
    this.features = props.features ?? [];
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      period: this.period,
      isConsultation: this.isConsultation,
      features: this.features,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

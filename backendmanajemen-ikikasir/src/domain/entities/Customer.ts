export interface CustomerProps {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  packagePrice?: number | null;
  packagePeriod?: string | null;
  status: string; // ACTIVE, EXPIRED, SUSPENDED
  startedAt: Date;
  expiresAt: Date;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  public readonly id: string;
  public readonly name: string;
  public readonly businessName: string;
  public readonly email: string;
  public readonly phone: string;
  public readonly address: string;
  public readonly packageId: string | null;
  public readonly packageName: string;
  public readonly packagePrice: number;
  public readonly packagePeriod: string;
  public readonly status: string;
  public readonly startedAt: Date;
  public readonly expiresAt: Date;
  public readonly notes: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: CustomerProps) {
    this.id = props.id;
    this.name = props.name;
    this.businessName = props.businessName;
    this.email = props.email.toLowerCase().trim();
    this.phone = props.phone.trim();
    this.address = props.address ?? '';
    this.packageId = props.packageId ?? null;
    this.packageName = props.packageName ?? 'Custom';
    this.packagePrice = props.packagePrice ?? 0;
    this.packagePeriod = props.packagePeriod ?? '/bulan';
    this.status = props.status;
    this.startedAt = props.startedAt;
    this.expiresAt = props.expiresAt;
    this.notes = props.notes ?? '';
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Menghitung apakah masa aktif langganan sudah kedaluwarsa berdasarkan waktu saat ini
   */
  public isExpired(now: Date = new Date()): boolean {
    if (this.status === 'EXPIRED') return true;
    return now.getTime() > this.expiresAt.getTime();
  }

  /**
   * Menghitung sisa hari aktif
   */
  public getDaysRemaining(now: Date = new Date()): number {
    const diffMs = this.expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Menghitung berapa hari telah kedaluwarsa jika sudah expired
   */
  public getDaysExpired(now: Date = new Date()): number {
    const diffMs = now.getTime() - this.expiresAt.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Status kalkulasi dinamis (ACTIVE, EXPIRED, atau SUSPENDED)
   */
  public getComputedStatus(now: Date = new Date()): 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' {
    if (this.status === 'SUSPENDED') return 'SUSPENDED';
    return this.isExpired(now) ? 'EXPIRED' : 'ACTIVE';
  }

  /**
   * Validasi apakah pelanggan diizinkan mengakses dan login di aplikasi Android
   */
  public canAccessApp(now: Date = new Date()): boolean {
    return this.getComputedStatus(now) === 'ACTIVE';
  }

  public toJSON() {
    const now = new Date();
    const computedStatus = this.getComputedStatus(now);
    const daysRemaining = this.getDaysRemaining(now);
    const daysExpired = this.getDaysExpired(now);
    const canAccess = this.canAccessApp(now);

    return {
      id: this.id,
      name: this.name,
      businessName: this.businessName,
      email: this.email,
      phone: this.phone,
      address: this.address,
      packageId: this.packageId,
      packageName: this.packageName,
      packagePrice: this.packagePrice,
      packagePeriod: this.packagePeriod,
      status: this.status,
      computedStatus,
      isExpired: computedStatus === 'EXPIRED',
      daysRemaining,
      daysExpired,
      canAccess,
      startedAt: this.startedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

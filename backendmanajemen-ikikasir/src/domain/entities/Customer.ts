export interface CustomerProps {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string | null;
  village?: string | null;
  district?: string | null;
  city?: string | null;
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

  // Bukti Pembayaran & Finance
  paymentProofUrl?: string | null;
  paymentMethod?: string | null;
  paymentAmount?: number | null;
  paymentDate?: Date | null;
  paymentStatus?: string | null;

  // Akun Kasir & Status Teknisi
  appUsername?: string | null;
  appPassword?: string | null;
  technicianStatus?: string | null;

  // Referral (Kode Referal & Upline)
  referralCode?: string | null;
  referredByCustomerId?: string | null;
  referredByCustomerName?: string | null;
  referredByBusinessName?: string | null;
  referralBoundAt?: Date | null;
  referralSource?: string | null;
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

  public readonly paymentProofUrl: string;
  public readonly paymentMethod: string;
  public readonly paymentAmount: number;
  public readonly paymentDate: Date | null;
  public readonly paymentStatus: string;
  public readonly appUsername: string;
  public readonly appPassword: string;
  public readonly technicianStatus: string;

  public readonly village: string;
  public readonly district: string;
  public readonly city: string;

  public readonly referralCode: string;
  public readonly referredByCustomerId: string | null;
  public readonly referredByCustomerName: string;
  public readonly referredByBusinessName: string;
  public readonly referralBoundAt: Date | null;
  public readonly referralSource: string;

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

    this.paymentProofUrl = props.paymentProofUrl ?? '';
    this.paymentMethod = props.paymentMethod ?? 'QRIS';
    this.paymentAmount = props.paymentAmount ?? props.packagePrice ?? 0;
    this.paymentDate = props.paymentDate ?? props.startedAt;
    this.paymentStatus = props.paymentStatus ?? 'PAID';
    this.appUsername = props.appUsername ?? '';
    this.appPassword = props.appPassword ?? '';
    this.technicianStatus = props.technicianStatus ?? 'completed';

    this.village = props.village ?? '';
    this.district = props.district ?? '';
    this.city = props.city ?? '';

    this.referralCode = props.referralCode ?? '';
    this.referredByCustomerId = props.referredByCustomerId ?? null;
    this.referredByCustomerName = props.referredByCustomerName ?? '';
    this.referredByBusinessName = props.referredByBusinessName ?? '';
    this.referralBoundAt = props.referralBoundAt ?? null;
    this.referralSource = props.referralSource ?? '';
  }

  /**
   * Alamat lengkap gabungan (jalan, desa/kelurahan, kecamatan, kabupaten/kota)
   */
  public getFullAddress(): string {
    return [this.address, this.village, this.district, this.city]
      .map((part) => (part || '').trim())
      .filter((part) => part.length > 0)
      .join(', ');
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
      village: this.village,
      district: this.district,
      city: this.city,
      fullAddress: this.getFullAddress(),
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
      paymentProofUrl: this.paymentProofUrl,
      paymentMethod: this.paymentMethod,
      paymentAmount: this.paymentAmount,
      paymentDate: this.paymentDate ? this.paymentDate.toISOString() : null,
      paymentStatus: this.paymentStatus,
      appUsername: this.appUsername,
      appPassword: this.appPassword,
      technicianStatus: this.technicianStatus,
      referralCode: this.referralCode,
      referredByCustomerId: this.referredByCustomerId,
      referredByCustomerName: this.referredByCustomerName,
      referredByBusinessName: this.referredByBusinessName,
      referralBoundAt: this.referralBoundAt ? this.referralBoundAt.toISOString() : null,
      referralSource: this.referralSource,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

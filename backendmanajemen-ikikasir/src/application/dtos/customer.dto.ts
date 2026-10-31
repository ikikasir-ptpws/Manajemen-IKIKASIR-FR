export interface CreateCustomerDto {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string;
  village?: string;
  district?: string;
  city?: string;
  packageId?: string;
  billingCycleMonths?: number;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentProofUrl?: string;
  paymentDate?: string | Date;
  paymentStatus?: string;
  appUsername?: string;
  appPassword?: string;
  technicianStatus?: string;
  notes?: string;
  /** Kode referral yang dipakai client (halaman Tambah Client, sumber = Referral) */
  referralCode?: string;
  /** Sumber pendaftaran client: Manual, Referral, Aplikasi, Formulir Pendaftaran */
  source?: string;
  referralSource?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  village?: string;
  district?: string;
  city?: string;
  packageId?: string | null;
  notes?: string;
  paymentProofUrl?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentDate?: string | Date;
  paymentStatus?: string;
  appUsername?: string;
  appPassword?: string;
  technicianStatus?: string;
  referralCode?: string | null;
  referredByCustomerId?: string | null;
  referredByCustomerName?: string;
  referredByBusinessName?: string;
  referralBoundAt?: Date | null;
  referralSource?: string;
}

export interface RenewSubscriptionDto {
  packageId?: string;
  billingCycleMonths?: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  notes?: string;
  customAmount?: number;
}

export interface CustomerResponseDto {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  village: string;
  district: string;
  city: string;
  fullAddress: string;
  packageId: string | null;
  packageName: string;
  packagePrice: number;
  packagePeriod: string;
  status: string;
  computedStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  isExpired: boolean;
  daysRemaining: number;
  daysExpired: number;
  canAccess: boolean;
  startedAt: string;
  expiresAt: string;
  notes: string;
  paymentProofUrl: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentDate: string | null;
  paymentStatus: string;
  appUsername: string;
  appPassword: string;
  technicianStatus: string;
  referralCode: string;
  referredByCustomerId: string | null;
  referredByCustomerName: string;
  referredByBusinessName: string;
  referralBoundAt: string | null;
  referralSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionCheckResponseDto {
  isActive: boolean;
  canAccess: boolean;
  canUseCashier: boolean; // Alias untuk Android pembatasan kasir
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'NOT_FOUND';
  subscriptionStatus: 'active' | 'expired' | 'suspended' | 'not_found';
  isExpired: boolean;
  customerName?: string;
  businessName?: string;
  email?: string;
  packageId?: string | null;
  packageName?: string;
  packagePeriod?: string;
  packageDurationMonths?: number;
  features?: string[];
  startedAt?: string;
  expiresAt?: string;
  daysRemaining?: number;
  daysExpired?: number;
  contactAdminUrl?: string;
  restriction?: {
    isRestricted: boolean;
    reason: 'EXPIRED' | 'SUSPENDED' | 'NOT_FOUND' | null;
    title: string | null;
    message: string | null;
  };
  plan?: {
    name: string;
    period: string;
    durationMonths: number;
    features: string[];
  };
  customerId?: string;
  referralCode?: string;
  message: string;
  serverTime: string;
}

export interface SimulateExpiredDto {
  email: string;
  daysAgo?: number; // berapa hari yang lalu expired (default 1)
}

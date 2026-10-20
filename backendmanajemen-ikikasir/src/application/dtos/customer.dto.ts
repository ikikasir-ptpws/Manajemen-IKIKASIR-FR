export interface CreateCustomerDto {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string;
  packageId?: string;
  billingCycleMonths?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface RenewSubscriptionDto {
  packageId?: string;
  billingCycleMonths?: number;
  paymentMethod?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionCheckResponseDto {
  isActive: boolean;
  canAccess: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'NOT_FOUND';
  isExpired: boolean;
  customerName?: string;
  businessName?: string;
  email?: string;
  packageName?: string;
  expiresAt?: string;
  daysRemaining?: number;
  message: string;
  serverTime: string;
}

export interface SimulateExpiredDto {
  email: string;
  daysAgo?: number; // berapa hari yang lalu expired (default 1)
}

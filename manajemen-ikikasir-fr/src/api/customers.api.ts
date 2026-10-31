import { httpClient } from './httpClient'

export interface CustomerItem {
  id: string
  name: string
  businessName: string
  email: string
  phone: string
  address?: string
  village?: string
  district?: string
  city?: string
  fullAddress?: string
  packageId?: string | null
  packageName?: string
  packagePrice?: number
  packagePeriod?: string
  status: string
  computedStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  isExpired?: boolean
  daysRemaining?: number
  daysExpired?: number
  canAccess?: boolean
  startedAt: string
  expiresAt: string
  notes?: string
  paymentProofUrl?: string
  paymentMethod?: string
  paymentAmount?: number
  paymentDate?: string | null
  paymentStatus?: string
  appUsername?: string
  appPassword?: string
  technicianStatus?: string
  referralCode?: string
  referredByCustomerId?: string | null
  referredByCustomerName?: string
  referredByBusinessName?: string
  referralBoundAt?: string | null
  referralSource?: string
  createdAt?: string
  updatedAt?: string
}

export interface SubscriptionHistoryItem {
  id: string
  customerId: string
  packageId?: string | null
  packageName: string
  amount: number
  billingCycleMonths: number
  paymentMethod: string
  paymentStatus: string
  paymentProofUrl?: string
  notes?: string
  startedAt: string
  expiresAt: string
  createdAt?: string
  customerName?: string
  businessName?: string
  phone?: string
  email?: string
  address?: string
}

export interface CreateCustomerPayload {
  name: string
  businessName: string
  email: string
  phone: string
  address?: string
  village?: string
  district?: string
  city?: string
  packageId?: string
  billingCycleMonths?: number
  paymentMethod?: string
  paymentAmount?: number
  paymentProofUrl?: string
  paymentDate?: string
  paymentStatus?: string
  appUsername?: string
  appPassword?: string
  technicianStatus?: string
  notes?: string
  /** Kode referral yang dipakai client (sumber = Referral) */
  referralCode?: string
  /** Sumber client: Manual, Referral, Aplikasi, Formulir Pendaftaran */
  source?: string
  referralSource?: string
}

export interface UpdateCustomerPayload {
  name?: string
  businessName?: string
  email?: string
  phone?: string
  address?: string
  packageId?: string
  notes?: string
  paymentProofUrl?: string
  paymentMethod?: string
  paymentAmount?: number
  paymentDate?: string
  paymentStatus?: string
  appUsername?: string
  appPassword?: string
  technicianStatus?: string
}

export interface RenewSubscriptionPayload {
  packageId?: string
  billingCycleMonths?: number
  paymentMethod?: string
  notes?: string
}

export const customersApi = {
  getAll: (params?: { search?: string; status?: string; packageId?: string }) =>
    httpClient.get<CustomerItem[]>('/customers', params),

  getExpired: (params?: { search?: string }) =>
    httpClient.get<CustomerItem[]>('/customers/expired', params),

  getById: (id: string) =>
    httpClient.get<CustomerItem>(`/customers/${id}`),

  getHistories: (id: string) =>
    httpClient.get<SubscriptionHistoryItem[]>(`/customers/${id}/histories`),

  getAllHistories: (params?: { customerId?: string }) =>
    httpClient.get<SubscriptionHistoryItem[]>('/customers/histories', params),

  markHistoryPaid: (id: string) =>
    httpClient.patch<SubscriptionHistoryItem>(`/customers/histories/${id}/pay`),

  create: (payload: CreateCustomerPayload) =>
    httpClient.post<CustomerItem>('/customers', payload),

  update: (id: string, payload: UpdateCustomerPayload) =>
    httpClient.put<CustomerItem>(`/customers/${id}`, payload),

  renew: (id: string, payload: RenewSubscriptionPayload) =>
    httpClient.post<CustomerItem>(`/customers/${id}/renew`, payload),

  delete: (id: string) =>
    httpClient.delete(`/customers/${id}`)
}

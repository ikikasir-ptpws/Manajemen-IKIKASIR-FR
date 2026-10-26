import { httpClient } from './httpClient'

export interface CustomerItem {
  id: string
  name: string
  businessName: string
  email: string
  phone: string
  address?: string
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
  notes?: string
  startedAt: string
  expiresAt: string
  createdAt?: string
}

export interface CreateCustomerPayload {
  name: string
  businessName: string
  email: string
  phone: string
  address?: string
  packageId?: string
  billingCycleMonths?: number
  paymentMethod?: string
  notes?: string
}

export interface UpdateCustomerPayload {
  name?: string
  businessName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
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

  create: (payload: CreateCustomerPayload) =>
    httpClient.post<CustomerItem>('/customers', payload),

  update: (id: string, payload: UpdateCustomerPayload) =>
    httpClient.put<CustomerItem>(`/customers/${id}`, payload),

  renew: (id: string, payload: RenewSubscriptionPayload) =>
    httpClient.post<CustomerItem>(`/customers/${id}/renew`, payload),

  delete: (id: string) =>
    httpClient.delete(`/customers/${id}`)
}

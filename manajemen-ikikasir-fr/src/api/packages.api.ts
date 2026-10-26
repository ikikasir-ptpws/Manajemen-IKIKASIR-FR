import { httpClient } from './httpClient'

export interface PackageItem {
  id: string
  name: string
  description?: string | null
  price: number
  period: string
  isConsultation: boolean
  features: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreatePackagePayload {
  name: string
  description?: string
  price?: number
  period?: string
  isConsultation?: boolean
  features?: string[]
  isActive?: boolean
}

export interface UpdatePackagePayload {
  name?: string
  description?: string
  price?: number
  period?: string
  isConsultation?: boolean
  features?: string[]
  isActive?: boolean
}

export const packagesApi = {
  getAll: (params?: { search?: string; isActive?: boolean | string }) =>
    httpClient.get<PackageItem[]>('/packages', params),
  getById: (id: string) => httpClient.get<PackageItem>(`/packages/${id}`),
  create: (payload: CreatePackagePayload) => httpClient.post<PackageItem>('/packages', payload),
  update: (id: string, payload: UpdatePackagePayload) => httpClient.put<PackageItem>(`/packages/${id}`, payload),
  toggleStatus: (id: string) => httpClient.patch<PackageItem>(`/packages/${id}/status`),
  delete: (id: string) => httpClient.delete(`/packages/${id}`)
}

import { httpClient } from './httpClient'

export interface RoleMenuAccess {
  dashboard: boolean
  manajemenPengguna: boolean
  manajemenRole: boolean
  manajemenPromo: boolean
  kelolaPaket: boolean
  calonClient: boolean
  semuaPelanggan: boolean
  langganan: boolean
  expired: boolean
  arusKas: boolean
  labaRugi: boolean
  neraca: boolean
  laporanPenjualan: boolean
  landingPage: boolean
}

export interface RoleItem {
  id: string
  name: string
  description?: string | null
  menuAccess?: RoleMenuAccess | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  menuAccess?: Partial<RoleMenuAccess>
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  menuAccess?: Partial<RoleMenuAccess>
}

export const rolesApi = {
  getAll: () => httpClient.get<RoleItem[]>('/roles'),
  getById: (id: string) => httpClient.get<RoleItem>(`/roles/${id}`),
  create: (payload: CreateRolePayload) => httpClient.post<RoleItem>('/roles', payload),
  update: (id: string, payload: UpdateRolePayload) => httpClient.put<RoleItem>(`/roles/${id}`, payload),
  delete: (id: string) => httpClient.delete(`/roles/${id}`)
}

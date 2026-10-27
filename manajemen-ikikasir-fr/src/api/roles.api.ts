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

export interface MenuCrudPermission {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

export type RolePermissions = Record<keyof RoleMenuAccess | string, MenuCrudPermission>

export interface MenuItemCatalog {
  key: keyof RoleMenuAccess
  label: string
  section: string
  route: string
  description: string
}

export interface RoleItem {
  id: string
  name: string
  description?: string | null
  menuAccess?: RoleMenuAccess | null
  permissions?: RolePermissions | null
  userCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  menuAccess?: Partial<RoleMenuAccess>
  permissions?: RolePermissions
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  menuAccess?: Partial<RoleMenuAccess>
  permissions?: RolePermissions
}

export const rolesApi = {
  getAll: () => httpClient.get<RoleItem[]>('/roles'),
  getById: (id: string) => httpClient.get<RoleItem>(`/roles/${id}`),
  create: (payload: CreateRolePayload) => httpClient.post<RoleItem>('/roles', payload),
  update: (id: string, payload: UpdateRolePayload) => httpClient.put<RoleItem>(`/roles/${id}`, payload),
  delete: (id: string) => httpClient.delete(`/roles/${id}`),
  getMenuCatalog: () => httpClient.get<MenuItemCatalog[]>('/roles/menus/list')
}


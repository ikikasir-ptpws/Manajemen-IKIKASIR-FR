import { httpClient } from './httpClient'

export interface UserItem {
  id: string
  name: string
  email: string
  role: string
  roleId?: string | null
  phone?: string | null
  isActive: boolean
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: string
  roleId?: string
  phone?: string
  isActive?: boolean
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: string
  roleId?: string
  phone?: string
  isActive?: boolean
}

export const usersApi = {
  getAll: (params?: { search?: string; role?: string; isActive?: boolean | string }) =>
    httpClient.get<UserItem[]>('/users', params),
  getById: (id: string) => httpClient.get<UserItem>(`/users/${id}`),
  create: (payload: CreateUserPayload) => httpClient.post<UserItem>('/users', payload),
  update: (id: string, payload: UpdateUserPayload) => httpClient.put<UserItem>(`/users/${id}`, payload),
  toggleStatus: (id: string) => httpClient.patch<UserItem>(`/users/${id}/status`),
  delete: (id: string) => httpClient.delete(`/users/${id}`)
}

import { httpClient } from './httpClient'

export type NeracaGroup = 'aset_tetap' | 'kewajiban_lancar' | 'kewajiban_jangka_panjang'

export interface NeracaItemData {
  id: string
  group: NeracaGroup
  name: string
  amount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface NeracaItemGrouped {
  aset_tetap: NeracaItemData[]
  kewajiban_lancar: NeracaItemData[]
  kewajiban_jangka_panjang: NeracaItemData[]
}

export interface CreateNeracaItemPayload {
  group: NeracaGroup
  name: string
  amount: number
  sortOrder?: number
}

export interface UpdateNeracaItemPayload {
  name?: string
  amount?: number
  sortOrder?: number
}

export const neracaItemApi = {
  /**
   * Ambil semua pos neraca (grouped dan flat)
   */
  getAll: () =>
    httpClient.get<NeracaItemData[]>('/neraca-items'),

  /**
   * Tambah pos neraca baru
   */
  create: (payload: CreateNeracaItemPayload) =>
    httpClient.post<NeracaItemData>('/neraca-items', payload),

  /**
   * Update pos neraca berdasarkan ID
   */
  update: (id: string, payload: UpdateNeracaItemPayload) =>
    httpClient.put<NeracaItemData>(`/neraca-items/${id}`, payload),

  /**
   * Hapus pos neraca berdasarkan ID
   */
  delete: (id: string) =>
    httpClient.delete(`/neraca-items/${id}`),
}

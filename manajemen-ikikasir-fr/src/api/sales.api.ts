import { httpClient } from './httpClient'
import type {
  SalesDashboard,
  SalesListItem,
  SalesClientItem,
  SalesWithdrawal,
  SalesWithdrawalRequest,
  SalesReferralValidation
} from '../types/sales'

export const salesApi = {
  // Daftar semua sales (superadmin)
  getSalesList: () =>
    httpClient.get<SalesListItem[]>('/sales'),

  // Dashboard sales tertentu
  getSalesDashboard: (userId: string) =>
    httpClient.get<SalesDashboard>(`/sales/${userId}/dashboard`),

  // Daftar klien yang diundang sales
  getSalesClients: (userId: string, params?: { page?: number; limit?: number; search?: string }) =>
    httpClient.get<SalesClientItem[]>(`/sales/${userId}/clients`, params),

  // Generate kode referral sales
  generateReferralCode: (userId: string) =>
    httpClient.post<{ referralCode: string }>(`/sales/${userId}/generate-code`),

  // Validasi kode referral sales (publik, dari form pendaftaran)
  validateReferralCode: (code: string) =>
    httpClient.get<SalesReferralValidation>('/sales/validate-code', { code }),

  // Request penarikan saldo sales
  requestWithdrawal: (payload: SalesWithdrawalRequest) =>
    httpClient.post<SalesWithdrawal>('/sales/withdrawals', payload),

  // Daftar penarikan (semua - superadmin)
  getAllWithdrawals: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    httpClient.get<SalesWithdrawal[]>('/sales/withdrawals', params),

  // Daftar penarikan per sales
  getSalesWithdrawals: (userId: string) =>
    httpClient.get<SalesWithdrawal[]>(`/sales/${userId}/withdrawals`),

  // Konfirmasi penarikan oleh superadmin
  confirmWithdrawal: (id: string, payload: { status: 'SELESAI' | 'DITOLAK'; transferReference?: string; paymentProofUrl?: string; notes?: string; rejectionReason?: string }) =>
    httpClient.patch<SalesWithdrawal>(`/sales/withdrawals/${id}/confirm`, payload),
}

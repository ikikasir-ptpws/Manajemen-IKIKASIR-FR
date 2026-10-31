import { httpClient } from './httpClient'
import type {
  ReferralOverview,
  ReferralValidation,
  ReferralWithdrawalItem,
  RequestReferralWithdrawalPayload
} from '../types/referral'

export const referralApi = {
  /** Validasi kode referral yang diketik admin pada halaman Tambah Client */
  validateCode: (code: string) =>
    httpClient.get<ReferralValidation>('/referrals/validate', { code }),

  /** Ringkasan halaman Referral (kode, upline, saldo, downline, pencairan) */
  getOverview: (customerId: string) =>
    httpClient.get<ReferralOverview>(`/referrals/customers/${customerId}`),

  /** Permintaan pencairan saldo komisi referral */
  requestWithdrawal: (customerId: string, payload: RequestReferralWithdrawalPayload) =>
    httpClient.post<ReferralWithdrawalItem>(`/referrals/customers/${customerId}/withdrawals`, payload),

  /** Verifikasi pencairan oleh finance */
  updateWithdrawalStatus: (id: string, payload: { status: string; notes?: string }) =>
    httpClient.patch<ReferralWithdrawalItem>(`/referrals/withdrawals/${id}`, payload)
}

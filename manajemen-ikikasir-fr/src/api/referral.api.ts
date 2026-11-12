import { httpClient } from './httpClient'
import type {
  ReferralOverview,
  ReferralValidation,
  ReferralWithdrawalItem,
  ReferralWithdrawalListItem,
  ReferralWithdrawalQuery,
  ConfirmWithdrawalPayload,
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
    httpClient.patch<ReferralWithdrawalItem>(`/referrals/withdrawals/${id}`, payload),

  /** Daftar seluruh permintaan pencairan referral (halaman Penarikan Referral) */
  getWithdrawals: (params?: ReferralWithdrawalQuery) =>
    httpClient.get<ReferralWithdrawalListItem[]>('/referrals/withdrawals', {
      status: params?.status,
      search: params?.search,
      page: params?.page,
      limit: params?.limit
    }),

  /** Konfirmasi pembayaran pencairan (SELESAI) atau penolakan (DITOLAK) */
  confirmWithdrawal: (id: string, payload: ConfirmWithdrawalPayload) =>
    httpClient.patch<ReferralWithdrawalListItem>(`/referrals/withdrawals/${id}/payment`, payload),

  /** Tandai bukti penarikan sudah dikirim ke pelanggan via WhatsApp */
  markWithdrawalWaSent: (id: string) =>
    httpClient.post<ReferralWithdrawalListItem>(`/referrals/withdrawals/${id}/wa-sent`)
}

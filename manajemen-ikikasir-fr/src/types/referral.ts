export type ReferralCommissionStatus = 'MENUNGGU_VERIFIKASI' | 'AKTIF' | 'DITOLAK'

export type ReferralWithdrawalStatus = 'MENUNGGU_VERIFIKASI' | 'SELESAI' | 'DITOLAK'

export interface ReferralUpline {
  id: string
  name: string
  businessName: string
  referralCode: string
  phone: string
  boundDate: string | null
}

export interface ReferralValidation {
  valid: boolean
  code: string
  message: string
  rewardPerActiveUser: number
  upline: ReferralUpline | null
}

export interface ReferralUserItem {
  id: string
  storeName: string
  ownerName: string
  phoneNumber: string
  registeredDate: string
  isActive: boolean
  status: string
  commissionEarned: number
}

export interface ReferralWithdrawalItem {
  id: string
  amount: number
  bankOrWallet: string
  accountNumber: string
  accountHolder: string
  requestDate: string
  completedDate: string | null
  status: ReferralWithdrawalStatus
  notes: string
}

export interface ReferralOverview {
  customerId: string
  referralCode: string
  uplineName: string
  uplineCode: string
  uplineBoundDate: string | null
  isBound: boolean
  availableBalance: number
  totalEarnings: number
  totalWithdrawn: number
  rewardPerActiveUser: number
  referredUsers: ReferralUserItem[]
  withdrawals: ReferralWithdrawalItem[]
  /** Alias struktur untuk aplikasi Android */
  referralInfo?: ReferralOverview
  /** Alias daftar downline untuk aplikasi Android */
  userReferrals?: ReferralUserItem[]
}

export interface RequestReferralWithdrawalPayload {
  amount: number
  bankOrWallet: string
  accountNumber: string
  accountHolder: string
  notes?: string
}

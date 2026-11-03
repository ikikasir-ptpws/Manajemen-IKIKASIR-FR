export interface ReferralUplineDto {
  id: string;
  name: string;
  businessName: string;
  referralCode: string;
  phone: string;
  boundDate: string | null;
}

export interface ValidateReferralCodeResponseDto {
  valid: boolean;
  code: string;
  message: string;
  rewardPerActiveUser: number;
  upline: ReferralUplineDto | null;
}

export interface ReferralUserItemDto {
  id: string;
  storeName: string;
  ownerName: string;
  phoneNumber: string;
  registeredDate: string;
  isActive: boolean;
  status: string;
  commissionEarned: number;
}

export interface ReferralWithdrawalItemDto {
  id: string;
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  requestDate: string;
  completedDate: string | null;
  status: string;
  notes: string;
  invoiceNo?: string | null;
  processedBy?: string;
  transferReference?: string;
  waSentAt?: string | null;
  rejectionReason?: string;
}

/**
 * Daftar pencairan referral untuk halaman Penarikan Referral (webbase)
 */
export interface ReferralWithdrawalListItemDto extends ReferralWithdrawalItemDto {
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  customerPhone: string;
  customerEmail: string;
  customerReferralCode: string;
}

export interface ReferralWithdrawalSummaryDto {
  pendingCount: number;
  pendingAmount: number;
  paidCount: number;
  paidAmount: number;
  rejectedCount: number;
}

export interface ReferralWithdrawalListDto {
  items: ReferralWithdrawalListItemDto[];
  total: number;
  page: number;
  limit: number;
  summary: ReferralWithdrawalSummaryDto;
}

/**
 * Ringkasan info referral pelanggan (dipakai aplikasi Android)
 */
export interface ReferralInfoDto {
  customerId: string;
  referralCode: string;
  uplineName: string;
  uplineCode: string;
  uplineCustomerId?: string;
  uplineBoundDate: string | null;
  isBound: boolean;
  availableBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  totalPending?: number;
  rewardPerActiveUser: number;
}

export interface ReferralOverviewDto extends ReferralInfoDto {
  referredUsers: ReferralUserItemDto[];
  withdrawals: ReferralWithdrawalItemDto[];
  /**
   * Alias struktur untuk aplikasi Android (versi lama membungkus data dalam object)
   * Dis了回来 agar APK yang sudah terpasang tetap bisa membaca data referral.
   */
  referralInfo: ReferralInfoDto;
  /**
   * Alias daftar downline untuk aplikasi Android (versi lama memakai `userReferrals`)
   */
  userReferrals: ReferralUserItemDto[];
}

export interface RequestReferralWithdrawalDto {
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string;
}

export interface UpdateReferralWithdrawalDto {
  status: string; // MENUNGGU_VERIFIKASI, SELESAI, DITOLAK
  notes?: string;
}

/**
 * Konfirmasi pembayaran pencairan oleh finance (webbase)
 */
export interface ConfirmWithdrawalPayoutDto {
  status: 'SELESAI' | 'DITOLAK';
  /** Nomor referensi transfer dana ke pelanggan */
  transferReference?: string;
  notes?: string;
  /** Alasan penolakan (wajib bila status DITOLAK) */
  rejectionReason?: string;
}

export interface ReferralWithdrawalFilterDto {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubmitClientByReferralDto {
  referralCode?: string;
  name: string;
  businessName: string;
  phone: string;
  email?: string;
  packageInterest?: string;
  notes?: string;
  /** Email pemilik lisensi (token referral global di aplikasi Android) */
  userEmail?: string;
  /** ID pelanggan pengundang (token referral global di aplikasi Android) */
  customerId?: string;
}

export interface ClientWithdrawalDto {
  email?: string;
  customerId?: string;
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  notes?: string;
}


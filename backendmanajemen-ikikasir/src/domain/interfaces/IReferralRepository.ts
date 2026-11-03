import { ReferralCommission } from '../entities/ReferralCommission.js';
import { ReferralWithdrawal } from '../entities/ReferralWithdrawal.js';

export interface CreateReferralCommissionData {
  uplineId: string;
  downlineId: string;
  amount: number;
  status?: string;
  notes?: string;
}

export interface CreateReferralWithdrawalData {
  customerId: string;
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  status?: string;
  notes?: string;
}

export interface ReferralWithdrawalFilter {
  status?: string;
  search?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface UpdateReferralWithdrawalData {
  status?: string;
  notes?: string;
  invoiceNo?: string | null;
  processedBy?: string;
  transferReference?: string;
  rejectionReason?: string;
  completedDate?: Date | null;
  rejectedAt?: Date | null;
  waSentAt?: Date | null;
}

export interface ConfirmWithdrawalPayoutData extends UpdateReferralWithdrawalData {
  /** Nominal dana keluar pencairan referral */
  cashAmount: number;
  /** Keterangan transaksi kas keluar (pencairan referral) */
  cashDescription: string;
  /** Nama pelanggan pada transaksi kas */
  cashCustomer: string;
  /** Metode pembayaran dana keluar (Transfer / QRIS / dll) */
  cashPaymentMethod: string;
  cashNotes?: string;
}

export interface IReferralRepository {
  // Komisi
  createCommission(data: CreateReferralCommissionData): Promise<ReferralCommission>;
  findCommissionByUplineAndDownline(uplineId: string, downlineId: string): Promise<ReferralCommission | null>;
  findCommissionsByUpline(uplineId: string): Promise<ReferralCommission[]>;
  findCommissionsByDownline(downlineId: string): Promise<ReferralCommission[]>;
  updateCommissionStatus(id: string, status: string, notes?: string): Promise<ReferralCommission>;

  // Pencairan
  createWithdrawal(data: CreateReferralWithdrawalData): Promise<ReferralWithdrawal>;
  findWithdrawalsByCustomer(customerId: string): Promise<ReferralWithdrawal[]>;
  findWithdrawalById(id: string): Promise<ReferralWithdrawal | null>;
  updateWithdrawalStatus(id: string, status: string, notes?: string): Promise<ReferralWithdrawal>;
  findWithdrawals(filter: ReferralWithdrawalFilter): Promise<{ items: ReferralWithdrawal[]; total: number }>;
  updateWithdrawal(id: string, data: UpdateReferralWithdrawalData): Promise<ReferralWithdrawal>;
  /**
   * Konfirmasi pembayaran pencairan dalam satu transaksi database:
   * update withdrawal + catat transaksi kas keluar (agar Arus Kas tetap sinkron).
   */
  confirmWithdrawalPayout(id: string, data: ConfirmWithdrawalPayoutData): Promise<ReferralWithdrawal>;
}

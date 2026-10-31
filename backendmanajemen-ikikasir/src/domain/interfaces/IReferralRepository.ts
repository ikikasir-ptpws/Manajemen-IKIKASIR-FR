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
}

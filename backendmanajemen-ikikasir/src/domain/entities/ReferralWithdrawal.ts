export interface ReferralWithdrawalProps {
  id: string;
  customerId: string;
  amount: number;
  bankOrWallet: string;
  accountNumber: string;
  accountHolder: string;
  requestDate: Date;
  completedDate: Date | null;
  status: string; // MENUNGGU_VERIFIKASI, SELESAI, DITOLAK
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReferralWithdrawal {
  public readonly id: string;
  public readonly customerId: string;
  public readonly amount: number;
  public readonly bankOrWallet: string;
  public readonly accountNumber: string;
  public readonly accountHolder: string;
  public readonly requestDate: Date;
  public readonly completedDate: Date | null;
  public readonly status: string;
  public readonly notes: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ReferralWithdrawalProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.bankOrWallet = props.bankOrWallet ?? '';
    this.accountNumber = props.accountNumber ?? '';
    this.accountHolder = props.accountHolder ?? '';
    this.requestDate = props.requestDate;
    this.completedDate = props.completedDate ?? null;
    this.status = props.status;
    this.notes = props.notes ?? '';
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      amount: this.amount,
      bankOrWallet: this.bankOrWallet,
      accountNumber: this.accountNumber,
      accountHolder: this.accountHolder,
      requestDate: this.requestDate.toISOString(),
      completedDate: this.completedDate ? this.completedDate.toISOString() : null,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

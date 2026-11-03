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
  invoiceNo?: string | null;
  processedBy?: string;
  transferReference?: string;
  waSentAt?: Date | null;
  rejectionReason?: string;
  rejectedAt?: Date | null;
  // Data pelanggan pemohon (diisi saat query dengan relasi customer)
  customerName?: string;
  customerBusinessName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerReferralCode?: string;
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
  public readonly invoiceNo: string | null;
  public readonly processedBy: string;
  public readonly transferReference: string;
  public readonly waSentAt: Date | null;
  public readonly rejectionReason: string;
  public readonly rejectedAt: Date | null;
  public readonly customerName: string;
  public readonly customerBusinessName: string;
  public readonly customerPhone: string;
  public readonly customerEmail: string;
  public readonly customerReferralCode: string;
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
    this.invoiceNo = props.invoiceNo ?? null;
    this.processedBy = props.processedBy ?? '';
    this.transferReference = props.transferReference ?? '';
    this.waSentAt = props.waSentAt ?? null;
    this.rejectionReason = props.rejectionReason ?? '';
    this.rejectedAt = props.rejectedAt ?? null;
    this.customerName = props.customerName ?? '';
    this.customerBusinessName = props.customerBusinessName ?? '';
    this.customerPhone = props.customerPhone ?? '';
    this.customerEmail = props.customerEmail ?? '';
    this.customerReferralCode = props.customerReferralCode ?? '';
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
      invoiceNo: this.invoiceNo,
      processedBy: this.processedBy,
      transferReference: this.transferReference,
      waSentAt: this.waSentAt ? this.waSentAt.toISOString() : null,
      rejectionReason: this.rejectionReason,
      rejectedAt: this.rejectedAt ? this.rejectedAt.toISOString() : null,
      customerName: this.customerName,
      customerBusinessName: this.customerBusinessName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      customerReferralCode: this.customerReferralCode,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

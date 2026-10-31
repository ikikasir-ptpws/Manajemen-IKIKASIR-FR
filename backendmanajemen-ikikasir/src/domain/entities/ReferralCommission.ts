export interface ReferralCommissionProps {
  id: string;
  uplineId: string;
  downlineId: string;
  amount: number;
  status: string; // MENUNGGU_VERIFIKASI, AKTIF, DITOLAK
  notes: string;
  createdAt: Date;
  activatedAt: Date | null;
  // Informasi downline (untuk ditampilkan pada halaman Referral)
  downlineName?: string;
  downlineBusinessName?: string;
  downlinePhone?: string;
  downlineStatus?: string;
}

export class ReferralCommission {
  public readonly id: string;
  public readonly uplineId: string;
  public readonly downlineId: string;
  public readonly amount: number;
  public readonly status: string;
  public readonly notes: string;
  public readonly createdAt: Date;
  public readonly activatedAt: Date | null;
  public readonly downlineName: string;
  public readonly downlineBusinessName: string;
  public readonly downlinePhone: string;
  public readonly downlineStatus: string;

  constructor(props: ReferralCommissionProps) {
    this.id = props.id;
    this.uplineId = props.uplineId;
    this.downlineId = props.downlineId;
    this.amount = props.amount;
    this.status = props.status;
    this.notes = props.notes ?? '';
    this.createdAt = props.createdAt;
    this.activatedAt = props.activatedAt ?? null;
    this.downlineName = props.downlineName ?? '';
    this.downlineBusinessName = props.downlineBusinessName ?? '';
    this.downlinePhone = props.downlinePhone ?? '';
    this.downlineStatus = props.downlineStatus ?? '';
  }

  public isActive(): boolean {
    return this.status === 'AKTIF';
  }

  public toJSON() {
    return {
      id: this.id,
      uplineId: this.uplineId,
      downlineId: this.downlineId,
      amount: this.amount,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      activatedAt: this.activatedAt ? this.activatedAt.toISOString() : null,
      downlineName: this.downlineName,
      downlineBusinessName: this.downlineBusinessName,
      downlinePhone: this.downlinePhone,
      downlineStatus: this.downlineStatus,
    };
  }
}

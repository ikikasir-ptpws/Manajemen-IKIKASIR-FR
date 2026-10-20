export interface SubscriptionHistoryProps {
  id: string;
  customerId: string;
  packageId?: string | null;
  packageName: string;
  amount: number;
  billingCycleMonths: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export class SubscriptionHistory {
  public readonly id: string;
  public readonly customerId: string;
  public readonly packageId: string | null;
  public readonly packageName: string;
  public readonly amount: number;
  public readonly billingCycleMonths: number;
  public readonly paymentMethod: string;
  public readonly paymentStatus: string;
  public readonly notes: string;
  public readonly startedAt: Date;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;

  constructor(props: SubscriptionHistoryProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.packageId = props.packageId ?? null;
    this.packageName = props.packageName;
    this.amount = props.amount;
    this.billingCycleMonths = props.billingCycleMonths;
    this.paymentMethod = props.paymentMethod;
    this.paymentStatus = props.paymentStatus;
    this.notes = props.notes ?? '';
    this.startedAt = props.startedAt;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }

  public toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      packageId: this.packageId,
      packageName: this.packageName,
      amount: this.amount,
      billingCycleMonths: this.billingCycleMonths,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      notes: this.notes,
      startedAt: this.startedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}

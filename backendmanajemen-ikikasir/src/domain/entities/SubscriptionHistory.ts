export interface SubscriptionHistoryProps {
  id: string;
  customerId: string;
  packageId?: string | null;
  packageName: string;
  amount: number;
  billingCycleMonths: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentProofUrl?: string | null;
  notes?: string | null;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  customerName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
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
  public readonly paymentProofUrl: string;
  public readonly notes: string;
  public readonly startedAt: Date;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  public readonly customerName?: string;
  public readonly businessName?: string;
  public readonly phone?: string;
  public readonly email?: string;
  public readonly address?: string;

  constructor(props: SubscriptionHistoryProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.packageId = props.packageId ?? null;
    this.packageName = props.packageName;
    this.amount = props.amount;
    this.billingCycleMonths = props.billingCycleMonths;
    this.paymentMethod = props.paymentMethod;
    this.paymentStatus = props.paymentStatus;
    this.paymentProofUrl = props.paymentProofUrl ?? '';
    this.notes = props.notes ?? '';
    this.startedAt = props.startedAt;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.customerName = props.customerName;
    this.businessName = props.businessName;
    this.phone = props.phone;
    this.email = props.email;
    this.address = props.address;
  }

  public toJSON() {
    return {
      id: this.id,
      customerId: this.customerId,
      customerName: this.customerName,
      businessName: this.businessName,
      phone: this.phone,
      email: this.email,
      address: this.address,
      packageId: this.packageId,
      packageName: this.packageName,
      amount: this.amount,
      billingCycleMonths: this.billingCycleMonths,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      paymentProofUrl: this.paymentProofUrl,
      notes: this.notes,
      startedAt: this.startedAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}

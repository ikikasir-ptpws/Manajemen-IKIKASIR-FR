export class SubscriptionHistory {
    id;
    customerId;
    packageId;
    packageName;
    amount;
    billingCycleMonths;
    paymentMethod;
    paymentStatus;
    paymentProofUrl;
    notes;
    startedAt;
    expiresAt;
    createdAt;
    customerName;
    businessName;
    phone;
    email;
    address;
    constructor(props) {
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
    toJSON() {
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
//# sourceMappingURL=SubscriptionHistory.js.map
export class ReferralCommission {
    id;
    uplineId;
    downlineId;
    amount;
    status;
    notes;
    createdAt;
    activatedAt;
    downlineName;
    downlineBusinessName;
    downlinePhone;
    downlineStatus;
    constructor(props) {
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
    isActive() {
        return this.status === 'AKTIF';
    }
    toJSON() {
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
//# sourceMappingURL=ReferralCommission.js.map
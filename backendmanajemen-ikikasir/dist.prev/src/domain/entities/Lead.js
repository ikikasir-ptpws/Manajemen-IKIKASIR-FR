export class LeadFollowUp {
    id;
    leadId;
    date;
    channel;
    notes;
    createdAt;
    constructor(props) {
        this.id = props.id;
        this.leadId = props.leadId;
        this.date = props.date;
        this.channel = props.channel;
        this.notes = props.notes;
        this.createdAt = props.createdAt;
    }
    toJSON() {
        return {
            id: this.id,
            leadId: this.leadId,
            date: this.date.toISOString().substring(0, 10),
            time: this.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            channel: this.channel,
            notes: this.notes,
            createdAt: this.createdAt.toISOString(),
        };
    }
}
export class Lead {
    id;
    no;
    name;
    businessName;
    businessCategory;
    businessType;
    phone;
    email;
    address;
    status;
    source;
    registrationDate;
    lastFollowUp;
    packageInterest;
    packageId;
    packageName;
    packagePrice;
    estimatedDeal;
    notes;
    followUpSchedule;
    referralCode;
    referredByCustomerId;
    referredByCustomerName;
    referredByBusinessName;
    city;
    outletCount;
    employeeAppCount;
    employeeCount;
    currentRecordingMethod;
    neededFeatures;
    otherNeededFeature;
    specialNeed;
    knownFrom;
    otherKnownFrom;
    consentAgreed;
    paymentProofUrl;
    paymentStatus;
    paymentAmount;
    paymentDate;
    paymentMethod;
    paymentVerifiedAt;
    paymentVerifiedBy;
    paymentNotes;
    technicianStatus;
    technicianAssignedTo;
    appUsername;
    appPassword;
    appDownloadUrl;
    guideBookUrl;
    rentalAgreementNumber;
    rentalAgreementDate;
    emailIssueReported;
    emailIssueNotes;
    setupCompletedAt;
    appExpiredDate;
    createdAt;
    updatedAt;
    followUps;
    constructor(props) {
        this.id = props.id;
        this.no = props.no;
        this.name = props.name;
        this.businessName = props.businessName;
        this.businessCategory = props.businessCategory || props.businessType || 'Retail';
        this.businessType = props.businessType || props.businessCategory || 'Retail';
        this.phone = props.phone.trim();
        this.email = props.email.toLowerCase().trim();
        this.address = props.address ?? '';
        this.status = props.status || 'New';
        this.source = props.source || 'Website';
        this.registrationDate = props.registrationDate;
        this.lastFollowUp = props.lastFollowUp;
        this.packageInterest = props.packageInterest || props.packageName || 'Basic';
        this.packageId = props.packageId ?? null;
        this.packageName = props.packageName || props.packageInterest || 'Basic';
        this.packagePrice = props.packagePrice ?? 250000;
        this.estimatedDeal = props.estimatedDeal || this.packagePrice;
        this.notes = props.notes ?? '';
        this.followUpSchedule = props.followUpSchedule || 'Hari ini';
        this.referralCode = props.referralCode ?? null;
        this.referredByCustomerId = props.referredByCustomerId ?? null;
        this.referredByCustomerName = props.referredByCustomerName ?? null;
        this.referredByBusinessName = props.referredByBusinessName ?? null;
        this.city = props.city ?? '';
        this.outletCount = props.outletCount ?? '';
        this.employeeAppCount = props.employeeAppCount ?? '';
        this.employeeCount = props.employeeCount ?? '';
        this.currentRecordingMethod = props.currentRecordingMethod ?? '';
        this.neededFeatures = props.neededFeatures ?? [];
        this.otherNeededFeature = props.otherNeededFeature ?? '';
        this.specialNeed = props.specialNeed ?? '';
        this.knownFrom = props.knownFrom ?? '';
        this.otherKnownFrom = props.otherKnownFrom ?? '';
        this.consentAgreed = props.consentAgreed ?? true;
        this.paymentProofUrl = props.paymentProofUrl ?? '';
        this.paymentStatus = props.paymentStatus || 'unpaid';
        this.paymentAmount = props.paymentAmount ?? 0;
        this.paymentDate = props.paymentDate ?? null;
        this.paymentMethod = props.paymentMethod ?? '';
        this.paymentVerifiedAt = props.paymentVerifiedAt ?? null;
        this.paymentVerifiedBy = props.paymentVerifiedBy ?? '';
        this.paymentNotes = props.paymentNotes ?? '';
        this.technicianStatus = props.technicianStatus ?? '';
        this.technicianAssignedTo = props.technicianAssignedTo ?? '';
        this.appUsername = props.appUsername ?? '';
        this.appPassword = props.appPassword ?? '';
        this.appDownloadUrl = props.appDownloadUrl ?? '';
        this.guideBookUrl = props.guideBookUrl ?? '';
        this.rentalAgreementNumber = props.rentalAgreementNumber ?? '';
        this.rentalAgreementDate = props.rentalAgreementDate ?? '';
        this.emailIssueReported = props.emailIssueReported ?? false;
        this.emailIssueNotes = props.emailIssueNotes ?? '';
        this.setupCompletedAt = props.setupCompletedAt ?? null;
        this.appExpiredDate = props.appExpiredDate ?? null;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.followUps = props.followUps ?? [];
    }
    toJSON() {
        return {
            id: this.id,
            no: this.no,
            name: this.name,
            businessName: this.businessName,
            businessCategory: this.businessCategory,
            businessType: this.businessType,
            phone: this.phone,
            email: this.email,
            address: this.address,
            status: this.status,
            source: this.source,
            registrationDate: this.registrationDate.toISOString().substring(0, 10),
            lastFollowUp: this.lastFollowUp.toISOString().substring(0, 10),
            packageInterest: this.packageInterest,
            packageId: this.packageId,
            packageName: this.packageName,
            packagePrice: this.packagePrice,
            estimatedDeal: this.estimatedDeal,
            notes: this.notes,
            followUpSchedule: this.followUpSchedule,
            referralCode: this.referralCode,
            referredByCustomerId: this.referredByCustomerId,
            referredByCustomerName: this.referredByCustomerName,
            referredByBusinessName: this.referredByBusinessName,
            city: this.city,
            outletCount: this.outletCount,
            employeeAppCount: this.employeeAppCount,
            employeeCount: this.employeeCount,
            currentRecordingMethod: this.currentRecordingMethod,
            neededFeatures: this.neededFeatures,
            otherNeededFeature: this.otherNeededFeature,
            specialNeed: this.specialNeed,
            knownFrom: this.knownFrom,
            otherKnownFrom: this.otherKnownFrom,
            consentAgreed: this.consentAgreed,
            paymentProofUrl: this.paymentProofUrl,
            paymentStatus: this.paymentStatus,
            paymentAmount: this.paymentAmount,
            paymentDate: this.paymentDate ? this.paymentDate.toISOString().substring(0, 10) : null,
            paymentMethod: this.paymentMethod,
            paymentVerifiedAt: this.paymentVerifiedAt ? this.paymentVerifiedAt.toISOString() : null,
            paymentVerifiedBy: this.paymentVerifiedBy,
            paymentNotes: this.paymentNotes,
            technicianStatus: this.technicianStatus,
            technicianAssignedTo: this.technicianAssignedTo,
            appUsername: this.appUsername,
            appPassword: this.appPassword,
            appDownloadUrl: this.appDownloadUrl,
            guideBookUrl: this.guideBookUrl,
            rentalAgreementNumber: this.rentalAgreementNumber,
            rentalAgreementDate: this.rentalAgreementDate,
            emailIssueReported: this.emailIssueReported,
            emailIssueNotes: this.emailIssueNotes,
            setupCompletedAt: this.setupCompletedAt ? this.setupCompletedAt.toISOString() : null,
            appExpiredDate: this.appExpiredDate ? this.appExpiredDate.toISOString().substring(0, 10) : null,
            followUpHistory: this.followUps.map(f => f.toJSON()),
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=Lead.js.map
export interface LeadFollowUpProps {
  id: string;
  leadId: string;
  date: Date;
  channel: string;
  notes: string;
  createdAt: Date;
}

export class LeadFollowUp {
  public readonly id: string;
  public readonly leadId: string;
  public readonly date: Date;
  public readonly channel: string;
  public readonly notes: string;
  public readonly createdAt: Date;

  constructor(props: LeadFollowUpProps) {
    this.id = props.id;
    this.leadId = props.leadId;
    this.date = props.date;
    this.channel = props.channel;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
  }

  public toJSON() {
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

export interface LeadProps {
  id: string;
  no: number;
  name: string;
  businessName: string;
  businessCategory?: string | null;
  businessType?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  status: string; // New, Contacted, Follow Up, Interested, Converted, Lost
  source: string; // Website, Google Form, Instagram, WhatsApp, Facebook Ads, Referral, Direct / Walk-in
  registrationDate: Date;
  lastFollowUp: Date;
  packageInterest?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  packagePrice?: number | null;
  estimatedDeal: number;
  notes?: string | null;
  followUpSchedule?: string | null;

  // Referral
  referralCode?: string | null;
  referredByCustomerId?: string | null;
  referredByCustomerName?: string | null;
  referredByBusinessName?: string | null;

  // Survey / Kuesioner
  city?: string | null;
  outletCount?: string | null;
  employeeAppCount?: string | null;
  employeeCount?: string | null;
  currentRecordingMethod?: string | null;
  neededFeatures?: string[];
  otherNeededFeature?: string | null;
  specialNeed?: string | null;
  knownFrom?: string | null;
  otherKnownFrom?: string | null;
  consentAgreed?: boolean;

  // Workflow Finance
  paymentProofUrl?: string | null;
  paymentStatus: string; // unpaid, pending_verification, verified, rejected
  paymentAmount?: number | null;
  paymentDate?: Date | null;
  paymentMethod?: string | null;
  paymentVerifiedAt?: Date | null;
  paymentVerifiedBy?: string | null;
  paymentNotes?: string | null;

  // Workflow Teknisi
  technicianStatus?: string | null; // pending_setup, in_progress, completed
  technicianAssignedTo?: string | null;
  appUsername?: string | null;
  appPassword?: string | null;
  appDownloadUrl?: string | null;
  guideBookUrl?: string | null;
  rentalAgreementNumber?: string | null;
  rentalAgreementDate?: string | null;
  emailIssueReported?: boolean;
  emailIssueNotes?: string | null;
  setupCompletedAt?: Date | null;
  appExpiredDate?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  followUps?: LeadFollowUp[];
}

export class Lead {
  public readonly id: string;
  public readonly no: number;
  public readonly name: string;
  public readonly businessName: string;
  public readonly businessCategory: string;
  public readonly businessType: string;
  public readonly phone: string;
  public readonly email: string;
  public readonly address: string;
  public readonly status: string;
  public readonly source: string;
  public readonly registrationDate: Date;
  public readonly lastFollowUp: Date;
  public readonly packageInterest: string;
  public readonly packageId: string | null;
  public readonly packageName: string;
  public readonly packagePrice: number;
  public readonly estimatedDeal: number;
  public readonly notes: string;
  public readonly followUpSchedule: string;

  public readonly referralCode: string | null;
  public readonly referredByCustomerId: string | null;
  public readonly referredByCustomerName: string | null;
  public readonly referredByBusinessName: string | null;

  public readonly city: string;
  public readonly outletCount: string;
  public readonly employeeAppCount: string;
  public readonly employeeCount: string;
  public readonly currentRecordingMethod: string;
  public readonly neededFeatures: string[];
  public readonly otherNeededFeature: string;
  public readonly specialNeed: string;
  public readonly knownFrom: string;
  public readonly otherKnownFrom: string;
  public readonly consentAgreed: boolean;

  public readonly paymentProofUrl: string;
  public readonly paymentStatus: string;
  public readonly paymentAmount: number;
  public readonly paymentDate: Date | null;
  public readonly paymentMethod: string;
  public readonly paymentVerifiedAt: Date | null;
  public readonly paymentVerifiedBy: string;
  public readonly paymentNotes: string;

  public readonly technicianStatus: string;
  public readonly technicianAssignedTo: string;
  public readonly appUsername: string;
  public readonly appPassword: string;
  public readonly appDownloadUrl: string;
  public readonly guideBookUrl: string;
  public readonly rentalAgreementNumber: string;
  public readonly rentalAgreementDate: string;
  public readonly emailIssueReported: boolean;
  public readonly emailIssueNotes: string;
  public readonly setupCompletedAt: Date | null;
  public readonly appExpiredDate: Date | null;

  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public readonly followUps: LeadFollowUp[];

  constructor(props: LeadProps) {
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

  public toJSON() {
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

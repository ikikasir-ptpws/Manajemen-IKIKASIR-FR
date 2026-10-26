import { Lead, LeadFollowUp } from '../entities/Lead.js';

export interface CreateLeadData {
  name: string;
  businessName: string;
  businessCategory?: string;
  businessType?: string;
  phone: string;
  email: string;
  address?: string;
  status?: string;
  source?: string;
  packageInterest?: string;
  packageId?: string;
  estimatedDeal?: number;
  notes?: string;
  followUpSchedule?: string;

  referralCode?: string;
  referredByCustomerId?: string;
  referredByCustomerName?: string;
  referredByBusinessName?: string;

  city?: string;
  outletCount?: string;
  employeeAppCount?: string;
  employeeCount?: string;
  currentRecordingMethod?: string;
  neededFeatures?: string[];
  otherNeededFeature?: string;
  specialNeed?: string;
  knownFrom?: string;
  otherKnownFrom?: string;
  consentAgreed?: boolean;

  paymentProofUrl?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentDate?: Date;
  paymentMethod?: string;
}

export interface UpdateLeadData {
  name?: string;
  businessName?: string;
  businessCategory?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  source?: string;
  packageInterest?: string;
  packageId?: string;
  estimatedDeal?: number;
  notes?: string;
  followUpSchedule?: string;

  referralCode?: string;
  referredByCustomerId?: string;
  referredByCustomerName?: string;
  referredByBusinessName?: string;

  city?: string;
  outletCount?: string;
  employeeAppCount?: string;
  employeeCount?: string;
  currentRecordingMethod?: string;
  neededFeatures?: string[];
  otherNeededFeature?: string;
  specialNeed?: string;
  knownFrom?: string;
  otherKnownFrom?: string;
  consentAgreed?: boolean;

  paymentProofUrl?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentDate?: Date;
  paymentMethod?: string;
  paymentVerifiedAt?: Date;
  paymentVerifiedBy?: string;
  paymentNotes?: string;

  technicianStatus?: string;
  technicianAssignedTo?: string;
  appUsername?: string;
  appPassword?: string;
  appDownloadUrl?: string;
  guideBookUrl?: string;
  rentalAgreementNumber?: string;
  rentalAgreementDate?: string;
  emailIssueReported?: boolean;
  emailIssueNotes?: string;
  setupCompletedAt?: Date;
  appExpiredDate?: Date;
}

export interface LeadFilter {
  search?: string;
  status?: string;
  source?: string;
  packageInterest?: string;
  packageId?: string;
  startDate?: Date;
  endDate?: Date;
  referralCode?: string;
  referredByCustomerId?: string;
}

export interface LeadStatistics {
  totalLeads: number;
  newLeads: number;
  inProgressLeads: number;
  interestedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  sources: {
    website: number;
    googleForm: number;
    instagram: number;
    whatsapp: number;
    referral: number;
    other: number;
  };
  packages: {
    basic: number;
    pro: number;
    addOn: number;
    custom: number;
  };
}

export interface ILeadRepository {
  findAll(filter?: LeadFilter): Promise<Lead[]>;
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  findByPhone(phone: string): Promise<Lead | null>;
  create(data: CreateLeadData): Promise<Lead>;
  update(id: string, data: UpdateLeadData): Promise<Lead>;
  delete(id: string): Promise<void>;
  addFollowUp(leadId: string, channel: string, notes: string): Promise<LeadFollowUp>;
  getStatistics(): Promise<LeadStatistics>;
}

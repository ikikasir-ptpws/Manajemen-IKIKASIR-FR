export interface CreateLeadDto {
  name: string;
  businessName: string;
  businessCategory?: string;
  businessType?: string;
  phone: string;
  email: string;
  address?: string;
  status?: 'New' | 'Contacted' | 'Follow Up' | 'Interested' | 'Converted' | 'Lost' | string;
  source?: 'Website' | 'Google Form' | 'Instagram' | 'WhatsApp' | 'Facebook Ads' | 'Referral' | 'Direct / Walk-in' | string;
  packageInterest?: 'Basic' | 'Pro' | 'Add on' | 'Custom' | 'Custom / IT One' | string;
  packageId?: string;
  estimatedDeal?: number;
  notes?: string;
  followUpSchedule?: 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat' | string;

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
  paymentMethod?: string;
  paymentAmount?: number;
}

export interface UpdateLeadDto {
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
  paymentDate?: string;
  paymentMethod?: string;

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
}

export interface UpdateLeadStatusDto {
  status: 'New' | 'Contacted' | 'Follow Up' | 'Interested' | 'Converted' | 'Lost' | string;
  notes?: string;
}

export interface AddFollowUpDto {
  channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem';
  notes: string;
}

export interface ApproveLeadDto {
  amount?: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  notes?: string;
  billingCycleMonths?: number;
  startDate?: string;
  appPassword?: string; // Optional password client
}

export interface RejectLeadDto {
  reason?: string;
}

import { httpClient } from './httpClient'

export interface FollowUpItem {
  id: string
  leadId?: string
  date: string
  time?: string
  channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem' | string
  notes: string
  createdAt?: string
}

export interface LeadItem {
  id: string
  no?: number
  name: string
  businessName: string
  businessCategory?: string
  businessType?: string
  phone: string
  email: string
  address?: string
  status: 'New' | 'Contacted' | 'Follow Up' | 'Interested' | 'Converted' | 'Lost' | string
  source: string
  registrationDate?: string
  lastFollowUp?: string
  packageInterest?: string
  packageId?: string | null
  packageName?: string
  packagePrice?: number
  estimatedDeal?: number
  notes?: string
  followUpSchedule?: string

  referralCode?: string
  referredByCustomerId?: string
  referredByCustomerName?: string
  referredByBusinessName?: string

  city?: string
  outletCount?: string
  employeeAppCount?: string
  employeeCount?: string
  currentRecordingMethod?: string
  neededFeatures?: string[]
  otherNeededFeature?: string
  specialNeed?: string
  knownFrom?: string
  otherKnownFrom?: string
  consentAgreed?: boolean

  paymentProofUrl?: string
  paymentStatus?: 'unpaid' | 'pending_verification' | 'verified' | 'rejected' | string
  paymentAmount?: number
  paymentDate?: string | null
  paymentMethod?: string
  paymentVerifiedAt?: string | null
  paymentVerifiedBy?: string
  paymentNotes?: string

  technicianStatus?: 'pending_setup' | 'in_progress' | 'completed' | string
  technicianAssignedTo?: string
  appUsername?: string
  appPassword?: string
  appDownloadUrl?: string
  guideBookUrl?: string
  rentalAgreementNumber?: string
  rentalAgreementDate?: string
  emailIssueReported?: boolean
  emailIssueNotes?: string
  setupCompletedAt?: string | null
  appExpiredDate?: string | null

  followUpHistory?: FollowUpItem[]
  createdAt?: string
  updatedAt?: string
}

export interface LeadStatisticsData {
  totalLeads: number
  newLeads: number
  inProgressLeads: number
  interestedLeads: number
  convertedLeads: number
  lostLeads: number
  sources: {
    website: number
    googleForm: number
    instagram: number
    whatsapp: number
    referral: number
    other: number
  }
  packages: {
    basic: number
    pro: number
    addOn: number
    custom: number
  }
}

export interface CreateLeadPayload {
  name: string
  businessName: string
  businessCategory?: string
  businessType?: string
  phone: string
  email: string
  address?: string
  status?: string
  source?: string
  packageInterest?: string
  packageId?: string
  estimatedDeal?: number
  notes?: string
  followUpSchedule?: string

  referralCode?: string
  referredByCustomerId?: string
  referredByCustomerName?: string
  referredByBusinessName?: string

  city?: string
  outletCount?: string
  employeeAppCount?: string
  employeeCount?: string
  currentRecordingMethod?: string
  neededFeatures?: string[]
  otherNeededFeature?: string
  specialNeed?: string
  knownFrom?: string
  otherKnownFrom?: string
  consentAgreed?: boolean

  paymentProofUrl?: string
  paymentMethod?: string
  paymentAmount?: number
}

export interface UpdateLeadPayload {
  name?: string
  businessName?: string
  businessCategory?: string
  businessType?: string
  phone?: string
  email?: string
  address?: string
  status?: string
  source?: string
  packageInterest?: string
  packageId?: string
  estimatedDeal?: number
  notes?: string
  followUpSchedule?: string

  referralCode?: string
  referredByCustomerId?: string
  referredByCustomerName?: string
  referredByBusinessName?: string

  city?: string
  outletCount?: string
  employeeAppCount?: string
  employeeCount?: string
  currentRecordingMethod?: string
  neededFeatures?: string[]
  otherNeededFeature?: string
  specialNeed?: string
  knownFrom?: string
  otherKnownFrom?: string
  consentAgreed?: boolean

  paymentProofUrl?: string
  paymentStatus?: string
  paymentAmount?: number
  paymentDate?: string
  paymentMethod?: string

  technicianStatus?: string
  technicianAssignedTo?: string
  appUsername?: string
  appPassword?: string
  appDownloadUrl?: string
  guideBookUrl?: string
  rentalAgreementNumber?: string
  rentalAgreementDate?: string
  emailIssueReported?: boolean
  emailIssueNotes?: string
}

export interface LeadFilterParams {
  search?: string
  status?: string
  source?: string
  packageInterest?: string
  packageId?: string
  startDate?: string
  endDate?: string
  referralCode?: string
  referredByCustomerId?: string
}

export interface ApproveLeadPayload {
  amount?: number
  paymentMethod?: string
  paymentProofUrl?: string
  notes?: string
  billingCycleMonths?: number
  startDate?: string
  appPassword?: string
}

export const leadsApi = {
  getAll: (params?: LeadFilterParams) =>
    httpClient.get<LeadItem[]>('/leads', params),

  getStatistics: () =>
    httpClient.get<LeadStatisticsData>('/leads/statistics'),

  getById: (id: string) =>
    httpClient.get<LeadItem>(`/leads/${id}`),

  create: (payload: CreateLeadPayload) =>
    httpClient.post<LeadItem>('/leads', payload, { skipAuth: false }),

  update: (id: string, payload: UpdateLeadPayload) =>
    httpClient.put<LeadItem>(`/leads/${id}`, payload),

  updateStatus: (id: string, status: string, notes?: string) =>
    httpClient.patch<LeadItem>(`/leads/${id}/status`, { status, notes }),

  addFollowUp: (id: string, channel: string, notes: string) =>
    httpClient.post<FollowUpItem>(`/leads/${id}/follow-up`, { channel, notes }),

  approve: (id: string, payload?: ApproveLeadPayload) =>
    httpClient.post<{ lead: LeadItem; customer: any; message: string }>(`/leads/${id}/approve`, payload || {}),

  reject: (id: string, reason?: string) =>
    httpClient.post<{ lead: LeadItem; message: string }>(`/leads/${id}/reject`, { reason }),

  delete: (id: string) =>
    httpClient.delete(`/leads/${id}`)
}

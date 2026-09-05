export type LeadStatus = 'New' | 'Contacted' | 'Follow Up' | 'Interested' | 'Converted' | 'Lost'

export type LeadSource = 'Website' | 'Instagram' | 'WhatsApp' | 'Facebook Ads' | 'Referral' | 'Direct / Walk-in'

export interface FollowUpLog {
  id: string
  date: string
  time: string
  channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem'
  notes: string
}

export interface ClientLead {
  id: string
  no: number
  name: string
  businessName: string
  businessCategory: string
  phone: string
  email: string
  address?: string
  status: LeadStatus
  source: LeadSource
  lastFollowUp: string
  packageInterest?: 'Basic' | 'Pro' | 'Premium'
  estimatedDeal?: number
  notes?: string
  avatar?: string
  followUpHistory: FollowUpLog[]
  followUpSchedule?: 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat'
}

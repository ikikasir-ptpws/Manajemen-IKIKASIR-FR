export type LeadStatus = 'New' | 'Contacted' | 'Follow Up' | 'Interested' | 'Converted' | 'Lost'

export type LeadSource = 'Website' | 'Google Form' | 'Instagram' | 'WhatsApp' | 'Facebook Ads' | 'Referral' | 'Direct / Walk-in'

export interface FollowUpLog {
  id: string
  date: string
  time: string
  channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem'
  notes: string
}

export interface ClientLead {
  id: string
  registration_id?: string
  no: number
  name: string
  nama_lengkap?: string
  businessName: string
  nama_bisnis?: string
  businessCategory?: string
  kategori_bisnis?: string
  phone: string
  whatsapp?: string
  email: string
  address?: string
  status: LeadStatus
  source: LeadSource
  registrationDate?: string
  tanggal_pendaftaran?: string
  lastFollowUp: string
  packageInterest?: 'Basic' | 'Pro' | 'Custom / IT One' | string
  paket?: string
  harga_paket?: number
  estimatedDeal?: number
  notes?: string
  avatar?: string
  followUpHistory: FollowUpLog[]
  followUpSchedule?: 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat'
  created_at?: string
  updated_at?: string

  // Google Form Aligned Fields
  employeeCount?: string
  employeeCountChoice?: string
  employeeCountCustom?: string
  willingToTry?: 'Ya Saya tertarik' | 'Mungkin' | 'Masih Mencoba' | 'Tidak' | string
  willingToTest?: 'Ya' | 'Tidak' | string
}


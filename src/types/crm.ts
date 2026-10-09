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
  /** @deprecated gunakan businessType untuk data baru */
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
  packageInterest?: 'Basic' | 'Add on' | 'Custom' | 'Pro' | 'Custom / IT One' | string
  paket?: string
  harga_paket?: number
  estimatedDeal?: number
  notes?: string
  avatar?: string
  followUpHistory: FollowUpLog[]
  followUpSchedule?: 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat'
  created_at?: string
  updated_at?: string

  // === FIELD LAMA (tetap ada untuk kompatibilitas data lama) ===
  employeeCount?: string
  employeeCountChoice?: string
  employeeCountCustom?: string
  willingToTry?: string
  willingToTest?: string

  // === FIELD BARU (semua optional agar data lama tidak rusak) ===
  /** Jenis Usaha: Kafe/Restoran, Toko Kelontong, Fashion, Laundry, Barbershop/Salon, Bengkel, Lainnya */
  businessType?: string
  /** Kota / Kabupaten */
  city?: string
  /** Jumlah Outlet: "1" | "2-3" | "4 atau lebih" */
  outletCount?: string
  /** Jumlah Karyawan Pakai Aplikasi: "1" | "2" | "3" | "4" | "5 atau lebih" */
  employeeAppCount?: string
  /** Metode pencatatan saat ini: Buku/manual, Excel, Aplikasi kasir lain, Belum mencatat */
  currentRecordingMethod?: string
  /** Fitur yang dibutuhkan (array checkbox) */
  neededFeatures?: string[]
  /** Input teks jika memilih "Lainnya" di neededFeatures */
  otherNeededFeature?: string
  /** Kendala terbesar atau kebutuhan khusus (opsional) */
  specialNeed?: string
  /** Dari mana mengetahui IKI KASIR */
  knownFrom?: string
  /** Input teks jika memilih "Lainnya" di knownFrom */
  otherKnownFrom?: string
  /** Sudah menyetujui persetujuan data */
  consentAgreed?: boolean
}



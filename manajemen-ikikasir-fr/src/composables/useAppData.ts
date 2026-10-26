import { ref, computed } from 'vue'
import type { ClientLead, LeadStatus, LeadSource, FollowUpLog } from '../types/crm'
import type { Customer, PackageType } from '../types/dashboard'

export interface PricingPackage {
  id: string
  name: string
  description?: string
  cardSub?: string
  isConsultation: boolean
  price: number
  period: string
  features: string[]
  isActive: boolean
  badge?: string
  cardClass?: string
  icon?: string
  btnText?: string
  btnClass?: string
  waText?: string
  priceTitle?: string
  priceSubtext?: string
}

// CONSTANTS (Rule 14 & 15: Single Admin WhatsApp Constant)
export const ADMIN_WA_NUMBER = '6285669660865'

export function getAdminWaUrl(customText?: string) {
  const defaultText = 'Halo tim IKI KASIR, saya ingin konsultasi mengenai aplikasi kasir...'
  const text = encodeURIComponent(customText || defaultText)
  return `https://api.whatsapp.com/send?phone=${ADMIN_WA_NUMBER}&text=${text}`
}

export function getCustomerWaUrl(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : (cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone)
  const encodedText = encodeURIComponent(text)
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
}

// SAMPLE RECEIPT SVGS FOR VERIFICATION DEMO
export const SAMPLE_RECEIPT_BCA = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480"><rect width="360" height="480" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><rect width="360" height="70" rx="16" fill="%23005baa"/><text x="180" y="44" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">m-Transfer BCA</text><circle cx="180" cy="115" r="26" fill="%23ecfdf5"/><path d="M170 115 l7 7 l14 -14" stroke="%23059669" stroke-width="3" fill="none" stroke-linecap="round"/><text x="180" y="155" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%23059669" text-anchor="middle">TRANSFER BERHASIL</text><text x="180" y="175" font-family="Arial, sans-serif" font-size="11" fill="%2364748b" text-anchor="middle">20 Sep 2026 - 14:22:10 WIB</text><line x1="30" y1="195" x2="330" y2="195" stroke="%23e2e8f0" stroke-dasharray="4 4"/><text x="35" y="225" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">No. Referensi</text><text x="325" y="225" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%231e293b" text-anchor="end">202609201422891</text><text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">Tujuan</text><text x="325" y="255" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%231e293b" text-anchor="end">BCA 8735019283</text><text x="325" y="272" font-family="Arial, sans-serif" font-size="11" fill="%23005baa" text-anchor="end">PT PUTRA WISANGGENI SATU/text><text x="35" y="305" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">Nominal Transfer</text><text x="325" y="305" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="%230f172a" text-anchor="end">Rp 250.000,00</text><text x="35" y="335" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">Berita / Catatan</text><text x="325" y="335" font-family="Arial, sans-serif" font-size="12" fill="%23334155" text-anchor="end">Paket Basic Toko ABC</text><line x1="30" y1="365" x2="330" y2="365" stroke="%23e2e8f0"/><text x="180" y="400" font-family="Arial, sans-serif" font-size="10" fill="%2394a3b8" text-anchor="middle">Simpan bukti transaksi ini sebagai bukti transfer yang sah.</text><text x="180" y="445" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23005baa" text-anchor="middle">IKIKASIR Official Payment</text></svg>'

export const SAMPLE_RECEIPT_QRIS = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480"><rect width="360" height="480" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><rect width="360" height="70" rx="16" fill="%23dc2626"/><text x="180" y="44" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%23ffffff" text-anchor="middle">QRIS Pembayaran Sukses</text><circle cx="180" cy="115" r="26" fill="%23ecfdf5"/><path d="M170 115 l7 7 l14 -14" stroke="%23059669" stroke-width="3" fill="none" stroke-linecap="round"/><text x="180" y="155" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%23059669" text-anchor="middle">TRANSAKSI BERHASIL</text><text x="180" y="175" font-family="Arial, sans-serif" font-size="11" fill="%2364748b" text-anchor="middle">21 Sep 2026 - 09:15:33 WIB</text><line x1="30" y1="195" x2="330" y2="195" stroke="%23e2e8f0" stroke-dasharray="4 4"/><text x="35" y="225" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">Merchant</text><text x="325" y="225" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%231e293b" text-anchor="end">IKI KASIR - PT PUNDI MAS</text><text x="35" y="255" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">NMID</text><text x="325" y="255" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%231e293b" text-anchor="end">ID1020091823901</text><text x="35" y="285" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">ID Transaksi</text><text x="325" y="285" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%23dc2626" text-anchor="end">QRIS-20260921-8819</text><text x="35" y="315" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">Total Bayar</text><text x="325" y="315" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="end">Rp 500.000,00</text><line x1="30" y1="345" x2="330" y2="345" stroke="%23e2e8f0"/><text x="180" y="390" font-family="Arial, sans-serif" font-size="11" fill="%23475569" text-anchor="middle">Paket Pro POS IKI KASIR (1 Bulan)</text><text x="180" y="445" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23dc2626" text-anchor="middle">STANDAR PEMBAYARAN NASIONAL</text></svg>'

// STORAGE KEYS
const STORAGE_KEY_LEADS = 'ikikasir_leads_v4'
const STORAGE_KEY_CUSTOMERS = 'ikikasir_customers_v4'
const STORAGE_KEY_INVOICES = 'ikikasir_invoices_v4'
const STORAGE_KEY_PACKAGES = 'ikikasir_packages_v1'
const STORAGE_KEY_ROLE = 'ikikasir_current_role_v1'
const STORAGE_KEY_NOTIFICATIONS = 'ikikasir_notifications_v1'

// INVOICE INTERFACE
export interface SubscriptionInvoice {
  id: string
  customerId: string
  customerName: string
  businessName: string
  phone: string
  package: PackageType
  amount: number
  billingCycleMonths: number
  date: string
  paymentMethod: string
  status: 'Paid' | 'Pending' | 'Failed'
  paymentProofUrl?: string
}

// INITIAL SEED DATA
const initialPackages: PricingPackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Cocok untuk usaha kecil, menengah, dan pemula.',
    cardSub: 'Cocok untuk usaha kecil, menengah, dan pemula.',
    isConsultation: false,
    price: 250000,
    period: '/bulan',
    features: [
      'Manajemen produk tanpa batas',
      'Transaksi kasir cepat & akurat',
      'Laporan penjualan lengkap',
      'Support bantuan pelanggan'
    ],
    isActive: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Solusi lengkap & fitur lanjutan untuk bisnis berkembang.',
    cardSub: 'Solusi lengkap & fitur lanjutan untuk bisnis berkembang.',
    isConsultation: false,
    price: 500000,
    period: '/bulan',
    features: [
      'Semua fitur Basic',
      'Multi kasir & manajemen karyawan',
      'Laporan keuangan & analitik lengkap',
      'Dedicated support & pendampingan 24/7'
    ],
    isActive: true
  },
  {
    id: 'custom-it-one',
    name: 'Custom / IT One',
    description: 'Solusi sistem kasir khusus sesuai alur dan kebutuhan bisnis Anda.',
    cardSub: 'Solusi sistem kasir khusus sesuai alur dan kebutuhan bisnis Anda.',
    isConsultation: true,
    price: 0,
    period: '',
    features: [
      'Semua fitur Basic & Pro',
      'Kustomisasi alur & fitur khusus',
      'Integrasi sistem modul custom',
      'Dedicated support & pendampingan tim'
    ],
    isActive: true
  }
]

const initialNotifications: import('../types/crm').SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Pembayaran Dikonfirmasi Finance',
    message: 'Pembayaran pendaftar Andi Wijaya (Andi Store) telah di-Acc oleh Finance. Tugas penyiapan aplikasi telah masuk ke antrean Teknisi.',
    roleTarget: 'Teknisi',
    type: 'technical_task',
    timestamp: '15 menit yang lalu',
    read: false,
    link: '/semua-pelanggan'
  },
  {
    id: 'notif-2',
    title: 'Bukti Transfer Baru Masuk',
    message: 'Pendaftar Budi Santoso (Toko ABC) telah mengunggah bukti transfer sebesar Rp 250.000.',
    roleTarget: 'Finance',
    type: 'payment_verified',
    timestamp: '30 menit yang lalu',
    read: false,
    link: '/calon-client'
  }
]

const initialLeads: ClientLead[] = [
  {
    id: 'c-101',
    no: 1,
    name: 'Budi Santoso',
    businessName: 'Toko ABC',
    businessCategory: 'Retail',
    phone: '081234567890',
    email: 'budi.santoso@email.com',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    status: 'New',
    source: 'Website',
    registrationDate: '15 Sep 2026', // Data terlama (FIFO Queue)
    lastFollowUp: '15 Sep 2026',
    packageInterest: 'Basic',
    harga_paket: 250000,
    estimatedDeal: 250000,
    notes: 'Pendaftaran mandiri via Website. Bukti transfer BCA telah diunggah oleh pendaftar.',
    followUpSchedule: 'Hari ini',
    // Finance payment proof
    paymentProofUrl: SAMPLE_RECEIPT_BCA,
    paymentStatus: 'pending_verification',
    paymentAmount: 250000,
    paymentDate: '15 Sep 2026 14:22',
    paymentMethod: 'BCA Transfer',
    paymentNotes: 'Transfer atas nama Budi Santoso melalui BCA Mobile.',
    followUpHistory: [
      { id: 'fh-1', date: '15 Sep 2026', time: '14:25', channel: 'Sistem', notes: 'Bukti transfer diunggah oleh pendaftar (Menunggu konfirmasi Finance).' }
    ]
  },
  {
    id: 'c-102',
    no: 2,
    name: 'Siti Rahmawati',
    businessName: 'Rahma Bakery & Cake',
    businessCategory: 'Kuliner & F&B',
    phone: '081299887766',
    email: 'siti.rahma@bakery.com',
    address: 'Jl. Raya Pajajaran No. 88, Bogor',
    status: 'New',
    source: 'Referral',
    referralCode: 'REF-BUDI101',
    referredByCustomerId: 'cust-101',
    referredByCustomerName: 'Budi Santoso',
    referredByBusinessName: 'Toko Budi Jaya',
    registrationDate: '18 Sep 2026', // Antrean terlama kedua
    lastFollowUp: '18 Sep 2026',
    packageInterest: 'Pro',
    harga_paket: 500000,
    estimatedDeal: 500000,
    notes: 'Pendaftaran via Google Form paket Pro. Pembayaran via QRIS telah diterima payment gateway.',
    followUpSchedule: 'Hari ini',
    paymentProofUrl: SAMPLE_RECEIPT_QRIS,
    paymentStatus: 'pending_verification',
    paymentAmount: 500000,
    paymentDate: '18 Sep 2026 09:15',
    paymentMethod: 'QRIS',
    paymentNotes: 'Pembayaran QRIS atas nama Rahma Bakery.',
    followUpHistory: [
      { id: 'fh-2', date: '18 Sep 2026', time: '09:18', channel: 'Sistem', notes: 'Pembayaran QRIS masuk (Menunggu konfirmasi Finance).' }
    ]
  },
  {
    id: 'c-103',
    no: 3,
    name: 'Andi Wijaya',
    businessName: 'Andi Store',
    businessCategory: 'Retail',
    phone: '081398765432',
    email: 'andi.wijaya@store.com',
    address: 'Jl. Ahmad Yani No. 45, Bandung',
    status: 'Converted',
    source: 'Website',
    registrationDate: '20 Sep 2026',
    lastFollowUp: '22 Sep 2026',
    packageInterest: 'Basic',
    harga_paket: 250000,
    estimatedDeal: 250000,
    notes: 'Pembayaran telah dikonfirmasi Finance. Tugas dikirim ke teknisi untuk penyiapan aplikasi.',
    followUpSchedule: 'Hari ini',
    paymentProofUrl: SAMPLE_RECEIPT_BCA,
    paymentStatus: 'verified',
    paymentAmount: 250000,
    paymentDate: '20 Sep 2026 10:15',
    paymentMethod: 'BCA Transfer',
    paymentVerifiedAt: '22 Sep 2026 11:00',
    paymentVerifiedBy: 'Rina Finance',
    paymentNotes: 'Pembayaran valid & lunas. Diteruskan ke Teknisi.',
    technicianStatus: 'pending_setup', // Siap dikerjakan Teknisi
    technicianAssignedTo: 'Doni Teknisi',
    followUpHistory: [
      { id: 'fh-3', date: '22 Sep 2026', time: '11:00', channel: 'Sistem', notes: 'Pembayaran di-acc oleh Finance (Rina Finance). Tugas diteruskan ke Teknisi.' }
    ]
  },
  {
    id: 'c-104',
    no: 4,
    name: 'Donni Handoko',
    businessName: 'Donni Cell & Pulsa',
    businessCategory: 'Retail & Aksesoris',
    phone: '085619283746',
    email: 'donni@cell.notfound', // Simulating email issue
    address: 'Jl. Malioboro No. 12, Yogyakarta',
    status: 'Converted',
    source: 'Website',
    registrationDate: '22 Sep 2026',
    lastFollowUp: '23 Sep 2026',
    packageInterest: 'Basic',
    harga_paket: 250000,
    estimatedDeal: 250000,
    notes: 'Sedang dikerjakan teknisi. Ditemukan kendala pada alamat email klien.',
    followUpSchedule: 'Hari ini',
    paymentProofUrl: SAMPLE_RECEIPT_BCA,
    paymentStatus: 'verified',
    paymentAmount: 250000,
    paymentMethod: 'BCA Transfer',
    paymentVerifiedAt: '22 Sep 2026 14:00',
    paymentVerifiedBy: 'Rina Finance',
    technicianStatus: 'in_progress', // Sedang dalam pengerjaan
    technicianAssignedTo: 'Doni Teknisi',
    emailIssueReported: true, // Ada kendala email!
    emailIssueNotes: 'Email donni@cell.notfound tidak dapat menerima aktivasi token (Domain bounce). Hubungi WA klien untuk konfirmasi.',
    followUpHistory: [
      { id: 'fh-4', date: '23 Sep 2026', time: '10:30', channel: 'Sistem', notes: 'Teknisi mendapati kendala email: alamat bounce.' }
    ]
  },
  {
    id: 'c-105',
    no: 5,
    name: 'Hendra Kusuma',
    businessName: 'Hendra Coffee & Eatery',
    businessCategory: 'Kuliner & F&B',
    phone: '082155667788',
    email: 'hendra@coffee.com',
    address: 'Jl. Pemuda No. 88, Semarang',
    status: 'Converted',
    source: 'Website',
    registrationDate: '10 Sep 2026',
    lastFollowUp: '12 Sep 2026',
    packageInterest: 'Pro',
    harga_paket: 500000,
    estimatedDeal: 500000,
    notes: 'Aplikasi selesai disiapkan & kredensial telah diserahkan ke klien via WA.',
    followUpSchedule: 'Terlambat',
    paymentProofUrl: SAMPLE_RECEIPT_QRIS,
    paymentStatus: 'verified',
    paymentAmount: 500000,
    paymentMethod: 'QRIS',
    paymentVerifiedAt: '10 Sep 2026 15:00',
    paymentVerifiedBy: 'Rina Finance',
    technicianStatus: 'completed', // Selesai
    technicianAssignedTo: 'Doni Teknisi',
    appUsername: 'hendra.coffee',
    appPassword: 'Ikikasir#2026',
    appDownloadUrl: 'https://ikikasir.com/download/ikikasir-pos-v2.apk',
    guideBookUrl: 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf',
    rentalAgreementNumber: 'SPK/IKIKASIR/IX/2026/045',
    rentalAgreementDate: '12 Sep 2026',
    setupCompletedAt: '12 Sep 2026 16:45',
    appExpiredDate: '2026-10-12',
    followUpHistory: [
      { id: 'fh-5', date: '12 Sep 2026', time: '16:45', channel: 'WhatsApp', notes: 'Kredensial APK, Username, Password, Buku Panduan, & Surat Sewa dikirim via WA.' }
    ]
  }
]

export function getOrCreateCustomerReferralCode(customer: { name?: string; id?: string; referralCode?: string }): string {
  if (customer.referralCode && customer.referralCode.trim().length > 0) {
    return customer.referralCode.trim().toUpperCase()
  }
  const cleanName = (customer.name || 'PELANGGAN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
  const cleanId = (customer.id || '101').replace(/[^a-zA-Z0-9]/g, '').slice(-3).toUpperCase()
  return `REF-${cleanName}${cleanId}`
}

const initialCustomers: Customer[] = [
  {
    id: 'cust-101',
    no: 1,
    name: 'Budi Santoso',
    businessName: 'Toko Budi Jaya',
    packageType: 'Custom / IT One',
    phone: '081234567890',
    email: 'budi@email.com',
    category: 'Retail',
    expiredDate: '2026-12-31', // Future date
    status: 'active',
    amount: 1500000,
    paymentMethod: 'QRIS',
    referralCode: 'REF-BUDI101'
  },
  {
    id: 'cust-102',
    no: 2,
    name: 'Dewi Lestari',
    businessName: 'Butik Dewi',
    packageType: 'Custom / IT One',
    phone: '082123456789',
    email: 'dewi@email.com',
    category: 'Fashion & Butik',
    expiredDate: '2026-10-15', // Active
    status: 'active',
    amount: 750000,
    paymentMethod: 'Transfer BCA',
    referralCode: 'REF-DEWI102'
  },
  {
    id: 'cust-103',
    no: 3,
    name: 'Siti Aisyah',
    businessName: 'Warung Bu Siti',
    packageType: 'Basic',
    phone: '085712345678',
    email: 'siti@email.com',
    category: 'Kuliner & F&B',
    expiredDate: '2026-09-01', // Expired
    status: 'expired',
    amount: 250000,
    paymentMethod: 'Transfer BCA',
    referralCode: 'REF-SITI103'
  },
  {
    id: 'cust-104',
    no: 4,
    name: 'Donni Cell',
    businessName: 'Donni Pulsa & Aksesoris',
    packageType: 'Basic',
    phone: '085619283746',
    email: 'donni@cell.com',
    category: 'Retail',
    expiredDate: '2026-08-31', // Expired
    status: 'expired',
    amount: 250000,
    paymentMethod: 'QRIS',
    referralCode: 'REF-DONNI104'
  },
  {
    id: 'cust-105',
    no: 5,
    name: 'Fajar Store',
    businessName: 'Fajar Elektronik',
    packageType: 'Custom / IT One',
    phone: '081298471928',
    email: 'fajar@store.com',
    category: 'Retail',
    expiredDate: '2026-08-28', // Expired
    status: 'expired',
    amount: 500000,
    paymentMethod: 'Transfer Mandiri',
    referralCode: 'REF-FAJAR105'
  }
]

const initialInvoices: SubscriptionInvoice[] = [
  {
    id: 'INV-20260901',
    customerId: 'cust-101',
    customerName: 'Budi Santoso',
    businessName: 'Toko Budi Jaya',
    phone: '081234567890',
    package: 'Custom / IT One',
    amount: 1500000,
    billingCycleMonths: 6,
    date: '10 Sep 2026',
    paymentMethod: 'QRIS',
    status: 'Paid'
  },
  {
    id: 'INV-20260902',
    customerId: 'cust-102',
    customerName: 'Dewi Lestari',
    businessName: 'Butik Dewi',
    phone: '082123456789',
    package: 'Custom / IT One',
    amount: 750000,
    billingCycleMonths: 3,
    date: '07 Sep 2026',
    paymentMethod: 'Transfer BCA',
    status: 'Paid'
  },
  {
    id: 'INV-20260903',
    customerId: 'cust-103',
    customerName: 'Siti Aisyah',
    businessName: 'Warung Bu Siti',
    phone: '085712345678',
    package: 'Basic',
    amount: 250000,
    billingCycleMonths: 1,
    date: '01 Agu 2026',
    paymentMethod: 'Transfer BCA',
    status: 'Paid'
  },
  {
    id: 'INV-20260904',
    customerId: 'cust-104',
    customerName: 'Donni Cell',
    businessName: 'Donni Pulsa & Aksesoris',
    phone: '085619283746',
    package: 'Basic',
    amount: 250000,
    billingCycleMonths: 1,
    date: '09 Sep 2026',
    paymentMethod: 'Transfer BCA',
    status: 'Pending'
  }
]
// SINGLETON REACTIVE STATE
const leads = ref<ClientLead[]>([])
const customers = ref<Customer[]>([])
const invoices = ref<SubscriptionInvoice[]>([])
const packages = ref<PricingPackage[]>([])
const currentRole = ref<'Super Admin' | 'Finance' | 'Teknisi' | 'Admin' | 'Staff' | 'Kasir'>('Super Admin')
const notifications = ref<import('../types/crm').SystemNotification[]>([])

function loadAllFromStorage() {
  if (typeof localStorage === 'undefined') return
  try {
    const rawRole = localStorage.getItem(STORAGE_KEY_ROLE)
    if (rawRole) currentRole.value = rawRole as any

    const rawNotif = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS)
    if (rawNotif) notifications.value = JSON.parse(rawNotif)
    else { notifications.value = [...initialNotifications]; saveStorage(STORAGE_KEY_NOTIFICATIONS, notifications.value) }

    const rawL = localStorage.getItem(STORAGE_KEY_LEADS)
    if (rawL) leads.value = JSON.parse(rawL)
    else { leads.value = [...initialLeads]; saveStorage(STORAGE_KEY_LEADS, leads.value) }

    const rawC = localStorage.getItem(STORAGE_KEY_CUSTOMERS)
    if (rawC) {
      const parsed: Customer[] = JSON.parse(rawC)
      customers.value = parsed.map(c => ({
        ...c,
        referralCode: c.referralCode || getOrCreateCustomerReferralCode(c)
      }))
    } else {
      customers.value = [...initialCustomers]
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    const rawI = localStorage.getItem(STORAGE_KEY_INVOICES)
    if (rawI) invoices.value = JSON.parse(rawI)
    else { invoices.value = [...initialInvoices]; saveStorage(STORAGE_KEY_INVOICES, invoices.value) }

    const rawP = localStorage.getItem(STORAGE_KEY_PACKAGES)
    if (rawP) {
      packages.value = JSON.parse(rawP)
      const hasCustom = packages.value.some(p => p.name === 'Custom / IT One' || p.id === 'custom-it-one')
      if (!hasCustom) {
        const customPkg = initialPackages.find(p => p.id === 'custom-it-one')
        if (customPkg) {
          packages.value.push({ ...customPkg })
          saveStorage(STORAGE_KEY_PACKAGES, packages.value)
        }
      }
    } else {
      packages.value = [...initialPackages]
      saveStorage(STORAGE_KEY_PACKAGES, packages.value)
    }
  } catch (e) {
    console.error('Failed loading storage', e)
    leads.value = [...initialLeads]
    customers.value = [...initialCustomers]
    invoices.value = [...initialInvoices]
    packages.value = [...initialPackages]
    notifications.value = [...initialNotifications]
  }
}

function saveStorage(key: string, data: any) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) }
  catch (e) { console.error('Failed saving storage', e) }
}


// Initial load
loadAllFromStorage()

export function useAppData() {

  // Helper date formatters
  const getTodayISO = () => new Date().toISOString().split('T')[0]
  const getTodayFormatted = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const d = new Date()
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  // DYNAMIC EXPIRED CALCULATION LOGIC (Rule 10 & 11)
  // Computes dynamic status ('active', 'expiring', 'expired'), daysLeft, and daysExpired for a customer
  const getComputedCustomerStatus = (c: Customer) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parse expiredDate string (supports 'YYYY-MM-DD' or 'DD MMM YYYY')
    let expDate: Date
    if (c.expiredDate.includes('-')) {
      expDate = new Date(c.expiredDate)
    } else {
      expDate = new Date(c.expiredDate)
      if (isNaN(expDate.getTime())) {
        expDate = new Date() // fallback
      }
    }
    expDate.setHours(0, 0, 0, 0)

    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let computedStatus: 'active' | 'expiring' | 'expired' = 'active'
    let daysLeft = 0
    let daysExpired = 0

    if (diffDays < 0) {
      computedStatus = 'expired'
      daysExpired = Math.abs(diffDays)
    } else if (diffDays <= 7) {
      computedStatus = 'expiring'
      daysLeft = diffDays
    } else {
      computedStatus = 'active'
      daysLeft = diffDays
    }

    return { computedStatus, daysLeft, daysExpired }
  }

  // Dynamic Expired Customers List (Rule 11)
  const expiredCustomers = computed(() => {
    return customers.value
      .map(c => {
        const { computedStatus, daysExpired } = getComputedCustomerStatus(c)
        return {
          ...c,
          computedStatus,
          daysExpired: daysExpired || 1
        }
      })
      .filter(c => c.computedStatus === 'expired')
  })

  // Dynamic Expiring Soon Customers List (H-7 to H-0)
  const expiringCustomers = computed(() => {
    return customers.value
      .map(c => {
        const { computedStatus, daysLeft } = getComputedCustomerStatus(c)
        return {
          ...c,
          computedStatus,
          daysLeft
        }
      })
      .filter(c => c.computedStatus === 'expiring')
  })

  // ==========================================
  // ACTIONS: CALON CLIENT / LEADS
  // ==========================================
  const addRegistration = (data: {
    name: string
    businessName: string
    /** @deprecated gunakan businessType */
    businessCategory?: string
    phone: string
    email: string
    address?: string
    packageInterest: PackageType | string
    source?: LeadSource
    notes?: string
    // Field lama (kompatibilitas)
    employeeCount?: string
    employeeCountChoice?: string
    employeeCountCustom?: string
    willingToTry?: string
    willingToTest?: string
    // Field baru
    businessType?: string
    city?: string
    outletCount?: string
    employeeAppCount?: string
    currentRecordingMethod?: string
    neededFeatures?: string[]
    otherNeededFeature?: string
    specialNeed?: string
    knownFrom?: string
    otherKnownFrom?: string
    consentAgreed?: boolean
    referralCode?: string
    referredByCustomerId?: string
    referredByCustomerName?: string
    referredByBusinessName?: string
  }) => {
    const today = getTodayFormatted()
    const nowIso = new Date().toISOString()
    const source: LeadSource = data.source || 'Website'
    const uniqueId = 'REG-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    const selectedPackage = packages.value.find(pkg => pkg.name === data.packageInterest)
    const packagePrice = selectedPackage?.isConsultation ? 0 : (selectedPackage?.price ?? 0)
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    const empCountVal = data.employeeCountChoice === 'Yang lain'
      ? (data.employeeCountCustom ? `Yang lain (${data.employeeCountCustom})` : 'Yang lain')
      : (data.employeeCount || data.employeeCountChoice || '-')

    // Gabungkan neededFeatures menjadi string yang mudah dibaca untuk notes
    const featuresText = data.neededFeatures?.length
      ? data.neededFeatures.join(', ') + (data.otherNeededFeature ? `, Lainnya: ${data.otherNeededFeature}` : '')
      : '-'
    const knownFromText = data.knownFrom === 'Lainnya' && data.otherKnownFrom
      ? `Lainnya (${data.otherKnownFrom})`
      : (data.knownFrom || '-')

    const autoNotes = data.notes || [
      `Pendaftaran mandiri via ${source}.`,
      `Paket: ${data.packageInterest}.`,
      data.businessType ? `Jenis Usaha: ${data.businessType}.` : '',
      data.city ? `Kota: ${data.city}.` : '',
      data.outletCount ? `Jumlah outlet: ${data.outletCount}.` : '',
      data.employeeAppCount ? `Pemakai aplikasi: ${data.employeeAppCount}.` : '',
      data.currentRecordingMethod ? `Pencatatan saat ini: ${data.currentRecordingMethod}.` : '',
      featuresText !== '-' ? `Fitur dibutuhkan: ${featuresText}.` : '',
      data.willingToTry ? `Minat mencoba: ${data.willingToTry}.` : '',
      data.willingToTest ? `Tester: ${data.willingToTest}.` : '',
      knownFromText !== '-' ? `Sumber info: ${knownFromText}.` : '',
      data.specialNeed ? `Kebutuhan khusus: ${data.specialNeed}.` : '',
    ].filter(Boolean).join(' ')

    const newLead: ClientLead = {
      id: uniqueId,
      registration_id: uniqueId,
      no: leads.value.length + 1,
      name: data.name.trim(),
      nama_lengkap: data.name.trim(),
      businessName: data.businessName.trim(),
      nama_bisnis: data.businessName.trim(),
      businessCategory: data.businessType || data.businessCategory?.trim() || '-',
      kategori_bisnis: data.businessType || data.businessCategory?.trim() || '-',
      phone: data.phone.trim(),
      whatsapp: data.phone.trim(),
      email: data.email.trim(),
      address: data.address?.trim() || '',
      status: 'New',
      source: source,
      registrationDate: today,
      tanggal_pendaftaran: today,
      lastFollowUp: today,
      packageInterest: data.packageInterest,
      paket: data.packageInterest,
      harga_paket: packagePrice,
      estimatedDeal: packagePrice,
      notes: autoNotes,
      followUpSchedule: 'Hari ini',
      created_at: nowIso,
      updated_at: nowIso,
      // Field lama
      employeeCount: empCountVal,
      employeeCountChoice: data.employeeCountChoice,
      employeeCountCustom: data.employeeCountCustom,
      willingToTry: data.willingToTry || '-',
      willingToTest: data.willingToTest || '-',
      // Field baru
      businessType: data.businessType,
      city: data.city,
      outletCount: data.outletCount,
      employeeAppCount: data.employeeAppCount,
      currentRecordingMethod: data.currentRecordingMethod,
      neededFeatures: data.neededFeatures,
      otherNeededFeature: data.otherNeededFeature,
      specialNeed: data.specialNeed,
      knownFrom: data.knownFrom,
      otherKnownFrom: data.otherKnownFrom,
      consentAgreed: data.consentAgreed,
      referralCode: data.referralCode?.trim() || undefined,
      referredByCustomerId: data.referredByCustomerId || undefined,
      referredByCustomerName: data.referredByCustomerName || undefined,
      referredByBusinessName: data.referredByBusinessName || undefined,
      followUpHistory: [
        {
          id: 'fh-' + Date.now(),
          date: today,
          time: currentTime,
          channel: 'Sistem',
          notes: `Pendaftaran berhasil tersimpan via ${source} (Status: Baru).`
        }
      ]
    }

    leads.value.unshift(newLead)
    saveStorage(STORAGE_KEY_LEADS, leads.value)
    return newLead
  }


  // Update Lead Status
  const updateLeadStatus = (id: string, newStatus: LeadStatus) => {
    const lead = leads.value.find(l => l.id === id)
    if (lead) {
      const today = getTodayFormatted()
      lead.status = newStatus
      lead.lastFollowUp = today
      lead.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: today,
        time: '12:00',
        channel: 'Sistem',
        notes: `Status pendaftaran diubah menjadi: ${newStatus}`
      })
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
  }

  // SETUJUI CALON CLIENT (Rule 6: Calon Client -> Disetujui -> Masuk Semua Pelanggan + Invoice)
  const approveLead = (leadId: string, paymentData?: {
    amount?: number
    paymentMethod?: string
    paymentProofUrl?: string
    notes?: string
    date?: string
  }) => {
    const lead = leads.value.find(l => l.id === leadId)
    if (!lead) return null

    // Mark lead status as Converted / Disetujui
    lead.status = 'Converted'
    lead.paymentStatus = 'verified'
    lead.lastFollowUp = getTodayFormatted()
    lead.updated_at = new Date().toISOString()
    if (paymentData?.amount) lead.paymentAmount = paymentData.amount
    if (paymentData?.paymentMethod) lead.paymentMethod = paymentData.paymentMethod
    if (paymentData?.paymentProofUrl) lead.paymentProofUrl = paymentData.paymentProofUrl
    if (paymentData?.notes) lead.paymentNotes = paymentData.notes

    lead.followUpHistory.unshift({
      id: 'fh-' + Date.now(),
      date: getTodayFormatted(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      channel: 'Sistem',
      notes: paymentData?.notes || 'Pendaftaran disetujui Super Admin. Klien dikonversi menjadi Pelanggan Aktif.'
    })
    saveStorage(STORAGE_KEY_LEADS, leads.value)

    // Check if customer already exists (Anti-Duplication Rule)
    let targetCustomer: Customer
    const existing = customers.value.find(c => c.id === 'cust-' + lead.id || (lead.phone && c.phone === lead.phone) || (lead.email && c.email === lead.email))

    const packagePrices: Record<string, number> = {
      'Basic': 250000,
      'Pro': 500000,
      'Add on': 150000,
      'Custom / IT One': 1500000
    }
    const finalAmount = paymentData?.amount ?? lead.paymentAmount ?? packagePrices[lead.packageInterest || 'Basic'] ?? 250000
    const finalMethod = paymentData?.paymentMethod ?? lead.paymentMethod ?? 'QRIS'
    const finalProof = paymentData?.paymentProofUrl ?? lead.paymentProofUrl

    if (existing) {
      targetCustomer = existing
      targetCustomer.amount = finalAmount
      targetCustomer.paymentMethod = finalMethod
      if (!targetCustomer.referralCode) {
        targetCustomer.referralCode = getOrCreateCustomerReferralCode(targetCustomer)
      }
      if (lead.referredByCustomerId && !targetCustomer.referredByCustomerId) {
        targetCustomer.referredByCustomerId = lead.referredByCustomerId
        targetCustomer.referredByCustomerName = lead.referredByCustomerName
      }
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    } else {
      // Calculate 1 month expired date
      const expDate = new Date()
      expDate.setMonth(expDate.getMonth() + 1)
      const expISO = expDate.toISOString().substring(0, 10)

      targetCustomer = {
        id: 'cust-' + lead.id,
        no: customers.value.length + 1,
        name: lead.name,
        businessName: lead.businessName,
        packageType: (lead.packageInterest as import('../types/dashboard').PackageType) || 'Basic',
        phone: lead.phone,
        email: lead.email,
        category: lead.businessCategory || 'Retail',
        expiredDate: expISO,
        status: 'active',
        amount: finalAmount,
        paymentMethod: finalMethod,
        referralCode: getOrCreateCustomerReferralCode({ name: lead.name, id: 'cust-' + lead.id }),
        referredByCustomerId: lead.referredByCustomerId,
        referredByCustomerName: lead.referredByCustomerName
      }
      customers.value.unshift(targetCustomer)
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    // Create Initial Invoice for Customer (Rule 9)
    const newInvoice: SubscriptionInvoice = {
      id: 'INV-' + Date.now().toString().slice(-8),
      customerId: targetCustomer.id,
      customerName: targetCustomer.name || '',
      businessName: targetCustomer.businessName || '',
      phone: targetCustomer.phone || '',
      package: targetCustomer.packageType,
      amount: finalAmount,
      billingCycleMonths: 1,
      date: paymentData?.date || getTodayFormatted(),
      paymentMethod: finalMethod,
      status: 'Paid',
      paymentProofUrl: finalProof
    }
    invoices.value.unshift(newInvoice)
    saveStorage(STORAGE_KEY_INVOICES, invoices.value)

    return targetCustomer
  }

  // Update Lead directly
  const updateLead = (updatedLead: ClientLead) => {
    const idx = leads.value.findIndex(l => l.id === updatedLead.id)
    if (idx !== -1) {
      leads.value[idx] = { ...updatedLead, updated_at: new Date().toISOString() }
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
  }

  // Add Follow Up log
  const addFollowUpLog = (clientId: string, notes: string, channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem' = 'Sistem') => {
    const lead = leads.value.find(l => l.id === clientId)
    if (lead) {
      const today = getTodayFormatted()
      const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      lead.lastFollowUp = today
      lead.updated_at = new Date().toISOString()
      lead.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: today,
        time: currentTime,
        channel: channel,
        notes: notes
      })
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
  }

  // TOLAK CALON CLIENT (Rule 7: Status Ditolak, tetap tersimpan di riwayat, tidak masuk pelanggan)
  const rejectLead = (leadId: string) => {
    const lead = leads.value.find(l => l.id === leadId)
    if (lead) {
      lead.status = 'Lost'
      lead.lastFollowUp = getTodayFormatted()
      lead.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: getTodayFormatted(),
        time: '12:00',
        channel: 'Sistem',
        notes: 'Pendaftaran ditolak oleh Super Admin.'
      })
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
  }

  // Delete Lead
  const deleteLead = (id: string) => {
    leads.value = leads.value.filter(l => l.id !== id)
    saveStorage(STORAGE_KEY_LEADS, leads.value)
  }

  // ==========================================
  // ACTIONS: INVOICES & PEMBAYARAN (Rule 9 & 10)
  // ==========================================
  const markInvoicePaid = (invoiceId: string) => {
    const inv = invoices.value.find(i => i.id === invoiceId)
    if (inv) {
      inv.status = 'Paid'
      saveStorage(STORAGE_KEY_INVOICES, invoices.value)

      // Update associated customer's active period dynamically (Rule 10)
      const customer = customers.value.find(c => c.id === inv.customerId)
      if (customer) {
        const today = new Date()
        const newExpDate = new Date(today)
        newExpDate.setMonth(newExpDate.getMonth() + (inv.billingCycleMonths || 1))

        customer.expiredDate = newExpDate.toISOString().substring(0, 10)
        customer.status = 'active'
        saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
      }
    }
  }

  // ==========================================
  // ACTIONS: PERPANJANG LANGGANAN (Rule 13 & 19 - Anti Duplikasi)
  // ==========================================
  const renewCustomerSubscription = (data: {
    customerId: string
    packageType: PackageType
    billingCycleMonths: number
    paymentMethod: string
    markPaidImmediately?: boolean
  }) => {
    // 1. Find existing customer (Rule 19: NO duplicate customer!)
    const customer = customers.value.find(c => c.id === data.customerId)
    if (!customer) return null

    // Update customer package if changed
    customer.packageType = data.packageType

    // 2. Create new Invoice for the SAME customer (Rule 13)
    const amountPerMonth = data.packageType === 'Basic' ? 250000 : 500000
    const totalAmount = amountPerMonth * data.billingCycleMonths

    const isPaid = data.markPaidImmediately !== false // default Paid on manual renewal

    const newInvoice: SubscriptionInvoice = {
      id: 'INV-' + Date.now().toString().slice(-8),
      customerId: customer.id,
      customerName: customer.name || '',
      businessName: customer.businessName || '',
      phone: customer.phone || '',
      package: data.packageType,
      amount: totalAmount,
      billingCycleMonths: data.billingCycleMonths,
      date: getTodayFormatted(),
      paymentMethod: data.paymentMethod || 'QRIS',
      status: isPaid ? 'Paid' : 'Pending'
    }

    invoices.value.unshift(newInvoice)
    saveStorage(STORAGE_KEY_INVOICES, invoices.value)

    // 3. If Paid, recalculate Expired Date dynamically (Rule 10 & 13)
    if (isPaid) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let baseDate = new Date(today)
      // If customer was already active with a future expiration, extend from that date
      if (customer.expiredDate) {
        const currentExp = new Date(customer.expiredDate)
        if (currentExp > today) {
          baseDate = currentExp
        }
      }

      baseDate.setMonth(baseDate.getMonth() + data.billingCycleMonths)
      customer.expiredDate = baseDate.toISOString().substring(0, 10)
      customer.status = 'active'

      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    return newInvoice
  }

  // ==========================================
  // STATISTIK SUPER ADMIN (Rule 16)
  // ==========================================
  const statistics = computed(() => {
    const totalLeads = leads.value.length
    const newLeads = leads.value.filter(l => l.status === 'New').length
    const inProgressLeads = leads.value.filter(l => ['Contacted', 'Follow Up', 'Interested'].includes(l.status)).length
    const approvedLeads = leads.value.filter(l => l.status === 'Converted').length
    const rejectedLeads = leads.value.filter(l => l.status === 'Lost').length

    const websiteLeads = leads.value.filter(l => l.source === 'Website').length
    const googleFormLeads = leads.value.filter(l => l.source === 'Google Form').length
    const basicLeads = leads.value.filter(l => l.packageInterest === 'Basic').length
    const addOnLeads = leads.value.filter(l => l.packageInterest === 'Add on').length
    const proLeads = leads.value.filter(l => l.packageInterest === 'Pro').length
    const customLeads = leads.value.filter(l => ['Custom', 'Custom / IT One'].includes(l.packageInterest || '')).length

    const totalCustomers = customers.value.length
    const totalInvoices = invoices.value.length
    const totalPaidRevenue = invoices.value
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + i.amount, 0)

    const totalExpired = expiredCustomers.value.length
    const totalExpiringSoon = expiringCustomers.value.length

    return {
      totalLeads,
      total: totalLeads,
      newLeads,
      newCount: newLeads,
      inProgressLeads,
      inProgressCount: inProgressLeads,
      approvedLeads,
      convertedCount: approvedLeads,
      rejectedLeads,
      lostCount: rejectedLeads,
      websiteLeads,
      websiteCount: websiteLeads,
      googleFormLeads,
      googleFormCount: googleFormLeads,
      basicCount: basicLeads,
      addOnCount: addOnLeads,
      proCount: proLeads,
      customCount: customLeads,
      totalCustomers,
      totalInvoices,
      totalPaidRevenue,
      totalExpired,
      totalExpiringSoon
    }

  })

  // ==========================================
  // WORKFLOW: ROLE & NOTIFICATIONS
  // ==========================================
  const setRole = (newRole: 'Super Admin' | 'Finance' | 'Teknisi' | 'Admin' | 'Staff' | 'Kasir') => {
    currentRole.value = newRole
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ROLE, newRole)
    }
  }

  const addNotification = (item: Omit<import('../types/crm').SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: import('../types/crm').SystemNotification = {
      ...item,
      id: 'notif-' + Date.now(),
      timestamp: 'Baru saja',
      read: false
    }
    notifications.value.unshift(newNotif)
    saveStorage(STORAGE_KEY_NOTIFICATIONS, notifications.value)
    return newNotif
  }

  const markNotificationRead = (id: string) => {
    const n = notifications.value.find(item => item.id === id)
    if (n) {
      n.read = true
      saveStorage(STORAGE_KEY_NOTIFICATIONS, notifications.value)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
    saveStorage(STORAGE_KEY_NOTIFICATIONS, notifications.value)
  }

  const unreadNotificationCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  // ==========================================
  // WORKFLOW: FINANCE (ACC KONFIRMASI) QUEUE
  // Sesuai flowchart: Urutan default Data Terlama (FIFO)
  // ==========================================
  const financeQueue = computed(() => {
    return [...leads.value]
      .filter(l => l.status !== 'Lost')
      .sort((a, b) => {
        // Pending verification prioritized first
        const aPending = a.paymentStatus === 'pending_verification' ? 0 : (a.paymentStatus === 'verified' ? 1 : 2)
        const bPending = b.paymentStatus === 'pending_verification' ? 0 : (b.paymentStatus === 'verified' ? 1 : 2)
        if (aPending !== bPending) return aPending - bPending

        // Data terlama first (FIFO)
        const idA = parseInt(a.id.replace(/[^0-9]/g, '')) || 0
        const idB = parseInt(b.id.replace(/[^0-9]/g, '')) || 0
        return idA - idB
      })
  })

  // ==========================================
  // WORKFLOW: TEKNISI QUEUE
  // Sesuai flowchart: Lihat list data user yang siap dikerjakan
  // ==========================================
  const technicianQueue = computed(() => {
    const list: Array<{
      id: string
      name: string
      businessName: string
      phone: string
      email: string
      packageType: string
      technicianStatus: 'pending_setup' | 'in_progress' | 'completed'
      technicianAssignedTo?: string
      appUsername?: string
      appPassword?: string
      appDownloadUrl?: string
      guideBookUrl?: string
      rentalAgreementNumber?: string
      rentalAgreementDate?: string
      emailIssueReported?: boolean
      emailIssueNotes?: string
      setupCompletedAt?: string
      appExpiredDate?: string
      paymentVerifiedAt?: string
      rawLead?: ClientLead
      rawCustomer?: Customer
    }> = []

    // 1. Dari leads yang sudah di-acc pembayarannya atau berstatus Converted
    leads.value.forEach(lead => {
      if (lead.paymentStatus === 'verified' || lead.technicianStatus || lead.status === 'Converted') {
        const cust = customers.value.find(c => c.id === 'cust-' + lead.id || c.phone === lead.phone || c.email === lead.email)
        list.push({
          id: lead.id,
          name: lead.name,
          businessName: lead.businessName,
          phone: lead.phone,
          email: lead.email,
          packageType: (lead.packageInterest as string) || 'Basic',
          technicianStatus: lead.technicianStatus || cust?.technicianStatus || 'pending_setup',
          technicianAssignedTo: lead.technicianAssignedTo || cust?.technicianAssignedTo || 'Doni Teknisi',
          appUsername: lead.appUsername || cust?.appUsername,
          appPassword: lead.appPassword || cust?.appPassword,
          appDownloadUrl: lead.appDownloadUrl || cust?.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk',
          guideBookUrl: lead.guideBookUrl || cust?.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf',
          rentalAgreementNumber: lead.rentalAgreementNumber || cust?.rentalAgreementNumber,
          rentalAgreementDate: lead.rentalAgreementDate || cust?.rentalAgreementDate,
          emailIssueReported: lead.emailIssueReported || cust?.emailIssueReported,
          emailIssueNotes: lead.emailIssueNotes || cust?.emailIssueNotes,
          setupCompletedAt: lead.setupCompletedAt || cust?.setupCompletedAt,
          appExpiredDate: lead.appExpiredDate || cust?.expiredDate,
          paymentVerifiedAt: lead.paymentVerifiedAt,
          rawLead: lead,
          rawCustomer: cust
        })
      }
    })

    // 2. Tambahkan pelanggan aktif yang belum ada di list
    customers.value.forEach(c => {
      if (!list.some(item => item.id === c.id || item.phone === c.phone || item.email === c.email)) {
        list.push({
          id: c.id,
          name: c.name,
          businessName: c.businessName || '',
          phone: c.phone || '',
          email: c.email || '',
          packageType: c.packageType,
          technicianStatus: c.technicianStatus || 'completed',
          technicianAssignedTo: c.technicianAssignedTo || 'Doni Teknisi',
          appUsername: c.appUsername,
          appPassword: c.appPassword,
          appDownloadUrl: c.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk',
          guideBookUrl: c.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf',
          rentalAgreementNumber: c.rentalAgreementNumber,
          rentalAgreementDate: c.rentalAgreementDate,
          emailIssueReported: c.emailIssueReported,
          emailIssueNotes: c.emailIssueNotes,
          setupCompletedAt: c.setupCompletedAt,
          appExpiredDate: c.expiredDate,
          rawCustomer: c
        })
      }
    })

    const priority: Record<string, number> = {
      pending_setup: 1,
      in_progress: 2,
      completed: 3
    }
    return list.sort((a, b) => (priority[a.technicianStatus] || 99) - (priority[b.technicianStatus] || 99))
  })

  // ==========================================
  // ACTIONS: WORKFLOW FINANCE
  // ==========================================
  const confirmPaymentByFinance = (
    leadId: string,
    data: { paymentAmount?: number; paymentMethod?: string; notes?: string; verifiedBy?: string }
  ) => {
    const lead = leads.value.find(l => l.id === leadId)
    if (!lead) return null

    const today = getTodayFormatted()
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const verifiedBy = data.verifiedBy || 'Rina Finance'

    lead.paymentStatus = 'verified'
    lead.paymentAmount = data.paymentAmount || lead.paymentAmount || (lead.harga_paket || 250000)
    lead.paymentMethod = data.paymentMethod || lead.paymentMethod || 'BCA Transfer'
    lead.paymentVerifiedAt = `${today} ${nowTime}`
    lead.paymentVerifiedBy = verifiedBy
    lead.paymentNotes = data.notes || 'Data pembayaran dan bukti transfer telah diperiksa dan sesuai.'
    lead.technicianStatus = 'pending_setup'
    lead.technicianAssignedTo = 'Doni Teknisi'
    lead.status = 'Converted'

    lead.followUpHistory.unshift({
      id: 'fh-' + Date.now(),
      date: today,
      time: nowTime,
      channel: 'Sistem',
      notes: `Pembayaran Rp ${Number(lead.paymentAmount).toLocaleString('id-ID')} di-Acc oleh Finance (${verifiedBy}). Tugas dikirim ke Teknisi.`
    })
    saveStorage(STORAGE_KEY_LEADS, leads.value)

    // CRM dirubah menjadi data Client/User
    const cust = approveLead(lead.id)
    if (cust) {
      cust.technicianStatus = 'pending_setup'
      cust.technicianAssignedTo = 'Doni Teknisi'
      cust.amount = lead.paymentAmount
      cust.paymentMethod = lead.paymentMethod
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    // Kirim notifikasi ke Teknisi
    addNotification({
      title: 'Tugas Penyiapan Baru (Teknisi)',
      message: `Pembayaran pendaftar "${lead.name}" (${lead.businessName}) telah di-Acc oleh Finance (${verifiedBy}). Silakan siapkan aplikasi & kredensial akun kasir.`,
      roleTarget: 'Teknisi',
      type: 'technical_task',
      link: '/semua-pelanggan'
    })

    // Template WA konfirmasi pembayaran
    const clientWaMsg = `Halo Kak ${lead.name} (${lead.businessName}),\n\nTerima kasih atas pembayaran paket IKI KASIR (${lead.packageInterest || 'Basic'}) sebesar Rp ${Number(lead.paymentAmount).toLocaleString('id-ID')}.\n\nPembayaran Anda telah BERHASIL kami verifikasi & dikonfirmasi masuk ke sistem IKI KASIR.\n\nSaat ini data Anda telah diteruskan ke tim Teknisi kami untuk penyiapan aplikasi kasir dan kredensial akun. Mohon ditunggu ya kak, tim teknisi kami akan segera menghubungi Kakak via WhatsApp setelah aplikasi siap digunakan.\n\nSalam sukses selalu! 🙏\nTim Finance IKI KASIR`

    return {
      lead,
      customer: cust,
      whatsappText: clientWaMsg,
      whatsappUrl: getCustomerWaUrl(lead.phone, clientWaMsg)
    }
  }

  const rejectPaymentByFinance = (leadId: string, reason: string) => {
    const lead = leads.value.find(l => l.id === leadId)
    if (!lead) return
    const today = getTodayFormatted()
    lead.paymentStatus = 'rejected'
    lead.paymentNotes = reason
    lead.followUpHistory.unshift({
      id: 'fh-' + Date.now(),
      date: today,
      time: '12:00',
      channel: 'Sistem',
      notes: `Pembayaran ditolak Finance: ${reason}`
    })
    saveStorage(STORAGE_KEY_LEADS, leads.value)
  }

  // ==========================================
  // ACTIONS: WORKFLOW TEKNISI
  // ==========================================
  const startTechnicianSetup = (id: string, teknisiName = 'Doni Teknisi') => {
    const lead = leads.value.find(l => l.id === id)
    if (lead) {
      lead.technicianStatus = 'in_progress'
      lead.technicianAssignedTo = teknisiName
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
    const cust = customers.value.find(c => c.id === id || c.id === 'cust-' + id || (lead && (c.phone === lead.phone || c.email === lead.email)))
    if (cust) {
      cust.technicianStatus = 'in_progress'
      cust.technicianAssignedTo = teknisiName
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }
  }

  const reportEmailIssue = (id: string, issueNotes: string) => {
    const lead = leads.value.find(l => l.id === id)
    const cust = customers.value.find(c => c.id === id || c.id === 'cust-' + id || (lead && (c.phone === lead.phone || c.email === lead.email)))

    if (lead) {
      lead.emailIssueReported = true
      lead.emailIssueNotes = issueNotes
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }
    if (cust) {
      cust.emailIssueReported = true
      cust.emailIssueNotes = issueNotes
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    const name = lead?.name || cust?.name || 'Pelanggan'
    const biz = lead?.businessName || cust?.businessName || ''
    const email = lead?.email || cust?.email || ''
    const phone = lead?.phone || cust?.phone || ''

    const waMsg = `Halo Kak ${name} (${biz}),\n\nKami dari tim Teknisi IKI KASIR ingin mengonfirmasi terkait alamat email akun kasir Anda (${email}).\n\nKendala yang kami temukan:\n"${issueNotes}"\n\nMohon konfirmasi apakah alamat email tersebut sudah benar atau ada email aktif alternatif yang ingin didaftarkan agar kami dapat segera menyelesaikan setup aplikasi kasir Anda.\n\nTerima kasih atas kerja samanya! 🙏`

    return {
      whatsappText: waMsg,
      whatsappUrl: getCustomerWaUrl(phone, waMsg)
    }
  }

  const resolveEmailIssue = (id: string, newEmail: string) => {
    const lead = leads.value.find(l => l.id === id)
    const cust = customers.value.find(c => c.id === id || c.id === 'cust-' + id || (lead && (c.phone === lead.phone || c.email === lead.email)))

    if (lead) {
      lead.email = newEmail
      lead.emailIssueReported = false
      lead.emailIssueNotes = undefined
      lead.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: getTodayFormatted(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        channel: 'Sistem',
        notes: `Alamat email klien berhasil diperbarui menjadi ${newEmail} (Kendala terselesaikan).`
      })
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }

    if (cust) {
      cust.email = newEmail
      cust.emailIssueReported = false
      cust.emailIssueNotes = undefined
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }
  }

  const completeTechnicianSetup = (
    id: string,
    setupData: {
      appUsername: string
      appPassword: string
      appDownloadUrl?: string
      guideBookUrl?: string
      rentalAgreementNumber?: string
      rentalAgreementDate?: string
      expiredDate: string
      teknisiName?: string
      notes?: string
    }
  ) => {
    const lead = leads.value.find(l => l.id === id)
    const cust = customers.value.find(c => c.id === id || c.id === 'cust-' + id || (lead && (c.phone === lead.phone || c.email === lead.email)))
    const today = getTodayFormatted()
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const teknisi = setupData.teknisiName || 'Doni Teknisi'

    const appDownloadUrl = setupData.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk'
    const guideBookUrl = setupData.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf'
    const rentalAgreementNumber = setupData.rentalAgreementNumber || `SPK/IKIKASIR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`

    if (lead) {
      lead.technicianStatus = 'completed'
      lead.technicianAssignedTo = teknisi
      lead.appUsername = setupData.appUsername
      lead.appPassword = setupData.appPassword
      lead.appDownloadUrl = appDownloadUrl
      lead.guideBookUrl = guideBookUrl
      lead.rentalAgreementNumber = rentalAgreementNumber
      lead.rentalAgreementDate = setupData.rentalAgreementDate || today
      lead.setupCompletedAt = `${today} ${nowTime}`
      lead.appExpiredDate = setupData.expiredDate
      lead.emailIssueReported = false

      lead.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: today,
        time: nowTime,
        channel: 'WhatsApp',
        notes: `Aplikasi selesai disiapkan oleh Teknisi (${teknisi}). Kredensial, panduan, dan surat sewa diserahkan ke klien.`
      })
      saveStorage(STORAGE_KEY_LEADS, leads.value)
    }

    if (cust) {
      cust.technicianStatus = 'completed'
      cust.technicianAssignedTo = teknisi
      cust.appUsername = setupData.appUsername
      cust.appPassword = setupData.appPassword
      cust.appDownloadUrl = appDownloadUrl
      cust.guideBookUrl = guideBookUrl
      cust.rentalAgreementNumber = rentalAgreementNumber
      cust.rentalAgreementDate = setupData.rentalAgreementDate || today
      cust.setupCompletedAt = `${today} ${nowTime}`
      cust.expiredDate = setupData.expiredDate
      cust.status = 'active'
      cust.emailIssueReported = false
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
    }

    const clientName = lead?.name || cust?.name || 'Pelanggan'
    const bizName = lead?.businessName || cust?.businessName || ''
    const clientPhone = lead?.phone || cust?.phone || ''

    addNotification({
      title: 'Aplikasi Kasir Selesai Disiapkan',
      message: `Aplikasi untuk "${clientName}" (${bizName}) telah selesai disiapkan oleh Teknisi (${teknisi}) dan kredensial diserahkan via WhatsApp.`,
      roleTarget: 'All',
      type: 'setup_completed',
      link: '/semua-pelanggan'
    })

    const waDeliveryText = `Halo Kak ${clientName} (${bizName}),\n\nKabar gembira! Aplikasi IKI KASIR untuk usaha Anda telah siap digunakan 🚀\n\nBerikut detail akses akun dan berkas kelengkapan Anda:\n━━━━━━━━━━━━━━━━━━━━\n📱 *Download Aplikasi (APK)*:\n${appDownloadUrl}\n\n👤 *Username*: ${setupData.appUsername}\n🔑 *Password*: ${setupData.appPassword}\n\n📖 *Buku Panduan Penggunaan*:\n${guideBookUrl}\n\n📄 *Surat Perjanjian Sewa*:\nNo: ${rentalAgreementNumber}\n(Tercatat resmi dalam sistem IKI KASIR)\n\n📅 *Masa Aktif Berlangganan*:\nAktif hingga: ${setupData.expiredDate}\n━━━━━━━━━━━━━━━━━━━━\nSilakan unduh aplikasi dan login menggunakan username & password di atas.\n\nJika Kakak membutuhkan panduan awal atau pendampingan input menu & produk, tim Teknisi kami siap membantu!\n\nSelamat bertransaksi & semoga usaha Kakak semakin sukses! 🙏✨\nTim Teknisi IKI KASIR`

    return {
      whatsappText: waDeliveryText,
      whatsappUrl: getCustomerWaUrl(clientPhone, waDeliveryText),
      rentalAgreementNumber
    }
  }

  // ==========================================
  // PRICING PACKAGES CRUD
  // ==========================================
  const addPackage = (pkg: Omit<PricingPackage, 'id'>) => {
    const newPackage: PricingPackage = { ...pkg, id: 'pkg-' + Date.now() }
    packages.value.push(newPackage)
    saveStorage(STORAGE_KEY_PACKAGES, packages.value)
    return newPackage
  }

  const updatePackage = (updatedPkg: PricingPackage) => {
    const idx = packages.value.findIndex(p => p.id === updatedPkg.id)
    if (idx !== -1) {
      packages.value[idx] = { ...updatedPkg }
      saveStorage(STORAGE_KEY_PACKAGES, packages.value)
    }
  }

  const deletePackage = (id: string) => {
    packages.value = packages.value.filter(p => p.id !== id)
    saveStorage(STORAGE_KEY_PACKAGES, packages.value)
  }

  const togglePackageActive = (id: string) => {
    const pkg = packages.value.find(p => p.id === id)
    if (pkg) {
      pkg.isActive = !pkg.isActive
      saveStorage(STORAGE_KEY_PACKAGES, packages.value)
    }
  }

  return {
    leads,
    customers,
    invoices,
    packages,
    currentRole,
    notifications,
    unreadNotificationCount,
    financeQueue,
    technicianQueue,
    expiredCustomers,
    expiringCustomers,
    statistics,
    setRole,
    addNotification,
    markNotificationRead,
    clearAllNotifications,
    confirmPaymentByFinance,
    rejectPaymentByFinance,
    startTechnicianSetup,
    reportEmailIssue,
    resolveEmailIssue,
    completeTechnicianSetup,
    addPackage,
    updatePackage,
    deletePackage,
    togglePackageActive,
    addRegistration,
    updateLead,
    updateLeadStatus,
    addFollowUpLog,
    approveLead,
    rejectLead,
    deleteLead,
    markInvoicePaid,
    renewCustomerSubscription,
    getAdminWaUrl,
    getCustomerWaUrl,
    getComputedCustomerStatus,
    getOrCreateCustomerReferralCode,
    resetAllToDefault: () => {
      leads.value = [...initialLeads]
      customers.value = [...initialCustomers]
      invoices.value = [...initialInvoices]
      packages.value = [...initialPackages]
      notifications.value = [...initialNotifications]
      currentRole.value = 'Super Admin'
      saveStorage(STORAGE_KEY_LEADS, leads.value)
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
      saveStorage(STORAGE_KEY_INVOICES, invoices.value)
      saveStorage(STORAGE_KEY_PACKAGES, packages.value)
      saveStorage(STORAGE_KEY_NOTIFICATIONS, notifications.value)
      saveStorage(STORAGE_KEY_ROLE, currentRole.value)
    }
  }
}


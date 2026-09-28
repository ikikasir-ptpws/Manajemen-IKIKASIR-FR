import { ref, computed } from 'vue'
import type { ClientLead, LeadStatus, LeadSource, FollowUpLog } from '../types/crm'
import type { Customer, PackageType } from '../types/dashboard'

export interface PricingPackage {
  id: string
  name: string
  cardClass: string
  badge: string
  cardSub: string
  icon: string
  isConsultation: boolean
  price: number
  priceTitle?: string
  priceSubtext?: string
  period: string
  features: string[]
  btnText: string
  btnClass: string
  waText: string
  isActive: boolean
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

// STORAGE KEYS
const STORAGE_KEY_LEADS = 'ikikasir_leads_v3'
const STORAGE_KEY_CUSTOMERS = 'ikikasir_customers_v3'
const STORAGE_KEY_INVOICES = 'ikikasir_invoices_v3'
const STORAGE_KEY_PACKAGES = 'ikikasir_packages_v1'

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
}

// INITIAL SEED DATA
const initialPackages: PricingPackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    cardClass: 'price-card basic',
    badge: '',
    cardSub: 'Cocok untuk usaha kecil, menengah, dan pemula.',
    icon: 'Box',
    isConsultation: false,
    price: 250000,
    period: '/bulan',
    features: [
      'Manajemen produk tanpa batas',
      'Transaksi kasir cepat & akurat',
      'Laporan penjualan lengkap',
      'Support bantuan pelanggan'
    ],
    btnText: 'Mulai Langganan',
    btnClass: 'btn-outline-blue',
    waText: 'Halo tim IKI KASIR, saya ingin berlangganan Paket Basic',
    isActive: true
  },
  {
    id: 'custom',
    name: 'Custom / IT One',
    cardClass: 'price-card pro',
    badge: 'Solusi Khusus',
    cardSub: 'Solusi khusus sesuai kebutuhan skala besar.',
    icon: 'Crown',
    isConsultation: true,
    price: 0,
    priceTitle: 'Konsultasi Terlebih Dahulu',
    priceSubtext: 'Tanya-tanya & penyesuaian fitur bisnis',
    period: '',
    features: [
      'Semua fitur Basic',
      'Fitur khusus sesuai kebutuhan bisnis',
      'Integrasi sistem & modul khusus',
      'Dedicated support & pendampingan'
    ],
    btnText: 'Konsultasi Sekarang',
    btnClass: 'btn-solid-white',
    waText: 'Halo tim IKI KASIR, saya ingin konsultasi mengenai Paket Custom IT One',
    isActive: true
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
    email: 'budi@email.com',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    status: 'New',
    source: 'Website',
    registrationDate: '26 Sep 2026',
    lastFollowUp: '26 Sep 2026',
    packageInterest: 'Custom / IT One',
    estimatedDeal: 0,
    notes: 'Pendaftaran baru melalui Form Website. Klien meminta info custom integrasi.',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-1', date: '26 Sep 2026', time: '10:30', channel: 'Sistem', notes: 'Data pendaftaran masuk dari Website.' }
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
    source: 'Google Form',
    registrationDate: '25 Sep 2026',
    lastFollowUp: '25 Sep 2026',
    packageInterest: 'Basic',
    estimatedDeal: 250000,
    notes: 'Pendaftaran via Google Form (Survei Minat Paket Basic POS).',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-2', date: '25 Sep 2026', time: '14:15', channel: 'Sistem', notes: 'Data pendaftaran masuk dari Google Form.' }
    ]
  },
  {
    id: 'c-103',
    no: 3,
    name: 'Andi Wijaya',
    businessName: 'Andi Store',
    businessCategory: 'Retail',
    phone: '081398765432',
    email: 'andi@email.com',
    address: 'Jl. Ahmad Yani No. 45, Bandung',
    status: 'Contacted',
    source: 'Website',
    registrationDate: '24 Sep 2026',
    lastFollowUp: '24 Sep 2026',
    packageInterest: 'Basic',
    estimatedDeal: 250000,
    notes: 'Sudah dihubungi via WA. Menunggu konfirmasi pembayaran.',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-3', date: '24 Sep 2026', time: '11:15', channel: 'WhatsApp', notes: 'Menjelaskan paket Basic dan sistem pencatatan stok.' }
    ]
  },
  {
    id: 'c-104',
    no: 4,
    name: 'Siti Aisyah',
    businessName: 'Siti Collection',
    businessCategory: 'Fashion & Butik',
    phone: '085711223344',
    email: 'siti@email.com',
    address: 'Jl. Malioboro No. 12, Yogyakarta',
    status: 'Converted',
    source: 'Google Form',
    registrationDate: '10 Sep 2026',
    lastFollowUp: '12 Sep 2026',
    packageInterest: 'Basic',
    estimatedDeal: 250000,
    notes: 'Pendaftaran disetujui. Telah dikonversi menjadi pelanggan aktif.',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-4', date: '12 Sep 2026', time: '10:00', channel: 'Sistem', notes: 'Status diubah menjadi Disetujui.' }
    ]
  },
  {
    id: 'c-105',
    no: 5,
    name: 'Rudi Hermawan',
    businessName: 'Rudi Mart',
    businessCategory: 'Minimarket & Grosir',
    phone: '082155667788',
    email: 'rudi@email.com',
    address: 'Jl. Pemuda No. 88, Semarang',
    status: 'Lost',
    source: 'Website',
    registrationDate: '01 Sep 2026',
    lastFollowUp: '02 Sep 2026',
    packageInterest: 'Custom / IT One',
    estimatedDeal: 0,
    notes: 'Klien belum memiliki anggaran untuk integrasi cabang.',
    followUpSchedule: 'Terlambat',
    followUpHistory: [
      { id: 'fh-5', date: '02 Sep 2026', time: '16:00', channel: 'Telepon', notes: 'Diskusi kebutuhan kustom ditolak.' }
    ]
  }
]

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
    paymentMethod: 'QRIS'
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
    paymentMethod: 'Transfer BCA'
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
    paymentMethod: 'Transfer BCA'
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
    paymentMethod: 'QRIS'
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
    paymentMethod: 'Transfer Mandiri'
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

function loadAllFromStorage() {
  try {
    const rawL = localStorage.getItem(STORAGE_KEY_LEADS)
    if (rawL) leads.value = JSON.parse(rawL)
    else { leads.value = [...initialLeads]; saveStorage(STORAGE_KEY_LEADS, leads.value) }

    const rawC = localStorage.getItem(STORAGE_KEY_CUSTOMERS)
    if (rawC) customers.value = JSON.parse(rawC)
    else { customers.value = [...initialCustomers]; saveStorage(STORAGE_KEY_CUSTOMERS, customers.value) }

    const rawI = localStorage.getItem(STORAGE_KEY_INVOICES)
    if (rawI) invoices.value = JSON.parse(rawI)
    else { invoices.value = [...initialInvoices]; saveStorage(STORAGE_KEY_INVOICES, invoices.value) }

    const rawP = localStorage.getItem(STORAGE_KEY_PACKAGES)
    if (rawP) packages.value = JSON.parse(rawP)
    else { packages.value = [...initialPackages]; saveStorage(STORAGE_KEY_PACKAGES, packages.value) }
  } catch (e) {
    console.error('Failed loading storage', e)
    leads.value = [...initialLeads]
    customers.value = [...initialCustomers]
    invoices.value = [...initialInvoices]
    packages.value = [...initialPackages]
  }
}

function saveStorage(key: string, data: any) {
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
    businessCategory?: string
    phone: string
    email: string
    address: string
    packageInterest: PackageType
    source?: LeadSource
    notes?: string
  }) => {
    const today = getTodayFormatted()
    const nowIso = new Date().toISOString()
    const source: LeadSource = data.source || 'Website'
    const uniqueId = 'REG-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    const packagePrice = data.packageInterest === 'Basic' ? 250000 : 0
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    const newLead: ClientLead = {
      id: uniqueId,
      registration_id: uniqueId,
      no: leads.value.length + 1,
      name: data.name.trim(),
      nama_lengkap: data.name.trim(),
      businessName: data.businessName.trim(),
      nama_bisnis: data.businessName.trim(),
      businessCategory: data.businessCategory?.trim() || 'Retail',
      kategori_bisnis: data.businessCategory?.trim() || 'Retail',
      phone: data.phone.trim(),
      whatsapp: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      status: 'New',
      source: source,
      registrationDate: today,
      tanggal_pendaftaran: today,
      lastFollowUp: today,
      packageInterest: data.packageInterest,
      paket: data.packageInterest,
      harga_paket: packagePrice,
      estimatedDeal: packagePrice,
      notes: data.notes || `Pendaftaran mandiri via ${source}. Paket: ${data.packageInterest}`,
      followUpSchedule: 'Hari ini',
      created_at: nowIso,
      updated_at: nowIso,
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
  const approveLead = (leadId: string) => {
    const lead = leads.value.find(l => l.id === leadId)
    if (!lead) return null

    // Mark lead status as Converted / Disetujui
    lead.status = 'Converted'
    lead.lastFollowUp = getTodayFormatted()
    lead.updated_at = new Date().toISOString()
    lead.followUpHistory.unshift({
      id: 'fh-' + Date.now(),
      date: getTodayFormatted(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      channel: 'Sistem',
      notes: 'Pendaftaran disetujui Super Admin. Klien dikonversi menjadi Pelanggan Aktif.'
    })
    saveStorage(STORAGE_KEY_LEADS, leads.value)

    // Check if customer already exists (Anti-Duplication Rule)
    let targetCustomer: Customer
    const existing = customers.value.find(c => c.id === 'cust-' + lead.id || (lead.phone && c.phone === lead.phone) || (lead.email && c.email === lead.email))
    
    if (existing) {
      targetCustomer = existing
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
        packageType: lead.packageInterest || 'Basic',
        phone: lead.phone,
        email: lead.email,
        category: lead.businessCategory || 'Retail',
        expiredDate: expISO,
        status: 'active',
        amount: lead.packageInterest === 'Basic' ? 250000 : 0,
        paymentMethod: 'QRIS'
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
      amount: targetCustomer.packageType === 'Basic' ? 250000 : 0,
      billingCycleMonths: 1,
      date: getTodayFormatted(),
      paymentMethod: 'QRIS',
      status: 'Paid'
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
      today.setHours(0,0,0,0)
      
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
    const customLeads = leads.value.filter(l => l.packageInterest === 'Custom / IT One').length

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
      customCount: customLeads,
      totalCustomers,
      totalInvoices,
      totalPaidRevenue,
      totalExpired,
      totalExpiringSoon
    }
  })

  // ==========================================
  // ACTIONS: PACKAGES (CRUD)
  // ==========================================
  const addPackage = (pkg: Omit<PricingPackage, 'id'>) => {
    const newPackage: PricingPackage = {
      ...pkg,
      id: 'pkg-' + Date.now()
    }
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
    expiredCustomers,
    expiringCustomers,
    statistics,
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
    resetAllToDefault: () => {
      leads.value = [...initialLeads]
      customers.value = [...initialCustomers]
      invoices.value = [...initialInvoices]
      packages.value = [...initialPackages]
      saveStorage(STORAGE_KEY_LEADS, leads.value)
      saveStorage(STORAGE_KEY_CUSTOMERS, customers.value)
      saveStorage(STORAGE_KEY_INVOICES, invoices.value)
      saveStorage(STORAGE_KEY_PACKAGES, packages.value)
    }
  }
}

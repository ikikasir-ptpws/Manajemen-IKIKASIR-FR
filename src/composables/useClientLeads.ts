import { ref, computed } from 'vue'
import type { ClientLead, LeadStatus, LeadSource, FollowUpLog } from '../types/crm'

const STORAGE_KEY = 'ikikasir_client_leads_v2'

// Initial default seed leads (compatible with website & google form structures)
const initialLeads: ClientLead[] = [
  {
    id: 'c-1',
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
    id: 'c-2',
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
    id: 'c-3',
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
    id: 'c-4',
    no: 4,
    name: 'Siti Aisyah',
    businessName: 'Siti Collection',
    businessCategory: 'Fashion & Butik',
    phone: '085711223344',
    email: 'siti@email.com',
    address: 'Jl. Malioboro No. 12, Yogyakarta',
    status: 'Follow Up',
    source: 'Google Form',
    registrationDate: '22 Sep 2026',
    lastFollowUp: '23 Sep 2026',
    packageInterest: 'Custom / IT One',
    estimatedDeal: 0,
    notes: 'Meminta jadwal meeting zoom untuk demonstrasi fitur kasir cabang.',
    followUpSchedule: 'Besok',
    followUpHistory: [
      { id: 'fh-4', date: '23 Sep 2026', time: '15:00', channel: 'WhatsApp', notes: 'Konfirmasi jadwal meeting demo aplikasi kasir.' }
    ]
  },
  {
    id: 'c-5',
    no: 5,
    name: 'Rudi Hermawan',
    businessName: 'Rudi Mart',
    businessCategory: 'Minimarket & Grosir',
    phone: '082155667788',
    email: 'rudi@email.com',
    address: 'Jl. Pemuda No. 88, Semarang',
    status: 'Interested',
    source: 'Website',
    registrationDate: '20 Sep 2026',
    lastFollowUp: '21 Sep 2026',
    packageInterest: 'Custom / IT One',
    estimatedDeal: 0,
    notes: 'Sangat tertarik dengan integrasi scan barcode dan printer thermal.',
    followUpSchedule: '2 Hari lagi',
    followUpHistory: [
      { id: 'fh-5', date: '21 Sep 2026', time: '16:45', channel: 'Telepon', notes: 'Panggilan telepon 10 menit diskusi printer kasir bluetooth.' }
    ]
  },
  {
    id: 'c-6',
    no: 6,
    name: 'Dewi Lestari',
    businessName: 'Dewi Fashion',
    businessCategory: 'Fashion & Butik',
    phone: '081988990011',
    email: 'dewi@email.com',
    address: 'Jl. Diponegoro No. 23, Surabaya',
    status: 'Converted',
    source: 'Website',
    registrationDate: '18 Sep 2026',
    lastFollowUp: '19 Sep 2026',
    packageInterest: 'Custom / IT One',
    estimatedDeal: 0,
    notes: 'Telah berlangganan paket Custom / IT One 1 Tahun dan aktif digunakan.',
    followUpSchedule: '3 Hari lagi',
    followUpHistory: [
      { id: 'fh-6', date: '19 Sep 2026', time: '10:00', channel: 'WhatsApp', notes: 'Pembayaran langganan terkonfirmasi. Akun diaktifkan.' }
    ]
  },
  {
    id: 'c-7',
    no: 7,
    name: 'Agus Setiawan',
    businessName: 'Agus Furniture',
    businessCategory: 'Jasa & Servis',
    phone: '087822334455',
    email: 'agus@email.com',
    address: 'Jl. Pahlawan No. 7, Malang',
    status: 'Lost',
    source: 'Google Form',
    registrationDate: '15 Sep 2026',
    lastFollowUp: '16 Sep 2026',
    packageInterest: 'Basic',
    estimatedDeal: 250000,
    notes: 'Belum membutuhkan sistem kasir digital dalam waktu dekat.',
    followUpSchedule: '5 Hari lagi',
    followUpHistory: [
      { id: 'fh-7', date: '16 Sep 2026', time: '13:20', channel: 'WhatsApp', notes: 'Client menginformasikan belum ada budget untuk langganan sistem.' }
    ]
  }
]

// Singleton Reactive State
const leads = ref<ClientLead[]>([])

function loadLeadsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        leads.value = parsed
        return
      }
    }
  } catch (e) {
    console.error('Failed to load leads from localStorage', e)
  }
  leads.value = [...initialLeads]
  saveLeadsToStorage()
}

function saveLeadsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads.value))
  } catch (e) {
    console.error('Failed to save leads to localStorage', e)
  }
}

// Initialize on module import
loadLeadsFromStorage()

export function useClientLeads() {
  const formatDateNow = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const d = new Date()
    const day = String(d.getDate()).padStart(2, '0')
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  }

  const formatTimeNow = () => {
    const d = new Date()
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${mins}`
  }

  // Create new registration (from Website, Google Form, or Admin)
  const addRegistration = (data: {
    name: string
    businessName: string
    businessCategory?: string
    phone: string
    email: string
    address: string
    packageInterest: 'Basic' | 'Custom / IT One'
    source?: LeadSource
    notes?: string
  }) => {
    const today = formatDateNow()
    const time = formatTimeNow()
    const source: LeadSource = data.source || 'Website'

    const newLead: ClientLead = {
      id: 'c-' + Date.now(),
      no: leads.value.length + 1,
      name: data.name.trim(),
      businessName: data.businessName.trim(),
      businessCategory: data.businessCategory?.trim() || 'Retail',
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      status: 'New',
      source: source,
      registrationDate: today,
      lastFollowUp: today,
      packageInterest: data.packageInterest,
      estimatedDeal: data.packageInterest === 'Basic' ? 250000 : 0,
      notes: data.notes || `Pendaftaran baru via ${source}. Paket: ${data.packageInterest}`,
      followUpSchedule: 'Hari ini',
      followUpHistory: [
        {
          id: 'fh-' + Date.now(),
          date: today,
          time: time,
          channel: 'Sistem',
          notes: `Data pendaftaran berhasil diterima dari ${source} (Status: Baru).`
        }
      ]
    }

    leads.value.unshift(newLead)
    saveLeadsToStorage()
    return newLead
  }

  // Update Status
  const updateStatus = (id: string, newStatus: LeadStatus) => {
    const target = leads.value.find(l => l.id === id)
    if (target) {
      const today = formatDateNow()
      const time = formatTimeNow()
      target.status = newStatus
      target.lastFollowUp = today
      target.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: today,
        time: time,
        channel: 'Sistem',
        notes: `Status pendaftaran diubah menjadi: ${newStatus}`
      })
      saveLeadsToStorage()
    }
  }

  // Update complete lead object
  const updateLead = (updatedLead: ClientLead) => {
    const idx = leads.value.findIndex(l => l.id === updatedLead.id)
    if (idx !== -1) {
      leads.value[idx] = updatedLead
      saveLeadsToStorage()
    }
  }

  // Delete lead
  const deleteLead = (id: string) => {
    leads.value = leads.value.filter(l => l.id !== id)
    saveLeadsToStorage()
  }

  // Add follow-up log entry
  const addFollowUpLog = (id: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Email' | 'Meeting' | 'Sistem') => {
    const target = leads.value.find(l => l.id === id)
    if (target) {
      const today = formatDateNow()
      const time = formatTimeNow()
      target.followUpHistory.unshift({
        id: 'fh-' + Date.now(),
        date: today,
        time: time,
        channel: channel,
        notes: note
      })
      target.lastFollowUp = today
      saveLeadsToStorage()
    }
  }

  // Statistics
  const statistics = computed(() => {
    const total = leads.value.length
    const newCount = leads.value.filter(l => l.status === 'New').length
    const inProgressCount = leads.value.filter(l => ['Contacted', 'Follow Up', 'Interested'].includes(l.status)).length
    const convertedCount = leads.value.filter(l => l.status === 'Converted').length
    const lostCount = leads.value.filter(l => l.status === 'Lost').length

    const websiteCount = leads.value.filter(l => l.source === 'Website').length
    const googleFormCount = leads.value.filter(l => l.source === 'Google Form').length
    const otherSourceCount = total - websiteCount - googleFormCount

    const basicCount = leads.value.filter(l => l.packageInterest === 'Basic').length
    const customCount = leads.value.filter(l => l.packageInterest === 'Custom / IT One').length

    return {
      total,
      newCount,
      inProgressCount,
      convertedCount,
      lostCount,
      websiteCount,
      googleFormCount,
      otherSourceCount,
      basicCount,
      customCount
    }
  })

  return {
    leads,
    addRegistration,
    updateStatus,
    updateLead,
    deleteLead,
    addFollowUpLog,
    statistics,
    resetToDefault: () => {
      leads.value = [...initialLeads]
      saveLeadsToStorage()
    }
  }
}

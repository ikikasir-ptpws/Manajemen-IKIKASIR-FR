<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Plus, 
  Search, 
  Calendar, 
  RotateCcw, 
  Edit3, 
  Eye, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Store,
  Clock,
  FileText,
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  CreditCard,
  Users,
  ShieldCheck,
  Check,
  ExternalLink,
  ZoomIn,
  X,
  Copy,
  ArrowUpDown,
  ArrowRight,
  Share2
} from 'lucide-vue-next'
import ClientFormModal from '../../components/crm/ClientFormModal.vue'
import ClientDetailModal from '../../components/crm/ClientDetailModal.vue'
import GoogleFormIntegrationModal from '../../components/crm/GoogleFormIntegrationModal.vue'
import { uploadApi } from '../../api/upload.api'
import DateRangePicker from '../../components/common/DateRangePicker.vue'
import { useAppData } from '../../composables/useAppData'
import type { ClientLead, LeadStatus, LeadSource } from '../../types/crm'

const router = useRouter()

// Connect to Centralized Lifecycle Store
const { 
  leads: clients, 
  packages,
  updateLead,
  updateLeadStatus: updateStatus, 
  addFollowUpLog,
  approveLead, 
  addRegistration,
  rejectLead, 
  deleteLead, 
  statistics,
  currentRole,
  financeQueue,
  confirmPaymentByFinance,
  rejectPaymentByFinance,
  syncWithBackend,
  SAMPLE_RECEIPT_BCA,
  SAMPLE_RECEIPT_QRIS,
  getCustomerWaUrl
} = useAppData()

const availablePackages = computed(() => {
  const active = packages.value.filter(p => p.isActive !== false)
  if (active.length > 0) return active
  if (packages.value.length > 0) return packages.value
  return [
    { id: 'basic', name: 'Basic', price: 250000, period: '/bulan' },
    { id: 'pro', name: 'Pro', price: 500000, period: '/bulan' },
    { id: 'custom', name: 'Custom / IT One', price: 1500000, period: '/bulan' }
  ]
})

onMounted(() => {
  syncWithBackend(true)
})

// Modals state
const isFormModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isGoogleFormModalOpen = ref(false)
const clientToEdit = ref<ClientLead | null>(null)
const selectedClient = ref<ClientLead | null>(null)

// Toast message
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Search & Filter state
const searchQuery = ref('')
const selectedStatus = ref<string>('Semua Status')
const selectedPackage = ref<string>('Semua Paket')
const startDate = ref('')
const endDate = ref('')

// Dropdown toggles
const showStatusDropdown = ref(false)
const showPackageDropdown = ref(false)

const statusOptions = ['Semua Status', 'Menunggu Acc Finance', 'New', 'Diproses', 'Lost']
const packageOptions = ['Semua Paket', 'Basic', 'Add on', 'Custom', 'Pro', 'Custom / IT One']

// Active clients count (leads yang belum disetujui dan belum ditolak)
const activeClientsCount = computed(() => {
  return clients.value.filter(c => c.status !== 'Converted' && c.status !== 'Lost').length
})

// Helper parse dates in data ('18 Sep 2026', '2026-09-18', ISO, etc.)
const parseDateToMs = (dateStr?: string): number | null => {
  if (!dateStr) return null
  const clean = dateStr.trim()
  if (clean.includes('-')) {
    const d = new Date(clean)
    return isNaN(d.getTime()) ? null : d.getTime()
  }
  const parts = clean.split(/\s+/)
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10)
    const monthStr = parts[1].toLowerCase()
    const year = parseInt(parts[2], 10)
    const monthMap: Record<string, number> = {
      jan: 0, januari: 0,
      feb: 1, februari: 1,
      mar: 2, maret: 2,
      apr: 3, april: 3,
      mei: 4, may: 4,
      jun: 5, juni: 5,
      jul: 6, juli: 6,
      agu: 7, agt: 7, agustus: 7, aug: 7,
      sep: 8, september: 8,
      okt: 9, oktober: 9, oct: 9,
      nov: 10, november: 10,
      des: 11, desember: 11, dec: 11
    }
    const month = monthMap[monthStr]
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day).getTime()
    }
  }
  const fallback = new Date(clean)
  return isNaN(fallback.getTime()) ? null : fallback.getTime()
}

// Badges colors
const statusBadges: Record<LeadStatus, { bg: string, text: string, label: string }> = {
  New: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', label: 'Baru' },
  Contacted: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', label: 'Diproses' },
  'Follow Up': { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600', label: 'Follow Up' },
  Interested: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-600', label: 'Tertarik' },
  Converted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', label: 'Disetujui (Pelanggan)' },
  Lost: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', label: 'Ditolak (Lost)' },
}

const pendingFinanceCount = computed(() => {
  return clients.value.filter(c => c.paymentStatus === 'pending_verification').length
})

// Filtered clients (Unified prospective list, prioritizing pending verification & FIFO order)
const filteredClients = computed(() => {
  return [...clients.value]
    .filter(c => {
      // Halaman Calon Client hanya menampilkan prospek yang BELUM disetujui
      // Calon client yang sudah disetujui otomatis berpindah ke Halaman Semua Pelanggan
      if (c.status === 'Converted') return false

      const matchSearch = !searchQuery.value.trim() || 
        c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        c.phone.includes(searchQuery.value) ||
        c.businessName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.value.toLowerCase())

      let matchStatus = true
      if (selectedStatus.value === 'Menunggu Acc Finance') {
        matchStatus = c.paymentStatus === 'pending_verification'
      } else if (selectedStatus.value === 'New') {
        matchStatus = c.status === 'New'
      } else if (selectedStatus.value === 'Diproses') {
        matchStatus = ['Contacted', 'Follow Up', 'Interested'].includes(c.status)
      } else if (selectedStatus.value === 'Lost') {
        matchStatus = c.status === 'Lost'
      }

      const matchPackage = selectedPackage.value === 'Semua Paket' || c.packageInterest === selectedPackage.value

      // Date Range Match
      let matchDate = true
      const clientDateStr = c.registrationDate || c.lastFollowUp || c.created_at
      const clientMs = parseDateToMs(clientDateStr)
      if (startDate.value && clientMs !== null) {
        const startMs = new Date(startDate.value + 'T00:00:00').getTime()
        matchDate = matchDate && (clientMs >= startMs)
      }
      if (endDate.value && clientMs !== null) {
        const endMs = new Date(endDate.value + 'T23:59:59').getTime()
        matchDate = matchDate && (clientMs <= endMs)
      }

      return matchSearch && matchStatus && matchPackage && matchDate
    })
    .sort((a, b) => {
      // Prioritas 1: Pending verifikasi pembayaran di atas (FIFO - Data Terlama lebih dulu)
      const aPending = a.paymentStatus === 'pending_verification' ? 0 : 1
      const bPending = b.paymentStatus === 'pending_verification' ? 0 : 1
      if (aPending !== bPending) return aPending - bPending

      const idA = parseInt(a.id.replace(/[^0-9]/g, '')) || 0
      const idB = parseInt(b.id.replace(/[^0-9]/g, '')) || 0
      return idA - idB
    })
})

const resetFilter = () => {
  searchQuery.value = ''
  selectedStatus.value = 'Semua Status'
  selectedPackage.value = 'Semua Paket'
  startDate.value = ''
  endDate.value = ''
  currentPage.value = 1
}

// ==========================================
// PAGINATION STATE
// ==========================================
const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => {
  return Math.ceil(filteredClients.value.length / pageSize.value) || 1
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + pageSize.value, filteredClients.value.length)
})

const paginatedClients = computed(() => {
  return filteredClients.value.slice(startIndex.value, startIndex.value + pageSize.value)
})

// Auto reset page if totalPages changes or filter updates
watch([searchQuery, selectedStatus, selectedPackage, startDate, endDate, pageSize], () => {
  currentPage.value = 1
})

// Displayed page numbers for pagination buttons
const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ==========================================
// FINANCE VERIFICATION ACTIONS
// ==========================================
const isFinanceVerifyModalOpen = ref(false)
const clientToVerify = ref<ClientLead | null>(null)
const verificationChecks = ref({
  amountMatches: true,
  accountValid: true,
  clientDataValid: true
})
const verificationNotes = ref('')
const verifiedPaymentAmount = ref<number>(250000)
const verifiedPaymentMethod = ref<string>('BCA Transfer')

const isReceiptZoomOpen = ref(false)
const zoomedReceiptUrl = ref('')

const showWaConfirmModal = ref(false)
const lastWaUrl = ref('')
const lastWaText = ref('')
const lastConfirmedClient = ref<ClientLead | null>(null)

const openFinanceVerifyModal = (client: ClientLead) => {
  clientToVerify.value = client
  verifiedPaymentAmount.value = client.paymentAmount || client.harga_paket || 250000
  verifiedPaymentMethod.value = client.paymentMethod || 'BCA Transfer'
  verificationNotes.value = client.paymentNotes || 'Bukti transfer telah diperiksa dan sesuai dengan paket yang dipilih.'
  verificationChecks.value = {
    amountMatches: true,
    accountValid: true,
    clientDataValid: true
  }
  isFinanceVerifyModalOpen.value = true
}

const handleAccPayment = () => {
  if (!clientToVerify.value) return

  const result = confirmPaymentByFinance(clientToVerify.value.id, {
    paymentAmount: verifiedPaymentAmount.value,
    paymentMethod: verifiedPaymentMethod.value,
    notes: verificationNotes.value,
    verifiedBy: 'Finance Officer'
  })

  if (result) {
    lastConfirmedClient.value = clientToVerify.value
    lastWaUrl.value = result.whatsappUrl
    lastWaText.value = result.whatsappText
    isFinanceVerifyModalOpen.value = false
    showWaConfirmModal.value = true
    showToast(`✅ Acc Pembayaran Selesai! Data ${clientToVerify.value.name} dikonversi ke Pelanggan Aktif & Notifikasi diteruskan ke Teknisi.`)
  }
}

const handleRejectPayment = () => {
  if (!clientToVerify.value) return
  const reason = prompt('Alasan penolakan bukti pembayaran:', 'Bukti transfer tidak terbaca / nominal tidak sesuai')
  if (reason) {
    rejectPaymentByFinance(clientToVerify.value.id, reason)
    isFinanceVerifyModalOpen.value = false
    showToast(`❌ Pembayaran "${clientToVerify.value.name}" ditolak / ditandai tidak sesuai.`)
  }
}

const openReceiptZoom = (url: string) => {
  zoomedReceiptUrl.value = url
  isReceiptZoomOpen.value = true
}

const copyWaText = () => {
  navigator.clipboard.writeText(lastWaText.value)
  showToast('📋 Pesan WhatsApp berhasil disalin ke clipboard!')
}

// CRM Actions
const openAddModal = () => {
  clientToEdit.value = null
  isFormModalOpen.value = true
}

const openEditModal = (client: ClientLead) => {
  clientToEdit.value = client
  isFormModalOpen.value = true
}

const openDetailModal = (client: ClientLead) => {
  selectedClient.value = client
  isDetailModalOpen.value = true
}

// ==========================================
// PAYMENT CONFIRMATION & APPROVAL MODAL STATE
// ==========================================
const isApprovalModalOpen = ref(false)
const clientToApprove = ref<ClientLead | null>(null)
const approvalForm = ref({
  packageType: 'Basic' as 'Basic' | 'Pro' | 'Add on' | 'Custom / IT One',
  amount: 250000,
  paymentMethod: 'Transfer BCA (PT PUNDI MAS BERKAH)',
  paymentDate: new Date().toISOString().substring(0, 10),
  referenceNo: '',
  paymentProofUrl: '',
  notes: 'Pembayaran pendaftaran & biaya langganan bulan pertama telah diverifikasi lunas.',
  confirmationAgreed: true
})

const openApprovalModal = (client: ClientLead) => {
  clientToApprove.value = client
  const defaultPkg = (client.packageInterest as 'Basic' | 'Pro' | 'Add on' | 'Custom / IT One') || 'Basic'
  const pkgPrices: Record<string, number> = {
    'Basic': 250000,
    'Pro': 500000,
    'Add on': 150000,
    'Custom': 1500000,
    'Custom / IT One': 1500000
  }
  const defaultAmount = client.paymentAmount || client.harga_paket || pkgPrices[defaultPkg] || 250000

  approvalForm.value = {
    packageType: defaultPkg,
    amount: defaultAmount,
    paymentMethod: client.paymentMethod || 'Transfer BCA',
    paymentDate: new Date().toISOString().substring(0, 10),
    referenceNo: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
    paymentProofUrl: client.paymentProofUrl || '',
    notes: client.paymentNotes || 'Pembayaran pendaftaran & biaya langganan bulan pertama telah diverifikasi lunas.',
    confirmationAgreed: true
  }
  isApprovalModalOpen.value = true
}

const onApprovalPackageChange = () => {
  const pkg = availablePackages.value.find(p => p.name === approvalForm.value.packageType || p.id === approvalForm.value.packageType)
  if (pkg) {
    approvalForm.value.amount = pkg.price ?? 250000
  }
}

const isUploadingProof = ref(false)

const handleProofFileUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    
    // Preview langsung sementara
    const reader = new FileReader()
    reader.onload = (event) => {
      if (!approvalForm.value.paymentProofUrl) {
        approvalForm.value.paymentProofUrl = event.target?.result as string
      }
    }
    reader.readAsDataURL(file)

    // Upload langsung ke server storage
    try {
      isUploadingProof.value = true
      showToast('Mengunggah berkas bukti bayar ke storage...')
      const res = await uploadApi.uploadFile(file)
      if (res.data?.url) {
        approvalForm.value.paymentProofUrl = res.data.url
        showToast('✅ Berkas bukti bayar berhasil disimpan ke storage server!')
      }
    } catch (err: any) {
      console.warn('Gagal upload langsung ke storage:', err)
      showToast('⚠️ Menggunakan format berkas lokal.')
    } finally {
      isUploadingProof.value = false
    }
  }
}

const useSampleReceiptBca = () => {
  approvalForm.value.paymentProofUrl = SAMPLE_RECEIPT_BCA
  showToast('Contoh bukti transfer BCA berhasil dipasang.')
}

const handleConfirmApproval = () => {
  if (!clientToApprove.value) return

  const targetId = clientToApprove.value.id
  const clientName = clientToApprove.value.name
  const finalAmount = Number(approvalForm.value.amount) || 250000
  const finalMethod = approvalForm.value.paymentMethod
  const finalProof = approvalForm.value.paymentProofUrl || clientToApprove.value.paymentProofUrl || ''
  const finalNotes = approvalForm.value.notes + (approvalForm.value.referenceNo ? ` (Ref: ${approvalForm.value.referenceNo})` : '')

  // 1. Process approveLead in centralized lifecycle store (creates Customer & Paid Invoice)
  approveLead(targetId, {
    amount: finalAmount,
    paymentMethod: finalMethod,
    paymentProofUrl: finalProof,
    notes: finalNotes,
    date: approvalForm.value.paymentDate
  })

  // 2. Also update finance status if was pending
  if (clientToApprove.value.paymentStatus === 'pending_verification') {
    confirmPaymentByFinance(targetId, {
      paymentAmount: finalAmount,
      paymentMethod: finalMethod,
      notes: finalNotes,
      verifiedBy: 'Super Admin'
    })
  }

  isApprovalModalOpen.value = false
  showToast(`✅ "${clientName}" berhasil disetujui! Mengalihkan ke Halaman Semua Pelanggan...`)

  // Automatically navigate directly to Semua Pelanggan page
  setTimeout(() => {
    router.push('/semua-pelanggan')
  }, 400)
}

const handleCreateSampleLead = () => {
  const rand = Math.floor(100 + Math.random() * 900)
  const sampleName = 'Rian Pratama ' + rand
  const sampleStore = 'Kopi Senja ' + rand

  const newLead = addRegistration({
    name: sampleName,
    businessName: sampleStore,
    businessCategory: 'Kafe & Minuman',
    businessType: 'Kafe & Minuman',
    phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
    email: `rian${rand}@kopisenja.com`,
    address: 'Jl. Pajajaran No. 28, Bogor',
    source: 'Website',
    packageInterest: 'Basic',
    notes: 'Pendaftaran calon client baru (siap dikonfirmasi & disetujui).'
  })

  if (newLead) {
    newLead.paymentStatus = 'pending_verification'
    newLead.paymentProofUrl = SAMPLE_RECEIPT_BCA
    newLead.paymentAmount = 250000
    newLead.paymentMethod = 'Transfer BCA (PT PUNDI MAS BERKAH)'
    newLead.paymentDate = new Date().toISOString().substring(0, 10)
    updateLead(newLead)
  }

  showToast(`✨ Contoh Calon Client "${sampleName}" berhasil dibuat! Silakan klik "Setujui" untuk mencoba.`)
}

const openConvertModal = (client: ClientLead) => {
  isDetailModalOpen.value = false
  openApprovalModal(client)
}

const handleApproveClient = (client: ClientLead) => {
  openApprovalModal(client)
}

const handleRejectClient = (client: ClientLead) => {
  if (confirm(`Tolak pendaftaran "${client.name}"? Status akan diubah menjadi Ditolak (Lost).`)) {
    rejectLead(client.id)
    showToast(`❌ Pendaftaran "${client.name}" telah DITOLAK.`)
  }
}

const sendWhatsAppDirect = (client: ClientLead) => {
  const phone = client.phone.replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const message = encodeURIComponent(`Halo Kak ${client.name}, salam dari IKI KASIR. Kami ingin mengonfirmasi pendaftaran sistem kasir Anda (Paket: ${client.packageInterest || 'Basic'}).`)
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}

const handleStatusChange = (id: string, status: LeadStatus) => {
  updateStatus(id, status)
  showToast(`Status calon client diperbarui menjadi "${status}".`)
}

const handleDeleteClient = (id: string, name: string) => {
  if (confirm(`Yakin ingin menghapus calon client "${name}"?`)) {
    deleteLead(id)
    showToast(`Data "${name}" berhasil dihapus.`)
  }
}

const handleAddFollowUp = (clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem') => {
  addFollowUpLog(clientId, note, channel)
  if (selectedClient.value && selectedClient.value.id === clientId) {
    const updated = clients.value.find(c => c.id === clientId)
    if (updated) selectedClient.value = { ...updated }
  }
  showToast('Catatan follow up berhasil disimpan.')
}

const handleClientSaved = (client: ClientLead) => {
  showToast(`Data "${client.name}" berhasil disimpan.`)
  isFormModalOpen.value = false
}
</script>

<template>
  <div class="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <Teleport to="body">
      <div 
        v-if="toastMessage"
        class="fixed bottom-5 right-5 z-[9999] px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </Teleport>

    <!-- Top Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Data Pendaftar & Calon Client</h1>
        <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">Kelola pendaftaran masuk, verifikasi bukti transfer pembayaran Finance, dan konversi ke pelanggan aktif.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <!-- "+ Tambah Client" button -->
        <button 
          @click="openAddModal"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Pendaftar</span>
        </button>
      </div>
    </header>

    <!-- NOTIFIKASI KHUSUS FINANCE JIKA ADA BUKTI TRANSFER MENUNGGU ACC -->
    <div 
      v-if="pendingFinanceCount > 0"
      class="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-in fade-in duration-150"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
          <CreditCard class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold text-slate-900">Antrean Verifikasi Finance: {{ pendingFinanceCount }} Pembayaran Masuk</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-900 uppercase">FIFO Terlama</span>
          </div>
          <p class="text-[11px] text-slate-600 mt-0.5">
            Data dengan bukti transfer diprioritaskan di baris teratas. Silakan periksa bukti bayar dan klik <strong>Verifikasi Bayar</strong> untuk Acc ke Teknisi.
          </p>
        </div>
      </div>

      <button 
        @click="selectedStatus = selectedStatus === 'Menunggu Acc Finance' ? 'Semua Status' : 'Menunggu Acc Finance'"
        class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
        :class="selectedStatus === 'Menunggu Acc Finance' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-50'"
      >
        {{ selectedStatus === 'Menunggu Acc Finance' ? 'Tampilkan Semua' : 'Filter Menunggu Acc' }}
      </button>
    </div>

    <!-- STATISTICS SUMMARY CARDS (Clickable Filters) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- Total Calon Client -->
      <div 
        @click="resetFilter()"
        class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        :class="selectedStatus === 'Semua Status' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Calon</span>
          <span class="text-lg sm:text-xl font-black text-slate-800">{{ activeClientsCount }}</span>
        </div>
      </div>

      <!-- Menunggu Acc Finance -->
      <div 
        @click="selectedStatus = 'Menunggu Acc Finance'"
        class="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-100 shadow-xs flex items-center gap-3 bg-amber-50/20 cursor-pointer hover:border-amber-300 transition-all"
        :class="selectedStatus === 'Menunggu Acc Finance' ? 'ring-2 ring-amber-500 bg-amber-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <CreditCard class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Menunggu Acc</span>
          <span class="text-lg sm:text-xl font-black text-amber-600">{{ pendingFinanceCount }}</span>
        </div>
      </div>

      <!-- Baru -->
      <div 
        @click="selectedStatus = 'New'"
        class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition-all"
        :class="selectedStatus === 'New' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <UserPlus class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Baru</span>
          <span class="text-lg sm:text-xl font-black text-blue-600">{{ statistics.newCount }}</span>
        </div>
      </div>

      <!-- Diproses -->
      <div 
        @click="selectedStatus = 'Diproses'"
        class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-300 transition-all"
        :class="selectedStatus === 'Diproses' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <RefreshCw class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Diproses</span>
          <span class="text-lg sm:text-xl font-black text-amber-600">{{ statistics.inProgressCount }}</span>
        </div>
      </div>

      <!-- Ditolak -->
      <div 
        @click="selectedStatus = 'Lost'"
        class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-rose-300 transition-all"
        :class="selectedStatus === 'Lost' ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <UserX class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ditolak</span>
          <span class="text-lg sm:text-xl font-black text-rose-600">{{ statistics.lostCount }}</span>
        </div>
      </div>

      <!-- Sudah Jadi Pelanggan (Shortcut ke Halaman Semua Pelanggan) -->
      <div 
        @click="router.push('/semua-pelanggan')"
        class="bg-emerald-50/40 rounded-2xl p-3.5 sm:p-4 border border-emerald-200 shadow-xs flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-400 hover:shadow-sm hover:bg-emerald-50/70 transition-all group"
        title="Klik untuk membuka Halaman Semua Pelanggan"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck class="w-5 h-5" />
          </div>
          <div class="truncate">
            <span class="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider truncate">Pelanggan Aktif</span>
            <span class="text-lg sm:text-xl font-black text-emerald-700">{{ statistics.convertedCount }}</span>
          </div>
        </div>
        <ArrowRight class="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-30">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari ID / nama / bisnis / WA / email..."
          class="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      <!-- Filter Controls -->
      <div class="flex items-center flex-wrap gap-2 text-xs">
        <!-- Date Range Filter: Custom Modern Component -->
        <DateRangePicker 
          v-model:startDate="startDate" 
          v-model:endDate="endDate" 
          placeholder="Filter Tanggal Pendaftaran"
        />

        <!-- Dropdown Status -->
        <div class="relative flex-1 sm:flex-none">
          <button 
            @click="showStatusDropdown = !showStatusDropdown"
            class="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <span class="truncate max-w-[140px] sm:max-w-none">Status: {{ selectedStatus }}</span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          <div 
            v-if="showStatusDropdown"
            class="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
          >
            <button 
              v-for="st in statusOptions" 
              :key="st"
              @click="selectedStatus = st; showStatusDropdown = false"
              class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
              :class="selectedStatus === st ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
            >
              <span>{{ st === 'Menunggu Acc Finance' ? 'Menunggu Acc Finance (' + pendingFinanceCount + ')' : (st === 'New' ? 'Baru' : (st === 'Converted' ? 'Disetujui' : (st === 'Lost' ? 'Ditolak' : st))) }}</span>
              <span v-if="selectedStatus === st" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
          </div>
        </div>

        <!-- Dropdown Paket -->
        <div class="relative flex-1 sm:flex-none">
          <button 
            @click="showPackageDropdown = !showPackageDropdown"
            class="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <span class="truncate max-w-[110px] sm:max-w-none">Paket: {{ selectedPackage }}</span>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          <div 
            v-if="showPackageDropdown"
            class="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
          >
            <button 
              v-for="pkg in packageOptions" 
              :key="pkg"
              @click="selectedPackage = pkg; showPackageDropdown = false"
              class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
              :class="selectedPackage === pkg ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
            >
              <span>{{ pkg }}</span>
              <span v-if="selectedPackage === pkg" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
          </div>
        </div>

        <!-- Reset Button -->
        <button 
          @click="resetFilter"
          class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
          title="Reset Filter"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>

    <!-- CONTEXT BAR: Informative Banner & Quick Link ke Semua Pelanggan -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/70 text-xs">
      <div class="flex items-center gap-2 text-slate-700">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
        <span class="font-medium text-slate-700">
          Calon client yang telah disetujui otomatis berpindah ke halaman <strong>Semua Pelanggan</strong> & tagihan tercatat di <strong>Langganan</strong>.
        </span>
      </div>

      <button 
        @click="router.push('/semua-pelanggan')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
      >
        <Users class="w-3.5 h-3.5 text-indigo-600" />
        <span>Buka Halaman Semua Pelanggan ({{ statistics.convertedCount }})</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- DESKTOP UNIFIED TABLE VIEW -->
    <div class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[950px]">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider">
              <th class="py-3 px-3.5 w-16 whitespace-nowrap">ID</th>
              <th class="py-3 px-3.5 min-w-[180px]">Nama & Bisnis</th>
              <th class="py-3 px-3.5 whitespace-nowrap">WhatsApp / Email</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Paket Kasir</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Tgl Daftar</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Status Prospek</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap w-48">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="client in paginatedClients" 
              :key="client.id"
              class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              :class="client.paymentStatus === 'pending_verification' ? 'bg-amber-50/40' : ''"
              @click="openDetailModal(client)"
            >
              <!-- ID -->
              <td class="py-3.5 px-3.5 text-slate-400 font-mono font-bold text-[11px] whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span class="text-slate-600 font-semibold">{{ client.id }}</span>
                  <span 
                    v-if="client.paymentStatus === 'pending_verification'" 
                    class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                    title="Menunggu Acc Finance"
                  ></span>
                </div>
              </td>
              
              <!-- Nama Client & Toko -->
              <td class="py-3.5 px-3.5">
                <div class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">{{ client.name }}</div>
                <div class="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{{ client.businessName }} ({{ client.businessCategory || 'Retail' }})</div>
                <div v-if="client.source === 'Referral' || client.referralCode" class="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 w-fit">
                  <Share2 class="w-2.5 h-2.5 text-purple-600" />
                  <span>Ref: {{ client.referredByCustomerName || client.referralCode }}</span>
                </div>
              </td>

              <!-- No WhatsApp & Email -->
              <td class="py-3.5 px-3.5 font-medium whitespace-nowrap">
                <div class="text-slate-700 font-mono text-[11px] flex items-center gap-1.5">
                  <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ client.phone }}</span>
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ client.email }}</span>
                </div>
              </td>

              <!-- Paket Kasir & Estimasi (Plus Bukti Transfer badge if available) -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[11px] font-bold inline-block border"
                    :class="['Custom', 'Custom / IT One'].includes(client.packageInterest || '') ? 'bg-purple-50 text-purple-700 border-purple-200' : client.packageInterest === 'Add on' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'"
                  >
                    {{ client.packageInterest || 'Basic' }}
                  </span>
                  <span class="text-[11px] font-bold text-slate-700">
                    Rp {{ Number(client.paymentAmount || client.harga_paket || 250000).toLocaleString('id-ID') }}
                  </span>
                </div>
                <!-- Bukti Transfer link jika di-upload saat pendaftaran -->
                <div v-if="client.paymentProofUrl" class="mt-1" @click.stop>
                  <button 
                    @click="openReceiptZoom(client.paymentProofUrl)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold cursor-pointer transition-colors"
                    title="Klik untuk membuka bukti transfer pembayaran"
                  >
                    <FileText class="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Lihat Bukti Transfer</span>
                  </button>
                </div>
              </td>

              <!-- Tgl Daftar -->
              <td class="py-3.5 px-3.5 text-slate-500 font-medium whitespace-nowrap">
                {{ client.registrationDate || client.lastFollowUp }}
              </td>

              <!-- Status Prospek CRM -->
              <td class="py-3.5 px-3.5 whitespace-nowrap" @click.stop>
                <div v-if="client.status === 'Converted'" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <UserCheck class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pelanggan Aktif</span>
                </div>
                <select 
                  v-else
                  v-model="client.status"
                  @change="handleStatusChange(client.id, client.status)"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer outline-none"
                  :class="statusBadges[client.status]?.bg"
                >
                  <option value="New">Baru</option>
                  <option value="Contacted">Diproses</option>
                  <option value="Interested">Tertarik</option>
                  <option value="Lost">Ditolak</option>
                </select>
              </td>

              <!-- Aksi (Organized Segmented Layout) -->
              <td class="py-3.5 px-3.5 text-center whitespace-nowrap" @click.stop>
                <div class="inline-flex items-center justify-center gap-1.5">
                  <!-- Tombol Acc Finance jika ada pending verification -->
                  <button 
                    v-if="client.paymentStatus === 'pending_verification'"
                    @click="openApprovalModal(client)"
                    title="Verifikasi Pembayaran & Acc Langganan"
                    class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-amber-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 shrink-0" />
                    <span>Acc Bayar</span>
                  </button>

                  <!-- Tombol Setujui Langsung untuk konversi ke Pelanggan jika belum converted -->
                  <button 
                    v-else-if="client.status !== 'Converted'"
                    @click="openApprovalModal(client)"
                    title="Setujui pendaftaran dan otomatis jadikan Pelanggan"
                    class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-emerald-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck class="w-3.5 h-3.5 shrink-0" />
                    <span>Setujui</span>
                  </button>

                  <!-- Segmented Toolbar: Rapi, Terstruktur & Sejajar (Detail, Edit, WA, Hapus) -->
                  <div class="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs divide-x divide-slate-100 overflow-hidden">
                    <button 
                      @click="openDetailModal(client)"
                      title="Lihat Detail Pendaftar"
                      class="px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <Eye class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Detail</span>
                    </button>

                    <button 
                      @click="openEditModal(client)"
                      title="Edit Data Pendaftar"
                      class="px-2.5 py-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <Edit3 class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Edit</span>
                    </button>

                    <button 
                      @click="sendWhatsAppDirect(client)"
                      title="Kirim Pesan WhatsApp"
                      class="px-2 py-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/70 transition-all cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                    </button>

                    <button 
                      @click="handleDeleteClient(client.id, client.name)"
                      title="Hapus Data"
                      class="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 transition-all cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="filteredClients.length === 0">
              <td colspan="7" class="py-12 px-4 text-center">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <UserCheck class="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Calon Client Pending</h4>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                      Semua calon client telah disetujui menjadi pelanggan aktif atau belum ada calon client yang cocok dengan filter pencarian.
                    </p>
                  </div>
                  <div class="flex items-center justify-center gap-2 pt-2">
                    <button 
                      @click="openAddModal"
                      class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>Tambah Calon Client</span>
                    </button>
                    <button 
                      @click="router.push('/semua-pelanggan')"
                      class="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users class="w-3.5 h-3.5 text-slate-500" />
                      <span>Buka Daftar Pelanggan ({{ statistics.convertedCount }})</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION FOOTER -->
      <div class="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
        <!-- Info & Page Size Selector -->
        <div class="flex items-center gap-3 text-slate-500 font-medium">
          <span>
            Menampilkan 
            <strong class="text-slate-800 font-bold">{{ filteredClients.length === 0 ? 0 : startIndex + 1 }}</strong> 
            - 
            <strong class="text-slate-800 font-bold">{{ endIndex }}</strong> 
            dari 
            <strong class="text-slate-800 font-bold">{{ filteredClients.length }}</strong> data
          </span>

          <div class="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span class="text-slate-400">Tampilkan:</span>
            <select 
              v-model="pageSize" 
              class="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <!-- Pagination Buttons -->
        <div class="flex items-center gap-1.5">
          <button 
            @click="currentPage--"
            :disabled="currentPage <= 1"
            class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Sebelumnya</span>
          </button>

          <div class="flex items-center gap-1">
            <button 
              v-for="(page, idx) in displayedPages" 
              :key="idx"
              @click="typeof page === 'number' && (currentPage = page)"
              :disabled="typeof page !== 'number'"
              class="w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
              :class="currentPage === page ? 'bg-indigo-600 text-white shadow-xs' : (typeof page === 'number' ? 'text-slate-600 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-default')"
            >
              {{ page }}
            </button>
          </div>

          <button 
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span class="hidden sm:inline">Selanjutnya</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- MOBILE CARDS VIEW -->
    <div class="block md:hidden space-y-3">
      <div 
        v-for="client in paginatedClients" 
        :key="client.id"
        class="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
        :class="client.paymentStatus === 'pending_verification' ? 'border-amber-300 bg-amber-50/10' : ''"
        @click="openDetailModal(client)"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono text-slate-400 font-bold">ID: {{ client.id }}</span>
              <span 
                v-if="client.paymentStatus === 'pending_verification'" 
                class="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800"
              >
                Menunggu Acc
              </span>
              <span 
                v-else-if="client.status === 'Converted'" 
                class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800"
              >
                Pelanggan Aktif
              </span>
            </div>
            <h4 class="font-extrabold text-sm text-slate-900 mt-0.5">{{ client.name }}</h4>
            <p class="text-xs text-slate-500">{{ client.businessName }} • {{ client.phone }}</p>
            <div v-if="client.source === 'Referral' || client.referralCode" class="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 w-fit">
              <Share2 class="w-2.5 h-2.5 text-purple-600" />
              <span>Ref: {{ client.referredByCustomerName || client.referralCode }}</span>
            </div>
          </div>

          <div v-if="client.status === 'Converted'" class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Disetujui
          </div>
          <select 
            v-else
            v-model="client.status"
            @change="handleStatusChange(client.id, client.status)"
            @click.stop
            class="px-2 py-1 rounded-xl text-[10px] font-bold border"
            :class="statusBadges[client.status]?.bg"
          >
            <option value="New">Baru</option>
            <option value="Contacted">Diproses</option>
            <option value="Interested">Tertarik</option>
            <option value="Lost">Ditolak</option>
          </select>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Paket & Biaya:</span>
            <span class="font-bold text-slate-800">{{ client.packageInterest || 'Basic' }} (Rp {{ Number(client.paymentAmount || 250000).toLocaleString('id-ID') }})</span>
          </div>
          <div v-if="client.paymentProofUrl" class="flex justify-between items-center">
            <span class="text-slate-400">Bukti Transfer:</span>
            <button 
              @click.stop="openReceiptZoom(client.paymentProofUrl)"
              class="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText class="w-3.5 h-3.5 text-indigo-500" />
              <span>Lihat Bukti Bayar</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1 flex-wrap" @click.stop>
          <button 
            v-if="client.paymentStatus === 'pending_verification'"
            @click="openApprovalModal(client)" 
            class="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-200"
          >
            <ShieldCheck class="w-3.5 h-3.5" /> Acc Bayar
          </button>
          <button 
            v-else-if="client.status !== 'Converted'"
            @click="openApprovalModal(client)" 
            class="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-200"
          >
            <UserCheck class="w-3.5 h-3.5" /> Setujui
          </button>
          <button 
            @click="openDetailModal(client)" 
            class="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-200 cursor-pointer"
          >
            <Eye class="w-3.5 h-3.5" /> Detail
          </button>
          <button 
            @click="openEditModal(client)" 
            class="flex-1 py-2 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-amber-100 cursor-pointer"
          >
            <Edit3 class="w-3.5 h-3.5" /> Edit
          </button>
          <button 
            @click="sendWhatsAppDirect(client)" 
            class="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA
          </button>
        </div>
      </div>

      <!-- Mobile Empty State -->
      <div v-if="filteredClients.length === 0" class="bg-white rounded-2xl p-6 border border-slate-100 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <UserCheck class="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Calon Client Pending</h4>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Semua calon client telah disetujui menjadi pelanggan aktif atau belum ada calon client yang cocok dengan filter pencarian.
          </p>
        </div>
        <div class="flex flex-col gap-2 pt-2">
          <button 
            @click="openAddModal"
            class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>+ Tambah Calon Client</span>
          </button>
          <button 
            @click="router.push('/semua-pelanggan')"
            class="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users class="w-3.5 h-3.5 text-slate-500" />
            <span>Buka Daftar Pelanggan ({{ statistics.convertedCount }})</span>
          </button>
          <button 
            @click="handleCreateSampleLead"
            class="text-[11px] font-bold text-indigo-600 hover:underline pt-1 cursor-pointer"
          >
            + Buat contoh calon client untuk uji coba
          </button>
        </div>
      </div>

      <!-- Mobile Pagination Control -->
      <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-xs">
        <button 
          @click="currentPage--"
          :disabled="currentPage <= 1"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span class="font-bold text-slate-700">Hal {{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40"
        >
          Selanjutnya
        </button>
      </div>
    </div>

    <!-- FINANCE VERIFICATION MODAL (Flowchart Step: Cek Kesesuaian & Acc) -->
    <div 
      v-if="isFinanceVerifyModalOpen && clientToVerify" 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      @click.self="isFinanceVerifyModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Verifikasi Pembayaran Pendaftaran</h3>
              <p class="text-xs text-slate-500">Periksa bukti transfer dan konfirmasi kesesuaian data pendaftar.</p>
            </div>
          </div>
          <button @click="isFinanceVerifyModalOpen = false" class="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer">
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- 2 Columns: Bukti Bayar & Detail Klien -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Kolom Kiri: Bukti Transfer -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-slate-700 block">Bukti Transfer Masuk</span>
            <div class="relative bg-slate-50 rounded-2xl border border-slate-200 p-2 overflow-hidden flex flex-col items-center justify-center group">
              <img 
                v-if="clientToVerify.paymentProofUrl" 
                :src="clientToVerify.paymentProofUrl" 
                alt="Receipt" 
                class="w-full max-h-56 object-contain rounded-xl cursor-pointer"
                @click="openReceiptZoom(clientToVerify.paymentProofUrl)"
              />
              <div v-else class="py-12 text-center text-slate-400 text-xs">
                Tidak ada berkas bukti transfer.
              </div>

              <button 
                v-if="clientToVerify.paymentProofUrl"
                @click="openReceiptZoom(clientToVerify.paymentProofUrl)"
                class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer"
              >
                <ZoomIn class="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </button>
            </div>
            
            <div class="text-[11px] text-slate-500 bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
              <div class="flex justify-between">
                <span class="text-slate-400">Metode:</span>
                <span class="font-bold text-slate-800">{{ clientToVerify.paymentMethod || 'Transfer BCA' }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-slate-400">Tgl Masuk:</span>
                <span class="font-bold text-slate-800">{{ clientToVerify.paymentDate || clientToVerify.registrationDate }}</span>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Detail Data & Checklist -->
          <div class="space-y-3">
            <span class="text-xs font-bold text-slate-700 block">Detail Pendaftar & Paket</span>
            <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs space-y-1.5">
              <div class="flex justify-between">
                <span class="text-slate-400">Nama Klien:</span>
                <span class="font-bold text-slate-800">{{ clientToVerify.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Bisnis / Toko:</span>
                <span class="font-bold text-slate-800">{{ clientToVerify.businessName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">WhatsApp:</span>
                <span class="font-mono font-bold text-slate-800">{{ clientToVerify.phone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Paket Dipilih:</span>
                <span class="font-bold text-indigo-700">{{ clientToVerify.packageInterest || 'Basic' }}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-slate-200">
                <span class="text-slate-600 font-bold">Total Tagihan:</span>
                <span class="font-black text-slate-900 text-sm">
                  Rp {{ Number(clientToVerify.harga_paket || 250000).toLocaleString('id-ID') }}
                </span>
              </div>
            </div>

            <!-- Decision: Apakah Data Sesuai? (Sesuai Flowchart) -->
            <div class="space-y-2 pt-1">
              <span class="text-xs font-bold text-slate-800 block">Kriteria Keputusan Finance: "Apakah Data Sesuai?"</span>
              
              <label class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input type="checkbox" v-model="verificationChecks.amountMatches" class="rounded text-amber-600 focus:ring-amber-500" />
                <span class="font-medium text-slate-700">Nominal transfer sesuai harga paket</span>
              </label>

              <label class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input type="checkbox" v-model="verificationChecks.accountValid" class="rounded text-amber-600 focus:ring-amber-500" />
                <span class="font-medium text-slate-700">Rekening tujuan PT PUTRA WISANGGENI SATU / QRIS IKI KASIR</span>
              </label>

              <label class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
                <input type="checkbox" v-model="verificationChecks.clientDataValid" class="rounded text-amber-600 focus:ring-amber-500" />
                <span class="font-medium text-slate-700">Data pendaftar & kontak bisnis lengkap</span>
              </label>
            </div>

            <!-- Catatan -->
            <div>
              <label class="text-[11px] font-bold text-slate-600 block mb-1">Catatan Verifikasi:</label>
              <input 
                v-model="verificationNotes" 
                type="text" 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
                placeholder="Catatan pemeriksa pembayaran..."
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button 
            @click="handleRejectPayment"
            class="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <UserX class="w-4 h-4" />
            <span>Tolak / Bukti Tidak Sesuai</span>
          </button>

          <div class="flex items-center gap-2">
            <button 
              @click="isFinanceVerifyModalOpen = false"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button 
              @click="handleAccPayment"
              :disabled="!verificationChecks.amountMatches || !verificationChecks.accountValid || !verificationChecks.clientDataValid"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Acc Pembayaran Selesai</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- WHATSAPP CONFIRMATION PROMPT MODAL (Flowchart Step: Kirim WA Konfirmasi ke Klien) -->
    <div 
      v-if="showWaConfirmModal && lastConfirmedClient"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      @click.self="showWaConfirmModal = false"
    >
      <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 class="w-6 h-6" />
        </div>

        <div class="text-center">
          <h3 class="text-lg font-extrabold text-slate-900">Pembayaran Berhasil di-Acc!</h3>
          <p class="text-xs text-slate-500 mt-1">
            Data <strong>{{ lastConfirmedClient.name }}</strong> telah dikonversi ke Pelanggan Aktif & tugas diteruskan ke tim Teknisi.
          </p>
        </div>

        <!-- WhatsApp Preview Box -->
        <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
          {{ lastWaText }}
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button 
            @click="copyWaText"
            class="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy class="w-4 h-4 text-slate-400" />
            <span>Salin Pesan</span>
          </button>
          
          <a 
            :href="lastWaUrl"
            target="_blank"
            @click="showWaConfirmModal = false"
            class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Kirim WhatsApp</span>
          </a>
        </div>
      </div>
    </div>

    <!-- RECEIPT LIGHTBOX ZOOM MODAL -->
    <div 
      v-if="isReceiptZoomOpen"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      @click.self="isReceiptZoomOpen = false"
    >
      <div class="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <span class="text-xs font-bold text-slate-800">Pratinjau Bukti Transfer Pembayaran</span>
          <button @click="isReceiptZoomOpen = false" class="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X class="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div class="flex items-center justify-center overflow-auto max-h-[75vh]">
          <img :src="zoomedReceiptUrl" alt="Zoomed Receipt" class="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-md" />
        </div>

        <div class="text-center pt-2">
          <button 
            @click="isReceiptZoomOpen = false"
            class="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>

    <!-- EXISTING CRM MODALS -->
    <ClientFormModal 
      :is-open="isFormModalOpen"
      :client-to-edit="clientToEdit"
      @close="isFormModalOpen = false"
      @saved="handleClientSaved"
    />

    <ClientDetailModal 
      :is-open="isDetailModalOpen"
      :client="selectedClient"
      @close="isDetailModalOpen = false"
      @edit="openEditModal"
      @convert="openConvertModal"
      @add-followup="handleAddFollowUp"
    />

    <!-- MODAL KONFIRMASI PEMBAYARAN & PERSETUJUAN CALON CLIENT -->
    <Teleport to="body">
      <div 
        v-if="isApprovalModalOpen && clientToApprove"
        class="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3 sm:p-5"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          @click="isApprovalModalOpen = false"
        ></div>

        <!-- Modal Dialog -->
        <div class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Modal Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <CheckCircle2 class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 leading-tight">Konfirmasi Pembayaran & Setujui</h3>
                <p class="text-xs text-slate-500 mt-0.5">Verifikasi pembayaran pendaftaran sebelum mengonversi ke Pelanggan Aktif.</p>
              </div>
            </div>

            <button 
              @click="isApprovalModalOpen = false"
              class="w-8 h-8 rounded-full bg-slate-200/70 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
            
            <!-- Summary Calon Client -->
            <div class="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl p-4 border border-slate-200/70 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-slate-500">ID: {{ clientToApprove.id }}</span>
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">Calon Client</span>
                  </div>
                  <h4 class="text-base font-bold text-slate-900">{{ clientToApprove.name }}</h4>
                  <p class="text-xs text-slate-600 font-medium">{{ clientToApprove.businessName }} • {{ clientToApprove.businessCategory || 'Retail' }}</p>
                </div>
                
                <div class="text-right">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Paket Awal</span>
                  <span class="text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 inline-block mt-0.5">
                    {{ clientToApprove.packageInterest || 'Basic' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-slate-600">
                <div class="flex items-center gap-1.5 truncate">
                  <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span class="font-mono">{{ clientToApprove.phone }}</span>
                </div>
                <div class="flex items-center gap-1.5 truncate">
                  <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span class="truncate">{{ clientToApprove.email || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Form Detail Pembayaran -->
            <div class="space-y-4">
              <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400">Detail Pembayaran & Langganan</h5>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- Pilihan Paket Kasir -->
                <div>
                  <label class="block text-slate-700 font-bold mb-1">Paket Kasir Langganan <span class="text-rose-500">*</span></label>
                  <select 
                    v-model="approvalForm.packageType"
                    @change="onApprovalPackageChange"
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option v-for="pkg in availablePackages" :key="pkg.id" :value="pkg.name">
                      {{ pkg.name }} (Rp {{ Number(pkg.price || 0).toLocaleString('id-ID') }} {{ pkg.period || '/bulan' }})
                    </option>
                  </select>
                </div>

                <!-- Nominal Pembayaran -->
                <div>
                  <label class="block text-slate-700 font-bold mb-1">Nominal Pembayaran Diterima <span class="text-rose-500">*</span></label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                    <input 
                      v-model.number="approvalForm.amount"
                      type="number"
                      step="50000"
                      class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="250000"
                    />
                  </div>
                  <span class="text-[10px] text-slate-400 mt-1 block">
                    Rp {{ Number(approvalForm.amount || 0).toLocaleString('id-ID') }}
                  </span>
                </div>

                <!-- Metode Pembayaran -->
                <div>
                  <label class="block text-slate-700 font-bold mb-1">Metode Pembayaran <span class="text-rose-500">*</span></label>
                  <select 
                    v-model="approvalForm.paymentMethod"
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="Transfer BCA (PT PUNDI MAS BERKAH)">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer BRI">Transfer Bank BRI</option>
                    <option value="Transfer BNI">Transfer Bank BNI</option>
                    <option value="QRIS IKI KASIR">QRIS IKI KASIR</option>
                    <option value="Tunai / Kas Langsung">Tunai / Kas Langsung</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <!-- Tanggal Pembayaran -->
                <div>
                  <label class="block text-slate-700 font-bold mb-1">Tanggal Pembayaran <span class="text-rose-500">*</span></label>
                  <input 
                    v-model="approvalForm.paymentDate"
                    type="date"
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  />
                </div>

                <!-- No Referensi Pembayaran -->
                <div class="sm:col-span-2">
                  <label class="block text-slate-700 font-bold mb-1">Nomor Referensi / No. Transaksi (Opsional)</label>
                  <input 
                    v-model="approvalForm.referenceNo"
                    type="text"
                    placeholder="Contoh: TRX-20261023-01 / No ref mutasi bank"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <!-- Bukti Transfer / Pembayaran Section -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between">
                  <label class="block text-slate-700 font-bold">Bukti Transfer / Pembayaran</label>
                  <button 
                    v-if="!approvalForm.paymentProofUrl"
                    type="button"
                    @click="useSampleReceiptBca"
                    class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    + Gunakan Contoh Struk BCA
                  </button>
                </div>

                <!-- Preview jika ada -->
                <div v-if="approvalForm.paymentProofUrl" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <img 
                      :src="approvalForm.paymentProofUrl" 
                      alt="Bukti Transfer"
                      class="w-14 h-14 object-cover rounded-xl border border-slate-200 cursor-pointer shadow-xs hover:opacity-90"
                      @click="openReceiptZoom(approvalForm.paymentProofUrl)"
                    />
                    <div>
                      <span class="font-bold text-slate-800 block text-xs">Bukti Transfer Terlampir</span>
                      <button 
                        type="button" 
                        @click="openReceiptZoom(approvalForm.paymentProofUrl)"
                        class="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer mt-0.5"
                      >
                        <ZoomIn class="w-3 h-3" />
                        <span>Pratinjau Gambar</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="button"
                    @click="approvalForm.paymentProofUrl = ''"
                    class="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Hapus Bukti
                  </button>
                </div>

                <!-- Upload field jika belum ada -->
                <div v-else class="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    @change="handleProofFileUpload"
                    class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>

              <!-- Catatan -->
              <div>
                <label class="block text-slate-700 font-bold mb-1">Catatan Persetujuan</label>
                <input 
                  v-model="approvalForm.notes"
                  type="text"
                  placeholder="Catatan verifikasi atau keterangan..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <!-- Info Box Masa Aktif & Alur -->
              <div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1.5 text-slate-700">
                <div class="flex items-center gap-2 font-bold text-emerald-800">
                  <Sparkles class="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Alur Otomatis Setelah Disetujui:</span>
                </div>
                <ul class="space-y-1 pl-6 list-disc text-slate-600 text-[11px]">
                  <li>Calon client langsung menjadi <strong>Pelanggan Aktif</strong> dengan masa aktif <strong>1 Bulan</strong>.</li>
                  <li>Invoice tagihan berstatus <strong>Lunas (Paid)</strong> otomatis dibuat di menu <strong>Langganan</strong>.</li>
                  <li>Halaman akan langsung <strong>berpindah otomatis ke menu Semua Pelanggan</strong>.</li>
                </ul>
              </div>

              <!-- Konfirmasi Checklist -->
              <label class="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  v-model="approvalForm.confirmationAgreed"
                  class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span class="text-xs font-semibold text-slate-700 leading-snug">
                  Saya mengonfirmasi bahwa data pendaftar & nominal pembayaran telah sesuai dan siap diaktifkan sebagai Pelanggan Resmi IKI KASIR.
                </span>
              </label>

            </div>

          </div>

          <!-- Modal Footer Actions -->
          <div class="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
            <button 
              type="button"
              @click="isApprovalModalOpen = false"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button 
              type="button"
              @click="handleConfirmApproval"
              :disabled="!approvalForm.confirmationAgreed || !approvalForm.amount"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Konfirmasi & Setujui Jadi Pelanggan</span>
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <GoogleFormIntegrationModal 
      :is-open="isGoogleFormModalOpen"
      @close="isGoogleFormModalOpen = false"
    />

  </div>
</template>

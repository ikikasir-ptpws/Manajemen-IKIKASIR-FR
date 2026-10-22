<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  ArrowUpDown
} from 'lucide-vue-next'
import ClientFormModal from '../../components/crm/ClientFormModal.vue'
import ClientDetailModal from '../../components/crm/ClientDetailModal.vue'
import ConvertClientModal from '../../components/crm/ConvertClientModal.vue'
import GoogleFormIntegrationModal from '../../components/crm/GoogleFormIntegrationModal.vue'
import DateRangePicker from '../../components/common/DateRangePicker.vue'
import { useAppData } from '../../composables/useAppData'
import type { ClientLead, LeadStatus, LeadSource } from '../../types/crm'

// Connect to Centralized Lifecycle Store
const { 
  leads: clients, 
  updateLead,
  updateLeadStatus: updateStatus, 
  addFollowUpLog,
  approveLead, 
  rejectLead, 
  deleteLead, 
  statistics,
  currentRole,
  financeQueue,
  confirmPaymentByFinance,
  rejectPaymentByFinance,
  SAMPLE_RECEIPT_BCA,
  SAMPLE_RECEIPT_QRIS,
  getCustomerWaUrl
} = useAppData()

// Modals state
const isFormModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isConvertModalOpen = ref(false)
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

const statusOptions = ['Semua Status', 'Menunggu Acc Finance', 'New', 'Diproses', 'Converted', 'Lost']
const packageOptions = ['Semua Paket', 'Basic', 'Add on', 'Custom', 'Pro', 'Custom / IT One']

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
  Contacted: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', label: 'Diproses (Contacted)' },
  'Follow Up': { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600', label: 'Diproses (Follow Up)' },
  Interested: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-600', label: 'Diproses (Interested)' },
  Converted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', label: 'Disetujui (Converted)' },
  Lost: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', label: 'Ditolak (Lost)' },
}

const pendingFinanceCount = computed(() => {
  return clients.value.filter(c => c.paymentStatus === 'pending_verification').length
})

// Filtered clients (Unified list, prioritizing pending verification & FIFO order)
const filteredClients = computed(() => {
  return [...clients.value]
    .filter(c => {
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
      } else if (selectedStatus.value === 'Converted') {
        matchStatus = c.status === 'Converted'
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

const openConvertModal = (client: ClientLead) => {
  selectedClient.value = client
  isConvertModalOpen.value = true
}

const handleClientSaved = (savedClient: ClientLead) => {
  showToast(`✅ Data "${savedClient.name}" berhasil tersimpan di Calon Client!`)
}

const handleStatusChange = (clientId: string, newStatus: LeadStatus) => {
  updateStatus(clientId, newStatus)
  showToast(`Status pendaftar diubah menjadi ${newStatus}!`)
}

const handleDeleteClient = (id: string, name: string) => {
  if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar "${name}"?`)) {
    deleteLead(id)
    showToast(`Data pendaftar "${name}" telah dihapus.`)
  }
}

const handleAddFollowUp = (clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem') => {
  addFollowUpLog(clientId, note, channel)
  showToast(`Follow up / riwayat status baru tersimpan untuk client ini.`)
}

const handleApproveClient = (client: ClientLead) => {
  if (confirm(`Setujui pendaftaran "${client.name}" (${client.businessName})? Data akan otomatis masuk ke Semua Pelanggan dan Data Langganan.`)) {
    const cust = approveLead(client.id)
    if (cust) {
      showToast(`✅ Pendaftaran "${client.name}" DISETUJUI! Otomatis masuk ke Semua Pelanggan & Data Langganan.`)
    }
  }
}

const handleConvertConfirmed = (client: ClientLead) => {
  if (client) {
    const cust = approveLead(client.id)
    if (cust) {
      showToast(`✅ Pendaftaran "${client.name}" DISETUJUI! Otomatis masuk ke Semua Pelanggan & Data Langganan.`)
    }
  }
  isConvertModalOpen.value = false
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
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold mb-1">
          <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
          <span>Pusat Data Pendaftaran & Verifikasi Finance</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Data Pendaftar & Calon Client</h1>
        <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">Kelola pendaftaran masuk, verifikasi bukti transfer pembayaran Finance, dan konversi ke pelanggan aktif.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <!-- Google Form Docs Button -->
        <button 
          @click="isGoogleFormModalOpen = true"
          class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
          <span class="hidden sm:inline">Dokumentasi Google Form</span>
          <span class="sm:hidden">Google Form</span>
        </button>

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

    <!-- STATISTICS SUMMARY CARDS -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- Total -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Data</span>
          <span class="text-lg sm:text-xl font-black text-slate-800">{{ statistics.total }}</span>
        </div>
      </div>

      <!-- Menunggu Acc Finance -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-100 shadow-xs flex items-center gap-3 bg-amber-50/20">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <CreditCard class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">Menunggu Acc</span>
          <span class="text-lg sm:text-xl font-black text-amber-600">{{ pendingFinanceCount }}</span>
        </div>
      </div>

      <!-- Baru -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <UserPlus class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Baru</span>
          <span class="text-lg sm:text-xl font-black text-blue-600">{{ statistics.newCount }}</span>
        </div>
      </div>

      <!-- Diproses -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <RefreshCw class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Diproses</span>
          <span class="text-lg sm:text-xl font-black text-amber-600">{{ statistics.inProgressCount }}</span>
        </div>
      </div>

      <!-- Disetujui -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <UserCheck class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Disetujui</span>
          <span class="text-lg sm:text-xl font-black text-emerald-600">{{ statistics.convertedCount }}</span>
        </div>
      </div>

      <!-- Ditolak -->
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <UserX class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ditolak</span>
          <span class="text-lg sm:text-xl font-black text-rose-600">{{ statistics.lostCount }}</span>
        </div>
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

    <!-- DESKTOP UNIFIED TABLE VIEW -->
    <div class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[1050px]">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider">
              <th class="py-3 px-3.5 w-16 whitespace-nowrap">ID</th>
              <th class="py-3 px-3.5 min-w-[180px]">Nama & Bisnis</th>
              <th class="py-3 px-3.5 whitespace-nowrap">WhatsApp / Email</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Paket & Nominal</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap">Bukti Bayar</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Tgl Daftar</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Status Pembayaran</th>
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

              <!-- Paket & Nominal -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-md text-[11px] font-bold inline-block border"
                  :class="['Custom', 'Custom / IT One'].includes(client.packageInterest || '') ? 'bg-purple-50 text-purple-700 border-purple-200' : client.packageInterest === 'Add on' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'"
                >
                  {{ client.packageInterest || 'Basic' }}
                </span>
                <div class="text-[11px] font-bold text-slate-700 mt-1">
                  Rp {{ Number(client.paymentAmount || client.harga_paket || 250000).toLocaleString('id-ID') }}
                </div>
              </td>

              <!-- Bukti Transfer (Clean single-line link) -->
              <td class="py-3.5 px-3.5 text-center whitespace-nowrap" @click.stop>
                <button 
                  v-if="client.paymentProofUrl" 
                  @click="openReceiptZoom(client.paymentProofUrl)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
                  title="Klik untuk membuka bukti transfer pembayaran"
                >
                  <FileText class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Lihat Bukti</span>
                </button>
                <span v-else class="text-slate-400 text-xs italic">-</span>
              </td>

              <!-- Tgl Daftar -->
              <td class="py-3.5 px-3.5 text-slate-500 font-medium whitespace-nowrap">
                {{ client.registrationDate || client.lastFollowUp }}
              </td>

              <!-- Status Pendaftaran (Quick Changer) -->
              <td class="py-3.5 px-3.5 whitespace-nowrap" @click.stop>
                <select 
                  v-model="client.status"
                  @change="handleStatusChange(client.id, client.status)"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer outline-none"
                  :class="statusBadges[client.status]?.bg"
                >
                  <option value="New">Baru</option>
                  <option value="Contacted">Diproses</option>
                  <option value="Converted">Disetujui</option>
                  <option value="Lost">Ditolak</option>
                </select>
              </td>

              <!-- Aksi (Organized Segmented Layout) -->
              <td class="py-3.5 px-3.5 text-center whitespace-nowrap" @click.stop>
                <div class="inline-flex items-center justify-center gap-1.5">
                  <!-- Tombol Acc Finance hanya untuk yang pending_verification -->
                  <button 
                    v-if="client.paymentStatus === 'pending_verification'"
                    @click="openFinanceVerifyModal(client)"
                    title="Verifikasi Bukti Transfer & Acc Finance"
                    class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-amber-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck class="w-3.5 h-3.5 shrink-0" />
                    <span>Acc Bayar</span>
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
              <td colspan="8" class="py-8 text-center text-slate-400 text-xs">
                Tidak ada data pendaftar yang cocok dengan filter / pencarian.
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
            </div>
            <h4 class="font-extrabold text-sm text-slate-900 mt-0.5">{{ client.name }}</h4>
            <p class="text-xs text-slate-500">{{ client.businessName }} • {{ client.phone }}</p>
          </div>

          <select 
            v-model="client.status"
            @change="handleStatusChange(client.id, client.status)"
            @click.stop
            class="px-2 py-1 rounded-xl text-[10px] font-bold border"
            :class="statusBadges[client.status]?.bg"
          >
            <option value="New">Baru</option>
            <option value="Contacted">Diproses</option>
            <option value="Converted">Disetujui</option>
            <option value="Lost">Ditolak</option>
          </select>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Paket & Biaya:</span>
            <span class="font-bold text-slate-800">{{ client.packageInterest || 'Basic' }} (Rp {{ Number(client.paymentAmount || 250000).toLocaleString('id-ID') }})</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Bukti Transfer:</span>
            <button 
              v-if="client.paymentProofUrl" 
              @click.stop="openReceiptZoom(client.paymentProofUrl)"
              class="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText class="w-3.5 h-3.5 text-indigo-500" />
              <span>Lihat Bukti Bayar</span>
            </button>
            <span v-else class="text-slate-400">-</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1 flex-wrap" @click.stop>
          <button 
            v-if="client.paymentStatus === 'pending_verification'"
            @click="openFinanceVerifyModal(client)" 
            class="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-200"
          >
            <ShieldCheck class="w-3.5 h-3.5" /> Acc Bayar
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
                <span class="font-medium text-slate-700">Rekening tujuan PT PUNDI MAS BERKAH / QRIS IKI KASIR</span>
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

    <ConvertClientModal 
      :is-open="isConvertModalOpen"
      :client="selectedClient"
      @close="isConvertModalOpen = false"
      @confirmed="handleConvertConfirmed"
    />

    <GoogleFormIntegrationModal 
      :is-open="isGoogleFormModalOpen"
      @close="isGoogleFormModalOpen = false"
    />

  </div>
</template>

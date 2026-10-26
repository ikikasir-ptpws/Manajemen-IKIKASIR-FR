<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  MapPin, 
  Filter, 
  X, 
  ChevronDown, 
  Wrench, 
  Key, 
  Download, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Phone, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  CheckCheck, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  RotateCcw, 
  Store, 
  CreditCard, 
  Calendar, 
  Check, 
  EyeOff, 
  ZoomIn, 
  Receipt, 
  User, 
  AlertCircle, 
  Building2, 
  ChevronRight, 
  Share2 
} from 'lucide-vue-next'
import RentalAgreementModal from '../../components/RentalAgreementModal.vue'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import CustomerFormModal from '../../components/crm/CustomerFormModal.vue'
import { 
  useAppData, 
  SAMPLE_RECEIPT_BCA, 
  SAMPLE_RECEIPT_QRIS, 
  getCustomerWaUrl, 
  getOrCreateCustomerReferralCode 
} from '../../composables/useAppData'

const { 
  customers, 
  leads, 
  invoices, 
  technicianQueue, 
  getComputedCustomerStatus, 
  startTechnicianSetup, 
  reportEmailIssue, 
  resolveEmailIssue, 
  completeTechnicianSetup,
  syncWithBackend,
  isSyncing
} = useAppData()

onMounted(() => {
  syncWithBackend(true)
})

// Toast state
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

const copyReferralCode = (code: string) => {
  if (!code) return
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(code)
    showToast(`Kode referral "${code}" berhasil disalin ke clipboard!`)
  } else {
    showToast(`Kode Referral: ${code}`)
  }
}

const getInvitedLeadsForCustomer = (cust: any) => {
  if (!cust) return []
  const code = (cust.referralCode || '').toUpperCase().trim()
  const custId = cust.id
  return leads.value.filter(l => 
    (l.referredByCustomerId && l.referredByCustomerId === custId) ||
    (code && l.referralCode && l.referralCode.toUpperCase().trim() === code)
  )
}

// Search & Filter state
const searchQuery = ref('')
const showFilterDropdown = ref(false)
const filterType = ref('Semua')
const filterTeknisiStatus = ref('Semua')

// Modals
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const showAddEditModal = ref(false)
const editMode = ref(false)
const selectedCustomer = ref<any>(null)

const form = ref({ name: '', business: '', type: 'Basic' as 'Basic' | 'Pro' | 'Custom / IT One', phone: '', address: '' })

// Teknisi Metrics
const pendingTeknisiCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus && u.technicianStatus !== 'completed').length
})

const readyForSetupCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus === 'pending_setup' && !u.emailIssueReported).length
})

const inProgressCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus === 'in_progress' && !u.emailIssueReported).length
})

const issueCount = computed(() => {
  return customers.value.filter(u => u.emailIssueReported).length
})

const completedCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus === 'completed').length
})

// Unified Filtered Customers List
const filteredCustomers = computed(() => {
  let list = customers.value.map(c => {
    const { computedStatus, daysLeft, daysExpired } = getComputedCustomerStatus(c)
    return {
      ...c,
      business: c.businessName || c.business || 'Toko',
      type: c.packageType,
      joinDate: c.expiredDate ? c.expiredDate : '2026-09-01',
      computedStatus,
      daysLeft,
      daysExpired
    }
  })

  // Filter Paket
  if (filterType.value !== 'Semua') {
    list = list.filter(c => c.type === filterType.value)
  }

  // Filter Status Teknisi
  if (filterTeknisiStatus.value === 'Siap Dikerjakan') {
    list = list.filter(c => c.technicianStatus === 'pending_setup' && !c.emailIssueReported)
  } else if (filterTeknisiStatus.value === 'Sedang Dikerjakan') {
    list = list.filter(c => c.technicianStatus === 'in_progress' && !c.emailIssueReported)
  } else if (filterTeknisiStatus.value === 'Ada Kendala') {
    list = list.filter(c => c.emailIssueReported)
  } else if (filterTeknisiStatus.value === 'Selesai') {
    list = list.filter(c => c.technicianStatus === 'completed')
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.business.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }

  // Urutan: Pelanggan yang butuh setup teknisi diprioritaskan di atas
  return list.sort((a, b) => {
    const aPending = a.technicianStatus && a.technicianStatus !== 'completed' ? 0 : 1
    const bPending = b.technicianStatus && b.technicianStatus !== 'completed' ? 0 : 1
    return aPending - bPending
  })
})

// ==========================================
// PAGINATION STATE
// ==========================================
const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / pageSize.value) || 1
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + pageSize.value, filteredCustomers.value.length)
})

const paginatedCustomers = computed(() => {
  return filteredCustomers.value.slice(startIndex.value, startIndex.value + pageSize.value)
})

const resetFilter = () => {
  searchQuery.value = ''
  filterType.value = 'Semua'
  filterTeknisiStatus.value = 'Semua'
  currentPage.value = 1
}

watch([searchQuery, filterType, filterTeknisiStatus, pageSize], () => {
  currentPage.value = 1
})

// Detail Modal State & Helpers
const activeDetailTab = ref<'profil' | 'langganan' | 'teknisi'>('profil')
const isPasswordVisible = ref(false)
const copiedField = ref<string | null>(null)
const isReceiptZoomOpen = ref(false)
const zoomedReceiptUrl = ref<string | null>(null)

const openReceiptZoom = (url: string) => {
  zoomedReceiptUrl.value = url
  isReceiptZoomOpen.value = true
}

const copyToClipboard = (text: string, fieldName: string) => {
  if (!text) return
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text)
  }
  copiedField.value = fieldName
  showToast(`📋 ${fieldName} berhasil disalin!`)
  setTimeout(() => {
    if (copiedField.value === fieldName) copiedField.value = null
  }, 2000)
}

const getAssociatedLead = (cust: any) => {
  if (!cust || !leads.value) return null
  return leads.value.find((l: any) => 
    (cust.leadId && l.id === cust.leadId) || 
    (l.phone && cust.phone && l.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '')) ||
    (l.email && cust.email && l.email.toLowerCase() === cust.email.toLowerCase()) ||
    (l.name && cust.name && l.name.toLowerCase() === cust.name.toLowerCase())
  ) || null
}

const getAssociatedInvoices = (cust: any) => {
  if (!cust || !invoices.value) return []
  return invoices.value.filter((inv: any) => 
    inv.customerId === cust.id || 
    (cust.phone && inv.phone && inv.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '')) ||
    (cust.name && inv.customerName && inv.customerName.toLowerCase() === cust.name.toLowerCase())
  )
}

const getCustomerPaymentProof = (cust: any) => {
  if (!cust) return SAMPLE_RECEIPT_BCA
  if (cust.paymentProofUrl) return cust.paymentProofUrl
  const lead = getAssociatedLead(cust)
  if (lead && lead.paymentProofUrl) return lead.paymentProofUrl
  const invs = getAssociatedInvoices(cust)
  const invWithProof = invs.find((i: any) => i.paymentProofUrl)
  if (invWithProof) return invWithProof.paymentProofUrl
  if (cust.paymentMethod?.toLowerCase().includes('qris')) return SAMPLE_RECEIPT_QRIS
  return SAMPLE_RECEIPT_BCA
}

const getCustomerCredentials = (cust: any) => {
  if (!cust) return { username: '', password: '', apkUrl: '', guideUrl: '', spkNumber: '' }
  const cleanName = (cust.business || cust.name || 'kasir').toLowerCase().replace(/[^a-z0-9]/g, '')
  const username = cust.appUsername || `${cleanName}.pos`
  const password = cust.appPassword || 'Ikikasir#2026'
  const apkUrl = cust.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk'
  const guideUrl = cust.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf'
  const spkNumber = cust.rentalAgreementNumber || ('SPK/IKIKASIR/' + new Date().getFullYear() + '/' + (cust.id ? cust.id.replace(/\D/g, '').slice(-3) || '101' : '101'))
  return { username, password, apkUrl, guideUrl, spkNumber }
}

const openDetail = (cust: any) => {
  selectedCustomer.value = cust
  activeDetailTab.value = 'profil'
  isPasswordVisible.value = false
  showDetailModal.value = true
}

const openEditFromDetail = () => {
  const cust = selectedCustomer.value
  showDetailModal.value = false
  openEdit(cust)
}

const openSetupFromDetail = () => {
  const cust = selectedCustomer.value
  openSetupModal(cust)
}

const openAgreementFromDetail = () => {
  openAgreementPreview(selectedCustomer.value)
}

const openEdit = (cust: any) => {
  editMode.value = true
  selectedCustomer.value = cust
  showAddEditModal.value = true
}

const openAdd = () => {
  editMode.value = false
  selectedCustomer.value = null
  showAddEditModal.value = true
}

const handleCustomerSaved = (savedCust: any) => {
  showToast(`Data pelanggan "${savedCust.name}" berhasil disimpan!`)
  showAddEditModal.value = false
}

const confirmDelete = (cust: any) => {
  selectedCustomer.value = cust
  showDeleteConfirm.value = true
}

const deleteCustomer = () => {
  if (!selectedCustomer.value) return
  const cust = selectedCustomer.value
  customers.value = customers.value.filter(c => c.id !== cust.id)
  customersApi.delete(cust.id).catch(err => console.warn('Backend customersApi.delete warning:', err))
  showToast(`Pelanggan "${cust.name}" berhasil dihapus!`)
  showDeleteConfirm.value = false
  selectedCustomer.value = null
}

// ==========================================
// TEKNISI SETUP & STATUS WORKFLOW
// ==========================================
const isSetupModalOpen = ref(false)
const selectedSetupUser = ref<any>(null)
const selectedTechStatus = ref<'pending_setup' | 'in_progress' | 'issue' | 'completed'>('pending_setup')
const techIssueNotes = ref('')

// Rental Agreement Preview Modal State
const isRentalAgreementOpen = ref(false)
const rentalAgreementData = ref<any>(null)

const openSetupModal = (user: any) => {
  selectedSetupUser.value = user
  if (user.emailIssueReported) {
    selectedTechStatus.value = 'issue'
    techIssueNotes.value = user.emailIssueNotes || 'Kendala konfirmasi data / kontak pelanggan'
  } else if (user.technicianStatus === 'completed') {
    selectedTechStatus.value = 'completed'
    techIssueNotes.value = ''
  } else if (user.technicianStatus === 'in_progress') {
    selectedTechStatus.value = 'in_progress'
    techIssueNotes.value = ''
  } else {
    selectedTechStatus.value = 'pending_setup'
    techIssueNotes.value = ''
  }
  isSetupModalOpen.value = true
}

const saveSetupStatus = () => {
  if (!selectedSetupUser.value) return
  const id = selectedSetupUser.value.id
  const target = customers.value.find(c => c.id === id)
  if (!target) return

  const isIssue = selectedTechStatus.value === 'issue'
  const isCompleted = selectedTechStatus.value === 'completed'
  const isPending = selectedTechStatus.value === 'pending_setup'

  target.technicianStatus = isCompleted ? 'completed' : (isPending ? 'pending_setup' : 'in_progress')
  target.emailIssueReported = isIssue
  target.emailIssueNotes = isIssue ? (techIssueNotes.value || 'Ada kendala teknis / verifikasi data.') : undefined

  if (isCompleted) {
    target.status = 'active'
    target.setupCompletedAt = new Date().toLocaleDateString('id-ID')
  }

  // Update lead matching
  const lead = leads.value?.find(l => l.id === id || l.phone === target.phone)
  if (lead) {
    lead.technicianStatus = target.technicianStatus
    lead.emailIssueReported = isIssue
    lead.emailIssueNotes = target.emailIssueNotes
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ikikasir_customers_v4', JSON.stringify(customers.value))
    if (leads.value) localStorage.setItem('ikikasir_leads_v4', JSON.stringify(leads.value))
  }

  const statusLabel = isIssue 
    ? 'Ada Kendala' 
    : (isCompleted ? 'Selesai (Aplikasi Diberikan)' : (selectedTechStatus.value === 'in_progress' ? 'Sedang Pengerjaan' : 'Siap Dikerjakan'))
  showToast(`✅ Status pengerjaan "${target.name}" berhasil diubah menjadi: ${statusLabel}`)
  isSetupModalOpen.value = false
}

// Redirect ke WA Pelanggan (Kendala / Selesai / Kontak Umum)
const redirectToWa = (user: any, mode: 'issue' | 'completed' | 'custom' = 'custom') => {
  if (!user) return
  const phone = (user.phone || '').replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const name = user.name || 'Pelanggan'
  const business = user.businessName || user.business || 'Toko'

  let text = ''
  if (mode === 'issue') {
    const reason = techIssueNotes.value || user.emailIssueNotes || 'Kendala verifikasi data akun / email kasir'
    text = `Halo Kak ${name} (${business}), salam dari tim Teknisi IKI KASIR 🙏\n\nSaat ini kami sedang menyiapkan sistem & akun aplikasi kasir Anda. Namun, kami mendapati kendala:\n"${reason}"\n\nMohon konfirmasinya ya Kak agar kami dapat segera melanjutkan dan menyelesaikan penyiapan aplikasi. Terima kasih!`
  } else if (mode === 'completed') {
    text = `Halo Kak ${name} (${business}), kabar gembira! 🚀\n\nPenyiapan sistem dan akun aplikasi IKI KASIR untuk usaha Anda telah SELESAI dan siap digunakan.\n\nJika Kakak membutuhkan panduan atau bantuan awal pengoperasian kasir, tim kami siap mendampingi. Selamat bertransaksi & sukses selalu untuk usahanya! 🙏✨\n\nTim Teknisi IKI KASIR`
  } else {
    text = `Halo Kak ${name} (${business}), salam dari IKI KASIR. Ada yang bisa kami bantu terkait sistem kasir Anda?`
  }

  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
}

const openAgreementPreview = (user?: any) => {
  const target = user || selectedSetupUser.value || selectedCustomer.value
  if (!target) return
  rentalAgreementData.value = {
    clientName: target.name,
    businessName: target.businessName || target.business || 'Toko',
    packageName: target.packageInterest || target.packageType || 'Basic',
    phone: target.phone,
    email: target.email,
    address: target.address || 'Indonesia',
    agreementNumber: target.rentalAgreementNumber || ('SPK/IKIKASIR/' + new Date().getFullYear() + '/' + String(Math.floor(100 + Math.random() * 900))),
    startDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    expiredDate: target.expiredDate || '2026-10-31',
    monthlyFee: target.amount || (target.packageInterest === 'Pro' ? 500000 : 250000)
  }
  isRentalAgreementOpen.value = true
}
</script>

<template>
  <div class="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <Transition name="slide-fade">
      <div v-if="toastMessage" class="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top duration-200">
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Top Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Semua Pelanggan</h1>
        <p class="text-xs text-slate-500 mt-0.5">Kelola data pelanggan aktif serta proses penyiapan teknis aplikasi kasir (APK, kredensial, & surat sewa) oleh Teknisi.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button 
          @click="openAdd"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>
    </header>

    <!-- Quick Metrics Cards (5 Status Pillars - Clickable Filters) -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <!-- Total -->
      <div 
        @click="resetFilter"
        class="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        :class="filterTeknisiStatus === 'Semua' && filterType === 'Semua' && !searchQuery ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pelanggan</span>
          <span class="text-lg font-black text-slate-800">{{ customers.length }}</span>
        </div>
      </div>

      <!-- Siap Dikerjakan -->
      <div 
        @click="filterTeknisiStatus = 'Siap Dikerjakan'"
        class="bg-white rounded-2xl p-3.5 border border-cyan-100 shadow-xs flex items-center gap-3 bg-cyan-50/20 cursor-pointer hover:border-cyan-300 transition-all"
        :class="filterTeknisiStatus === 'Siap Dikerjakan' ? 'ring-2 ring-cyan-500 bg-cyan-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-cyan-700 font-bold uppercase tracking-wider block">Siap Dikerjakan</span>
          <span class="text-lg font-black text-cyan-600">{{ readyForSetupCount }}</span>
        </div>
      </div>

      <!-- Sedang Proses -->
      <div 
        @click="filterTeknisiStatus = 'Sedang Dikerjakan'"
        class="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        :class="filterTeknisiStatus === 'Sedang Dikerjakan' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Wrench class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sedang Proses</span>
          <span class="text-lg font-black text-indigo-600">{{ inProgressCount }}</span>
        </div>
      </div>

      <!-- Ada Kendala -->
      <div 
        @click="filterTeknisiStatus = 'Ada Kendala'"
        class="bg-white rounded-2xl p-3.5 border border-rose-100 shadow-xs flex items-center gap-3 bg-rose-50/20 cursor-pointer hover:border-rose-300 transition-all"
        :class="filterTeknisiStatus === 'Ada Kendala' ? 'ring-2 ring-rose-500 bg-rose-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Ada Kendala</span>
          <span class="text-lg font-black text-rose-600">{{ issueCount }}</span>
        </div>
      </div>

      <!-- Aplikasi Diberikan / Selesai -->
      <div 
        @click="filterTeknisiStatus = 'Selesai'"
        class="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center gap-3 bg-emerald-50/20 cursor-pointer hover:border-emerald-300 transition-all"
        :class="filterTeknisiStatus === 'Selesai' ? 'ring-2 ring-emerald-500 bg-emerald-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Selesai (Aktif)</span>
          <span class="text-lg font-black text-emerald-600">{{ completedCount }}</span>
        </div>
      </div>
    </div>

    <!-- Toolbar Filters -->
    <div class="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari pelanggan berdasarkan nama / toko / no telp / email..." 
          class="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      <div class="flex items-center flex-wrap gap-2 text-xs">
        <!-- Filter Status Teknisi -->
        <select 
          v-model="filterTeknisiStatus" 
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 cursor-pointer shadow-2xs"
        >
          <option value="Semua">Status Teknisi: Semua</option>
          <option value="Siap Dikerjakan">Siap Dikerjakan ({{ readyForSetupCount }})</option>
          <option value="Sedang Dikerjakan">Sedang Dikerjakan ({{ inProgressCount }})</option>
          <option value="Ada Kendala">Ada Kendala ({{ issueCount }})</option>
          <option value="Selesai">Aplikasi Diberikan ({{ completedCount }})</option>
        </select>

        <!-- Filter Paket -->
        <select 
          v-model="filterType" 
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="Semua">Paket: Semua</option>
          <option value="Basic">Basic</option>
          <option value="Pro">Pro</option>
          <option value="Custom / IT One">Custom / IT One</option>
        </select>

        <!-- Reset Button -->
        <button 
          @click="resetFilter"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Reset Filter"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <!-- Sinkronkan Data Backend Button -->
        <button 
          @click="syncWithBackend(true)"
          :disabled="isSyncing"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/60 font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          title="Sinkronkan dengan Database Backend"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="isSyncing ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">{{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan' }}</span>
        </button>
      </div>
    </div>

    <!-- Table Container (Desktop) -->
    <div class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[1000px]">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider">
              <th class="py-3 px-3.5 w-16 whitespace-nowrap">No</th>
              <th class="py-3 px-3.5 min-w-[200px]">Pelanggan & Toko</th>
              <th class="py-3 px-3.5 whitespace-nowrap">WhatsApp & Email</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Paket Kasir</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Status Penyiapan</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Masa Aktif Expired</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap w-48">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(cust, index) in paginatedCustomers" 
              :key="cust.id" 
              class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              :class="cust.technicianStatus === 'pending_setup' ? 'bg-cyan-50/20' : (cust.emailIssueReported ? 'bg-rose-50/20' : '')"
              @click="openDetail(cust)"
            >
              <!-- No -->
              <td class="py-3.5 px-3.5 text-slate-400 font-mono font-bold text-[11px] whitespace-nowrap">
                {{ startIndex + index + 1 }}
              </td>
              
              <!-- Pelanggan & Bisnis -->
              <td class="py-3.5 px-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {{ cust.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors leading-snug">{{ cust.name }}</div>
                    <div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium leading-tight">
                      <ShieldCheck class="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{{ cust.business }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- No WhatsApp & Email -->
              <td class="py-3.5 px-3.5 font-medium whitespace-nowrap">
                <div class="text-slate-700 font-mono text-[11px] flex items-center gap-1.5">
                  <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ cust.phone }}</span>
                </div>
                
                <!-- Email Issue flag -->
                <div v-if="cust.emailIssueReported" class="mt-1" @click.stop>
                  <button 
                    @click="redirectToWa(cust, 'issue')"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors animate-pulse cursor-pointer"
                    title="Hubungi Pelanggan via WhatsApp"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Kendala Email (Chat WA)</span>
                  </button>
                </div>
                <div v-else class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ cust.email || '-' }}</span>
                </div>
              </td>

              <!-- Tipe Paket -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-md text-[11px] font-bold inline-block border"
                  :class="{
                    'bg-purple-50 text-purple-700 border-purple-200': cust.type === 'Custom / IT One',
                    'bg-indigo-50 text-indigo-700 border-indigo-200': cust.type === 'Pro',
                    'bg-slate-100 text-slate-700 border-slate-200': cust.type === 'Basic'
                  }"
                >
                  {{ cust.type }}
                </span>
              </td>
              
              <!-- Status Teknisi -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <span 
                  v-if="cust.emailIssueReported"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                >
                  <AlertTriangle class="w-3.5 h-3.5 text-rose-600" />
                  <span>Ada Kendala</span>
                </span>
                <span 
                  v-else-if="cust.technicianStatus === 'completed'"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aplikasi Diberikan</span>
                </span>
                <span 
                  v-else-if="cust.technicianStatus === 'in_progress'"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                >
                  <Wrench class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sedang Pengerjaan</span>
                </span>
                <span 
                  v-else
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                >
                  <Clock class="w-3.5 h-3.5 text-cyan-600" />
                  <span>Siap Dikerjakan</span>
                </span>
              </td>

              <!-- Masa Aktif Expired -->
              <td class="py-3.5 px-3.5 text-slate-600 text-xs font-mono font-medium whitespace-nowrap">
                {{ cust.expiredDate || '-' }}
              </td>

              <!-- Aksi -->
              <td class="py-3.5 px-3.5 text-center whitespace-nowrap" @click.stop>
                <div class="inline-flex items-center justify-center gap-1.5">
                  <!-- Tombol Ubah Status Setup -->
                  <button 
                    @click="openSetupModal(cust)"
                    class="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-cyan-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Ubah Status Pengerjaan Teknisi"
                  >
                    <Wrench class="w-3.5 h-3.5 shrink-0" />
                    <span>Setup</span>
                  </button>

                  <!-- Tombol Redirect ke WA jika Ada Kendala -->
                  <button 
                    v-if="cust.emailIssueReported"
                    @click="redirectToWa(cust, 'issue')"
                    class="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Hubungi Pelanggan via WhatsApp (Ada Kendala)"
                  >
                    <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                    <span>WA Kendala</span>
                  </button>

                  <!-- Tombol Redirect ke WA jika Sudah Selesai -->
                  <button 
                    v-else-if="cust.technicianStatus === 'completed'"
                    @click="redirectToWa(cust, 'completed')"
                    class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Kirim Konfirmasi Selesai via WhatsApp"
                  >
                    <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                    <span>WA Selesai</span>
                  </button>

                  <!-- Segmented Action Toolbar: Detail, Edit, Hapus -->
                  <div class="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs divide-x divide-slate-100 overflow-hidden">
                    <button 
                      @click="openDetail(cust)" 
                      class="px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                      title="Lihat Detail Pelanggan"
                    >
                      <Eye class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Detail</span>
                    </button>
                    <button 
                      @click="openEdit(cust)" 
                      class="px-2.5 py-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                      title="Edit Data Pelanggan"
                    >
                      <Edit2 class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Edit</span>
                    </button>
                    <button 
                      @click="confirmDelete(cust)" 
                      class="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 transition-all cursor-pointer" 
                      title="Hapus Data Pelanggan"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="py-12 px-4 text-center">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <Users class="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Pelanggan Ditemukan</h4>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                      Belum ada data pelanggan yang cocok dengan kriteria filter atau pencarian Anda.
                    </p>
                  </div>
                  <div class="pt-2">
                    <button 
                      @click="resetFilter"
                      class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all cursor-pointer"
                    >
                      <RotateCcw class="w-3.5 h-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredCustomers.length > 0"
        :current-page="currentPage"
        :total-items="filteredCustomers.length"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <!-- Mobile Cards View -->
    <div class="block md:hidden space-y-3">
      <div 
        v-for="cust in paginatedCustomers" 
        :key="cust.id"
        class="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 cursor-pointer"
        @click="openDetail(cust)"
      >
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-extrabold text-sm text-slate-900">{{ cust.name }}</h4>
            <p class="text-xs text-slate-500">{{ cust.business }} &bull; {{ cust.phone }}</p>
          </div>
          <span 
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="cust.technicianStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'"
          >
            {{ cust.technicianStatus === 'completed' ? 'Selesai' : 'Siap Setup' }}
          </span>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Paket:</span>
            <span class="font-bold text-slate-800">{{ cust.type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Masa Aktif:</span>
            <span class="font-mono text-slate-700">{{ cust.expiredDate || '-' }}</span>
          </div>
          <div v-if="cust.emailIssueReported" class="pt-1 border-t border-slate-200 flex justify-between items-center text-rose-600 font-bold">
            <span>Ada Kendala!</span>
            <button @click.stop="redirectToWa(cust, 'issue')" class="text-rose-600 flex items-center gap-1 font-bold">
              <MessageSquare class="w-3 h-3" /> Hubungi WA
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1 flex-wrap" @click.stop>
          <button 
            @click="openSetupModal(cust)"
            class="flex-1 py-2 px-3 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-cyan-200 cursor-pointer"
          >
            <Wrench class="w-3.5 h-3.5" /> Setup Status
          </button>
          <button 
            v-if="cust.emailIssueReported"
            @click="redirectToWa(cust, 'issue')"
            class="py-2 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-200 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA Kendala
          </button>
          <button 
            v-else-if="cust.technicianStatus === 'completed'"
            @click="redirectToWa(cust, 'completed')"
            class="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-200 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA Selesai
          </button>
          <button 
            @click="openDetail(cust)" 
            class="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="openEdit(cust)" 
            class="py-2 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs hover:bg-amber-100 cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="confirmDelete(cust)" 
            class="py-2 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Mobile Empty State -->
      <div v-if="filteredCustomers.length === 0" class="bg-white rounded-2xl p-6 border border-slate-100 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Users class="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Pelanggan</h4>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Belum ada data pelanggan yang cocok dengan pencarian atau filter Anda.
          </p>
        </div>
        <div class="pt-2">
          <button 
            @click="resetFilter"
            class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-indigo-200"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset Filter</span>
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

    <!-- MODAL SETUP STATUS PENGERJAAN TEKNISI & REDIRECT WA -->
    <div 
      v-if="isSetupModalOpen && selectedSetupUser"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      @click.self="isSetupModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Wrench class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Status Pengerjaan Teknisi</h3>
              <p class="text-xs text-slate-500 font-medium">
                {{ selectedSetupUser.name }} &bull; {{ selectedSetupUser.businessName || selectedSetupUser.business }} ({{ selectedSetupUser.phone }})
              </p>
            </div>
          </div>
          <button @click="isSetupModalOpen = false" class="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer">
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Pilihan Status Pengerjaan (Cards Selector) -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 block">Pilih Status Pengerjaan Saat Ini:</label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- 1. Siap Dikerjakan -->
            <button 
              type="button"
              @click="selectedTechStatus = 'pending_setup'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'pending_setup' 
                ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 ring-2 ring-cyan-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold">Siap Dikerjakan</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Antrean baru, belum mulai diproses.</div>
              </div>
            </button>

            <!-- 2. Sedang Pengerjaan -->
            <button 
              type="button"
              @click="selectedTechStatus = 'in_progress'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'in_progress' 
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Wrench class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold">Sedang Pengerjaan</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Akun & aplikasi kasir sedang diproses.</div>
              </div>
            </button>

            <!-- 3. Ada Kendala -->
            <button 
              type="button"
              @click="selectedTechStatus = 'issue'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'issue' 
                ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold text-rose-700">Ada Kendala</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Email bounce, nomor salah, dll.</div>
              </div>
            </button>

            <!-- 4. Selesai (Aplikasi Diberikan) -->
            <button 
              type="button"
              @click="selectedTechStatus = 'completed'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'completed' 
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold text-emerald-700">Selesai</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Aplikasi selesai & aktif.</div>
              </div>
            </button>
          </div>
        </div>

        <!-- JIKA ADA KENDALA: Input Catatan & Tombol Redirect ke WA -->
        <div v-if="selectedTechStatus === 'issue'" class="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
            <span class="text-xs font-bold text-rose-800">Catatan Kendala & Redirect ke WhatsApp</span>
          </div>
          
          <div>
            <label class="text-[11px] font-bold text-slate-600 block mb-1">Catatan Kendala:</label>
            <textarea 
              v-model="techIssueNotes"
              rows="2"
              placeholder="Contoh: Email bounce / nomor telepon tidak aktif / butuh konfirmasi alamat toko..."
              class="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <!-- Tombol Redirect ke WA Pelanggan -->
          <button 
            type="button"
            @click="redirectToWa(selectedSetupUser, 'issue')"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Hubungi Pelanggan via WhatsApp (Info Kendala)</span>
          </button>
        </div>

        <!-- JIKA SELESAI: Tombol Redirect ke WA -->
        <div v-if="selectedTechStatus === 'completed'" class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span class="text-xs font-bold text-emerald-800">Penyiapan Selesai & Kirim Konfirmasi ke Pelanggan</span>
          </div>
          <p class="text-xs text-slate-600">
            Penyiapan sistem telah selesai. Anda dapat langsung mengirimkan ucapan selesai dan konfirmasi aplikasi kepada pelanggan melalui WhatsApp:
          </p>

          <!-- Tombol Redirect ke WA Pelanggan -->
          <button 
            type="button"
            @click="redirectToWa(selectedSetupUser, 'completed')"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Kirim Konfirmasi Selesai via WhatsApp</span>
          </button>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button 
            type="button"
            @click="isSetupModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="button"
            @click="saveSetupStatus"
            class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Simpan Perubahan Status</span>
          </button>
        </div>

      </div>
    </div>

    <!-- RENTAL AGREEMENT MODAL (Bilingual Printable Agreement with Kop Surat & Signatures) -->
    <RentalAgreementModal 
      v-if="rentalAgreementData"
      :is-open="isRentalAgreementOpen"
      :client-name="rentalAgreementData.clientName"
      :business-name="rentalAgreementData.businessName"
      :package-name="rentalAgreementData.packageName"
      :phone="rentalAgreementData.phone"
      :email="rentalAgreementData.email"
      :address="rentalAgreementData.address"
      :agreement-number="rentalAgreementData.agreementNumber"
      :start-date="rentalAgreementData.startDate"
      :expired-date="rentalAgreementData.expiredDate"
      :monthly-fee="rentalAgreementData.monthlyFee"
      @close="isRentalAgreementOpen = false"
    />

    <!-- COMPREHENSIVE DETAIL MODAL (3 TABS: PROFIL, LANGGANAN, TEKNISI) -->
    <Teleport to="body">
      <div 
        v-if="showDetailModal && selectedCustomer" 
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200" 
          @click="showDetailModal = false"
        ></div>

        <!-- Modal Box -->
        <div class="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Top Header with Breadcrumbs & Actions -->
          <div class="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/80">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                  <span class="hover:text-slate-600 cursor-pointer" @click="showDetailModal = false">Semua Pelanggan</span>
                  <ChevronRight class="w-3.5 h-3.5" />
                  <span class="text-slate-700 font-semibold">Detail Akun</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/80 text-slate-600 ml-1">#{{ selectedCustomer.id }}</span>
                </div>
                <h2 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Detail Lengkap Pelanggan & Akun Kasir</h2>
              </div>

              <button 
                @click="showDetailModal = false"
                class="w-8 h-8 rounded-full bg-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Action Buttons Row (Responsive) -->
            <div class="flex items-center flex-wrap gap-2 pt-0.5">
              <!-- Hubungi WhatsApp -->
              <button 
                @click="redirectToWa(selectedCustomer, selectedCustomer.emailIssueReported ? 'issue' : (selectedCustomer.technicianStatus === 'completed' ? 'completed' : 'custom'))"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <MessageSquare class="w-3.5 h-3.5" />
                <span>Hubungi WhatsApp</span>
              </button>

              <!-- Setup Status Teknisi -->
              <button 
                @click="openSetupFromDetail"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Wrench class="w-3.5 h-3.5" />
                <span>Ubah Status Setup</span>
              </button>

              <!-- Surat Perjanjian Sewa (SPK) -->
              <button 
                @click="openAgreementFromDetail"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <FileText class="w-3.5 h-3.5 text-indigo-300" />
                <span>Surat Sewa (SPK)</span>
              </button>

              <!-- Edit Data Pelanggan -->
              <button 
                @click="openEditFromDetail"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Edit2 class="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
            </div>
          </div>

          <!-- Main Modal Content (2 Columns: Left Profile Sidebar, Right Multi-Tab Content) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              <!-- Left Column (4 cols): Profile Card -->
              <div class="md:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
                <!-- Avatar -->
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold shadow-md mb-2 sm:mb-3">
                  {{ selectedCustomer.name.charAt(0) }}
                </div>

                <h3 class="text-base font-extrabold text-slate-800">{{ selectedCustomer.name }}</h3>
                <p class="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{{ selectedCustomer.business }}</span>
                </p>
                
                <!-- Status Badges Stack -->
                <div class="mt-2.5 mb-3 sm:mb-4 flex flex-wrap items-center justify-center gap-1.5">
                  <!-- Paket Badge -->
                  <span 
                    class="px-2.5 py-0.5 rounded-md text-[10px] font-bold border"
                    :class="{
                      'bg-purple-50 text-purple-700 border-purple-200': selectedCustomer.type === 'Custom / IT One',
                      'bg-indigo-50 text-indigo-700 border-indigo-200': selectedCustomer.type === 'Pro',
                      'bg-slate-100 text-slate-700 border-slate-200': selectedCustomer.type === 'Basic'
                    }"
                  >
                    Paket {{ selectedCustomer.type }}
                  </span>

                  <!-- Status Masa Aktif -->
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': selectedCustomer.computedStatus === 'active',
                      'bg-amber-50 text-amber-700 border-amber-200': selectedCustomer.computedStatus === 'expiring',
                      'bg-rose-50 text-rose-700 border-rose-200': selectedCustomer.computedStatus === 'expired'
                    }"
                  >
                    {{ selectedCustomer.computedStatus === 'active' ? 'Aktif' : (selectedCustomer.computedStatus === 'expiring' ? 'Segera Expired' : 'Expired') }}
                  </span>

                  <!-- Status Teknisi Badge -->
                  <span 
                    v-if="selectedCustomer.emailIssueReported"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-600" />
                    <span>Ada Kendala</span>
                  </span>
                  <span 
                    v-else-if="selectedCustomer.technicianStatus === 'completed'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                    <span>Aplikasi Selesai</span>
                  </span>
                  <span 
                    v-else-if="selectedCustomer.technicianStatus === 'in_progress'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                  >
                    <Wrench class="w-3 h-3 text-indigo-600" />
                    <span>Sedang Setup</span>
                  </span>
                  <span 
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                  >
                    <Clock class="w-3 h-3 text-cyan-600" />
                    <span>Siap Dikerjakan</span>
                  </span>
                </div>

                <!-- Contact & Store Info Box -->
                <div class="w-full border-t border-slate-100 pt-3 sm:pt-4 space-y-2.5 sm:space-y-3 text-left text-xs">
                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">No. WhatsApp / Telepon:</span>
                    <div class="flex items-center justify-between mt-0.5">
                      <p class="font-bold text-slate-800 font-mono">{{ selectedCustomer.phone }}</p>
                      <button 
                        @click="copyToClipboard(selectedCustomer.phone, 'Nomor Telepon')"
                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Salin Nomor Telepon"
                      >
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Email:</span>
                    <div class="flex items-center justify-between mt-0.5">
                      <p class="font-medium text-slate-700 truncate text-[11px]">{{ selectedCustomer.email || '-' }}</p>
                      <button 
                        v-if="selectedCustomer.email"
                        @click="copyToClipboard(selectedCustomer.email, 'Email')"
                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Salin Email"
                      >
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Kategori Usaha:</span>
                    <p class="font-bold text-slate-700 mt-0.5">{{ selectedCustomer.category || 'Retail & Usaha Mikro' }}</p>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Alamat Toko:</span>
                    <p class="font-medium text-slate-700 mt-0.5 leading-relaxed">{{ selectedCustomer.address || 'Indonesia' }}</p>
                  </div>

                  <div class="pt-1">
                    <span class="text-slate-400 block text-[11px] font-semibold">Tanggal Terdaftar:</span>
                    <p class="font-mono text-slate-700 mt-0.5">{{ selectedCustomer.joinDate || '2026-09-01' }}</p>
                  </div>
                </div>

                <!-- Direct WA button in card -->
                <button 
                  @click="redirectToWa(selectedCustomer, 'custom')"
                  class="w-full mt-4 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kirim Pesan WhatsApp</span>
                </button>
              </div>

              <!-- Right Column (8 cols): Tabbed Sections -->
              <div class="md:col-span-8 space-y-4">
                
                <!-- Tab Navigation Buttons -->
                <div class="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs font-bold">
                  <!-- Tab 1: Ringkasan & Profil -->
                  <button 
                    @click="activeDetailTab = 'profil'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="activeDetailTab === 'profil' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <User class="w-3.5 h-3.5" />
                    <span>Ringkasan & Profil</span>
                  </button>

                  <!-- Tab 2: Paket & Langganan -->
                  <button 
                    @click="activeDetailTab = 'langganan'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="activeDetailTab === 'langganan' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <CreditCard class="w-3.5 h-3.5" />
                    <span>Paket & Langganan</span>
                  </button>

                  <!-- Tab 3: Akun Kasir & Teknisi -->
                  <button 
                    @click="activeDetailTab = 'teknisi'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative"
                    :class="activeDetailTab === 'teknisi' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <Wrench class="w-3.5 h-3.5" />
                    <span>Akun Kasir & Teknisi</span>
                    <!-- Dot indicator if issue -->
                    <span 
                      v-if="selectedCustomer.emailIssueReported" 
                      class="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse"
                    ></span>
                  </button>
                </div>

                <!-- ========================================== -->
                <!-- TAB 1: RINGKASAN & PROFIL BISNIS -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'profil'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Alert Status Penyiapan Kasir -->
                  <div 
                    v-if="selectedCustomer.emailIssueReported"
                    class="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-rose-800">Perhatian: Ada Kendala Penyiapan Akun!</span>
                        <span class="text-[10px] font-bold uppercase bg-rose-200/80 text-rose-800 px-1.5 py-0.5 rounded">Action Needed</span>
                      </div>
                      <p class="text-xs text-rose-700 mt-1 leading-relaxed">
                        Catatan Teknisi: "{{ selectedCustomer.emailIssueNotes || 'Kendala verifikasi nomor telepon / email kasir.' }}"
                      </p>
                      <div class="mt-2.5 flex items-center gap-2">
                        <button 
                          @click="redirectToWa(selectedCustomer, 'issue')"
                          class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageSquare class="w-3.5 h-3.5" />
                          <span>Hubungi Pelanggan via WhatsApp</span>
                        </button>
                        <button 
                          @click="openSetupFromDetail"
                          class="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-50 cursor-pointer"
                        >
                          Ubah Status Setup
                        </button>
                      </div>
                    </div>
                  </div>

                  <div 
                    v-else-if="selectedCustomer.technicianStatus === 'completed'"
                    class="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 class="w-5 h-5" />
                      </div>
                      <div>
                        <span class="text-xs font-extrabold text-emerald-900 block">Penyiapan Aplikasi Telah Selesai</span>
                        <p class="text-[11px] text-emerald-700 mt-0.5">Sistem kasir sudah aktif, kredensial akun dan tautan aplikasi telah diserahkan ke pelanggan.</p>
                      </div>
                    </div>
                    <button 
                      @click="redirectToWa(selectedCustomer, 'completed')"
                      class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                      <span>Kirim WA Sukses</span>
                    </button>
                  </div>

                  <div 
                    v-else
                    class="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <Wrench class="w-5 h-5" />
                      </div>
                      <div>
                        <span class="text-xs font-extrabold text-cyan-900 block">
                          {{ selectedCustomer.technicianStatus === 'in_progress' ? 'Sedang Dikerjakan oleh Teknisi' : 'Menunggu Penyiapan Akun Kasir' }}
                        </span>
                        <p class="text-[11px] text-cyan-700 mt-0.5">
                          Teknisi ditugaskan untuk mengonfigurasi aplikasi kasir, APK, serta surat sewa pelanggan.
                        </p>
                      </div>
                    </div>
                    <button 
                      @click="openSetupFromDetail"
                      class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Update Status
                    </button>
                  </div>

                  <!-- Card Profil Bisnis & Pemilik -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Store class="w-4 h-4 text-indigo-600" />
                        <span>Informasi Profil Bisnis & Toko</span>
                      </h4>
                      <button 
                        @click="openEditFromDetail"
                        class="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 class="w-3 h-3" />
                        <span>Edit Profil</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Nama Pemilik / PIC:</span>
                        <p class="font-bold text-slate-800 text-sm mt-0.5">{{ selectedCustomer.name }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Nama Usaha / Toko:</span>
                        <p class="font-bold text-slate-800 text-sm mt-0.5">{{ selectedCustomer.business }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Kategori Bisnis:</span>
                        <p class="font-bold text-slate-800 mt-0.5">{{ selectedCustomer.category || 'Retail & Toko' }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">No. Handphone:</span>
                        <p class="font-mono font-bold text-slate-800 mt-0.5">{{ selectedCustomer.phone }}</p>
                      </div>

                      <div class="sm:col-span-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Alamat Lengkap Operasional:</span>
                        <p class="font-medium text-slate-800 mt-0.5 leading-relaxed">{{ selectedCustomer.address || 'Alamat belum diisi lengkap.' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Card Referensi Pendaftaran & Lead -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Sparkles class="w-4 h-4 text-indigo-600" />
                      <span>Data Referensi & Pendaftaran</span>
                    </h4>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span class="text-slate-400 block text-[11px]">ID Pelanggan:</span>
                        <span class="font-mono font-bold text-slate-800">#{{ selectedCustomer.id }}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[11px]">Tanggal Bergabung:</span>
                        <span class="font-mono font-semibold text-slate-800">{{ selectedCustomer.joinDate || '2026-09-01' }}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[11px]">Sumber Pendaftaran:</span>
                        <span class="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">Website / Online</span>
                      </div>
                    </div>

                    <div v-if="getAssociatedLead(selectedCustomer)?.notes" class="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span class="text-slate-400 block text-[11px] font-semibold">Catatan Pendaftaran Awal:</span>
                      <p class="text-slate-600 mt-0.5 italic">"{{ getAssociatedLead(selectedCustomer)?.notes }}"</p>
                    </div>
                  </div>

                  <!-- Card Program Referral & Calon Klien yang Di-Invite -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/90 shadow-xs space-y-4">
                    <div class="flex items-center justify-between border-b border-purple-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <Share2 class="w-4 h-4 text-purple-600" />
                        <span>Program Referral Pelanggan</span>
                      </h4>
                      <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Total Di-invite: {{ getInvitedLeadsForCustomer(selectedCustomer).length }} Klien
                      </span>
                    </div>

                    <!-- Kode Referal Pelanggan Ini -->
                    <div class="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span class="text-[11px] font-bold text-purple-950 block">Kode Referral Unik Pelanggan:</span>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-base font-black font-mono tracking-wider text-purple-950 bg-white px-2.5 py-1 rounded-lg border border-purple-300 shadow-xs">
                            {{ selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer) }}
                          </span>
                          <button 
                            @click="copyReferralCode(selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer))"
                            type="button"
                            class="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 text-xs font-bold px-2.5"
                            title="Salin Kode Referral"
                          >
                            <Copy class="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </button>
                        </div>
                        <p class="text-[10px] text-purple-700 mt-1">Bagikan kode ini ke calon pelanggan baru saat pendaftaran IKI KASIR.</p>
                      </div>

                      <!-- Jika pelanggan ini diundang oleh orang lain -->
                      <div v-if="selectedCustomer.referredByCustomerName" class="text-xs bg-white/80 p-2.5 rounded-xl border border-purple-200 sm:max-w-xs">
                        <span class="text-slate-400 block text-[10px]">Di-invite oleh Pelanggan:</span>
                        <p class="font-bold text-slate-800 text-[11px]">{{ selectedCustomer.referredByCustomerName }}</p>
                      </div>
                    </div>

                    <!-- Daftar Calon Klien yang Menggunakan Kode Ini -->
                    <div class="space-y-2">
                      <h5 class="text-xs font-bold text-slate-700">
                        Daftar Calon Klien Terhubung (Di-invite):
                      </h5>

                      <div v-if="getInvitedLeadsForCustomer(selectedCustomer).length > 0" class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                        <div 
                          v-for="lead in getInvitedLeadsForCustomer(selectedCustomer)" 
                          :key="lead.id"
                          class="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                        >
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="font-bold text-xs text-slate-900 truncate">{{ lead.name }}</span>
                              <span class="text-[11px] text-slate-500 font-medium">({{ lead.businessName }})</span>
                            </div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Paket: <strong class="text-slate-600">{{ lead.packageInterest || 'Basic' }}</strong></span>
                              <span>•</span>
                              <span>Daftar: {{ lead.registrationDate || '-' }}</span>
                            </div>
                          </div>

                          <div class="shrink-0 flex items-center gap-2">
                            <span 
                              class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              :class="lead.status === 'Converted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lead.status === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'"
                            >
                              {{ lead.status === 'Converted' ? 'Pelanggan Aktif' : lead.status === 'Lost' ? 'Ditolak' : 'Prospek Lead' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div v-else class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        <Share2 class="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p class="font-medium text-slate-700">Belum ada calon klien yang di-invite</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                          Saat calon klien mendaftar dengan memilih sumber <strong>Referral</strong> dan kode <strong>{{ selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer) }}</strong>, mereka akan otomatis terhubung di sini.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- ========================================== -->
                <!-- TAB 2: PAKET, MASA AKTIF & PEMBAYARAN -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'langganan'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Card Detail Paket & Billing -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CreditCard class="w-4 h-4 text-indigo-600" />
                        <span>Rincian Langganan & Tagihan</span>
                      </h4>
                      <span 
                        class="px-2.5 py-0.5 rounded-md text-[11px] font-bold border"
                        :class="{
                          'bg-purple-50 text-purple-700 border-purple-200': selectedCustomer.type === 'Custom / IT One',
                          'bg-indigo-50 text-indigo-700 border-indigo-200': selectedCustomer.type === 'Pro',
                          'bg-slate-100 text-slate-700 border-slate-200': selectedCustomer.type === 'Basic'
                        }"
                      >
                        Paket {{ selectedCustomer.type }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <!-- Nominal Langganan -->
                      <div class="p-3.5 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-2xl border border-indigo-100/70">
                        <span class="text-slate-500 block text-[11px] font-medium">Biaya Berlangganan:</span>
                        <div class="text-lg font-black text-slate-900 mt-0.5">
                          Rp {{ Number(selectedCustomer.amount || (selectedCustomer.type === 'Pro' ? 500000 : (selectedCustomer.type === 'Custom / IT One' ? 1500000 : 250000))).toLocaleString('id-ID') }}
                          <span class="text-xs font-normal text-slate-400">/ bulan</span>
                        </div>
                        <span class="text-[10px] text-indigo-600 font-bold mt-1 block">Termasuk modul POS & Cloud Sync</span>
                      </div>

                      <!-- Masa Aktif & Expired -->
                      <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <span class="text-slate-500 block text-[11px] font-medium">Masa Berlaku Aktif:</span>
                        <div class="font-mono text-base font-bold text-slate-800 mt-0.5">
                          {{ selectedCustomer.expiredDate || '-' }}
                        </div>
                        <div class="mt-1 flex items-center gap-1.5">
                          <span 
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            :class="{
                              'bg-emerald-100 text-emerald-800': selectedCustomer.computedStatus === 'active',
                              'bg-amber-100 text-amber-800': selectedCustomer.computedStatus === 'expiring',
                              'bg-rose-100 text-rose-800': selectedCustomer.computedStatus === 'expired'
                            }"
                          >
                            {{ selectedCustomer.computedStatus === 'active' ? `Tersisa ${selectedCustomer.daysLeft || 30} Hari` : (selectedCustomer.computedStatus === 'expiring' ? `Hampir Habis (${selectedCustomer.daysLeft} Hari)` : `Lewat ${selectedCustomer.daysExpired || 1} Hari`) }}
                          </span>
                        </div>
                      </div>

                      <!-- Metode Pembayaran -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Metode Pembayaran:</span>
                        <p class="font-bold text-slate-800 mt-0.5">{{ selectedCustomer.paymentMethod || 'Transfer BCA (PT PUNDI MAS BERKAH)' }}</p>
                      </div>

                      <!-- Status Pelanggan -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Status Akun:</span>
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span class="font-bold text-slate-800 capitalize">{{ selectedCustomer.status || 'Active' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Bukti Pembayaran / Struk Transfer -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Receipt class="w-4 h-4 text-indigo-600" />
                        <span>Bukti Pembayaran / Struk Transfer</span>
                      </h4>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3" />
                        <span>Terverifikasi Finance</span>
                      </span>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                      <!-- Struk Thumbnail -->
                      <div 
                        class="relative w-36 h-48 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs cursor-pointer group shrink-0"
                        @click="openReceiptZoom(getCustomerPaymentProof(selectedCustomer))"
                      >
                        <img 
                          :src="getCustomerPaymentProof(selectedCustomer)" 
                          alt="Bukti Transfer" 
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn class="w-6 h-6" />
                        </div>
                      </div>

                      <!-- Struk Details -->
                      <div class="flex-1 space-y-2 text-xs">
                        <div>
                          <span class="text-slate-400 block text-[11px]">Rekening / Channel Tujuan:</span>
                          <p class="font-bold text-slate-800">PT PUNDI MAS BERKAH (BCA 8735019283)</p>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[11px]">Nominal Transfer:</span>
                          <p class="font-extrabold text-slate-900 text-sm">
                            Rp {{ Number(selectedCustomer.amount || 250000).toLocaleString('id-ID') }}
                          </p>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[11px]">Status Struk:</span>
                          <p class="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                            <span>Telah diverifikasi sesuai tagihan paket kasir.</span>
                          </p>
                        </div>
                        <div class="pt-1">
                          <button 
                            @click="openReceiptZoom(getCustomerPaymentProof(selectedCustomer))"
                            class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <ZoomIn class="w-3.5 h-3.5 text-slate-500" />
                            <span>Perbesar & Lihat Bukti Bayar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Riwayat Invoices (Jika Ada) -->
                  <div v-if="getAssociatedInvoices(selectedCustomer).length > 0" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FileText class="w-4 h-4 text-indigo-600" />
                      <span>Riwayat Tagihan / Invoices</span>
                    </h4>

                    <div class="divide-y divide-slate-100 text-xs">
                      <div 
                        v-for="inv in getAssociatedInvoices(selectedCustomer)" 
                        :key="inv.id" 
                        class="py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <span class="font-mono font-bold text-slate-800 block">{{ inv.id }}</span>
                          <span class="text-[11px] text-slate-400">{{ inv.date }} &bull; {{ inv.paymentMethod }}</span>
                        </div>
                        <div class="text-right">
                          <span class="font-bold text-slate-900 block">Rp {{ Number(inv.amount || 0).toLocaleString('id-ID') }}</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {{ inv.status }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- ========================================== -->
                <!-- TAB 3: AKUN KASIR & PENYIAPAN TEKNISI -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'teknisi'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Card Status Pengerjaan Teknisi -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Wrench class="w-4 h-4 text-cyan-600" />
                        <span>Status Pengerjaan Teknisi</span>
                      </h4>
                      <button 
                        @click="openSetupFromDetail"
                        class="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Wrench class="w-3 h-3" />
                        <span>Ubah Status</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Status Saat Ini:</span>
                        <div class="mt-1">
                          <span 
                            v-if="selectedCustomer.emailIssueReported"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                          >
                            <AlertTriangle class="w-3.5 h-3.5 text-rose-600" />
                            <span>Ada Kendala Penyiapan</span>
                          </span>
                          <span 
                            v-else-if="selectedCustomer.technicianStatus === 'completed'"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                            <span>Selesai (Aplikasi Diberikan)</span>
                          </span>
                          <span 
                            v-else-if="selectedCustomer.technicianStatus === 'in_progress'"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                          >
                            <Wrench class="w-3.5 h-3.5 text-indigo-600" />
                            <span>Sedang Pengerjaan</span>
                          </span>
                          <span 
                            v-else
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                          >
                            <Clock class="w-3.5 h-3.5 text-cyan-600" />
                            <span>Siap Dikerjakan</span>
                          </span>
                        </div>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Teknisi PIC / Penanggung Jawab:</span>
                        <p class="font-bold text-slate-800 mt-1">
                          {{ selectedCustomer.technicianAssignedTo || 'Doni Teknisi (Tim Teknisi IKI KASIR)' }}
                        </p>
                      </div>
                    </div>

                    <!-- Catatan Kendala jika ada -->
                    <div v-if="selectedCustomer.emailIssueReported" class="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-rose-800">Catatan Kendala Teknisi:</span>
                        <button 
                          @click="redirectToWa(selectedCustomer, 'issue')"
                          class="text-rose-700 hover:underline font-bold flex items-center gap-1"
                        >
                          <MessageSquare class="w-3 h-3" /> Hubungi via WA
                        </button>
                      </div>
                      <p class="text-rose-700 mt-1 italic">"{{ selectedCustomer.emailIssueNotes || 'Kendala data nomor telepon / email kasir.' }}"</p>
                    </div>
                  </div>

                  <!-- Card Kredensial Akun Login Kasir -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Key class="w-4 h-4 text-indigo-600" />
                        <span>Kredensial Akun Aplikasi Kasir (Login Device)</span>
                      </h4>
                      <span class="text-[11px] text-slate-400">Digunakan kasir di tablet / HP</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <!-- Email Akun (Firebase Auth) -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                        <div class="min-w-0 flex-1">
                          <span class="text-slate-400 block text-[11px] font-semibold">Email Akun Pelanggan (Firebase Auth):</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block truncate">
                            {{ selectedCustomer.email || '-' }}
                          </span>
                        </div>
                        <button 
                          v-if="selectedCustomer.email"
                          @click="copyToClipboard(selectedCustomer.email, 'Email Akun Firebase')"
                          class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer shrink-0 ml-2"
                          title="Salin Email Firebase"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </div>

                      <!-- Password Akun -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span class="text-slate-400 block text-[11px] font-semibold">Password Akun (Firebase / Kasir):</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                            {{ isPasswordVisible ? getCustomerCredentials(selectedCustomer).password : '••••••••••••' }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <button 
                            @click="isPasswordVisible = !isPasswordVisible"
                            class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                            :title="isPasswordVisible ? 'Sembunyikan Password' : 'Lihat Password'"
                          >
                            <EyeOff v-if="isPasswordVisible" class="w-4 h-4" />
                            <Eye v-else class="w-4 h-4" />
                          </button>
                          <button 
                            @click="copyToClipboard(getCustomerCredentials(selectedCustomer).password, 'Password Kasir')"
                            class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                            title="Salin Password"
                          >
                            <Copy class="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <!-- Username -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span class="text-slate-400 block text-[11px] font-semibold">Username Login Kasir:</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                            {{ getCustomerCredentials(selectedCustomer).username }}
                          </span>
                        </div>
                        <button 
                          @click="copyToClipboard(getCustomerCredentials(selectedCustomer).username, 'Username Kasir')"
                          class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                          title="Salin Username"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p class="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Catatan:</strong> Kredensial ini diserahkan kepada pemilik usaha saat serah terima aplikasi kasir. Pemilik dapat mengganti password melalui menu pengaturan akun di aplikasi kasir.
                    </p>
                  </div>

                  <!-- Card File APK, Buku Panduan & Surat Sewa -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Download class="w-4 h-4 text-indigo-600" />
                      <span>Berkas APK & Surat Perjanjian Sewa</span>
                    </h4>

                    <div class="space-y-2.5 text-xs">
                      <!-- 1. APK Download -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Download class="w-4 h-4" />
                          </div>
                          <div>
                            <span class="font-bold text-slate-800 block">APK Aplikasi Kasir Android (v2.4)</span>
                            <span class="text-[11px] text-slate-400 font-mono">ikikasir-pos-v2.apk (42 MB)</span>
                          </div>
                        </div>

                        <div class="flex items-center gap-1.5">
                          <button 
                            @click="copyToClipboard(getCustomerCredentials(selectedCustomer).apkUrl, 'Link APK')"
                            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title="Salin Link Download APK"
                          >
                            <Copy class="w-3.5 h-3.5" />
                            <span class="hidden sm:inline">Salin Link</span>
                          </button>
                          <a 
                            :href="getCustomerCredentials(selectedCustomer).apkUrl" 
                            target="_blank"
                            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Download class="w-3.5 h-3.5" />
                            <span>Unduh APK</span>
                          </a>
                        </div>
                      </div>

                      <!-- 2. Buku Panduan PDF -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <BookOpen class="w-4 h-4" />
                          </div>
                          <div>
                            <span class="font-bold text-slate-800 block">Buku Panduan & SOP Kasir (PDF)</span>
                            <span class="text-[11px] text-slate-400 font-mono">panduan-penggunaan-ikikasir.pdf (3.8 MB)</span>
                          </div>
                        </div>

                        <a 
                          :href="getCustomerCredentials(selectedCustomer).guideUrl" 
                          target="_blank"
                          class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink class="w-3.5 h-3.5" />
                          <span>Buka Panduan</span>
                        </a>
                      </div>

                      <!-- 3. Surat Perjanjian Sewa SPK -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <FileText class="w-4 h-4" />
                          </div>
                          <div>
                            <span class="font-bold text-slate-800 block">Surat Perjanjian Sewa (SPK Resmi)</span>
                            <span class="text-[11px] text-slate-500 font-mono">No. {{ getCustomerCredentials(selectedCustomer).spkNumber }}</span>
                          </div>
                        </div>

                        <button 
                          @click="openAgreementFromDetail"
                          class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileText class="w-3.5 h-3.5 text-indigo-300" />
                          <span>Cetak Surat Sewa</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span class="text-[11px] text-slate-400">Data tersinkronisasi otomatis dengan server IKI KASIR.</span>
            
            <div class="flex items-center gap-2">
              <button 
                @click="showDetailModal = false"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white cursor-pointer"
              >
                Tutup
              </button>
              <button 
                @click="openSetupFromDetail"
                class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Wrench class="w-3.5 h-3.5" />
                <span>Setup Status</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- RECEIPT LIGHTBOX ZOOM MODAL -->
    <Teleport to="body">
      <div 
        v-if="isReceiptZoomOpen && zoomedReceiptUrl"
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
    </Teleport>

    <!-- CUSTOMER FORM MODAL (TAMBAH & EDIT DENGAN PEMILIHAN PEMBAYARAN & BUKTI TRANSFER) -->
    <CustomerFormModal 
      :is-open="showAddEditModal"
      :customer-to-edit="editMode ? selectedCustomer : null"
      @close="showAddEditModal = false"
      @saved="handleCustomerSaved"
    />

    <!-- EXISTING DELETE CONFIRMATION -->
    <div v-if="showDeleteConfirm && selectedCustomer" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
        <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center">Hapus Pelanggan?</h3>
        <p class="text-sm text-slate-500 text-center mt-1">Data <strong>{{ selectedCustomer.name }}</strong> akan dihapus secara permanen.</p>
        <div class="flex items-center gap-3 mt-6">
          <button @click="showDeleteConfirm = false" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Batal</button>
          <button @click="deleteCustomer" class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 cursor-pointer">Ya, Hapus</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { transform: translateX(30px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(30px); opacity: 0; }
</style>

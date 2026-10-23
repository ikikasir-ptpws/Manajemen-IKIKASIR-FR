<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  RotateCcw
} from 'lucide-vue-next'
import RentalAgreementModal from '../../components/RentalAgreementModal.vue'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import { useAppData } from '../../composables/useAppData'

const { 
  customers, 
  leads,
  technicianQueue, 
  getComputedCustomerStatus,
  startTechnicianSetup,
  reportEmailIssue,
  resolveEmailIssue,
  completeTechnicianSetup,
  getCustomerWaUrl
} = useAppData()

// Toast state
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
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

const openDetail = (cust: any) => {
  selectedCustomer.value = cust
  showDetailModal.value = true
}

const openEdit = (cust: any) => {
  editMode.value = true
  form.value = { name: cust.name, business: cust.business, type: cust.type, phone: cust.phone, address: cust.address }
  selectedCustomer.value = cust
  showAddEditModal.value = true
}

const openAdd = () => {
  editMode.value = false
  form.value = { name: '', business: '', type: 'Basic', phone: '', address: '' }
  showAddEditModal.value = true
}

const saveCustomer = () => {
  if (!form.value.name || !form.value.business) return
  if (editMode.value && selectedCustomer.value) {
    const idx = customers.value.findIndex(c => c.id === selectedCustomer.value.id)
    if (idx !== -1 && customers.value[idx]) {
      const curr = customers.value[idx]
      customers.value[idx] = {
        ...curr,
        name: form.value.name,
        businessName: form.value.business,
        business: form.value.business,
        packageType: form.value.type as any,
        phone: form.value.phone,
        address: form.value.address,
        joinDate: curr.joinDate,
        status: curr.status
      }
      showToast(`Data "${form.value.name}" berhasil diperbarui!`)
    }
  } else {
    customers.value.push({
      id: 'cust-' + Date.now(),
      no: customers.value.length + 1,
      name: form.value.name,
      businessName: form.value.business,
      business: form.value.business,
      packageType: form.value.type as any,
      phone: form.value.phone,
      address: form.value.address,
      expiredDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'active',
      technicianStatus: 'pending_setup',
      amount: form.value.type === 'Pro' ? 500000 : 250000,
      paymentMethod: 'Transfer'
    })
    showToast(`Pelanggan "${form.value.name}" berhasil ditambahkan!`)
  }
  showAddEditModal.value = false
}

const confirmDelete = (cust: any) => {
  selectedCustomer.value = cust
  showDeleteConfirm.value = true
}

const deleteCustomer = () => {
  customers.value = customers.value.filter(c => c.id !== selectedCustomer.value.id)
  showToast(`Pelanggan "${selectedCustomer.value.name}" berhasil dihapus!`)
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
    localStorage.setItem('ikikasir_customers', JSON.stringify(customers.value))
    if (leads.value) localStorage.setItem('ikikasir_leads', JSON.stringify(leads.value))
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
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800 text-[11px] font-bold mb-1">
          <Wrench class="w-3.5 h-3.5 text-cyan-600" />
          <span>Data Pelanggan & Penyiapan Aplikasi Teknisi</span>
        </div>
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

    <!-- EXISTING DETAIL MODAL -->
    <div v-if="showDetailModal && selectedCustomer" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showDetailModal = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800">Detail Pelanggan</h3>
          <button @click="showDetailModal = false" class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X class="w-4 h-4 text-slate-400" /></button>
        </div>
        <div class="flex items-center gap-3 mb-5">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">{{ selectedCustomer.name.charAt(0) }}</div>
          <div>
            <div class="font-bold text-slate-800">{{ selectedCustomer.name }}</div>
            <div class="text-xs text-slate-500">{{ selectedCustomer.business }}</div>
          </div>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Telepon</span><span class="font-semibold text-slate-800">{{ selectedCustomer.phone }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Alamat</span><span class="font-semibold text-slate-800 text-right max-w-[200px]">{{ selectedCustomer.address }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Paket</span><span class="font-semibold text-slate-800">{{ selectedCustomer.type }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Masa Aktif</span><span class="font-semibold text-slate-800">{{ selectedCustomer.expiredDate || '-' }}</span></div>
          <div class="flex justify-between py-2"><span class="text-slate-500">Status</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="selectedCustomer.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'">{{ selectedCustomer.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- EXISTING ADD / EDIT MODAL -->
    <div v-if="showAddEditModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showAddEditModal = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-slate-800">{{ editMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru' }}</h3>
          <button @click="showAddEditModal = false" class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X class="w-4 h-4 text-slate-400" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Nama Pelanggan *</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Masukkan nama..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Nama Bisnis *</label>
            <input v-model="form.business" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Masukkan nama bisnis..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">No. Telepon</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="08xxx..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Alamat</label>
            <input v-model="form.address" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Alamat..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Tipe Paket</label>
            <select v-model="form.type" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500">
              <option>Basic</option>
              <option>Pro</option>
              <option>Custom / IT One</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-6">
          <button @click="showAddEditModal = false" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Batal</button>
          <button @click="saveCustomer" class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer">{{ editMode ? 'Simpan Perubahan' : 'Tambah Pelanggan' }}</button>
        </div>
      </div>
    </div>

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

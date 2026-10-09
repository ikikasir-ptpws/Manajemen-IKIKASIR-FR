<script setup lang="ts">
import { ref, computed } from 'vue'
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
  FileSpreadsheet,
  Package,
  Layers,
  Sparkles,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Users
} from 'lucide-vue-next'
import ClientFormModal from '../../components/crm/ClientFormModal.vue'
import ClientDetailModal from '../../components/crm/ClientDetailModal.vue'
import ConvertClientModal from '../../components/crm/ConvertClientModal.vue'
import GoogleFormIntegrationModal from '../../components/crm/GoogleFormIntegrationModal.vue'
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
  statistics 
} = useAppData()

// View state: 'table' or 'detail'
const currentView = ref<'table' | 'detail'>('table')

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
const selectedSource = ref<string>('Semua Sumber')
const selectedPackage = ref<string>('Semua Paket')
const currentPage = ref(1)

// Dropdown toggles
const showStatusDropdown = ref(false)
const showSourceDropdown = ref(false)
const showPackageDropdown = ref(false)

const statusOptions = ['Semua Status', 'New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost']
const sourceOptions = ['Semua Sumber', 'Website', 'Google Form', 'Instagram', 'WhatsApp', 'Facebook Ads', 'Referral']
const packageOptions = ['Semua Paket', 'Basic', 'Add on', 'Custom', 'Pro', 'Custom / IT One']

// Badges colors
const statusBadges: Record<LeadStatus, { bg: string, text: string, label: string }> = {
  New: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', label: 'Baru' },
  Contacted: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', label: 'Diproses (Contacted)' },
  'Follow Up': { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600', label: 'Diproses (Follow Up)' },
  Interested: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-600', label: 'Diproses (Interested)' },
  Converted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', label: 'Disetujui (Converted)' },
  Lost: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', label: 'Ditolak (Lost)' },
}

// Filtered clients
const filteredClients = computed(() => {
  return clients.value.filter(c => {
    const matchSearch = !searchQuery.value.trim() || 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.phone.includes(searchQuery.value) ||
      c.businessName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchStatus = selectedStatus.value === 'Semua Status' || 
      (selectedStatus.value === 'New' && c.status === 'New') ||
      (selectedStatus.value === 'Diproses' && ['Contacted', 'Follow Up', 'Interested'].includes(c.status)) ||
      (selectedStatus.value === 'Converted' && c.status === 'Converted') ||
      (selectedStatus.value === 'Lost' && c.status === 'Lost') ||
      c.status === selectedStatus.value

    const matchSource = selectedSource.value === 'Semua Sumber' || c.source === selectedSource.value
    const matchPackage = selectedPackage.value === 'Semua Paket' || c.packageInterest === selectedPackage.value

    return matchSearch && matchStatus && matchSource && matchPackage
  })
})

const resetFilter = () => {
  searchQuery.value = ''
  selectedStatus.value = 'Semua Status'
  selectedSource.value = 'Semua Sumber'
  selectedPackage.value = 'Semua Paket'
}

// Actions
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
  // ClientFormModal already persists to store (addRegistration or updateLead).
  // Here we just show a success notification.
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
      showToast(`✅ Pendaftaran "${client.name}" DISERETUJI! Otomatis masuk ke Semua Pelanggan & Data Langganan.`)
    }
  }
}

const handleConvertConfirmed = (client: ClientLead) => {
  if (client) {
    const cust = approveLead(client.id)
    if (cust) {
      showToast(`✅ Pendaftaran "${client.name}" DISERETUJI! Otomatis masuk ke Semua Pelanggan & Data Langganan.`)
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
  const message = encodeURIComponent(`Halo Kak ${client.name}, salam dari Super Admin IKI KASIR. Kami ingin mengonfirmasi pendaftaran sistem kasir Anda (Paket: ${client.packageInterest || 'Basic'}).`)
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

    <!-- VIEW 1: TABLE / CARDS VIEW -->
    <div v-if="currentView === 'table'" class="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      
      <!-- Top Header -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold mb-1">
            <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
            <span>Pusat Data Pendaftaran Super Admin</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Data Pendaftar & Calon Client</h1>
          <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">Kelola seluruh data pendaftaran dari Form Website dan Google Form secara terpusat.</p>
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

      <!-- SUPER ADMIN STATISTICS SUMMARY CARDS (Required by Item 8) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <!-- Total -->
        <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Pendaftar</span>
            <span class="text-lg sm:text-xl font-black text-slate-800">{{ statistics.total }}</span>
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
        <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserX class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ditolak</span>
            <span class="text-lg sm:text-xl font-black text-rose-600">{{ statistics.lostCount }}</span>
          </div>
        </div>
      </div>

      <!-- SOURCE & PACKAGE BREAKDOWN BADGES -->
      <div class="flex items-center flex-wrap gap-2 text-xs">
        <div class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-2">
          <span>Sumber:</span>
          <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold">Website: {{ statistics.websiteCount }}</span>
          <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold">Google Form: {{ statistics.googleFormCount }}</span>
        </div>

        <div class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-2">
          <span>Paket:</span>
          <span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">Basic: {{ statistics.basicCount }}</span>
          <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold">Add on: {{ statistics.addOnCount }}</span>
          <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold">Pro: {{ statistics.proCount }}</span>
          <span class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold">Custom: {{ statistics.customCount }}</span>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
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
          
          <!-- Dropdown Status -->
          <div class="relative flex-1 sm:flex-none">
            <button 
              @click="showStatusDropdown = !showStatusDropdown"
              class="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <span class="truncate max-w-[110px] sm:max-w-none">Status: {{ selectedStatus }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            <div 
              v-if="showStatusDropdown"
              class="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button 
                v-for="st in ['Semua Status', 'New', 'Diproses', 'Converted', 'Lost']" 
                :key="st"
                @click="selectedStatus = st; showStatusDropdown = false"
                class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
                :class="selectedStatus === st ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
              >
                <span>{{ st === 'New' ? 'Baru' : (st === 'Converted' ? 'Disetujui' : (st === 'Lost' ? 'Ditolak' : st)) }}</span>
                <span v-if="selectedStatus === st" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              </button>
            </div>
          </div>

          <!-- Dropdown Sumber (Website vs Google Form) -->
          <div class="relative flex-1 sm:flex-none">
            <button 
              @click="showSourceDropdown = !showSourceDropdown"
              class="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <span class="truncate max-w-[110px] sm:max-w-none">Sumber: {{ selectedSource }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            <div 
              v-if="showSourceDropdown"
              class="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button 
                v-for="src in ['Semua Sumber', 'Website', 'Google Form', 'Instagram', 'WhatsApp']" 
                :key="src"
                @click="selectedSource = src; showSourceDropdown = false"
                class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
                :class="selectedSource === src ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
              >
                <span>{{ src }}</span>
                <span v-if="selectedSource === src" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
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

      <!-- DESKTOP TABLE VIEW (Required by Item 6) -->
      <div class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/60 font-semibold">
                <th class="py-3 px-3.5 w-12">ID</th>
                <th class="py-3 px-3.5">Nama & Bisnis</th>
                <th class="py-3 px-3.5">WhatsApp / Email</th>
                <th class="py-3 px-3.5">Paket Dipilih</th>
                <th class="py-3 px-3.5">Alamat</th>
                <th class="py-3 px-3.5">Sumber</th>
                <th class="py-3 px-3.5">Tgl Daftar</th>
                <th class="py-3 px-3.5">Status Pendaftaran</th>
                <th class="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="(client, idx) in filteredClients" 
                :key="client.id"
                class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                @click="openDetailModal(client)"
              >
                <td class="py-3.5 px-3.5 text-slate-400 font-mono font-bold text-[11px]">{{ client.id }}</td>
                
                <!-- Nama Client & Toko -->
                <td class="py-3.5 px-3.5">
                  <div class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ client.name }}</div>
                  <div class="text-[11px] text-slate-400 font-medium">{{ client.businessName }} ({{ client.businessCategory || 'Retail' }})</div>
                </td>

                <!-- No WhatsApp & Email -->
                <td class="py-3.5 px-3.5 font-medium">
                  <div class="text-slate-700 font-mono text-[11px] flex items-center gap-1">
                    <Phone class="w-3 h-3 text-slate-400" />
                    {{ client.phone }}
                  </div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-1">
                    <Mail class="w-3 h-3 text-slate-400" />
                    {{ client.email }}
                  </div>
                </td>

                <!-- Paket Dipilih -->
                <td class="py-3.5 px-3.5 font-semibold">
                  <span 
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block border"
                    :class="['Custom', 'Custom / IT One'].includes(client.packageInterest || '') ? 'bg-purple-50 text-purple-700 border-purple-200' : client.packageInterest === 'Add on' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'"
                  >
                    {{ client.packageInterest || 'Basic' }}
                  </span>
                </td>

                <!-- Alamat -->
                <td class="py-3.5 px-3.5 text-slate-600 max-w-[150px] truncate" :title="client.address">
                  {{ client.address || '-' }}
                </td>

                <!-- Sumber Pendaftaran (Website vs Google Form) -->
                <td class="py-3.5 px-3.5 font-bold">
                  <span 
                    v-if="client.source === 'Google Form'"
                    class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"
                  >
                    <FileSpreadsheet class="w-3 h-3 text-emerald-600" />
                    Google Form
                  </span>
                  <span 
                    v-else-if="client.source === 'Website'"
                    class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 w-fit"
                  >
                    <Sparkles class="w-3 h-3 text-indigo-600" />
                    Website
                  </span>
                  <span v-else class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 w-fit">
                    {{ client.source }}
                  </span>
                </td>

                <!-- Tgl Daftar -->
                <td class="py-3.5 px-3.5 text-slate-500 font-medium">
                  {{ client.registrationDate || client.lastFollowUp }}
                </td>

                <!-- Status Pendaftaran (Interactive Quick Changer) -->
                <td class="py-3.5 px-3.5" @click.stop>
                  <select 
                    v-model="client.status"
                    @change="handleStatusChange(client.id, client.status)"
                    class="px-2.5 py-1 rounded-xl text-[11px] font-bold border focus:outline-none transition-all cursor-pointer"
                    :class="statusBadges[client.status]?.bg"
                  >
                    <option value="New">Baru</option>
                    <option value="Contacted">Diproses (Contacted)</option>
                    <option value="Follow Up">Diproses (Follow Up)</option>
                    <option value="Interested">Diproses (Interested)</option>
                    <option value="Converted">Disetujui (Converted)</option>
                    <option value="Lost">Ditolak (Lost)</option>
                  </select>
                </td>

                <!-- Aksi -->
                <td class="py-3.5 px-3.5 text-center" @click.stop>
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Setujui Button (Rule 6) -->
                    <button 
                      v-if="client.status !== 'Converted'"
                      @click="handleApproveClient(client)"
                      title="Setujui Pendaftaran (Masuk Semua Pelanggan)"
                      class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                    >
                      <UserCheck class="w-3 h-3 text-emerald-600" />
                      <span>Setujui</span>
                    </button>

                    <!-- Tolak Button (Rule 7) -->
                    <button 
                      v-if="client.status !== 'Lost' && client.status !== 'Converted'"
                      @click="handleRejectClient(client)"
                      title="Tolak Pendaftaran"
                      class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-rose-200"
                    >
                      <UserX class="w-3 h-3 text-rose-600" />
                      <span>Tolak</span>
                    </button>

                    <button 
                      @click="openDetailModal(client)"
                      title="Lihat Detail Pendaftar"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <button 
                      @click="sendWhatsAppDirect(client)"
                      title="Kirim Pesan WA"
                      class="w-7 h-7 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                    </button>

                    <button 
                      @click="handleDeleteClient(client.id, client.name)"
                      title="Hapus Data"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredClients.length === 0">
                <td colspan="9" class="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data pendaftar yang cocok dengan filter / pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MOBILE CARDS VIEW -->
      <div class="block md:hidden space-y-3">
        <div 
          v-for="client in filteredClients" 
          :key="client.id"
          class="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
          @click="openDetailModal(client)"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono text-slate-400 font-bold">ID: {{ client.id }}</span>
              <h4 class="font-extrabold text-sm text-slate-900">{{ client.name }}</h4>
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

          <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Paket:</span>
              <span class="font-bold text-indigo-700">{{ client.packageInterest || 'Basic' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Sumber:</span>
              <span class="font-bold text-emerald-700">{{ client.source }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Alamat:</span>
              <span class="font-medium text-slate-700 truncate max-w-[180px]">{{ client.address || '-' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1" @click.stop>
            <button 
              @click="openDetailModal(client)" 
              class="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1"
            >
              <Eye class="w-3.5 h-3.5" /> Detail
            </button>
            <button 
              @click="sendWhatsAppDirect(client)" 
              class="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1"
            >
              <MessageSquare class="w-3.5 h-3.5" /> WA
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- MODALS -->
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

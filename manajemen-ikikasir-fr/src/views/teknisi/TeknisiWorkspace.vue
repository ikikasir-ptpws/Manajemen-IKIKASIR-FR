<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Eye, 
  Send, 
  FileText, 
  KeyRound, 
  User, 
  Lock, 
  Download, 
  BookOpen, 
  FileCheck, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  RotateCcw,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-vue-next'
import { useAppData } from '../../composables/useAppData'
import RentalAgreementModal from '../../components/RentalAgreementModal.vue'

const { 
  technicianQueue, 
  startTechnicianSetup, 
  reportEmailIssue, 
  resolveEmailIssue, 
  completeTechnicianSetup,
  getCustomerWaUrl
} = useAppData()

// State
const searchQuery = ref('')
const filterStatus = ref<'all' | 'pending_setup' | 'in_progress' | 'completed' | 'email_issue'>('all')
const selectedClient = ref<any | null>(null)
const isWorkModalOpen = ref(false)
const isRentalModalOpen = ref(false)
const isSuccessModalOpen = ref(false)

// Work Form State
const workUsername = ref('')
const workPassword = ref('')
const workApkUrl = ref('https://ikikasir.com/download/ikikasir-pos-v2.apk')
const workGuideUrl = ref('https://ikikasir.com/docs/buku-panduan-ikikasir.pdf')
const workRentalNumber = ref('')
const workExpiredDate = ref('')
const workNotes = ref('')
const isWorking = ref(false)

// Email Issue State
const hasEmailIssue = ref(false)
const emailIssueReason = ref('')
const correctedEmail = ref('')

// WhatsApp Delivery payload
const deliveryPayload = ref<{
  clientName: string
  businessName: string
  whatsappText: string
  whatsappUrl: string
} | null>(null)

// Toast
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// KPI Stats
const stats = computed(() => {
  const all = technicianQueue.value
  const pending = all.filter(c => c.technicianStatus === 'pending_setup')
  const inProgress = all.filter(c => c.technicianStatus === 'in_progress')
  const completed = all.filter(c => c.technicianStatus === 'completed')
  const emailIssues = all.filter(c => c.emailIssueReported)

  return {
    pendingCount: pending.length,
    inProgressCount: inProgress.length,
    completedCount: completed.length,
    emailIssueCount: emailIssues.length
  }
})

// Filtered Queue
const filteredList = computed(() => {
  let list = technicianQueue.value

  if (filterStatus.value === 'pending_setup') {
    list = list.filter(c => c.technicianStatus === 'pending_setup')
  } else if (filterStatus.value === 'in_progress') {
    list = list.filter(c => c.technicianStatus === 'in_progress')
  } else if (filterStatus.value === 'completed') {
    list = list.filter(c => c.technicianStatus === 'completed')
  } else if (filterStatus.value === 'email_issue') {
    list = list.filter(c => c.emailIssueReported)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.businessName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  }

  return list
})

// Generate random password helper
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pass = 'Ikikasir#'
  for (let i = 0; i < 4; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  workPassword.value = pass
}

// Open Work Modal for a selected client
const openWorkModal = (item: any) => {
  selectedClient.value = item

  // Auto-fill or restore existing credentials
  const sanitizedBiz = item.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')
  workUsername.value = item.appUsername || `${item.name.toLowerCase().split(' ')[0]}.${sanitizedBiz}`
  workPassword.value = item.appPassword || 'Ikikasir#2026'
  workApkUrl.value = item.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk'
  workGuideUrl.value = item.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf'
  
  const curYear = new Date().getFullYear()
  const curMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  const randNum = String(Math.floor(100 + Math.random() * 900))
  workRentalNumber.value = item.rentalAgreementNumber || `SPK/IKIKASIR/${curYear}/${curMonth}/${randNum}`

  // 1 month expired date by default
  if (item.appExpiredDate) {
    workExpiredDate.value = item.appExpiredDate
  } else {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    workExpiredDate.value = nextMonth.toISOString().substring(0, 10)
  }

  // Email issue flags
  hasEmailIssue.value = !!item.emailIssueReported
  emailIssueReason.value = item.emailIssueNotes || 'Alamat email klien tidak valid / belum bisa menerima email konfirmasi aktivasi.'
  correctedEmail.value = item.email

  // If status is pending_setup, automatically mark as in_progress
  if (item.technicianStatus === 'pending_setup') {
    startTechnicianSetup(item.id, 'Doni Teknisi')
  }

  isWorkModalOpen.value = true
}

// Toggle Email Issue
const handleToggleEmailIssue = () => {
  hasEmailIssue.value = !hasEmailIssue.value
  if (!hasEmailIssue.value && selectedClient.value) {
    // If resolved
    resolveEmailIssue(selectedClient.value.id, correctedEmail.value)
    showToast(`✅ Kendala email berhasil diselesaikan. Data email diperbarui.`)
  }
}

// Contact client via WhatsApp for email issue (Flowchart decision: Ada kendala di email -> Hubungi by WA)
const contactWhatsAppEmailIssue = () => {
  if (!selectedClient.value) return
  const result = reportEmailIssue(selectedClient.value.id, emailIssueReason.value)
  window.open(result.whatsappUrl, '_blank')
}

// Save corrected email
const handleSaveCorrectedEmail = () => {
  if (!selectedClient.value || !correctedEmail.value) return
  resolveEmailIssue(selectedClient.value.id, correctedEmail.value)
  hasEmailIssue.value = false
  showToast(`✅ Email klien diperbarui ke: ${correctedEmail.value}. Lanjut pengecekan data.`)
}

// Preview Rental Agreement Document
const openRentalAgreement = () => {
  isRentalModalOpen.value = true
}

// Send Credentials via WhatsApp (Flowchart Step 6: Kirim by Whatsapp, aplikasi, username, password, buku panduan, surat kerja sama sewa)
const sendWhatsAppCredentials = () => {
  if (!selectedClient.value) return
  const result = completeTechnicianSetup(selectedClient.value.id, {
    appUsername: workUsername.value,
    appPassword: workPassword.value,
    appDownloadUrl: workApkUrl.value,
    guideBookUrl: workGuideUrl.value,
    rentalAgreementNumber: workRentalNumber.value,
    expiredDate: workExpiredDate.value,
    teknisiName: 'Doni Teknisi'
  })

  deliveryPayload.value = {
    clientName: selectedClient.value.name,
    businessName: selectedClient.value.businessName,
    whatsappText: result.whatsappText,
    whatsappUrl: result.whatsappUrl
  }

  window.open(result.whatsappUrl, '_blank')
}

// Finish & Acc Aplikasi Selesai (Flowchart Step 7: Update status progress selesai beserta expired -> Acc Aplikasi diberikan Selesai)
const handleCompleteSetup = () => {
  if (!selectedClient.value) return
  if (!workUsername.value || !workPassword.value) {
    alert('Username dan Password aplikasi wajib diisi.')
    return
  }
  if (!workExpiredDate.value) {
    alert('Tanggal expired masa aktif berlangganan wajib diset.')
    return
  }

  isWorking.value = true
  setTimeout(() => {
    isWorking.value = false
    const result = completeTechnicianSetup(selectedClient.value.id, {
      appUsername: workUsername.value,
      appPassword: workPassword.value,
      appDownloadUrl: workApkUrl.value,
      guideBookUrl: workGuideUrl.value,
      rentalAgreementNumber: workRentalNumber.value,
      expiredDate: workExpiredDate.value,
      teknisiName: 'Doni Teknisi'
    })

    deliveryPayload.value = {
      clientName: selectedClient.value.name,
      businessName: selectedClient.value.businessName,
      whatsappText: result.whatsappText,
      whatsappUrl: result.whatsappUrl
    }

    isWorkModalOpen.value = false
    isSuccessModalOpen.value = true
    showToast(`🚀 Acc Aplikasi Selesai! Kredensial dan masa aktif ${selectedClient.value.name} telah aktif.`)
  }, 600)
}
</script>

<template>
  <div class="space-y-6 max-w-[1400px] mx-auto select-none">
    
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

    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-xs font-bold mb-1.5">
          <Wrench class="w-3.5 h-3.5 text-cyan-600" />
          <span>Alur Teknisi: Penyiapan Aplikasi & Penyerahan Kredensial</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
          Workspace Teknisi
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-bold">
            Technical Operations
          </span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Kelola penyiapan aplikasi kasir untuk pendaftar yang pembayarannya telah di-Acc Finance, cek kendala email via WhatsApp, generate berkas sewa, dan serahkan kredensial.
        </p>
      </div>

      <!-- Quick Switch to Finance -->
      <div class="flex items-center gap-2.5">
        <RouterLink 
          to="/finance-workspace"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
        >
          <span>Workspace Finance</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </RouterLink>

        <RouterLink 
          to="/semua-pelanggan"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
        >
          <span>Data Pelanggan</span>
        </RouterLink>
      </div>
    </header>

    <!-- KPI STATS CARDS -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <!-- Menunggu Penyiapan (Dari Finance) -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-cyan-200 dark:border-cyan-800 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wider">Menunggu Penyiapan</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center">
            <Clock class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-cyan-600">{{ stats.pendingCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Acc Finance Selesai</span>
        </div>
        <div class="mt-2 text-[10px] text-cyan-600 font-semibold flex items-center gap-1">
          <Sparkles class="w-3 h-3 shrink-0" />
          <span>Siap dikerjakan akunnya</span>
        </div>
      </div>

      <!-- Sedang Dikerjakan -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sedang Pengerjaan</span>
          <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
            <Wrench class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-indigo-600">{{ stats.inProgressCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Dalam Proses</span>
        </div>
        <div class="mt-2 text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
          <RefreshCw class="w-3 h-3 shrink-0" />
          <span>Setup kredensial & berkas</span>
        </div>
      </div>

      <!-- Selesai Diserahkan -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Aplikasi Diberikan</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-emerald-600">{{ stats.completedCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Kredensial Terkirim</span>
        </div>
        <div class="mt-2 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
          <Check class="w-3 h-3 shrink-0" />
          <span>Masa aktif expired tercatat</span>
        </div>
      </div>

      <!-- Kendala Email Klien -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/40 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-rose-600 font-bold uppercase tracking-wider">Kendala Email</span>
          <span class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
            <AlertTriangle class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-rose-600">{{ stats.emailIssueCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Perlu Hubungi WA</span>
        </div>
        <div class="mt-2 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
          <Phone class="w-3 h-3 shrink-0" />
          <span>Konfirmasi email via WhatsApp</span>
        </div>
      </div>
    </div>

    <!-- FILTER & SEARCH TOOLBAR -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
        <button 
          @click="filterStatus = 'all'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0"
          :class="filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          Semua User ({{ technicianQueue.length }})
        </button>

        <button 
          @click="filterStatus = 'pending_setup'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'pending_setup' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Siap Dikerjakan ({{ stats.pendingCount }})</span>
        </button>

        <button 
          @click="filterStatus = 'in_progress'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'in_progress' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <Wrench class="w-3.5 h-3.5" />
          <span>Sedang Pengerjaan ({{ stats.inProgressCount }})</span>
        </button>

        <button 
          @click="filterStatus = 'email_issue'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'email_issue' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <AlertTriangle class="w-3.5 h-3.5" />
          <span>Kendala Email ({{ stats.emailIssueCount }})</span>
        </button>

        <button 
          @click="filterStatus = 'completed'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Selesai ({{ stats.completedCount }})</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari user / toko / WA / email..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900/40"
        />
      </div>
    </div>

    <!-- LIST DATA USER TABLE (Flowchart: Lihat list data User -> Pilih User) -->
    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40 font-semibold">
              <th class="py-3 px-4">Nama Klien & Usaha</th>
              <th class="py-3 px-4">Kontak (WhatsApp & Email)</th>
              <th class="py-3 px-4">Paket Dipilih</th>
              <th class="py-3 px-4">Status Pengerjaan Teknisi</th>
              <th class="py-3 px-4">Kendala Email?</th>
              <th class="py-3 px-4">Masa Aktif Expired</th>
              <th class="py-3 px-4 text-center">Aksi Pengerjaan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr 
              v-for="item in filteredList" 
              :key="item.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
              @click="openWorkModal(item)"
            >
              <!-- Klien & Bisnis -->
              <td class="py-3.5 px-4">
                <div class="font-extrabold text-slate-800 dark:text-white group-hover:text-cyan-600 transition-colors text-sm">
                  {{ item.name }}
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                  <Building2 class="w-3 h-3 text-slate-400" />
                  {{ item.businessName }}
                </div>
              </td>

              <!-- WhatsApp & Email -->
              <td class="py-3.5 px-4 font-medium">
                <div class="text-slate-700 dark:text-slate-200 font-mono text-[11px] flex items-center gap-1">
                  <Phone class="w-3 h-3 text-slate-400" />
                  {{ item.phone }}
                </div>
                <div 
                  class="text-[11px] flex items-center gap-1 mt-0.5"
                  :class="item.emailIssueReported ? 'text-rose-500 font-bold' : 'text-slate-400'"
                >
                  <Mail class="w-3 h-3 text-slate-400" />
                  <span>{{ item.email }}</span>
                </div>
              </td>

              <!-- Paket -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold inline-block border bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  {{ item.packageType }}
                </span>
                <p class="text-[10px] text-slate-400 mt-1">Acc: {{ item.paymentVerifiedAt || 'Terverifikasi' }}</p>
              </td>

              <!-- Status Pengerjaan -->
              <td class="py-3.5 px-4">
                <span 
                  v-if="item.technicianStatus === 'pending_setup'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200"
                >
                  <Clock class="w-3 h-3 text-cyan-600" />
                  Menunggu Penyiapan
                </span>
                <span 
                  v-else-if="item.technicianStatus === 'in_progress'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse"
                >
                  <Wrench class="w-3 h-3 text-indigo-600" />
                  Sedang Dikerjakan
                </span>
                <span 
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                  Aplikasi Diberikan (Selesai)
                </span>
              </td>

              <!-- Kendala Email Client -->
              <td class="py-3.5 px-4">
                <div v-if="item.emailIssueReported" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle class="w-3 h-3 text-rose-600" />
                  Ada Kendala Email
                </div>
                <div v-else class="text-slate-400 text-[11px] flex items-center gap-1">
                  <Check class="w-3 h-3 text-emerald-500" />
                  Email Normal
                </div>
              </td>

              <!-- Masa Aktif Expired -->
              <td class="py-3.5 px-4 font-medium">
                <div v-if="item.appExpiredDate" class="font-mono text-emerald-600 font-bold">
                  {{ item.appExpiredDate }}
                </div>
                <div v-else class="text-slate-400 text-[11px] italic">
                  Belum diset
                </div>
              </td>

              <!-- Aksi -->
              <td class="py-3.5 px-4 text-center" @click.stop>
                <button 
                  v-if="item.technicianStatus !== 'completed'"
                  @click="openWorkModal(item)"
                  class="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-cyan-200 cursor-pointer active:scale-95 mx-auto"
                >
                  <Wrench class="w-3.5 h-3.5" />
                  <span>Proses Pengerjaan</span>
                </button>
                <button 
                  v-else
                  @click="openWorkModal(item)"
                  class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer mx-auto"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Lihat Kredensial</span>
                </button>
              </td>
            </tr>

            <tr v-if="filteredList.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400 text-xs">
                Tidak ada data user yang sesuai dengan filter pencarian saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PENGERJAAN APLIKASI TEKNISI (Flowchart Right: Pengecekan -> Cek Kendala Email -> Pengerjaan -> Kirim WA -> Update Expired) -->
    <div 
      v-if="isWorkModalOpen && selectedClient"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        class="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center">
              <Wrench class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
                Proses Penyiapan Aplikasi Kasir
              </h3>
              <p class="text-xs text-slate-500 font-medium">Klien: {{ selectedClient.name }} • Toko: {{ selectedClient.businessName }}</p>
            </div>
          </div>

          <button 
            @click="isWorkModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-xs">
          
          <!-- TAHAP 1: PROSES PENGECEKAN BERDASARKAN DATA (Flowchart Step 3) -->
          <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tahap 1: Pengecekan Berdasarkan Data</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Pembayaran Telah Di-Acc Finance
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p class="text-slate-400 text-[10px]">Nama Klien</p>
                <p class="font-bold text-slate-800 dark:text-white">{{ selectedClient.name }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">Nama Usaha</p>
                <p class="font-bold text-slate-800 dark:text-white">{{ selectedClient.businessName }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">Paket Kasir</p>
                <p class="font-bold text-indigo-600">{{ selectedClient.packageType }}</p>
              </div>
              <div>
                <p class="text-slate-400 text-[10px]">WhatsApp</p>
                <p class="font-mono font-bold text-slate-700 dark:text-slate-200">{{ selectedClient.phone }}</p>
              </div>
            </div>
          </div>

          <!-- TAHAP 2: CEK KENDALA EMAIL (Flowchart Decision: Apakah ada kendala di email client?) -->
          <div 
            class="rounded-2xl p-4 border transition-all"
            :class="hasEmailIssue ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-rose-500" v-if="hasEmailIssue" />
                <Mail class="w-4 h-4 text-slate-400" v-else />
                <span class="font-extrabold text-xs" :class="hasEmailIssue ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white'">
                  Pengecekan Email: Apakah ada kendala di email client?
                </span>
              </div>

              <!-- Toggle Question -->
              <div class="flex items-center gap-2">
                <button 
                  @click="hasEmailIssue = false"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  :class="!hasEmailIssue ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'"
                >
                  Tidak Ada Kendala
                </button>
                <button 
                  @click="hasEmailIssue = true"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  :class="hasEmailIssue ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'"
                >
                  Ya, Ada Kendala
                </button>
              </div>
            </div>

            <!-- If Yes: Hubungi by Whatsapp & Koreksi Email (Flowchart Path) -->
            <div v-if="hasEmailIssue" class="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800/60 space-y-3">
              <p class="text-[11px] text-rose-600 leading-relaxed font-medium">
                Ditemukan kendala pada alamat email klien. Teknisi dapat langsung menghubungi klien via WhatsApp untuk konfirmasi alamat email alternatif.
              </p>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div class="relative flex-1">
                  <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="correctedEmail"
                    type="email" 
                    placeholder="Masukkan alamat email hasil konfirmasi WA..."
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <button 
                  @click="contactWhatsAppEmailIssue"
                  class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <MessageSquare class="w-3.5 h-3.5" />
                  <span>Hubungi by WhatsApp</span>
                </button>

                <button 
                  @click="handleSaveCorrectedEmail"
                  class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>Simpan Email</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAHAP 3: PROSES PENGERJAAN APLIKASI (Flowchart Step 4) -->
          <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tahap 2: Proses Pengerjaan (Penyiapan Akun & Dokumen)</span>
              <button 
                @click="generateRandomPassword" 
                class="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw class="w-3 h-3" /> Acak Password Baru
              </button>
            </div>

            <!-- Grid Kredensial Akun -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <!-- Username -->
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Username Aplikasi Kasir
                </label>
                <div class="relative">
                  <User class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="workUsername"
                    type="text" 
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password Aplikasi Kasir
                </label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="workPassword"
                    type="text" 
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <!-- Link Download APK -->
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Link Download Aplikasi (APK)
                </label>
                <div class="relative">
                  <Download class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="workApkUrl"
                    type="text" 
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <!-- Link Buku Panduan -->
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Link Buku Panduan Penggunaan
                </label>
                <div class="relative">
                  <BookOpen class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="workGuideUrl"
                    type="text" 
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <!-- Surat Kerja Sama Sewa Box -->
            <div class="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-0.5">
                <span class="text-[10px] uppercase font-bold text-slate-400">Surat Kerja Sama Sewa (Perjanjian Resmi)</span>
                <p class="font-bold text-slate-800 dark:text-white font-mono text-xs">{{ workRentalNumber }}</p>
                <p class="text-[11px] text-slate-500">Tercatat resmi dalam sistem IKI KASIR untuk {{ selectedClient.businessName }}</p>
              </div>

              <button 
                @click="openRentalAgreement"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Lihat Dokumen Surat Sewa</span>
              </button>
            </div>

          </div>

          <!-- TAHAP 4: UPDATE STATUS EXPIRED & SELESAI (Flowchart Step 6 & 7) -->
          <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tahap 3: Update Progress Selesai beserta Expired</span>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Masa Aktif Berakhir (Expired Date)
                </label>
                <div class="relative">
                  <Calendar class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="workExpiredDate"
                    type="date" 
                    class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Otomatis dihitung 30 hari dari tanggal aktivasi</p>
              </div>

              <!-- Quick WA Sender Button (Flowchart: Kirim by Whatsapp, aplikasi, username & password, panduan, surat sewa) -->
              <div class="pt-4 sm:pt-0">
                <button 
                  @click="sendWhatsAppCredentials"
                  type="button"
                  class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
                >
                  <MessageSquare class="w-4 h-4" />
                  <span>Kirim Akses & Berkas via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button 
            @click="isWorkModalOpen = false"
            type="button"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <!-- Acc Aplikasi diberikan Selesai (Final Flowchart Step) -->
          <button 
            @click="handleCompleteSetup"
            :disabled="isWorking"
            type="button"
            class="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-200 dark:shadow-none transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>{{ isWorking ? 'Menyimpan...' : 'Acc Aplikasi Diberikan (Selesai)' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL SUKSES ACC APLIKASI DIBERIKAN (Flowchart Final) -->
    <div 
      v-if="isSuccessModalOpen && deliveryPayload"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3.5 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 text-center space-y-4">
        
        <div class="w-16 h-16 rounded-full bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 class="w-10 h-10" />
        </div>

        <div>
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Acc Aplikasi Diberikan Selesai! 🚀</h3>
          <p class="text-xs text-slate-500 mt-1">
            Aplikasi kasir untuk <strong>{{ deliveryPayload.clientName }}</strong> ({{ deliveryPayload.businessName }}) telah siap dan aktif di sistem.
          </p>
        </div>

        <!-- WhatsApp Dispatch Box -->
        <div class="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left space-y-2">
          <div class="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
            <MessageSquare class="w-4 h-4 text-emerald-600" />
            <span>Format Pesan WhatsApp Klien (Siap Kirim)</span>
          </div>

          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900 text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
            {{ deliveryPayload.whatsappText }}
          </div>

          <a 
            :href="deliveryPayload.whatsappUrl"
            target="_blank"
            class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Buka WhatsApp Sekarang</span>
          </a>
        </div>

        <button 
          @click="isSuccessModalOpen = false"
          class="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-black transition-colors cursor-pointer"
        >
          Selesai & Tutup
        </button>

      </div>
    </div>

    <!-- RENTAL AGREEMENT MODAL PREVIEW -->
    <RentalAgreementModal 
      :is-open="isRentalModalOpen"
      :client-name="selectedClient?.name || ''"
      :business-name="selectedClient?.businessName || ''"
      :package-name="selectedClient?.packageType || 'Basic'"
      :phone="selectedClient?.phone || ''"
      :email="selectedClient?.email || ''"
      :address="selectedClient?.rawLead?.address || selectedClient?.rawCustomer?.address || ''"
      :agreement-number="workRentalNumber"
      :expired-date="workExpiredDate"
      @close="isRentalModalOpen = false"
    />

  </div>
</template>

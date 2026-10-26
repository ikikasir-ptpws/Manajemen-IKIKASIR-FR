<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  FileCheck2, 
  MessageSquare, 
  Send, 
  ArrowRight, 
  ExternalLink, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  Sparkles,
  ArrowUpRight,
  Layers,
  Receipt,
  RotateCcw,
  Check,
  ZoomIn,
  X
} from 'lucide-vue-next'
import { useAppData } from '../../composables/useAppData'
import type { ClientLead } from '../../types/crm'

const { 
  financeQueue, 
  confirmPaymentByFinance, 
  rejectPaymentByFinance, 
  currentRole,
  setRole,
  getCustomerWaUrl
} = useAppData()

// State
const searchQuery = ref('')
const filterStatus = ref<'all' | 'pending' | 'verified' | 'rejected'>('pending')
const selectedLead = ref<ClientLead | null>(null)
const isVerifyModalOpen = ref(false)
const isProofZoomOpen = ref(false)
const zoomedProofUrl = ref('')
const isRejectModalOpen = ref(false)
const rejectReason = ref('')
const isSuccessModalOpen = ref(false)
const successPayload = ref<{
  lead: ClientLead
  whatsappText: string
  whatsappUrl: string
} | null>(null)

// Checklist verification states (Apakah data sesuai?)
const checkNominal = ref(true)
const checkProof = ref(true)
const checkContact = ref(true)
const customPaymentMethod = ref('BCA Transfer')
const customPaymentAmount = ref<number>(250000)
const financeNotes = ref('Nominal dan bukti transfer sesuai. Pembayaran valid.')
const isProcessing = ref(false)

// Toast
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// KPI Statistics
const stats = computed(() => {
  const all = financeQueue.value
  const pending = all.filter(l => l.paymentStatus === 'pending_verification')
  const verified = all.filter(l => l.paymentStatus === 'verified')
  const rejected = all.filter(l => l.paymentStatus === 'rejected')
  const totalNominal = verified.reduce((sum, l) => sum + (l.paymentAmount || l.harga_paket || 0), 0)

  return {
    pendingCount: pending.length,
    verifiedCount: verified.length,
    rejectedCount: rejected.length,
    totalNominal
  }
})

// Filtered list (Always ordered by FIFO: oldest first!)
const filteredList = computed(() => {
  let list = financeQueue.value

  if (filterStatus.value === 'pending') {
    list = list.filter(l => l.paymentStatus === 'pending_verification')
  } else if (filterStatus.value === 'verified') {
    list = list.filter(l => l.paymentStatus === 'verified')
  } else if (filterStatus.value === 'rejected') {
    list = list.filter(l => l.paymentStatus === 'rejected')
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(l => 
      l.name.toLowerCase().includes(q) ||
      l.businessName.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.id.toLowerCase().includes(q) ||
      (l.packageInterest || '').toLowerCase().includes(q)
    )
  }

  return list
})

// Open Verification Modal for a CRM
const openVerifyModal = (lead: ClientLead) => {
  selectedLead.value = lead
  customPaymentAmount.value = lead.paymentAmount || lead.harga_paket || 250000
  customPaymentMethod.value = lead.paymentMethod || (lead.paymentProofUrl?.includes('QRIS') ? 'QRIS' : 'BCA Transfer')
  checkNominal.value = true
  checkProof.value = true
  checkContact.value = true
  financeNotes.value = `Pembayaran paket ${lead.packageInterest || 'Basic'} sebesar Rp ${customPaymentAmount.value.toLocaleString('id-ID')} telah diperiksa dan diverifikasi.`
  isVerifyModalOpen.value = true
}

// Zoom Image
const zoomProof = (url?: string) => {
  if (!url) return
  zoomedProofUrl.value = url
  isProofZoomOpen.value = true
}

// Confirm Payment
const handleConfirmPayment = () => {
  if (!selectedLead.value) return
  if (!checkNominal.value || !checkProof.value || !checkContact.value) {
    alert('Harap centang semua checklist verifikasi data sebelum meng-Acc pembayaran.')
    return
  }

  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    const result = confirmPaymentByFinance(selectedLead.value!.id, {
      paymentAmount: customPaymentAmount.value,
      paymentMethod: customPaymentMethod.value,
      notes: financeNotes.value,
      verifiedBy: 'Rina Finance'
    })

    if (result) {
      isVerifyModalOpen.value = false
      successPayload.value = {
        lead: result.lead,
        whatsappText: result.whatsappText,
        whatsappUrl: result.whatsappUrl
      }
      isSuccessModalOpen.value = true
      showToast(`✅ Pembayaran "${result.lead.name}" (${result.lead.businessName}) BERHASIL di-Acc! Tugas dikirim ke Teknisi.`)
    }
  }, 600)
}

// Open Reject Modal
const openRejectModal = () => {
  rejectReason.value = 'Bukti transfer tidak terbaca / nominal tidak sesuai dengan paket yang dipilih.'
  isRejectModalOpen.value = true
}

const handleRejectPayment = () => {
  if (!selectedLead.value) return
  rejectPaymentByFinance(selectedLead.value.id, rejectReason.value)
  isRejectModalOpen.value = false
  isVerifyModalOpen.value = false
  showToast(`❌ Pembayaran untuk "${selectedLead.value.name}" telah DITOLAK.`)
}

// Send WhatsApp confirmation to client
const openWhatsAppConfirm = () => {
  if (!successPayload.value) return
  window.open(successPayload.value.whatsappUrl, '_blank')
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
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1.5">
          <CreditCard class="w-3.5 h-3.5 text-amber-600" />
          <span>Alur Finance: Acc & Konfirmasi Pembayaran CRM</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
          Workspace Finance
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold font-mono">
            FIFO Queue
          </span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Verifikasi bukti transfer pendaftar CRM berdasarkan antrean tertua (Data terlama), konversi menjadi Client aktif, lalu teruskan notifikasi ke tim Teknisi.
        </p>
      </div>

      <!-- Quick Switch Role / Actions -->
      <div class="flex items-center gap-2.5">
        <RouterLink 
          to="/calon-client"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
          <span>Lihat Semua CRM</span>
        </RouterLink>

        <RouterLink 
          to="/teknisi-workspace"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-200 dark:shadow-none"
        >
          <span>Workspace Teknisi</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>
    </header>

    <!-- KPI STATS CARDS -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <!-- Menunggu Konfirmasi (Prioritas Tertinggi) -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/60 shadow-xs relative overflow-hidden group">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Menunggu Acc (FIFO)</span>
          <span class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
            <Clock class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-amber-600">{{ stats.pendingCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Antrean Prioritas</span>
        </div>
        <div class="mt-2 text-[10px] text-amber-600/80 flex items-center gap-1 font-semibold">
          <AlertCircle class="w-3 h-3 shrink-0" />
          <span>Diproses urut dari pendaftaran terlama</span>
        </div>
      </div>

      <!-- Terverifikasi / Di-Acc -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pembayaran Di-Acc</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-emerald-600">{{ stats.verifiedCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Masuk ke Teknisi</span>
        </div>
        <div class="mt-2 text-[10px] text-emerald-600/80 flex items-center gap-1 font-semibold">
          <Check class="w-3 h-3 shrink-0" />
          <span>Status Client aktif & invoice Paid</span>
        </div>
      </div>

      <!-- Total Dana Masuk -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Dana Masuk</span>
          <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
            <Receipt class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2">
          <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rp {{ (stats.totalNominal / 1000).toLocaleString('id-ID') }}k
          </span>
        </div>
        <div class="mt-2 text-[10px] text-indigo-600/80 font-semibold flex items-center gap-1">
          <ShieldCheck class="w-3 h-3 shrink-0" />
          <span>Tercatat resmi di Arus Kas</span>
        </div>
      </div>

      <!-- Ditolak / Tidak Sesuai -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ditolak / Batal</span>
          <span class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
            <XCircle class="w-4 h-4" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-rose-600">{{ stats.rejectedCount }}</span>
          <span class="text-[11px] text-slate-400 font-medium">Bukti tidak valid</span>
        </div>
        <div class="mt-2 text-[10px] text-rose-600/80 font-semibold flex items-center gap-1">
          <X class="w-3 h-3 shrink-0" />
          <span>Tersimpan di riwayat log</span>
        </div>
      </div>
    </div>

    <!-- FILTER & SEARCH TOOLBAR -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
        <button 
          @click="filterStatus = 'pending'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <Clock class="w-3.5 h-3.5" />
          <span>Menunggu Acc ({{ stats.pendingCount }})</span>
        </button>

        <button 
          @click="filterStatus = 'verified'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="filterStatus === 'verified' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Sudah Di-Acc ({{ stats.verifiedCount }})</span>
        </button>

        <button 
          @click="filterStatus = 'all'"
          class="px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0"
          :class="filterStatus === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          Semua Data ({{ financeQueue.length }})
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama toko / pendaftar / paket..."
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
        />
      </div>
    </div>

    <!-- FIFO QUEUE TABLE (Sesuai Flowchart: Lihat list data CRM data terlama) -->
    <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/40 font-semibold">
              <th class="py-3 px-4 w-12 text-center">Urutan</th>
              <th class="py-3 px-4">Pendaftar & Usaha</th>
              <th class="py-3 px-4">Kontak (WhatsApp & Email)</th>
              <th class="py-3 px-4">Paket & Biaya</th>
              <th class="py-3 px-4">Bukti Transfer</th>
              <th class="py-3 px-4">Status Pembayaran</th>
              <th class="py-3 px-4">Tgl Masuk</th>
              <th class="py-3 px-4 text-center">Aksi Konfirmasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr 
              v-for="(lead, idx) in filteredList" 
              :key="lead.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
              @click="openVerifyModal(lead)"
            >
              <!-- Antrean / Urutan FIFO -->
              <td class="py-3.5 px-4 text-center">
                <span 
                  v-if="lead.paymentStatus === 'pending_verification'"
                  class="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-200"
                  title="Prioritas Data Terlama (FIFO)"
                >
                  {{ idx + 1 }}
                </span>
                <span v-else class="text-slate-400 font-mono text-[11px]">
                  #{{ idx + 1 }}
                </span>
              </td>

              <!-- Nama & Bisnis -->
              <td class="py-3.5 px-4">
                <div class="font-extrabold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors text-sm">
                  {{ lead.name }}
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                  <Building2 class="w-3 h-3 text-slate-400" />
                  {{ lead.businessName }} ({{ lead.businessCategory || 'Retail' }})
                </div>
              </td>

              <!-- Kontak -->
              <td class="py-3.5 px-4 font-medium">
                <div class="text-slate-700 dark:text-slate-200 font-mono text-[11px] flex items-center gap-1">
                  <Phone class="w-3 h-3 text-slate-400" />
                  {{ lead.phone }}
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Mail class="w-3 h-3 text-slate-400" />
                  {{ lead.email }}
                </div>
              </td>

              <!-- Paket & Biaya -->
              <td class="py-3.5 px-4">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold inline-block border bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  {{ lead.packageInterest || 'Basic' }}
                </span>
                <div class="text-xs font-black text-slate-800 dark:text-white mt-1">
                  Rp {{ (lead.paymentAmount || lead.harga_paket || 250000).toLocaleString('id-ID') }}
                </div>
              </td>

              <!-- Bukti Transfer (Thumbnail Klik Zoom) -->
              <td class="py-3.5 px-4" @click.stop>
                <div v-if="lead.paymentProofUrl" class="flex items-center gap-2">
                  <div 
                    @click="zoomProof(lead.paymentProofUrl)"
                    class="w-12 h-14 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 overflow-hidden relative cursor-zoom-in group/img shadow-2xs"
                  >
                    <img :src="lead.paymentProofUrl" alt="Bukti Transfer" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <ZoomIn class="w-4 h-4" />
                    </div>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase">{{ lead.paymentMethod || 'Transfer' }}</span>
                </div>
                <div v-else class="text-slate-400 text-[11px] italic">
                  Belum upload
                </div>
              </td>

              <!-- Status Pembayaran -->
              <td class="py-3.5 px-4">
                <span 
                  v-if="lead.paymentStatus === 'verified'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                  Di-Acc Finance
                </span>
                <span 
                  v-else-if="lead.paymentStatus === 'rejected'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <XCircle class="w-3 h-3 text-rose-600" />
                  Ditolak
                </span>
                <span 
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                >
                  <Clock class="w-3 h-3 text-amber-600" />
                  Menunggu Konfirmasi
                </span>
              </td>

              <!-- Tgl Masuk (Data Terlama) -->
              <td class="py-3.5 px-4 text-slate-500 font-medium">
                <div>{{ lead.registrationDate || lead.lastFollowUp }}</div>
                <div class="text-[10px] text-slate-400">{{ lead.paymentDate || '14:22 WIB' }}</div>
              </td>

              <!-- Aksi -->
              <td class="py-3.5 px-4 text-center" @click.stop>
                <button 
                  v-if="lead.paymentStatus !== 'verified'"
                  @click="openVerifyModal(lead)"
                  class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-amber-200 cursor-pointer active:scale-95 mx-auto"
                >
                  <FileCheck2 class="w-3.5 h-3.5" />
                  <span>Periksa & Acc</span>
                </button>
                <button 
                  v-else
                  @click="openVerifyModal(lead)"
                  class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer mx-auto"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Detail Acc</span>
                </button>
              </td>
            </tr>

            <tr v-if="filteredList.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400 text-xs">
                Tidak ada data pendaftar yang cocok dengan filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: PROSES PENGECEKAN DATA BESERTA BUKTI TRANSFER (Flowchart Left) -->
    <div 
      v-if="isVerifyModalOpen && selectedLead"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3.5 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        class="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <CreditCard class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
                Proses Pengecekan & Acc Pembayaran
              </h3>
              <p class="text-xs text-slate-500 font-medium">Verifikasi bukti transfer sebelum dikonversi ke Client Aktif</p>
            </div>
          </div>

          <button 
            @click="isVerifyModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-xs">
          
          <!-- Grid: Client Data vs Bukti Transfer -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <!-- Left: Client CRM Info -->
            <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl space-y-2.5 border border-slate-100 dark:border-slate-700">
              <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Data Pendaftar CRM</span>
              
              <div>
                <p class="text-slate-400 text-[10px]">Nama Klien / Pemilik</p>
                <p class="font-bold text-slate-800 dark:text-white text-sm">{{ selectedLead.name }}</p>
              </div>

              <div>
                <p class="text-slate-400 text-[10px]">Nama Usaha / Toko</p>
                <p class="font-bold text-slate-800 dark:text-white">{{ selectedLead.businessName }} ({{ selectedLead.businessCategory || 'Retail' }})</p>
              </div>

              <div>
                <p class="text-slate-400 text-[10px]">Nomor WhatsApp</p>
                <p class="font-bold text-indigo-600 font-mono">{{ selectedLead.phone }}</p>
              </div>

              <div>
                <p class="text-slate-400 text-[10px]">Alamat Email</p>
                <p class="font-semibold text-slate-700 dark:text-slate-200">{{ selectedLead.email }}</p>
              </div>

              <div>
                <p class="text-slate-400 text-[10px]">Paket Dipilih</p>
                <span class="inline-block px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px] mt-0.5">
                  {{ selectedLead.packageInterest || 'Basic' }}
                </span>
              </div>
            </div>

            <!-- Right: Bukti Transfer Viewer -->
            <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl flex flex-col justify-between border border-slate-100 dark:border-slate-700">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bukti Transfer Masuk</span>
                  <button 
                    v-if="selectedLead.paymentProofUrl"
                    @click="zoomProof(selectedLead.paymentProofUrl)"
                    class="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn class="w-3 h-3" /> Perbesar
                  </button>
                </div>

                <div 
                  v-if="selectedLead.paymentProofUrl"
                  @click="zoomProof(selectedLead.paymentProofUrl)"
                  class="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden cursor-zoom-in relative group flex items-center justify-center p-2"
                >
                  <img :src="selectedLead.paymentProofUrl" alt="Bukti Transfer" class="max-h-full max-w-full object-contain" />
                  <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                    Klik untuk Memperbesar Bukti
                  </div>
                </div>
                <div v-else class="h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <AlertCircle class="w-6 h-6 mb-1 text-slate-400" />
                  <span>Klien belum mengunggah file bukti transfer.</span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-400">Metode:</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{ customPaymentMethod }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-slate-400">Total Nominal:</span>
                  <span class="font-extrabold text-emerald-600 text-sm">Rp {{ customPaymentAmount.toLocaleString('id-ID') }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Question: "Apakah data sesuai ?" (Decision in Flowchart) -->
          <div class="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 space-y-3">
            <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <CheckCircle2 class="w-4 h-4 text-amber-600" />
              <span>Pengecekan Kesesuaian Data (Decision Check): Apakah data sesuai?</span>
            </div>

            <div class="space-y-2 text-xs">
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input v-model="checkNominal" type="checkbox" class="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                <span class="text-slate-700 dark:text-slate-300">Nominal transfer sebesar <strong>Rp {{ customPaymentAmount.toLocaleString('id-ID') }}</strong> telah cocok dengan tarif paket {{ selectedLead.packageInterest }}.</span>
              </label>

              <label class="flex items-center gap-2.5 cursor-pointer">
                <input v-model="checkProof" type="checkbox" class="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                <span class="text-slate-700 dark:text-slate-300">Struk / mutasi bank asli, valid, dan rekening tujuan terkonfirmasi</span>
              </label>

              <label class="flex items-center gap-2.5 cursor-pointer">
                <input v-model="checkContact" type="checkbox" class="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer" />
                <span class="text-slate-700 dark:text-slate-300">Data nomor WhatsApp ({{ selectedLead.phone }}) dan Email aktif untuk pengiriman aplikasi kasir.</span>
              </label>
            </div>
          </div>

          <!-- Catatan Finance -->
          <div>
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Catatan Verifikasi Finance (Opsional)
            </label>
            <input 
              v-model="financeNotes" 
              type="text" 
              placeholder="Contoh: Pembayaran valid via BCA Mobile tanggal 20 Sep."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        <!-- Modal Actions (Flowchart: CRM dirubah jadi client/user & kirim notif ke teknisi) -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button 
            @click="openRejectModal"
            type="button"
            class="px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
          >
            Tolak Pembayaran
          </button>

          <div class="flex items-center gap-2">
            <button 
              @click="isVerifyModalOpen = false"
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button 
              @click="handleConfirmPayment"
              :disabled="isProcessing"
              type="button"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-none transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ isProcessing ? 'Memproses...' : 'Acc Pembayaran & Teruskan ke Teknisi' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL 2: SUCCESS & KIRIM WHATSAPP KE CLIENT (Flowchart Step 5 & 6) -->
    <div 
      v-if="isSuccessModalOpen && successPayload"
      class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3.5 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 text-center space-y-4">
        
        <div class="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 class="w-10 h-10" />
        </div>

        <div>
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Acc Payment Selesai! 🎉</h3>
          <p class="text-xs text-slate-500 mt-1">
            Data <strong>{{ successPayload.lead.name }}</strong> ({{ successPayload.lead.businessName }}) telah resmi dikonversi menjadi data Pelanggan & invoice lunas telah diterbitkan.
          </p>
        </div>

        <!-- Notification to Teknisi confirmation box -->
        <div class="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-3.5 text-left text-xs space-y-1">
          <div class="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
            <span>Notifikasi Otomatis Terkirim ke Teknisi</span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Status tugas di antrean Teknisi diubah menjadi <strong>"Menunggu Penyiapan Aplikasi"</strong>. Teknisi dapat segera menyiapkan akun dan berkas sewa.
          </p>
        </div>

        <!-- WhatsApp Confirmation to Client (Required by Flowchart) -->
        <div class="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left space-y-2">
          <div class="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
            <MessageSquare class="w-4 h-4 text-emerald-600" />
            <span>Kirim WhatsApp Konfirmasi ke Client (Flowchart Step)</span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Konfirmasikan bahwa pembayaran telah masuk dan aplikasi sedang dalam antrean teknisi.
          </p>
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900 text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-24 overflow-y-auto whitespace-pre-line">
            {{ successPayload.whatsappText }}
          </div>

          <button 
            @click="openWhatsAppConfirm"
            class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Kirim by WhatsApp Sekarang</span>
          </button>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <RouterLink
            to="/teknisi-workspace"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            Buka Workspace Teknisi
          </RouterLink>

          <button 
            @click="isSuccessModalOpen = false"
            class="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Selesai / Lanjut
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL 3: ZOOM BUKTI TRANSFER LIGHTBOX -->
    <div 
      v-if="isProofZoomOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      @click="isProofZoomOpen = false"
    >
      <div class="relative max-w-xl max-h-[90vh] bg-white rounded-2xl p-2 overflow-hidden shadow-2xl" @click.stop>
        <button 
          @click="isProofZoomOpen = false"
          class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
        <img :src="zoomedProofUrl" alt="Zoom Bukti Transfer" class="max-h-[85vh] w-auto mx-auto object-contain rounded-xl" />
      </div>
    </div>

    <!-- MODAL 4: TOLAK PEMBAYARAN -->
    <div 
      v-if="isRejectModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-700">
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <XCircle class="w-5 h-5 text-rose-500" />
          Tolak Konfirmasi Pembayaran
        </h3>
        <p class="text-xs text-slate-500">
          Masukkan alasan penolakan bukti transfer untuk pendaftar "{{ selectedLead?.name }}":
        </p>
        <textarea 
          v-model="rejectReason"
          rows="3"
          class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-rose-500"
          placeholder="Tulis alasan penolakan..."
        ></textarea>

        <div class="flex items-center gap-2 justify-end pt-2">
          <button 
            @click="isRejectModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button 
            @click="handleRejectPayment"
            class="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
          >
            Tolak Pembayaran
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

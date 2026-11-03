<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Banknote,
  Search,
  RefreshCw,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  AlertTriangle,
  FileText,
  User
} from 'lucide-vue-next'
import { useReferralWithdrawal } from '../../composables/useReferralWithdrawal'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import BuktiPenarikanModal from './components/BuktiPenarikanModal.vue'
import type { ReferralWithdrawalListItem } from '../../types/referral'

const {
  items,
  summary,
  total,
  currentPage,
  pageSize,
  statusFilter,
  searchQuery,
  isLoading,
  isSubmitting,
  error,
  fetchWithdrawals,
  confirmWithdrawal,
  markWaSent,
  setStatusFilter,
  setPage
} = useReferralWithdrawal()

// Toast notification
const toastMessage = ref<string | null>(null)
let toastTimer: any = null
const showToast = (msg: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = msg
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Modal konfirmasi bayar
const isPayModalOpen = ref(false)
const payForm = ref({ transferReference: '', notes: '' })

// Modal tolak
const isRejectModalOpen = ref(false)
const rejectReason = ref('')

// Modal bukti penarikan
const isProofModalOpen = ref(false)
const proofItem = ref<ReferralWithdrawalListItem | null>(null)

const selectedItem = ref<ReferralWithdrawalListItem | null>(null)

const statusTabs = [
  { key: '', label: 'Semua' },
  { key: 'MENUNGGU_VERIFIKASI', label: 'Menunggu' },
  { key: 'SELESAI', label: 'Selesai' },
  { key: 'DITOLAK', label: 'Ditolak' }
]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (value?: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const statusLabel = (status: string): string => {
  if (status === 'MENUNGGU_VERIFIKASI') return 'Menunggu Verifikasi'
  if (status === 'SELESAI') return 'Selesai'
  if (status === 'DITOLAK') return 'Ditolak'
  return status
}

const statusBadgeClass = (status: string): string => {
  if (status === 'SELESAI') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'DITOLAK') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const openPayModal = (item: ReferralWithdrawalListItem) => {
  selectedItem.value = item
  payForm.value = { transferReference: '', notes: item.notes || '' }
  isPayModalOpen.value = true
}

const openRejectModal = (item: ReferralWithdrawalListItem) => {
  selectedItem.value = item
  rejectReason.value = ''
  isRejectModalOpen.value = true
}

const openProofModal = (item: ReferralWithdrawalListItem) => {
  proofItem.value = item
  isProofModalOpen.value = true
}

/** Tandai sudah dibayar (SELESAI) -> dana dikirim manual oleh admin */
const handleConfirmPaid = async () => {
  if (!selectedItem.value) return

  const result = await confirmWithdrawal(selectedItem.value.id, {
    status: 'SELESAI',
    transferReference: payForm.value.transferReference.trim() || undefined,
    notes: payForm.value.notes.trim() || undefined
  })

  if (!result) {
    showToast(error.value || 'Gagal memproses konfirmasi pencairan.')
    return
  }

  isPayModalOpen.value = false
  showToast(`Pencairan ${formatCurrency(result.amount)} berhasil ditandai sebagai dibayar.`)
  openProofModal(result)
}

/** Tolak pengajuan pencairan */
const handleReject = async () => {
  if (!selectedItem.value) return
  if (!rejectReason.value.trim()) {
    showToast('Alasan penolakan wajib diisi.')
    return
  }

  const result = await confirmWithdrawal(selectedItem.value.id, {
    status: 'DITOLAK',
    rejectionReason: rejectReason.value.trim(),
    notes: rejectReason.value.trim()
  })

  if (!result) {
    showToast(error.value || 'Gagal menolak pengajuan pencairan.')
    return
  }

  isRejectModalOpen.value = false
  showToast('Pengajuan pencairan referral berhasil ditolak.')
}

const handleMarkWaSent = async () => {
  if (!proofItem.value) return
  const ok = await markWaSent(proofItem.value.id)
  if (ok) {
    proofItem.value = { ...proofItem.value, waSentAt: new Date().toISOString() }
    showToast('Bukti penarikan ditandai sudah dikirim ke pelanggan.')
  } else {
    showToast(error.value || 'Gagal menandai bukti penarikan sebagai terkirim.')
  }
}

onMounted(() => {
  fetchWithdrawals()
})
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto select-none relative">

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-3 max-w-md pointer-events-auto"
      >
        <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-4 h-4" />
        </div>
        <span class="leading-relaxed">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Header -->
    <header class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Banknote class="w-6 h-6 text-emerald-600" />
          Penarikan Referral
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Proses permintaan pencairan saldo komisi referral, konfirmasi pembayaran, lalu kirim bukti invoice ke pelanggan.
        </p>
      </div>

      <button
        @click="fetchWithdrawals"
        :disabled="isLoading"
        class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
      >
        <RefreshCw class="w-3.5 h-3.5 text-slate-500" :class="isLoading ? 'animate-spin text-blue-600' : ''" />
        <span class="hidden sm:inline">Refresh</span>
      </button>
    </header>

    <!-- KPI Summary -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Menunggu Verifikasi</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
            {{ summary.pendingCount }} permintaan
          </span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          {{ formatCurrency(summary.pendingAmount) }}
        </h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1 text-amber-600">
          <Clock class="w-3.5 h-3.5" />
          <span>Perlu dikirim ke pelanggan</span>
        </div>
      </div>

      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Sudah Dibayar</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
            {{ summary.paidCount }} permintaan
          </span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          {{ formatCurrency(summary.paidAmount) }}
        </h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1 text-emerald-600">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>Tercatat di arus kas keluar</span>
        </div>
      </div>

      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Ditolak</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
            {{ summary.rejectedCount }} permintaan
          </span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          {{ total }} total
        </h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1 text-rose-600">
          <XCircle class="w-3.5 h-3.5" />
          <span>Permintaan pencairan ditolak</span>
        </div>
      </div>
    </section>

    <!-- Tabel -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-slate-800">Daftar Permintaan Pencairan</h2>
          <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
            {{ total }} permintaan
          </span>
          <span v-if="isLoading" class="text-[11px] text-blue-600 font-semibold flex items-center gap-1 ml-2">
            <RefreshCw class="w-3 h-3 animate-spin" /> Memuat...
          </span>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="relative flex-1 sm:w-64">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama pelanggan atau rekening..."
              class="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div class="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
            <button
              v-for="tab in statusTabs"
              :key="tab.key"
              @click="setStatusFilter(tab.key)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="statusFilter === tab.key ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[1050px] border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3.5 w-12 text-center whitespace-nowrap">No</th>
              <th class="px-4 py-3.5 min-w-[240px]">Pelanggan</th>
              <th class="px-4 py-3.5 w-44 whitespace-nowrap">Rekening Tujuan</th>
              <th class="px-4 py-3.5 w-32 whitespace-nowrap">Tanggal Ajukan</th>
              <th class="px-4 py-3.5 w-36 text-right whitespace-nowrap">Nominal</th>
              <th class="px-4 py-3.5 w-40 text-center whitespace-nowrap">Status</th>
              <th class="px-4 py-3.5 w-40 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(item, index) in items"
              :key="item.id"
              class="transition-colors hover:bg-slate-50/70 group"
            >
              <td class="px-4 py-3.5 text-center text-slate-400 font-semibold text-xs whitespace-nowrap">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>

              <td class="px-4 py-3.5 min-w-[240px]">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-1">
                      {{ item.customerName || '-' }}
                    </p>
                    <p class="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                      {{ item.customerBusinessName || 'Pelanggan IKIKASIR' }}
                    </p>
                    <span
                      v-if="item.customerReferralCode"
                      class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block"
                    >
                      {{ item.customerReferralCode }}
                    </span>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="font-bold text-slate-700 text-xs">{{ item.bankOrWallet }}</div>
                <div class="font-mono text-[11px] text-slate-500 mt-0.5">{{ item.accountNumber }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ item.accountHolder }}</div>
              </td>

              <td class="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-600">
                {{ formatDate(item.requestDate) }}
              </td>

              <td class="px-4 py-3.5 text-right whitespace-nowrap font-extrabold text-sm text-emerald-600">
                {{ formatCurrency(item.amount) }}
              </td>

              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block"
                  :class="statusBadgeClass(item.status)"
                >
                  {{ statusLabel(item.status) }}
                </span>
                <div v-if="item.invoiceNo" class="font-mono text-[10px] text-slate-500 mt-1">
                  {{ item.invoiceNo }}
                </div>
              </td>

              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    v-if="item.status === 'MENUNGGU_VERIFIKASI'"
                    @click="openPayModal(item)"
                    title="Konfirmasi pembayaran pencairan"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-all cursor-pointer text-[10px] font-bold shadow-2xs"
                  >
                    Bayar
                  </button>
                  <button
                    v-if="item.status === 'MENUNGGU_VERIFIKASI'"
                    @click="openRejectModal(item)"
                    title="Tolak pengajuan pencairan"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer text-[10px] font-bold shadow-2xs"
                  >
                    Tolak
                  </button>
                  <button
                    v-if="item.status === 'SELESAI'"
                    @click="openProofModal(item)"
                    title="Lihat bukti penarikan"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="items.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400 text-sm">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Wallet class="w-8 h-8 text-slate-300" />
                  <p class="font-medium">Tidak ada permintaan pencairan yang cocok dengan filter ini.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="block md:hidden divide-y divide-slate-100">
        <div v-for="item in items" :key="item.id" class="p-4 space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-xs sm:text-sm truncate">{{ item.customerName || '-' }}</p>
              <p class="text-[11px] text-slate-500 truncate">{{ item.customerBusinessName || 'Pelanggan IKIKASIR' }}</p>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap" :class="statusBadgeClass(item.status)">
              {{ statusLabel(item.status) }}
            </span>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-50">
            <div class="text-[11px] text-slate-500">
              <div>{{ item.bankOrWallet }} · {{ item.accountNumber }}</div>
              <div class="mt-0.5">{{ formatDate(item.requestDate) }}</div>
            </div>
            <span class="font-extrabold text-sm text-emerald-600">{{ formatCurrency(item.amount) }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              v-if="item.status === 'MENUNGGU_VERIFIKASI'"
              @click="openPayModal(item)"
              class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold"
            >
              Bayar
            </button>
            <button
              v-if="item.status === 'MENUNGGU_VERIFIKASI'"
              @click="openRejectModal(item)"
              class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold"
            >
              Tolak
            </button>
            <button
              v-if="item.status === 'SELESAI'"
              @click="openProofModal(item)"
              class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold"
            >
              Bukti
            </button>
          </div>
        </div>

        <div v-if="items.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Tidak ada permintaan pencairan yang cocok dengan filter.
        </div>
      </div>

      <GlobalPagination
        v-if="total > 0"
        :current-page="currentPage"
        :total-items="total"
        :page-size="pageSize"
        @update:current-page="setPage($event)"
        @update:page-size="setPage(currentPage, $event)"
      />
    </section>

    <!-- MODAL KONFIRMASI BAYAR -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isPayModalOpen && selectedItem"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        @click.self="isPayModalOpen = false"
      >
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Banknote class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">Konfirmasi Pembayaran Pencairan</h3>
                <p class="text-[11px] text-slate-500">{{ selectedItem.customerName }}</p>
              </div>
            </div>
            <button
              @click="isPayModalOpen = false"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 text-center space-y-1">
              <span class="text-xs font-semibold text-emerald-800">Nominal yang Dibayarkan</span>
              <div class="text-2xl font-black text-emerald-900">{{ formatCurrency(selectedItem.amount) }}</div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Penerima</span>
                <p class="font-bold text-slate-800">{{ selectedItem.accountHolder }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Bank / E-Wallet</span>
                <p class="font-bold text-slate-800">{{ selectedItem.bankOrWallet }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Nomor Rekening</span>
                <p class="font-mono font-bold text-slate-800">{{ selectedItem.accountNumber }}</p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Kode Referral</span>
                <p class="font-mono font-bold text-slate-800">{{ selectedItem.customerReferralCode || '-' }}</p>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText class="w-3.5 h-3.5 text-slate-400" />
                Nomor Referensi Transfer
              </label>
              <input
                v-model="payForm.transferReference"
                type="text"
                placeholder="Contoh: TRX/BCA/1234567890"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 text-slate-800 placeholder-slate-400"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText class="w-3.5 h-3.5 text-slate-400" />
                Catatan Internal
              </label>
              <textarea
                v-model="payForm.notes"
                rows="2"
                placeholder="Catatan opsional untuk tim internal"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 text-slate-800 placeholder-slate-400 resize-none"
              ></textarea>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
              <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
              <p class="leading-relaxed">
                Pastikan dana sudah benar-benar dikirim manual ke rekening tujuan sebelum menekan tombol di bawah.
                Pencairan yang ditandai selesai akan otomatis tercatat sebagai transaksi kas keluar.
              </p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              @click="isPayModalOpen = false"
              class="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Batal
            </button>
            <button
              @click="handleConfirmPaid"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" />
              {{ isSubmitting ? 'Memproses...' : 'Tandai Sudah Dibayar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL TOLAK -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isRejectModalOpen && selectedItem"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        @click.self="isRejectModalOpen = false"
      >
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle class="w-6 h-6" />
          </div>
          <div class="text-center">
            <h4 class="text-sm font-bold text-slate-800">Tolak Pengajuan Pencairan</h4>
            <p class="text-xs text-slate-500 mt-1">
              Pengajuan sebesar
              <span class="font-bold text-slate-700">{{ formatCurrency(selectedItem.amount) }}</span>
              atas nama {{ selectedItem.customerName }} akan ditolak.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Alasan Penolakan</label>
            <textarea
              v-model="rejectReason"
              rows="3"
              placeholder="Contoh: rekening tujuan tidak sesuai data pelanggan"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-slate-50/50 text-slate-800 placeholder-slate-400 resize-none"
            ></textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              @click="isRejectModalOpen = false"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              @click="handleReject"
              :disabled="isSubmitting"
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {{ isSubmitting ? 'Memproses...' : 'Ya, Tolak' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL BUKTI PENARIKAN -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isProofModalOpen && proofItem"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
        @click.self="isProofModalOpen = false"
      >
        <BuktiPenarikanModal
          :item="proofItem"
          @close="isProofModalOpen = false"
          @mark-wa-sent="handleMarkWaSent"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  Filter,
  Wallet,
  DollarSign,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  X,
  AlertTriangle,
  Receipt,
  Clock,
  User,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'
import { cashflowApi, type CashTransactionItem, type CashFlowSummary } from '../../api'
import { usePagination } from '../../composables/usePagination'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import CatatKasModal from './components/CatatKasModal.vue'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

// Date range filter (default September 2026)
const startDate = ref('2026-09-01')
const endDate = ref('2026-09-30')
const filterType = ref<'semua' | 'masuk' | 'keluar'>('semua')
const searchQuery = ref('')

// State Data dari Backend API
const transactions = ref<CashTransactionItem[]>([])
const summary = ref<CashFlowSummary>({
  totalMasuk: 0,
  totalKeluar: 0,
  saldoBersih: 0,
  countMasuk: 0,
  countKeluar: 0,
  pertumbuhanMasuk: 12.5,
  pertumbuhanKeluar: -3.2
})
const isLoading = ref(false)

// Highlight row setelah penambahan transaksi
const lastAddedId = ref<string | null>(null)

// Modal Catat Pemasukan / Pengeluaran
const isModalOpen = ref(false)
const modalDefaultType = ref<'masuk' | 'keluar'>('masuk')

// Modal Detail Transaksi
const isDetailModalOpen = ref(false)
const selectedDetail = ref<CashTransactionItem | null>(null)

// Modal Zoom Bukti Pembayaran
const isReceiptZoomOpen = ref(false)
const selectedReceiptUrl = ref('')

// Modal Konfirmasi Hapus Transaksi
const isDeleteModalOpen = ref(false)
const itemToDelete = ref<CashTransactionItem | null>(null)
const isDeleting = ref(false)

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

// Format mata uang Rupiah
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

/**
 * Fetch Data Transaksi Arus Kas dari Backend API
 */
const fetchCashflow = async () => {
  isLoading.value = true
  try {
    const res = await cashflowApi.getAll({
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      type: filterType.value === 'semua' ? undefined : filterType.value,
      search: searchQuery.value.trim() || undefined
    })

    if (res.data && Array.isArray(res.data)) {
      transactions.value = res.data
    }
    if (res.summary) {
      summary.value = res.summary
    }
  } catch (err: any) {
    console.error('Error fetching cashflow from backend:', err)
    showToast(err.message || 'Gagal memuat data arus kas dari server.')
  } finally {
    isLoading.value = false
  }
}

// Inisialisasi Pagination
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedItems: paginatedCashflow,
  resetPage
} = usePagination(transactions, 10)

// Debounce pencarian
let searchDebounceTimer: any = null
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    resetPage()
    fetchCashflow()
  }, 350)
})

// Watch filter tanggal dan tipe transaksi
watch([startDate, endDate, filterType], () => {
  resetPage()
  fetchCashflow()
})

// Muat data saat komponen di-mount
onMounted(() => {
  fetchCashflow()
})

// Handler refresh manual
const handleRefresh = async () => {
  await fetchCashflow()
  showToast('Data Arus Kas berhasil disinkronisasi!')
}

// Modal open/close handlers
const openModal = (type: 'masuk' | 'keluar') => {
  modalDefaultType.value = type
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const openDetailModal = (item: CashTransactionItem) => {
  selectedDetail.value = item
  isDetailModalOpen.value = true
}

const closeDetailModal = () => {
  isDetailModalOpen.value = false
  selectedDetail.value = null
}

const openReceiptZoom = (url?: string) => {
  if (!url) return
  selectedReceiptUrl.value = url
  isReceiptZoomOpen.value = true
}

const closeReceiptZoom = () => {
  isReceiptZoomOpen.value = false
  selectedReceiptUrl.value = ''
}

const confirmDelete = (item: CashTransactionItem) => {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

// Submit Catat Pemasukan
const handleSaveIncome = async (payload: {
  date: string
  displayDate: string
  customer: string
  desc: string
  category: string
  amount: number
  paymentMethod: string
  paymentProofUrl?: string
}) => {
  try {
    const res = await cashflowApi.createIncome({
      date: payload.date,
      displayDate: payload.displayDate,
      customer: payload.customer,
      desc: payload.desc,
      category: payload.category,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      paymentProofUrl: payload.paymentProofUrl
    })

    if (res.data) {
      lastAddedId.value = res.data.id
      isModalOpen.value = false
      showToast(`Pemasukan sebesar ${formatCurrency(payload.amount)} dari "${payload.customer}" berhasil dicatat!`)
      await fetchCashflow()

      setTimeout(() => {
        if (lastAddedId.value === res.data.id) {
          lastAddedId.value = null
        }
      }, 5000)
    }
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan pemasukan ke API backend.')
  }
}

// Submit Catat Pengeluaran
const handleSaveExpense = async (payload: {
  date: string
  displayDate: string
  desc: string
  category: string
  amount: number
  paymentMethod: string
  paymentProofUrl?: string
}) => {
  try {
    const res = await cashflowApi.createExpense({
      date: payload.date,
      displayDate: payload.displayDate,
      desc: payload.desc,
      category: payload.category,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      paymentProofUrl: payload.paymentProofUrl
    })

    if (res.data) {
      lastAddedId.value = res.data.id
      isModalOpen.value = false
      showToast(`Pengeluaran sebesar ${formatCurrency(payload.amount)} untuk "${payload.desc}" berhasil dicatat!`)
      await fetchCashflow()

      setTimeout(() => {
        if (lastAddedId.value === res.data.id) {
          lastAddedId.value = null
        }
      }, 5000)
    }
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan pengeluaran ke API backend.')
  }
}

// Handler Konfirmasi Hapus Transaksi
const handleDeleteConfirm = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await cashflowApi.delete(itemToDelete.value.id)
    showToast(`Transaksi "${itemToDelete.value.desc}" berhasil dihapus.`)
    isDeleteModalOpen.value = false
    itemToDelete.value = null
    await fetchCashflow()
  } catch (err: any) {
    showToast(err.message || 'Gagal menghapus transaksi dari server.')
  } finally {
    isDeleting.value = false
  }
}

// Ekspor Laporan ke Berkas CSV
const handleExport = () => {
  if (!transactions.value || transactions.value.length === 0) {
    alert('Tidak ada data transaksi untuk diekspor.')
    return
  }

  const headers = ['No', 'ID Transaksi', 'No Invoice', 'Tanggal', 'Waktu', 'Tipe Kas', 'Kategori', 'Deskripsi', 'Klien / Pihak', 'Metode Pembayaran', 'Status', 'Nominal (IDR)']
  const rows = transactions.value.map((t, idx) => [
    idx + 1,
    `"${t.id}"`,
    `"${t.invoiceNo || '-'}"`,
    `"${t.rawDate || t.date}"`,
    `"${t.time || '-'}"`,
    `"${t.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'}"`,
    `"${t.category || '-'}"`,
    `"${(t.desc || '').replace(/"/g, '""')}"`,
    `"${(t.customer || '-').replace(/"/g, '""')}"`,
    `"${t.paymentMethod || 'Tunai'}"`,
    `"${t.status || 'Selesai'}"`,
    t.amount
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Laporan_Arus_Kas_IKIKASIR_${startDate.value || 'all'}_sd_${endDate.value || 'all'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showToast('Data Arus Kas berhasil diekspor ke file CSV!')
}
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

    <!-- Header Section (Satu Baris Rapi & Presisi) -->
    <header class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <TrendingUp class="w-6 h-6 text-blue-600" />
          Laporan Arus Kas
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Pantau arus uang masuk dan keluar pada bisnis Anda secara real-time dari database.
        </p>
      </div>

      <!-- Action Buttons Bar -->
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <!-- Date Range Filter -->
        <DateRangePicker 
          v-model:startDate="startDate" 
          v-model:endDate="endDate" 
          placeholder="Filter Rentang Tanggal"
        />

        <!-- Refresh Button -->
        <button 
          @click="handleRefresh"
          :disabled="isLoading"
          class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
          title="Segarkan data dari server"
        >
          <RefreshCw class="w-3.5 h-3.5 text-slate-500" :class="isLoading ? 'animate-spin text-blue-600' : ''" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <!-- Export CSV Button -->
        <button 
          @click="handleExport"
          class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
          title="Unduh laporan CSV"
        >
          <Download class="w-3.5 h-3.5 text-slate-500" />
          <span class="hidden sm:inline">Export CSV</span>
        </button>

        <!-- Tombol Catat Pemasukan -->
        <button 
          @click="openModal('masuk')"
          class="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md shrink-0"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Pemasukan</span>
        </button>

        <!-- Tombol Catat Pengeluaran -->
        <button 
          @click="openModal('keluar')"
          class="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md shrink-0"
        >
          <MinusCircle class="w-4 h-4" />
          <span>Pengeluaran</span>
        </button>
      </div>
    </header>

    <!-- KPI Summary Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Pemasukan -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all relative">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">Total Pemasukan</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              {{ summary.countMasuk }} transaksi
            </span>
          </div>
          <button
            @click="openModal('masuk')"
            title="Klik untuk mencatat pemasukan baru"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <PlusCircle class="w-3.5 h-3.5" />
            <span class="text-[11px] font-bold">+ Catat</span>
          </button>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(summary.totalMasuk) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
          <ArrowUpRight class="w-3.5 h-3.5" />
          <span>+{{ summary.pertumbuhanMasuk }}% dari bulan lalu</span>
        </div>
      </div>

      <!-- Pengeluaran -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all relative">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">Total Pengeluaran</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
              {{ summary.countKeluar }} transaksi
            </span>
          </div>
          <button
            @click="openModal('keluar')"
            title="Klik untuk mencatat pengeluaran baru"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <MinusCircle class="w-3.5 h-3.5" />
            <span class="text-[11px] font-bold">- Catat</span>
          </button>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(summary.totalKeluar) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
          <ArrowDownRight class="w-3.5 h-3.5" />
          <span>{{ summary.pertumbuhanKeluar }}% dari bulan lalu</span>
        </div>
      </div>

      <!-- Saldo Bersih -->
      <div class="kpi-card kpi-primary bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all text-white">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-indigo-200">Saldo Bersih (Net Cash Flow)</span>
          <div class="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center">
            <Wallet class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">{{ formatCurrency(summary.saldoBersih) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-indigo-200 mt-1">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>{{ summary.saldoBersih >= 0 ? 'Surplus Kas Sehat' : 'Defisit Kas Operasional' }}</span>
        </div>
      </div>
    </section>

    <!-- Tabel Transaksi Arus Kas -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <!-- Toolbar Filter & Search -->
      <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-slate-800">Riwayat Transaksi Arus Kas</h2>
          <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
            {{ transactions.length }} transaksi
          </span>
          <span v-if="isLoading" class="text-[11px] text-blue-600 font-semibold flex items-center gap-1 ml-2">
            <RefreshCw class="w-3 h-3 animate-spin" /> Memuat...
          </span>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Input Pencarian -->
          <div class="relative flex-1 sm:w-64">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari transaksi, invoice, klien..."
              class="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 text-slate-800 placeholder-slate-400"
            />
          </div>

          <!-- Tab Filter Tipe Kas -->
          <div class="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
            <button 
              @click="filterType = 'semua'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="filterType === 'semua' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
            >Semua</button>
            <button 
              @click="filterType = 'masuk'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="filterType === 'masuk' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
            >Masuk</button>
            <button 
              @click="filterType = 'keluar'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              :class="filterType === 'keluar' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
            >Keluar</button>
          </div>
        </div>
      </div>

      <!-- Tampilan Desktop (Sleek, Proporsional & Rapi) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[1050px] border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3.5 w-12 text-center whitespace-nowrap">No</th>
              <th class="px-4 py-3.5 w-32 whitespace-nowrap">Tanggal</th>
              <th class="px-5 py-3.5 min-w-[320px]">Deskripsi Transaksi</th>
              <th class="px-4 py-3.5 w-36 whitespace-nowrap">Kategori</th>
              <th class="px-4 py-3.5 w-40 whitespace-nowrap">Metode & Bukti</th>
              <th class="px-4 py-3.5 w-24 text-center whitespace-nowrap">Status</th>
              <th class="px-4 py-3.5 w-32 text-center whitespace-nowrap">Tipe Kas</th>
              <th class="px-5 py-3.5 w-36 text-right whitespace-nowrap">Nominal</th>
              <th class="px-4 py-3.5 w-20 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(t, index) in paginatedCashflow" 
              :key="t.id" 
              class="transition-colors hover:bg-slate-50/70 group"
              :class="lastAddedId === t.id ? 'bg-indigo-50/80 animate-pulse duration-700' : ''"
            >
              <!-- 1. No Urut -->
              <td class="px-4 py-3.5 text-center text-slate-400 font-semibold text-xs whitespace-nowrap">
                {{ startIndex + index + 1 }}
              </td>

              <!-- 2. Tanggal & Waktu -->
              <td class="px-4 py-3.5 whitespace-nowrap text-xs">
                <div class="font-bold text-slate-800">{{ t.displayDate || t.rawDate }}</div>
                <div class="text-[10px] text-slate-400 font-medium mt-0.5">{{ t.time || 'WIB' }}</div>
              </td>

              <!-- 3. Deskripsi & Pihak Terkait (Lega, Rapi, Tidak Menumpuk) -->
              <td class="px-5 py-3.5 min-w-[320px]">
                <div class="flex items-start gap-3">
                  <div 
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                    :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                  >
                    <ArrowUpRight v-if="t.type === 'masuk'" class="w-4 h-4" />
                    <ArrowDownRight v-else class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-1" :title="t.desc">
                      {{ t.desc }}
                    </p>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span 
                        v-if="t.invoiceNo"
                        class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {{ t.invoiceNo }}
                      </span>
                      <span v-if="t.customer" class="text-[11px] text-slate-500 font-medium">
                        • {{ t.customer }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- 4. Kategori -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 inline-block">
                  {{ t.category }}
                </span>
              </td>

              <!-- 5. Metode & Bukti Pembayaran -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200/80">
                    {{ t.paymentMethod || 'Tunai' }}
                  </span>
                  <button 
                    v-if="t.paymentProofUrl"
                    @click="openReceiptZoom(t.paymentProofUrl)"
                    title="Klik untuk melihat bukti transfer / struk"
                    class="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold shadow-2xs"
                  >
                    <Eye class="w-3 h-3" />
                    <span>Bukti</span>
                  </button>
                </div>
              </td>

              <!-- 6. Status Transaksi -->
              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block"
                  :class="{
                    'bg-emerald-50 text-emerald-700 border-emerald-200': t.status === 'Selesai',
                    'bg-amber-50 text-amber-700 border-amber-200': t.status === 'Pending',
                    'bg-rose-50 text-rose-700 border-rose-200': t.status === 'Batal'
                  }"
                >
                  {{ t.status || 'Selesai' }}
                </span>
              </td>

              <!-- 7. Tipe Kas -->
              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                >
                  <ArrowUpRight v-if="t.type === 'masuk'" class="w-3 h-3" />
                  <ArrowDownRight v-else class="w-3 h-3" />
                  {{ t.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar' }}
                </span>
              </td>

              <!-- 8. Nominal -->
              <td class="px-5 py-3.5 text-right whitespace-nowrap font-extrabold text-sm"
                :class="t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'"
              >
                {{ t.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
              </td>

              <!-- 9. Aksi -->
              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openDetailModal(t)"
                    title="Lihat Detail Transaksi"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(t)"
                    title="Hapus Transaksi"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- State Kosong -->
            <tr v-if="transactions.length === 0">
              <td colspan="9" class="px-6 py-12 text-center text-slate-400 text-sm">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Wallet class="w-8 h-8 text-slate-300" />
                  <p class="font-medium">Tidak ada data transaksi arus kas yang cocok dengan pencarian / rentang tanggal ini.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tampilan Mobile (< md) -->
      <div class="block md:hidden divide-y divide-slate-100">
        <div 
          v-for="(t, index) in paginatedCashflow" 
          :key="t.id"
          class="p-4 space-y-2.5"
          :class="lastAddedId === t.id ? 'bg-indigo-50/80 animate-pulse' : ''"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#{{ startIndex + index + 1 }}</span>
              <span v-if="t.invoiceNo" class="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {{ t.invoiceNo }}
              </span>
              <span class="text-xs text-slate-500 font-medium">{{ t.displayDate || t.rawDate }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span 
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
              >
                {{ t.type === 'masuk' ? 'Masuk' : 'Keluar' }}
              </span>
              <button
                @click="openDetailModal(t)"
                class="p-1 text-slate-400 hover:text-indigo-600"
                title="Detail"
              >
                <FileText class="w-3.5 h-3.5" />
              </button>
              <button
                @click="confirmDelete(t)"
                class="p-1 text-slate-400 hover:text-rose-600"
                title="Hapus"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="font-bold text-slate-800 text-xs sm:text-sm">
            {{ t.desc }}
          </div>

          <div v-if="t.customer" class="text-[11px] text-slate-500">
            Pihak: <span class="font-semibold text-slate-700">{{ t.customer }}</span>
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-50">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {{ t.category }}
              </span>
              <span class="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                {{ t.paymentMethod || 'Tunai' }}
              </span>
              <button 
                v-if="t.paymentProofUrl"
                @click="openReceiptZoom(t.paymentProofUrl)"
                class="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center gap-0.5"
              >
                <Eye class="w-2.5 h-2.5" /> Bukti
              </button>
            </div>
            <span 
              class="font-extrabold text-sm"
              :class="t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ t.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
            </span>
          </div>
        </div>

        <div v-if="transactions.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Tidak ada data transaksi yang cocok dengan filter.
        </div>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="transactions.length > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </section>

    <!-- MODAL CATAT PEMASUKAN / PENGELUARAN -->
    <CatatKasModal
      :is-open="isModalOpen"
      :default-type="modalDefaultType"
      @close="closeModal"
      @submit-income="handleSaveIncome"
      @submit-expense="handleSaveExpense"
    />

    <!-- MODAL DETAIL TRANSAKSI ARUS KAS -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isDetailModalOpen && selectedDetail" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        @click.self="closeDetailModal"
      >
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <!-- Header Detail -->
          <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-2.5">
              <div 
                class="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
                :class="selectedDetail.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
              >
                <ArrowUpRight v-if="selectedDetail.type === 'masuk'" class="w-5 h-5" />
                <ArrowDownRight v-else class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">
                  Detail Transaksi Arus Kas
                </h3>
                <span class="font-mono text-xs font-bold text-indigo-600">
                  {{ selectedDetail.invoiceNo || selectedDetail.id }}
                </span>
              </div>
            </div>
            <button 
              @click="closeDetailModal"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body Detail Grid -->
          <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <!-- Nominal Card -->
            <div 
              class="p-4 rounded-2xl border text-center space-y-1 shadow-2xs"
              :class="selectedDetail.type === 'masuk' ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900' : 'bg-rose-50/60 border-rose-200/80 text-rose-900'"
            >
              <span class="text-xs font-semibold">
                {{ selectedDetail.type === 'masuk' ? 'Nominal Pemasukan Kas' : 'Nominal Pengeluaran Kas' }}
              </span>
              <div class="text-2xl font-black">
                {{ selectedDetail.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(selectedDetail.amount) }}
              </div>
            </div>

            <!-- Detail List -->
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Tanggal Transaksi</span>
                <p class="font-bold text-slate-800">{{ selectedDetail.displayDate || selectedDetail.rawDate }}</p>
                <p class="text-[10px] text-slate-500">{{ selectedDetail.time }}</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Kategori Transaksi</span>
                <p class="font-bold text-slate-800">{{ selectedDetail.category }}</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Pihak Terkait (Klien/Vendor)</span>
                <p class="font-bold text-slate-800">{{ selectedDetail.customer || '-' }}</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span class="text-slate-400 font-medium">Metode Pembayaran</span>
                <p class="font-bold text-slate-800">{{ selectedDetail.paymentMethod || 'Tunai' }}</p>
              </div>
            </div>

            <!-- Deskripsi Lengkap -->
            <div class="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
              <span class="text-slate-400 font-medium">Deskripsi / Keperluan</span>
              <p class="font-semibold text-slate-800 leading-relaxed">{{ selectedDetail.desc }}</p>
            </div>

            <!-- Catatan Tambahan jika ada -->
            <div v-if="selectedDetail.notes" class="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
              <span class="text-slate-400 font-medium">Catatan Internal</span>
              <p class="text-slate-700">{{ selectedDetail.notes }}</p>
            </div>

            <!-- Lampiran Bukti Pembayaran -->
            <div v-if="selectedDetail.paymentProofUrl" class="space-y-2">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Receipt class="w-4 h-4 text-blue-600" />
                Bukti Pembayaran / Struk:
              </span>
              <div 
                @click="openReceiptZoom(selectedDetail.paymentProofUrl)"
                class="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer max-h-48 flex items-center justify-center"
              >
                <img 
                  :src="selectedDetail.paymentProofUrl" 
                  alt="Bukti Struk" 
                  class="max-h-48 object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Eye class="w-4 h-4" /> Klik untuk Zoom
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Detail -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <button 
              @click="closeDetailModal"
              class="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL ZOOM BUKTI PEMBAYARAN -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isReceiptZoomOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        @click.self="closeReceiptZoom"
      >
        <div class="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-2">
              <Eye class="w-4 h-4 text-blue-600" />
              <h4 class="text-xs font-bold text-slate-800">Lampiran Bukti Pembayaran</h4>
            </div>
            <button 
              @click="closeReceiptZoom"
              class="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-4 bg-slate-900 flex items-center justify-center min-h-[260px] max-h-[70vh] overflow-auto">
            <img 
              :src="selectedReceiptUrl" 
              alt="Bukti Transfer"
              class="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg border border-slate-800"
            />
          </div>
          <div class="p-4 bg-white flex items-center justify-between border-t border-slate-100">
            <span class="text-[11px] text-slate-500 font-medium">Pratinjau Bukti Transaksi</span>
            <button 
              @click="closeReceiptZoom"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL KONFIRMASI HAPUS TRANSAKSI -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isDeleteModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        @click.self="isDeleteModalOpen = false"
      >
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-800">Hapus Transaksi Ini?</h4>
            <p class="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus catatan 
              <span class="font-bold text-slate-700">"{{ itemToDelete?.desc }}"</span>
              sebesar 
              <span class="font-bold text-rose-600">{{ itemToDelete ? formatCurrency(itemToDelete.amount) : '' }}</span> dari database?
            </p>
          </div>
          <div class="flex items-center gap-2 pt-2">
            <button 
              @click="isDeleteModalOpen = false"
              class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              @click="handleDeleteConfirm"
              :disabled="isDeleting"
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

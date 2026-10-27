<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  Search
} from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'
import { usePagination } from '../../composables/usePagination'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import CatatKasModal from './components/CatatKasModal.vue'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

const {
  masterTransactions,
  masterExpenses,
  getTrxTotalAmount,
  addIncomeTransaction,
  addExpenseTransaction
} = useReportData()

// Date range filter
const startDate = ref('2026-09-01')
const endDate = ref('2026-09-30')

const filterType = ref<'semua' | 'masuk' | 'keluar'>('semua')

// Modal state
const isModalOpen = ref(false)
const modalDefaultType = ref<'masuk' | 'keluar'>('masuk')
const lastAddedId = ref<string | null>(null)

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

const openModal = (type: 'masuk' | 'keluar') => {
  modalDefaultType.value = type
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

// Master cashflow generated dynamically from single source of truth
const cashflowTransactions = computed(() => {
  const list: { id: string | number, date: string, rawDate: string, desc: string, category: string, type: 'masuk' | 'keluar', amount: number }[] = []
  
  // 1. Pemasukan (Penyelesaian transaksi penjualan & penerimaan kas)
  masterTransactions.value.forEach((trx) => {
    if (trx.status === 'Selesai') {
      const total = getTrxTotalAmount(trx)
      const firstItem = trx.items[0]
      const hasCustomDesc = firstItem && firstItem.name && firstItem.name !== firstItem.category
      const descText = hasCustomDesc
        ? `Pembayaran Transaksi (${trx.invoiceNo}) - ${trx.customer} (${firstItem.name})`
        : `Pembayaran Transaksi (${trx.invoiceNo}) - ${trx.customer}`

      list.push({
        id: `in-${trx.id}`,
        date: trx.displayDate,
        rawDate: trx.date,
        desc: descText,
        category: firstItem?.category || 'Penjualan',
        type: 'masuk',
        amount: total
      })
    }
  })

  // 2. Pengeluaran (Biaya operasional & beban kas)
  masterExpenses.value.forEach((exp) => {
    list.push({
      id: `out-${exp.id}`,
      date: exp.displayDate,
      rawDate: exp.date,
      desc: exp.desc,
      category: exp.category,
      type: 'keluar',
      amount: exp.amount
    })
  })

  return list.sort((a, b) => b.rawDate.localeCompare(a.rawDate))
})

// Filtered by selected date range
const periodFilteredCashflow = computed(() => {
  return cashflowTransactions.value.filter(t => {
    if (startDate.value && t.rawDate < startDate.value) return false
    if (endDate.value && t.rawDate > endDate.value) return false
    return true
  })
})

// Summary KPI computed from periodFilteredCashflow
const summary = computed(() => {
  const masuk = periodFilteredCashflow.value
    .filter(t => t.type === 'masuk')
    .reduce((s, t) => s + t.amount, 0)

  const keluar = periodFilteredCashflow.value
    .filter(t => t.type === 'keluar')
    .reduce((s, t) => s + t.amount, 0)

  return {
    totalMasuk: masuk,
    totalKeluar: keluar,
    saldoBersih: masuk - keluar,
    pertumbuhanMasuk: 12.5,
    pertumbuhanKeluar: -3.2,
  }
})

// Search query for cash flow transactions
const searchQuery = ref('')

// Final list for table
const filteredTransactions = computed(() => {
  let list = periodFilteredCashflow.value
  if (filterType.value !== 'semua') {
    list = list.filter(t => t.type === filterType.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(t => 
      t.desc.toLowerCase().includes(q) || 
      t.category.toLowerCase().includes(q) ||
      t.date.toLowerCase().includes(q)
    )
  }
  return list
})

// Pagination
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedItems: paginatedCashflow,
  resetPage
} = usePagination(filteredTransactions, 10)

watch([startDate, endDate, filterType, searchQuery], () => {
  resetPage()
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const handleExport = () => {
  alert('Data Arus Kas berhasil diekspor! (Demo)')
}

// Handlers for modal submissions
const handleSaveIncome = (payload: {
  date: string
  displayDate: string
  customer: string
  desc: string
  category: string
  amount: number
  paymentMethod: string
  paymentProofUrl?: string
}) => {
  const createdTrx = addIncomeTransaction({
    date: payload.date,
    displayDate: payload.displayDate,
    customer: payload.customer,
    desc: payload.desc,
    category: payload.category,
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    paymentProofUrl: payload.paymentProofUrl
  })

  lastAddedId.value = `in-${createdTrx.id}`
  isModalOpen.value = false
  showToast(`Pemasukan sebesar ${formatCurrency(payload.amount)} dari "${payload.customer}" berhasil dicatat ke Arus Kas!`)

  // Clear highlight after 5 seconds
  setTimeout(() => {
    if (lastAddedId.value === `in-${createdTrx.id}`) {
      lastAddedId.value = null
    }
  }, 5000)
}

const handleSaveExpense = (payload: {
  date: string
  displayDate: string
  desc: string
  category: string
  amount: number
  paymentMethod: string
  paymentProofUrl?: string
}) => {
  const createdExp = addExpenseTransaction({
    date: payload.date,
    displayDate: payload.displayDate,
    desc: payload.desc,
    category: payload.category,
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    paymentProofUrl: payload.paymentProofUrl
  })

  lastAddedId.value = `out-${createdExp.id}`
  isModalOpen.value = false
  showToast(`Pengeluaran sebesar ${formatCurrency(payload.amount)} untuk "${payload.desc}" berhasil dicatat ke Arus Kas!`)

  // Clear highlight after 5 seconds
  setTimeout(() => {
    if (lastAddedId.value === `out-${createdExp.id}`) {
      lastAddedId.value = null
    }
  }, 5000)
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none relative">

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
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <TrendingUp class="w-6 h-6 text-blue-600" />
          Laporan Arus Kas
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Pantau arus uang masuk dan keluar pada bisnis Anda secara real-time.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Date Range Filter: Range Date Picker -->
        <DateRangePicker 
          v-model:startDate="startDate" 
          v-model:endDate="endDate" 
          placeholder="Filter Rentang Tanggal"
        />

        <!-- Export Excel Button -->
        <button 
          @click="handleExport"
          class="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Download class="w-4 h-4 text-slate-500" />
          <span>Export Excel</span>
        </button>

        <!-- Tombol Catat Pemasukan -->
        <button 
          @click="openModal('masuk')"
          class="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Catat Pemasukan</span>
        </button>

        <!-- Tombol Catat Pengeluaran -->
        <button 
          @click="openModal('keluar')"
          class="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <MinusCircle class="w-4 h-4" />
          <span>Catat Pengeluaran</span>
        </button>
      </div>
    </header>

    <!-- KPI Summary Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Pemasukan -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all relative group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pemasukan</span>
          <button
            @click="openModal('masuk')"
            title="Klik untuk mencatat pemasukan baru"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <PlusCircle class="w-4 h-4" />
            <span class="text-[11px] font-bold hidden sm:inline">+ Catat</span>
          </button>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(summary.totalMasuk) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
          <ArrowUpRight class="w-3.5 h-3.5" />
          <span>+{{ summary.pertumbuhanMasuk }}% dari bulan lalu</span>
        </div>
      </div>

      <!-- Pengeluaran -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all relative group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pengeluaran</span>
          <button
            @click="openModal('keluar')"
            title="Klik untuk mencatat pengeluaran baru"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <MinusCircle class="w-4 h-4" />
            <span class="text-[11px] font-bold hidden sm:inline">- Catat</span>
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
          <span class="text-xs font-semibold text-indigo-200">Saldo Bersih</span>
          <div class="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center">
            <Wallet class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">{{ formatCurrency(summary.saldoBersih) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-indigo-200 mt-1">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Profit margin sehat</span>
        </div>
      </div>
    </section>

    <!-- Transactions Table (Standardized Global Table with Pagination) -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <!-- Table Header & Toolbar -->
      <div class="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-bold text-slate-800">Riwayat Transaksi Arus Kas</h2>
          <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
            {{ filteredTransactions.length }} transaksi
          </span>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Search input -->
          <div class="relative flex-1 sm:w-56">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari transaksi / kategori..."
              class="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 text-slate-800 placeholder-slate-400"
            />
          </div>

          <!-- Type Filter Tabs -->
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

      <!-- Desktop Table View (md+) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[750px]">
          <thead class="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th class="px-6 py-4 w-16">No</th>
              <th class="px-6 py-4">Tanggal</th>
              <th class="px-6 py-4">Deskripsi</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4 text-center">Tipe Kas</th>
              <th class="px-6 py-4 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(t, index) in paginatedCashflow" 
              :key="t.id" 
              class="transition-colors hover:bg-slate-50/70"
              :class="lastAddedId === t.id ? 'bg-indigo-50/80 animate-pulse duration-700' : ''"
            >
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ startIndex + index + 1 }}
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium whitespace-nowrap text-xs">
                <div class="flex items-center gap-1.5">
                  <span>{{ t.date }}</span>
                  <span v-if="lastAddedId === t.id" class="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-md">
                    Baru
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                  >
                    <ArrowUpRight v-if="t.type === 'masuk'" class="w-3.5 h-3.5" />
                    <ArrowDownRight v-else class="w-3.5 h-3.5" />
                  </div>
                  <span class="font-bold text-slate-800 text-xs sm:text-sm">{{ t.desc }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {{ t.category }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                >
                  <ArrowUpRight v-if="t.type === 'masuk'" class="w-3 h-3" />
                  <ArrowDownRight v-else class="w-3 h-3" />
                  {{ t.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <span 
                  class="font-extrabold text-sm"
                  :class="t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ t.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-sm">
                Tidak ada data transaksi arus kas yang cocok dengan pencarian / filter ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List View (< md) -->
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
              <span class="text-xs text-slate-500 font-medium">{{ t.date }}</span>
              <span v-if="lastAddedId === t.id" class="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-md">
                Baru
              </span>
            </div>
            <span 
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
            >
              {{ t.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar' }}
            </span>
          </div>

          <div class="font-bold text-slate-800 text-xs sm:text-sm">
            {{ t.desc }}
          </div>

          <div class="flex items-center justify-between pt-1 border-t border-slate-50">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              {{ t.category }}
            </span>
            <span 
              class="font-extrabold text-sm"
              :class="t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'"
            >
              {{ t.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
            </span>
          </div>
        </div>

        <div v-if="filteredTransactions.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Tidak ada data transaksi yang cocok dengan filter.
        </div>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredTransactions.length > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </section>

    <!-- Modal Catat Pemasukan / Pengeluaran -->
    <CatatKasModal
      :is-open="isModalOpen"
      :default-type="modalDefaultType"
      @close="closeModal"
      @submit-income="handleSaveIncome"
      @submit-expense="handleSaveExpense"
    />
  </div>
</template>

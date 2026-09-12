<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search, 
  Calendar, 
  RotateCcw, 
  Download, 
  Printer,
  FileText, 
  TrendingUp, 
  ShoppingBag,
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  X, 
  Receipt,
  ArrowRight,
  Filter,
  Info
} from 'lucide-vue-next'

import { useReportData, type SalesTransaction as Transaction } from '../../composables/useReportData'

const { masterTransactions } = useReportData()
const transactions = masterTransactions


// Filter state
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')
const filterStatus = ref<'Semua' | 'Selesai' | 'Pending' | 'Batal'>('Semua')

// Modal state
const showDetailModal = ref(false)
const selectedTrx = ref<Transaction | null>(null)
const toastMessage = ref<string | null>(null)

// Toast Helper
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3000)
}

// Utility formatting
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

// Helper computations per transaction
const getTrxTotalAmount = (trx: Transaction) => {
  return trx.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
}

const getTrxTotalQty = (trx: Transaction) => {
  return trx.items.reduce((sum, item) => sum + item.qty, 0)
}

const getTrxProductsSummary = (trx: Transaction) => {
  if (!trx.items || trx.items.length === 0) return '-'
  if (trx.items.length === 1) {
    return `${trx.items[0].name} (${trx.items[0].qty}x)`
  }
  return `${trx.items[0].name} +${trx.items.length - 1} produk lainnya`
}

// Quick Date Range Filter presets
const setDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'all') => {
  const today = new Date('2026-09-12')
  
  if (preset === 'all') {
    startDate.value = ''
    endDate.value = ''
    return
  }

  const formatISO = (d: Date) => d.toISOString().split('T')[0]
  endDate.value = formatISO(today)

  if (preset === 'today') {
    startDate.value = formatISO(today)
  } else if (preset === '7days') {
    const past = new Date(today)
    past.setDate(past.getDate() - 7)
    startDate.value = formatISO(past)
  } else if (preset === 'thisMonth') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    startDate.value = formatISO(firstDay)
  }
}

// Filtered Transactions
const filteredTransactions = computed(() => {
  return transactions.value.filter(trx => {
    // Filter status
    if (filterStatus.value !== 'Semua' && trx.status !== filterStatus.value) {
      return false
    }

    // Filter search (Invoice / Pelanggan / Produk)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchInvoice = trx.invoiceNo.toLowerCase().includes(q)
      const matchCustomer = trx.customer.toLowerCase().includes(q)
      const matchProduct = trx.items.some(i => i.name.toLowerCase().includes(q))
      if (!matchInvoice && !matchCustomer && !matchProduct) return false
    }

    // Filter date range
    if (startDate.value && trx.date < startDate.value) return false
    if (endDate.value && trx.date > endDate.value) return false

    return true
  })
})

// Summary KPI (Calculated from filtered data for dynamic updates)
const summaryKpi = computed(() => {
  const list = filteredTransactions.value
  
  // Total Penjualan: Sum total from 'Selesai' status
  const totalPenjualan = list
    .filter(t => t.status === 'Selesai')
    .reduce((sum, t) => sum + getTrxTotalAmount(t), 0)

  // Jumlah Transaksi: Count of filtered transactions
  const jumlahTransaksi = list.length

  // Produk Terjual: Sum total items qty from 'Selesai' status
  const produkTerjual = list
    .filter(t => t.status === 'Selesai')
    .reduce((sum, t) => sum + getTrxTotalQty(t), 0)

  return {
    totalPenjualan,
    jumlahTransaksi,
    produkTerjual
  }
})

// Reset Filters
const resetFilters = () => {
  searchQuery.value = ''
  startDate.value = ''
  endDate.value = ''
  filterStatus.value = 'Semua'
}

// Actions
const openDetail = (trx: Transaction) => {
  selectedTrx.value = trx
  showDetailModal.value = true
}

const handleExport = () => {
  showToast('Laporan Penjualan berhasil diekspor (Format Excel/CSV)!')
}

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none print:p-0 print:space-y-4">
    
    <!-- Toast Notification -->
    <Transition name="slide-fade">
      <div v-if="toastMessage" class="fixed top-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 print:hidden">
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- ========== ALUR KERJA BANNER (TRANSAKSI PENJUALAN -> LAPORAN) ========== -->
    <section class="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-700/30 print:hidden relative overflow-hidden">
      <!-- Decorative background accent -->
      <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[11px] font-bold tracking-wider uppercase border border-indigo-400/20">
              Otomatis & Terintegrasi
            </span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold mt-2 tracking-tight text-white">Alur Data Laporan Penjualan</h2>
          <p class="text-xs text-indigo-200/90 mt-1 max-w-xl">
            Laporan ini dibuat berdasarkan transaksi penjualan yang tercatat di sistem secara otomatis.
          </p>
        </div>

        <!-- Workflow Visual Diagram -->
        <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/10 shrink-0 text-xs font-medium text-white">
            <ShoppingBag class="w-4 h-4 text-indigo-300" />
            <span>1. Transaksi Penjualan</span>
          </div>
          <ArrowRight class="w-3.5 h-3.5 text-indigo-300 shrink-0" />
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/10 shrink-0 text-xs font-medium text-white">
            <Receipt class="w-4 h-4 text-emerald-300" />
            <span>2. Data Tersimpan</span>
          </div>
          <ArrowRight class="w-3.5 h-3.5 text-indigo-300 shrink-0" />
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/40 border border-indigo-300/40 shrink-0 text-xs font-bold text-white shadow-xs">
            <FileText class="w-4 h-4 text-amber-300" />
            <span>3. Laporan Penjualan</span>
          </div>
          <ArrowRight class="w-3.5 h-3.5 text-indigo-300 shrink-0" />
          <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/10 shrink-0 text-xs font-medium text-white">
            <Eye class="w-4 h-4 text-cyan-300" />
            <span>4. Detail Transaksi</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== HEADER LAPORAN PENJUALAN ========== -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <Receipt class="w-6 h-6" />
          </div>
          Laporan Penjualan
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
          <Info class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Laporan ini dibuat berdasarkan transaksi penjualan yang tercatat di sistem.</span>
        </p>
      </div>

      <!-- Action Buttons: Export & Cetak -->
      <div class="flex items-center gap-2.5 print:hidden">
        <button 
          @click="handlePrint"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <Printer class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Cetak</span>
        </button>

        <button 
          @click="handleExport"
          class="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
        >
          <Download class="w-4 h-4" />
          <span>Export Laporan</span>
        </button>
      </div>
    </header>

    <!-- ========== FILTER TANGGAL & PENCARIAN ========== -->
    <section class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700/50 space-y-4 print:hidden">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          <Filter class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Filter & Pencarian Laporan
        </div>
        <button 
          v-if="searchQuery || startDate || endDate || filterStatus !== 'Semua'"
          @click="resetFilters"
          class="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
        >
          <RotateCcw class="w-3 h-3" />
          Reset Filter
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        <!-- Search Input -->
        <div class="lg:col-span-4 relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari no. transaksi, pelanggan, produk..."
            class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
          />
        </div>

        <!-- Date Range Pickers -->
        <div class="lg:col-span-5 flex items-center gap-2">
          <div class="relative flex-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase absolute left-3 top-1 pointer-events-none">Mulai</span>
            <input 
              v-model="startDate"
              type="date"
              class="w-full pl-3 pr-2 pt-4 pb-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
            />
          </div>
          <span class="text-slate-400 text-xs font-bold">s/d</span>
          <div class="relative flex-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase absolute left-3 top-1 pointer-events-none">Sampai</span>
            <input 
              v-model="endDate"
              type="date"
              class="w-full pl-3 pr-2 pt-4 pb-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
            />
          </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="lg:col-span-3 flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1 shrink-0">
          <button 
            v-for="s in (['Semua', 'Selesai', 'Pending', 'Batal'] as const)" :key="s"
            @click="filterStatus = s"
            class="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center"
            :class="{
              'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs': filterStatus === s && s === 'Semua',
              'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs': filterStatus === s && s === 'Selesai',
              'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs': filterStatus === s && s === 'Pending',
              'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs': filterStatus === s && s === 'Batal',
              'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200': filterStatus !== s,
            }"
          >{{ s }}</button>
        </div>
      </div>

      <!-- Quick Date Presets -->
      <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 overflow-x-auto scrollbar-none">
        <span class="text-[11px] font-medium text-slate-400 shrink-0">Preset Tanggal:</span>
        <button @click="setDatePreset('all')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer shrink-0">Semua</button>
        <button @click="setDatePreset('today')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer shrink-0">Hari Ini (12 Sep)</button>
        <button @click="setDatePreset('7days')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer shrink-0">7 Hari Terakhir</button>
        <button @click="setDatePreset('thisMonth')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer shrink-0">Bulan Ini</button>
      </div>
    </section>

    <!-- ========== RINGKASAN LAPORAN (KPI CARDS) ========== -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- 1. Total Penjualan -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Penjualan</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
            {{ formatCurrency(summaryKpi.totalPenjualan) }}
          </h3>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Akumulasi transaksi status Selesai</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <TrendingUp class="w-6 h-6" />
        </div>
      </div>

      <!-- 2. Jumlah Transaksi -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Jumlah Transaksi</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-1 tracking-tight">
            {{ summaryKpi.jumlahTransaksi }} <span class="text-xs font-medium text-slate-400">Transaksi</span>
          </h3>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tercatat pada periode terfilter</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileText class="w-6 h-6" />
        </div>
      </div>

      <!-- 3. Produk Terjual -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-xs flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Produk Terjual</span>
          <h3 class="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
            {{ summaryKpi.produkTerjual }} <span class="text-xs font-medium text-slate-400">Item Qty</span>
          </h3>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Total produk keluar & sukses</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <ShoppingBag class="w-6 h-6" />
        </div>
      </div>
    </section>

    <!-- ========== TABEL LAPORAN PENJUALAN ========== -->
    <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/50 overflow-hidden">
      <!-- Table Header -->
      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span>Daftar Transaksi Penjualan</span>
            <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
              {{ filteredTransactions.length }} Data
            </span>
          </h2>
          <p class="text-[11px] text-slate-400 dark:text-slate-400">Klik tombol "Lihat Detail" untuk melihat rincian item & rincian pembayaran.</p>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Status Selesai: <strong class="text-emerald-600 dark:text-emerald-400 font-bold">{{ filteredTransactions.filter(t => t.status === 'Selesai').length }}</strong>
        </div>
      </div>

      <!-- Desktop Table (Visible on md+) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[900px]">
          <thead class="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
            <tr>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs w-12 text-center">No</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs">Tanggal</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs">No. Transaksi</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs">Pelanggan</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs">Produk</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs text-center">Qty</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs text-right">Total</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs text-center">Status</th>
              <th class="px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs text-center w-28 print:hidden">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr 
              v-for="(trx, idx) in filteredTransactions" :key="trx.id"
              class="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
            >
              <!-- No -->
              <td class="px-5 py-4 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                {{ idx + 1 }}
              </td>

              <!-- Tanggal -->
              <td class="px-5 py-4 whitespace-nowrap">
                <div class="font-semibold text-slate-700 dark:text-slate-200 text-xs">{{ trx.displayDate }}</div>
                <div class="text-[11px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">{{ trx.time }}</div>
              </td>

              <!-- No. Transaksi -->
              <td class="px-5 py-4 whitespace-nowrap">
                <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/40">
                  {{ trx.invoiceNo }}
                </span>
              </td>

              <!-- Pelanggan -->
              <td class="px-5 py-4">
                <div class="font-semibold text-slate-800 dark:text-slate-100 text-xs">{{ trx.customer }}</div>
                <div class="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">{{ trx.paymentMethod }}</div>
              </td>

              <!-- Produk -->
              <td class="px-5 py-4 max-w-[240px]">
                <div class="text-xs text-slate-700 dark:text-slate-300 font-medium truncate" :title="getTrxProductsSummary(trx)">
                  {{ getTrxProductsSummary(trx) }}
                </div>
              </td>

              <!-- Qty -->
              <td class="px-5 py-4 text-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                {{ getTrxTotalQty(trx) }}
              </td>

              <!-- Total -->
              <td class="px-5 py-4 text-right whitespace-nowrap">
                <span class="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {{ formatCurrency(getTrxTotalAmount(trx)) }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-5 py-4 text-center whitespace-nowrap">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  :class="{
                    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50': trx.status === 'Selesai',
                    'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50': trx.status === 'Pending',
                    'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50': trx.status === 'Batal',
                  }"
                >
                  <CheckCircle2 v-if="trx.status === 'Selesai'" class="w-3 h-3" />
                  <Clock v-else-if="trx.status === 'Pending'" class="w-3 h-3" />
                  <XCircle v-else class="w-3 h-3" />
                  {{ trx.status }}
                </span>
              </td>

              <!-- Aksi -->
              <td class="px-5 py-4 text-center whitespace-nowrap print:hidden">
                <button 
                  @click="openDetail(trx)" 
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Lihat Detail</span>
                </button>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="9" class="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <div class="max-w-xs mx-auto space-y-2">
                  <Receipt class="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p class="font-semibold text-slate-600 dark:text-slate-400">Tidak ada transaksi ditemukan</p>
                  <p class="text-xs text-slate-400">Coba ubah kata kunci atau preset filter tanggal Anda.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List View (Visible on < md) -->
      <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        <div 
          v-for="(trx, idx) in filteredTransactions" :key="trx.id"
          class="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
        >
          <!-- Top Row: Invoice & Status -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] text-slate-400 font-bold mr-1.5">#{{ idx + 1 }}</span>
              <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                {{ trx.invoiceNo }}
              </span>
              <div class="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                {{ trx.displayDate }} · {{ trx.time }}
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0"
              :class="{
                'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400': trx.status === 'Selesai',
                'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400': trx.status === 'Pending',
                'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400': trx.status === 'Batal',
              }"
            >
              {{ trx.status }}
            </span>
          </div>

          <!-- Customer & Products -->
          <div class="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 space-y-1 text-xs">
            <div class="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>{{ trx.customer }}</span>
              <span class="text-slate-400 font-normal">{{ trx.paymentMethod }}</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {{ getTrxProductsSummary(trx) }}
            </div>
          </div>

          <!-- Total & Detail Action -->
          <div class="flex items-center justify-between pt-1">
            <div>
              <div class="text-[10px] font-semibold text-slate-400 uppercase">Total Transaksi</div>
              <div class="text-base font-extrabold text-slate-900 dark:text-white">
                {{ formatCurrency(getTrxTotalAmount(trx)) }}
              </div>
            </div>
            <button 
              @click="openDetail(trx)"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>Detail</span>
            </button>
          </div>
        </div>

        <div v-if="filteredTransactions.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Tidak ada data transaksi yang sesuai filter.
        </div>
      </div>

      <!-- Footer Recap -->
      <div class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
          Menampilkan <strong class="text-slate-800 dark:text-slate-200">{{ filteredTransactions.length }}</strong> dari <strong class="text-slate-800 dark:text-slate-200">{{ transactions.length }}</strong> total transaksi terdaftar.
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-slate-500 dark:text-slate-400">Total Pendapatan Terfilter (Selesai):</span>
            <span class="ml-2 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
              {{ formatCurrency(summaryKpi.totalPenjualan) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== MODAL DETAIL TRANSAKSI ========== -->
    <div 
      v-if="showDetailModal && selectedTrx" 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Top Bar -->
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Receipt class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800 dark:text-white">Detail Transaksi</h3>
              <p class="text-[11px] text-slate-400">Rincian item & informasi status pembayaran</p>
            </div>
          </div>
          <button 
            @click="showDetailModal = false" 
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Invoice Card Header -->
        <div class="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <div class="text-[10px] uppercase tracking-wider font-bold text-slate-400">No. Transaksi / Invoice</div>
            <div class="text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {{ selectedTrx.invoiceNo }}
            </div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Calendar class="w-3 h-3 text-slate-400" />
              <span>{{ selectedTrx.displayDate }} · {{ selectedTrx.time }}</span>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold"
            :class="{
              'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800': selectedTrx.status === 'Selesai',
              'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800': selectedTrx.status === 'Pending',
              'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800': selectedTrx.status === 'Batal',
            }"
          >
            {{ selectedTrx.status }}
          </span>
        </div>

        <!-- Customer & Payment Metadata -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/40">
            <span class="text-slate-400 text-[11px] block font-medium">Pelanggan</span>
            <span class="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{{ selectedTrx.customer }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/40">
            <span class="text-slate-400 text-[11px] block font-medium">Metode Pembayaran</span>
            <span class="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 block">{{ selectedTrx.paymentMethod }}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Rincian Produk
          </h4>
          <div class="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th class="px-3.5 py-2.5 font-semibold">Produk</th>
                  <th class="px-3.5 py-2.5 font-semibold text-center">Harga</th>
                  <th class="px-3.5 py-2.5 font-semibold text-center">Qty</th>
                  <th class="px-3.5 py-2.5 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/40">
                <tr v-for="item in selectedTrx.items" :key="item.id" class="text-slate-800 dark:text-slate-200">
                  <td class="px-3.5 py-3 font-medium">{{ item.name }}</td>
                  <td class="px-3.5 py-3 text-center text-slate-500 dark:text-slate-400">{{ formatCurrency(item.price) }}</td>
                  <td class="px-3.5 py-3 text-center font-bold">{{ item.qty }}</td>
                  <td class="px-3.5 py-3 text-right font-bold">{{ formatCurrency(item.price * item.qty) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Total Breakdown -->
        <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/40 space-y-2">
          <div class="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <span>Jumlah Item:</span>
            <span class="font-bold">{{ getTrxTotalQty(selectedTrx) }} Qty</span>
          </div>
          <div class="flex items-center justify-between text-sm font-bold text-indigo-900 dark:text-indigo-200 pt-2 border-t border-indigo-100 dark:border-indigo-800/40">
            <span>Total Pembayaran:</span>
            <span class="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              {{ formatCurrency(getTrxTotalAmount(selectedTrx)) }}
            </span>
          </div>
        </div>

        <!-- System Source Footnote -->
        <div class="text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1 pt-1">
          <Info class="w-3 h-3 text-indigo-500" />
          <span>Laporan ini dibuat berdasarkan transaksi penjualan yang tercatat di sistem.</span>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button 
            @click="showDetailModal = false"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button 
            @click="handlePrint"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { transform: translateY(-10px); opacity: 0; }
.slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }
</style>

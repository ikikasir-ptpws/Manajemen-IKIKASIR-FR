<script setup lang="ts">
import { ref, computed } from 'vue'
import { TrendingUp, TrendingDown, Download, ArrowUpRight, ArrowDownRight, Calendar, ChevronDown, Filter, Wallet, DollarSign, MinusCircle, PlusCircle } from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'

const { masterTransactions, masterExpenses, getTrxTotalAmount } = useReportData()

const selectedPeriod = ref('Bulan Ini')
const showPeriodDropdown = ref(false)
const periods = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', '3 Bulan Terakhir', 'Tahun Ini']

const selectPeriod = (p: string) => {
  selectedPeriod.value = p
  showPeriodDropdown.value = false
}

const filterType = ref<'semua' | 'masuk' | 'keluar'>('semua')

// Master cashflow generated dynamically from single source of truth
const cashflowTransactions = computed(() => {
  const list: { id: string | number, date: string, rawDate: string, desc: string, category: string, type: 'masuk' | 'keluar', amount: number }[] = []
  
  // 1. Pemasukan (Penyelesaian transaksi penjualan)
  masterTransactions.value.forEach((trx) => {
    if (trx.status === 'Selesai') {
      const total = getTrxTotalAmount(trx)
      list.push({
        id: `in-${trx.id}`,
        date: trx.displayDate,
        rawDate: trx.date,
        desc: `Pembayaran Transaksi (${trx.invoiceNo}) - ${trx.customer}`,
        category: trx.items[0]?.category || 'Penjualan',
        type: 'masuk',
        amount: total
      })
    }
  })

  // 2. Pengeluaran (Biaya operasional)
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

// Filtered by selected period
const periodFilteredCashflow = computed(() => {
  const p = selectedPeriod.value
  return cashflowTransactions.value.filter(t => {
    if (p === 'Hari Ini') return t.rawDate === '2026-09-12'
    if (p === 'Minggu Ini') return t.rawDate >= '2026-09-06' && t.rawDate <= '2026-09-12'
    if (p === 'Bulan Ini') return t.rawDate.startsWith('2026-09')
    if (p === '3 Bulan Terakhir') return t.rawDate >= '2026-07-01'
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

// Final list for table
const filteredTransactions = computed(() => {
  if (filterType.value === 'semua') return periodFilteredCashflow.value
  return periodFilteredCashflow.value.filter(t => t.type === filterType.value)
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const handleExport = () => {
  alert('Data Arus Kas berhasil diekspor! (Demo)')
}
</script>


<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none">

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <TrendingUp class="w-6 h-6 text-blue-600" />
          Laporan Arus Kas
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Pantau arus uang masuk dan keluar pada bisnis Anda.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Period Selector -->
        <div class="relative">
          <button 
            @click="showPeriodDropdown = !showPeriodDropdown"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ selectedPeriod }}</span>
            <ChevronDown class="w-3 h-3 text-slate-400" />
          </button>
          <div 
            v-if="showPeriodDropdown"
            class="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 text-xs"
          >
            <button 
              v-for="p in periods" :key="p"
              @click="selectPeriod(p)"
              class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 cursor-pointer"
              :class="selectedPeriod === p ? 'bg-indigo-50 text-indigo-600' : ''"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <button 
          @click="handleExport"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Download class="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>
    </header>

    <!-- KPI Summary Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Pemasukan -->
      <div class="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pemasukan</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PlusCircle class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(summary.totalMasuk) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
          <ArrowUpRight class="w-3.5 h-3.5" />
          <span>+{{ summary.pertumbuhanMasuk }}% dari bulan lalu</span>
        </div>
      </div>

      <!-- Pengeluaran -->
      <div class="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pengeluaran</span>
          <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <MinusCircle class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(summary.totalKeluar) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
          <ArrowDownRight class="w-3.5 h-3.5" />
          <span>{{ summary.pertumbuhanKeluar }}% dari bulan lalu</span>
        </div>
      </div>

      <!-- Saldo Bersih -->
      <div class="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all text-white">
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

    <!-- Transactions Table -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <!-- Filter Tabs -->
      <div class="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 class="text-sm font-bold text-slate-800">Riwayat Transaksi</h2>
        <div class="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
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

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[700px]">
          <thead class="bg-slate-50/50">
            <tr>
              <th class="px-6 py-3 font-semibold text-slate-500 text-xs">Tanggal</th>
              <th class="px-6 py-3 font-semibold text-slate-500 text-xs">Deskripsi</th>
              <th class="px-6 py-3 font-semibold text-slate-500 text-xs">Kategori</th>
              <th class="px-6 py-3 font-semibold text-slate-500 text-xs text-right">Nominal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="t in filteredTransactions" :key="t.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-3.5 text-slate-500 text-xs font-medium whitespace-nowrap">{{ t.date }}</td>
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    :class="t.type === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                  >
                    <ArrowUpRight v-if="t.type === 'masuk'" class="w-3.5 h-3.5" />
                    <ArrowDownRight v-else class="w-3.5 h-3.5" />
                  </div>
                  <span class="font-medium text-slate-700 text-sm">{{ t.desc }}</span>
                </div>
              </td>
              <td class="px-6 py-3.5">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                  {{ t.category }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-right">
                <span 
                  class="font-bold text-sm"
                  :class="t.type === 'masuk' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ t.type === 'masuk' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-400 text-sm">
                Tidak ada transaksi untuk filter ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import { PieChart, Download, Calendar, ChevronDown, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Minus } from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'

const { masterTransactions, masterExpenses } = useReportData()

const selectedPeriod = ref('September 2026')
const showPeriodDropdown = ref(false)
const periods = ['Agustus 2026', 'September 2026', 'Q3 2026', 'Tahun 2026']

const selectPeriod = (p: string) => {
  selectedPeriod.value = p
  showPeriodDropdown.value = false
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

// Sales transactions filtered by period
const filteredSales = computed(() => {
  const p = selectedPeriod.value
  return masterTransactions.value.filter(trx => {
    if (trx.status !== 'Selesai') return false
    if (p === 'September 2026') return trx.date.startsWith('2026-09')
    if (p === 'Agustus 2026') return trx.date.startsWith('2026-08')
    if (p === 'Q3 2026') return trx.date >= '2026-07-01' && trx.date <= '2026-09-30'
    return true
  })
})

// Expense items filtered by period
const filteredExpenses = computed(() => {
  const p = selectedPeriod.value
  return masterExpenses.value.filter(exp => {
    if (p === 'September 2026') return exp.date.startsWith('2026-09')
    if (p === 'Agustus 2026') return exp.date.startsWith('2026-08')
    if (p === 'Q3 2026') return exp.date >= '2026-07-01' && exp.date <= '2026-09-30'
    return true
  })
})

// Pendapatan items computed directly from completed sales transactions
const pendapatanItems = computed(() => {
  const categoryTotals: Record<string, number> = {
    'Pendapatan Lisensi & Paket POS': 0,
    'Pendapatan Perangkat Hardware POS': 0,
    'Pendapatan Addon & Aksesoris': 0,
  }

  filteredSales.value.forEach(trx => {
    trx.items.forEach(item => {
      if (item.category === 'Lisensi POS') {
        categoryTotals['Pendapatan Lisensi & Paket POS'] = (categoryTotals['Pendapatan Lisensi & Paket POS'] ?? 0) + item.price * item.qty
      } else if (item.category === 'Hardware') {
        categoryTotals['Pendapatan Perangkat Hardware POS'] = (categoryTotals['Pendapatan Perangkat Hardware POS'] ?? 0) + item.price * item.qty
      } else if (item.category === 'Addon & Aksesoris') {
        categoryTotals['Pendapatan Addon & Aksesoris'] = (categoryTotals['Pendapatan Addon & Aksesoris'] ?? 0) + item.price * item.qty
      }
    })
  })

  return Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount }))
})

// Beban items computed directly from master expenses
const bebanItems = computed(() => {
  const categoryTotals: Record<string, number> = {}

  filteredExpenses.value.forEach(exp => {
    const key = `Beban ${exp.category}`
    categoryTotals[key] = (categoryTotals[key] || 0) + exp.amount
  })

  return Object.entries(categoryTotals).map(([name, amount]) => ({ name, amount }))
})

const totalPendapatan = computed(() => pendapatanItems.value.reduce((sum, i) => sum + i.amount, 0))
const totalBeban = computed(() => bebanItems.value.reduce((sum, i) => sum + i.amount, 0))
const labaRugiBersih = computed(() => totalPendapatan.value - totalBeban.value)
const marginPersentase = computed(() => totalPendapatan.value > 0 ? ((labaRugiBersih.value / totalPendapatan.value) * 100).toFixed(1) : '0.0')

const handleExport = () => {
  alert('Data Laba Rugi berhasil diekspor! (Demo)')
}
</script>


<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none">

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <PieChart class="w-6 h-6 text-purple-600" />
          Laporan Laba Rugi
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Analisis pendapatan dan pengeluaran secara terperinci.</p>
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

    <!-- KPI Summary -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pendapatan</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(totalPendapatan) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>+8.3% dari bulan lalu</span>
        </div>
      </div>

      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Beban / Biaya</span>
          <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(totalBeban) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
          <TrendingDown class="w-3.5 h-3.5" />
          <span>-2.1% dari bulan lalu</span>
        </div>
      </div>

      <div class="kpi-card kpi-primary rounded-2xl p-5 shadow-md hover:shadow-lg transition-all text-white"
        :class="labaRugiBersih >= 0 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-red-700'"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold" :class="labaRugiBersih >= 0 ? 'text-emerald-200' : 'text-rose-200'">
            {{ labaRugiBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih' }}
          </span>
          <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">{{ formatCurrency(Math.abs(labaRugiBersih)) }}</h3>
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1" :class="labaRugiBersih >= 0 ? 'text-emerald-200' : 'text-rose-200'">
          <TrendingUp class="w-3.5 h-3.5" />
          <span>Margin {{ marginPersentase }}%</span>
        </div>
      </div>
    </section>

    <!-- Pendapatan & Beban Detail -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      <!-- Pendapatan -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            Rincian Pendapatan
          </h2>
          <span class="text-xs font-bold text-emerald-600">{{ formatCurrency(totalPendapatan) }}</span>
        </div>
        <div class="">
          <div v-for="item in pendapatanItems" :key="item.name" class="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
            <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(item.amount) }}</span>
          </div>
          <div class="px-5 py-3.5 flex items-center justify-between bg-emerald-50/50">
            <span class="text-sm text-slate-800 font-bold">Total Pendapatan</span>
            <span class="text-sm font-extrabold text-emerald-700">{{ formatCurrency(totalPendapatan) }}</span>
          </div>
        </div>
      </div>

      <!-- Beban -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-rose-500"></div>
            Rincian Beban / Biaya
          </h2>
          <span class="text-xs font-bold text-rose-600">{{ formatCurrency(totalBeban) }}</span>
        </div>
        <div class="">
          <div v-for="item in bebanItems" :key="item.name" class="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
            <span class="text-sm font-bold text-rose-600">{{ formatCurrency(item.amount) }}</span>
          </div>
          <div class="px-5 py-3.5 flex items-center justify-between bg-rose-50/50">
            <span class="text-sm text-slate-800 font-bold">Total Beban</span>
            <span class="text-sm font-extrabold text-rose-700">{{ formatCurrency(totalBeban) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Summary Bar -->
    <div class="rounded-2xl p-5 border-2 flex flex-col sm:flex-row items-center justify-between gap-4"
      :class="labaRugiBersih >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
          :class="labaRugiBersih >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
        >
          <TrendingUp v-if="labaRugiBersih >= 0" class="w-5 h-5" />
          <TrendingDown v-else class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold" :class="labaRugiBersih >= 0 ? 'text-emerald-800' : 'text-rose-800'">
            {{ labaRugiBersih >= 0 ? 'Bisnis Anda Menguntungkan!' : 'Bisnis Anda Merugi' }}
          </h3>
          <p class="text-xs" :class="labaRugiBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ labaRugiBersih >= 0 ? 'Pendapatan melebihi total beban operasional.' : 'Beban melebihi total pendapatan. Evaluasi pengeluaran Anda.' }}
          </p>
        </div>
      </div>
      <div class="text-center sm:text-right">
        <div class="text-xs font-semibold" :class="labaRugiBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'">
          {{ labaRugiBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih' }}
        </div>
        <div class="text-2xl font-extrabold" :class="labaRugiBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">
          {{ formatCurrency(Math.abs(labaRugiBersih)) }}
        </div>
      </div>
    </div>
  </div>
</template>

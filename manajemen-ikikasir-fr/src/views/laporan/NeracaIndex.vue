
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calculator, Download, Calendar, ChevronDown, Scale, Building, Landmark, Wallet, ArrowRight } from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'

const { masterTransactions, masterExpenses, getTrxTotalAmount } = useReportData()

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

// Calculations derived from shared dataset
const totalPendapatanKas = computed(() => {
  return filteredSales.value
    .filter(t => t.status === 'Selesai')
    .reduce((sum, t) => sum + getTrxTotalAmount(t), 0)
})

const totalPiutangPending = computed(() => {
  return filteredSales.value
    .filter(t => t.status === 'Pending')
    .reduce((sum, t) => sum + getTrxTotalAmount(t), 0)
})

const totalBebanOperasional = computed(() => {
  return filteredExpenses.value.reduce((sum, e) => sum + e.amount, 0)
})

const labaPeriodeBerjalan = computed(() => totalPendapatanKas.value - totalBebanOperasional.value)

// Dynamic Aset Lancar
const asetLancar = computed(() => [
  { name: 'Kas & Setara Kas', amount: 30000000 + (totalPendapatanKas.value - totalBebanOperasional.value) },
  { name: 'Piutang Usaha / Penjualan (Pending)', amount: totalPiutangPending.value },
  { name: 'Perlengkapan Kantor', amount: 3200000 },
])

const asetTetap = ref([
  { name: 'Peralatan Komputer & Server', amount: 35000000 },
  { name: 'Peralatan Kantor', amount: 8500000 },
  { name: 'Akumulasi Penyusutan', amount: -12500000 },
])

const totalAsetLancar = computed(() => asetLancar.value.reduce((s, i) => s + i.amount, 0))
const totalAsetTetap = computed(() => asetTetap.value.reduce((s, i) => s + i.amount, 0))
const totalAset = computed(() => totalAsetLancar.value + totalAsetTetap.value)

// Kewajiban
const kewajibanLancar = ref([
  { name: 'Utang Usaha', amount: 5000000 },
  { name: 'Pendapatan Diterima Dimuka', amount: 8500000 },
  { name: 'Utang Pajak', amount: 1200000 },
])

const kewajibanJangkaPanjang = ref([
  { name: 'Utang Bank (Kredit Usaha)', amount: 15000000 },
])

const totalKewajibanLancar = computed(() => kewajibanLancar.value.reduce((s, i) => s + i.amount, 0))
const totalKewajibanJP = computed(() => kewajibanJangkaPanjang.value.reduce((s, i) => s + i.amount, 0))
const totalKewajiban = computed(() => totalKewajibanLancar.value + totalKewajibanJP.value)

// Ekuitas
const ekuitasItems = computed(() => [
  { name: 'Modal Disetor', amount: 30000000 },
  { name: 'Laba Ditahan', amount: 5200000 },
  { name: 'Laba Periode Berjalan', amount: labaPeriodeBerjalan.value },
])

const totalEkuitas = computed(() => totalAset.value - totalKewajiban.value)

const isBalanced = computed(() => {
  const kewajibanPlusEkuitas = totalKewajiban.value + totalEkuitas.value
  return Math.abs(totalAset.value - kewajibanPlusEkuitas) < 1
})

const handleExport = () => {
  alert('Data Neraca berhasil diekspor! (Demo)')
}
</script>


<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none">

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Calculator class="w-6 h-6 text-amber-600" />
          Neraca (Balance Sheet)
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Ringkasan posisi keuangan: Aset, Kewajiban, dan Ekuitas.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
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

    <!-- Balance Equation Summary -->
    <section class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Aset</div>
          <div class="text-lg sm:text-xl font-extrabold text-blue-700">{{ formatCurrency(totalAset) }}</div>
        </div>
        <div class="hidden sm:flex items-center justify-center text-slate-300">
          <span class="text-xl font-bold">=</span>
        </div>
        <div class="sm:hidden text-xs text-slate-300 font-bold">=</div>
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Kewajiban</div>
          <div class="text-lg sm:text-xl font-extrabold text-rose-700">{{ formatCurrency(totalKewajiban) }}</div>
        </div>
        <div class="hidden sm:flex items-center justify-center text-slate-300">
          <span class="text-xl font-bold">+</span>
        </div>
        <div class="sm:hidden text-xs text-slate-300 font-bold">+</div>
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Ekuitas</div>
          <div class="text-lg sm:text-xl font-extrabold text-emerald-700">{{ formatCurrency(totalEkuitas) }}</div>
        </div>
      </div>
      <div class="mt-4 pt-3 text-center">
        <span 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
          :class="isBalanced ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
        >
          <Scale class="w-3.5 h-3.5" />
          {{ isBalanced ? 'Neraca Seimbang (Balance)' : 'Neraca Tidak Seimbang' }}
        </span>
      </div>
    </section>

    <!-- Detail Tables -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      <!-- ASET (Kiri) -->
      <div class="space-y-4">
        <!-- Aset Lancar -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              Aset Lancar
            </h2>
            <span class="text-xs font-bold text-blue-600">{{ formatCurrency(totalAsetLancar) }}</span>
          </div>
          <div class="">
            <div v-for="item in asetLancar" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Aset Tetap -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
              Aset Tetap
            </h2>
            <span class="text-xs font-bold text-indigo-600">{{ formatCurrency(totalAsetTetap) }}</span>
          </div>
          <div class="">
            <div v-for="item in asetTetap" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold" :class="item.amount < 0 ? 'text-rose-600' : 'text-slate-800'">
                {{ item.amount < 0 ? '(' + formatCurrency(Math.abs(item.amount)) + ')' : formatCurrency(item.amount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Total Aset -->
        <div class="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 flex items-center justify-between">
          <span class="text-sm font-bold text-blue-800 flex items-center gap-2">
            <Building class="w-4 h-4" />
            TOTAL ASET
          </span>
          <span class="text-lg font-extrabold text-blue-700">{{ formatCurrency(totalAset) }}</span>
        </div>
      </div>

      <!-- KEWAJIBAN + EKUITAS (Kanan) -->
      <div class="space-y-4">
        <!-- Kewajiban Lancar -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-rose-500"></div>
              Kewajiban Lancar
            </h2>
            <span class="text-xs font-bold text-rose-600">{{ formatCurrency(totalKewajibanLancar) }}</span>
          </div>
          <div class="">
            <div v-for="item in kewajibanLancar" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Kewajiban Jangka Panjang -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              Kewajiban Jangka Panjang
            </h2>
            <span class="text-xs font-bold text-orange-600">{{ formatCurrency(totalKewajibanJP) }}</span>
          </div>
          <div class="">
            <div v-for="item in kewajibanJangkaPanjang" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Ekuitas -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              Ekuitas Pemilik
            </h2>
            <span class="text-xs font-bold text-emerald-600">{{ formatCurrency(totalEkuitas) }}</span>
          </div>
          <div class="">
            <div v-for="item in ekuitasItems" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold text-emerald-700">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Total Kewajiban + Ekuitas -->
        <div class="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 flex items-center justify-between">
          <span class="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <Landmark class="w-4 h-4" />
            TOTAL KEWAJIBAN + EKUITAS
          </span>
          <span class="text-lg font-extrabold text-emerald-700">{{ formatCurrency(totalKewajiban + totalEkuitas) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Calculator, Download, Calendar, ChevronDown, Scale, Building, Landmark, Wallet, ArrowRight, RefreshCw, AlertCircle } from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'
import { useNeraca } from '../../composables/useNeraca'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

const { startDate, endDate, periodeLabel, formatCurrency, setPreset, exportCsv } = useReportData()
const { report, isLoading, error, fetchNeraca } = useNeraca()

const asetLancar = computed(() => report.value?.asetLancar ?? [])
const asetTetap = computed(() => report.value?.asetTetap ?? [])
const kewajibanLancar = computed(() => report.value?.kewajibanLancar ?? [])
const kewajibanJangkaPanjang = computed(() => report.value?.kewajibanJangkaPanjang ?? [])
const ekuitasItems = computed(() => report.value?.ekuitas ?? [])

const totalAsetLancar = computed(() => report.value?.summary.totalAsetLancar ?? 0)
const totalAsetTetap = computed(() => report.value?.summary.totalAsetTetap ?? 0)
const totalAset = computed(() => report.value?.summary.totalAset ?? 0)
const totalKewajibanLancar = computed(() => report.value?.summary.totalKewajibanLancar ?? 0)
const totalKewajibanJP = computed(() => report.value?.summary.totalKewajibanJangkaPanjang ?? 0)
const totalKewajiban = computed(() => report.value?.summary.totalKewajiban ?? 0)
const totalEkuitas = computed(() => report.value?.summary.totalEkuitas ?? 0)
const labaPeriodeBerjalan = computed(() => report.value?.summary.labaPeriodeBerjalan ?? 0)
const isBalanced = computed(() => report.value?.summary.isBalanced ?? true)

const muatNeraca = async () => {
  await fetchNeraca({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  })
}

// Muat ulang neraca ketika rentang tanggal berubah
watch([startDate, endDate], () => {
  muatNeraca()
})

onMounted(() => {
  muatNeraca()
})

const handleExport = () => {
  const rows: (string | number)[][] = [
    ['LAPORAN NERACA'],
    ['Periode', periodeLabel.value],
    [],
    ['ASET LANCAR', 'Nominal'],
    ...asetLancar.value.map((item) => [item.name, item.amount]),
    ['Total Aset Lancar', totalAsetLancar.value],
    [],
    ['ASET TETAP', 'Nominal'],
    ...asetTetap.value.map((item) => [item.name, item.amount]),
    ['Total Aset Tetap', totalAsetTetap.value],
    [],
    ['TOTAL ASET', totalAset.value],
    [],
    ['KEWAJIBAN LANCAR', 'Nominal'],
    ...kewajibanLancar.value.map((item) => [item.name, item.amount]),
    ['Total Kewajiban Lancar', totalKewajibanLancar.value],
    [],
    ['KEWAJIBAN JANGKA PANJANG', 'Nominal'],
    ...kewajibanJangkaPanjang.value.map((item) => [item.name, item.amount]),
    ['Total Kewajiban Jangka Panjang', totalKewajibanJP.value],
    [],
    ['EKUITAS', 'Nominal'],
    ...ekuitasItems.value.map((item) => [item.name, item.amount]),
    ['Total Ekuitas', totalEkuitas.value],
    [],
    ['TOTAL KEWAJIBAN + EKUITAS', totalKewajiban.value + totalEkuitas.value],
  ]

  const berhasil = exportCsv(`neraca-${new Date().toISOString().slice(0, 10)}`, rows)
  if (!berhasil) {
    window.alert('Tidak ada data untuk diekspor.')
  }
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
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Ringkasan posisi keuangan: Aset, Kewajiban, dan Ekuitas.
          <span class="text-slate-400">Periode: {{ periodeLabel }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          placeholder="Filter Rentang Tanggal"
        />

        <button
          @click="muatNeraca"
          :disabled="isLoading"
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Muat Ulang</span>
        </button>

        <button
          @click="handleExport"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Download class="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>
    </header>

    <!-- Preset Periode -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 px-4 py-3 flex items-center gap-2 flex-wrap">
      <span class="text-[11px] font-medium text-slate-400 shrink-0">Preset Periode:</span>
      <button @click="setPreset('semua')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Semua</button>
      <button @click="setPreset('hari-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Hari Ini</button>
      <button @click="setPreset('7-hari')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">7 Hari Terakhir</button>
      <button @click="setPreset('bulan-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Bulan Ini</button>
    </section>

    <!-- Error State -->
    <div v-if="error" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

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
            <div v-if="!isLoading && asetLancar.length === 0" class="px-5 py-6 text-center text-xs text-slate-400">
              Belum ada data aset lancar.
            </div>
            <div v-if="isLoading" class="px-5 py-6 text-center text-xs text-slate-400">
              Memuat data laporan...
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
              <span class="text-sm font-bold" :class="item.amount < 0 ? 'text-rose-600' : 'text-emerald-700'">
                {{ formatCurrency(item.amount) }}
              </span>
            </div>
            <div class="px-5 py-3 flex items-center justify-between bg-emerald-50/40 border-t border-emerald-100">
              <span class="text-[11px] text-slate-500 font-medium">Laba Periode Berjalan</span>
              <span class="text-xs font-bold" :class="labaPeriodeBerjalan >= 0 ? 'text-emerald-700' : 'text-rose-600'">
                {{ formatCurrency(labaPeriodeBerjalan) }}
              </span>
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

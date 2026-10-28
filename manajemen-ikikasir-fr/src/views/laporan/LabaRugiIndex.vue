<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  PieChart,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'
import { useLabaRugi } from '../../composables/useLabaRugi'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

const { startDate, endDate, periodeLabel, formatCurrency, setPreset, exportCsv } = useReportData()
const { report, isLoading, error, fetchLabaRugi } = useLabaRugi()

const pendapatanItems = computed(() => report.value?.pendapatan ?? [])
const bebanItems = computed(() => report.value?.beban ?? [])

const totalPendapatan = computed(() => report.value?.summary.totalPendapatan ?? 0)
const totalBeban = computed(() => report.value?.summary.totalBeban ?? 0)
const labaRugiBersih = computed(() => report.value?.summary.labaBersih ?? 0)
const marginPersentase = computed(() => report.value?.summary.marginPersentase ?? 0)
const pertumbuhanPendapatan = computed(() => report.value?.summary.pertumbuhanPendapatan ?? 0)
const pertumbuhanBeban = computed(() => report.value?.summary.pertumbuhanBeban ?? 0)

const formatPertumbuhan = (nilai: number): string => {
  if (nilai > 0) return `+${nilai}% dari periode sebelumnya`
  if (nilai < 0) return `${nilai}% dari periode sebelumnya`
  return 'Tidak ada pembanding periode sebelumnya'
}

const muatLaporan = async () => {
  await fetchLabaRugi({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  })
}

// Muat ulang laporan ketika rentang tanggal berubah
watch([startDate, endDate], () => {
  muatLaporan()
})

onMounted(() => {
  muatLaporan()
})

const handleExport = () => {
  const rows: (string | number)[][] = [
    ['LAPORAN LABA RUGI'],
    ['Periode', periodeLabel.value],
    [],
    ['RINCIAN PENDAPATAN'],
    ['Kategori', 'Nominal', 'Jumlah Transaksi'],
    ...pendapatanItems.value.map((item) => [item.name, item.amount, item.jumlahTransaksi ?? 0]),
    ['Total Pendapatan', totalPendapatan.value, report.value?.summary.jumlahTransaksiPendapatan ?? 0],
    [],
    ['RINCIAN BEBAN'],
    ['Kategori', 'Nominal', 'Jumlah Transaksi'],
    ...bebanItems.value.map((item) => [item.name, item.amount, item.jumlahTransaksi ?? 0]),
    ['Total Beban', totalBeban.value, report.value?.summary.jumlahTransaksiBeban ?? 0],
    [],
    ['Laba Bersih', labaRugiBersih.value, `Margin ${marginPersentase}%`],
  ]

  const berhasil = exportCsv(`laba-rugi-${new Date().toISOString().slice(0, 10)}`, rows)
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
          <PieChart class="w-6 h-6 text-purple-600" />
          Laporan Laba Rugi
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Analisis pendapatan dan pengeluaran secara terperinci.
          <span class="text-slate-400">Periode: {{ periodeLabel }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Range Date Picker -->
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          placeholder="Filter Rentang Tanggal"
        />

        <button
          @click="muatLaporan"
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
      <button @click="setPreset('semua')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer">Semua</button>
      <button @click="setPreset('hari-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer">Hari Ini</button>
      <button @click="setPreset('7-hari')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer">7 Hari Terakhir</button>
      <button @click="setPreset('bulan-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors cursor-pointer">Bulan Ini</button>
    </section>

    <!-- Error State -->
    <div v-if="error" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

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
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1" :class="pertumbuhanPendapatan >= 0 ? 'text-emerald-600' : 'text-rose-600'">
          <TrendingUp v-if="pertumbuhanPendapatan >= 0" class="w-3.5 h-3.5" />
          <TrendingDown v-else class="w-3.5 h-3.5" />
          <span>{{ formatPertumbuhan(pertumbuhanPendapatan) }}</span>
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
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1" :class="pertumbuhanBeban <= 0 ? 'text-emerald-600' : 'text-rose-600'">
          <TrendingDown v-if="pertumbuhanBeban <= 0" class="w-3.5 h-3.5" />
          <TrendingUp v-else class="w-3.5 h-3.5" />
          <span>{{ formatPertumbuhan(pertumbuhanBeban) }}</span>
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
        <div>
          <div v-for="item in pendapatanItems" :key="item.name" class="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-[11px] text-slate-400 ml-1.5">{{ item.jumlahTransaksi }} transaksi</span>
            </div>
            <span class="text-sm font-bold text-emerald-600">{{ formatCurrency(item.amount) }}</span>
          </div>
          <div v-if="!isLoading && pendapatanItems.length === 0" class="px-5 py-6 text-center text-xs text-slate-400">
            Tidak ada transaksi pendapatan pada rentang tanggal ini.
          </div>
          <div v-if="isLoading" class="px-5 py-6 text-center text-xs text-slate-400">
            Memuat data laporan...
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
        <div>
          <div v-for="item in bebanItems" :key="item.name" class="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-[11px] text-slate-400 ml-1.5">{{ item.jumlahTransaksi }} transaksi</span>
            </div>
            <span class="text-sm font-bold text-rose-600">{{ formatCurrency(item.amount) }}</span>
          </div>
          <div v-if="!isLoading && bebanItems.length === 0" class="px-5 py-6 text-center text-xs text-slate-400">
            Tidak ada pencatatan beban pada rentang tanggal ini.
          </div>
          <div v-if="isLoading" class="px-5 py-6 text-center text-xs text-slate-400">
            Memuat data laporan...
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
        <div class="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
          <Calendar class="w-3 h-3" />
          <span>{{ periodeLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

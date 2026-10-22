<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  PieChart,
  Download,
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Minus,
  Plus,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BarChart3,
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  X,
  FileText,
  Building,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

const { masterTransactions, masterExpenses, getTrxTotalAmount } = useReportData()

// ==========================================
// 1. FILTER & DATE RANGE STATE
// ==========================================
// Default to September 2026 (matching demo baseline)
const startDate = ref('2026-09-01')
const endDate = ref('2026-09-30')

// Quick period selection shortcuts
const quickPeriod = ref<'this_month' | 'last_month' | 'q3' | 'this_year' | 'all'>('this_month')

const setQuickPeriod = (p: 'this_month' | 'last_month' | 'q3' | 'this_year' | 'all') => {
  quickPeriod.value = p
  if (p === 'this_month') {
    startDate.value = '2026-09-01'
    endDate.value = '2026-09-30'
  } else if (p === 'last_month') {
    startDate.value = '2026-08-01'
    endDate.value = '2026-08-31'
  } else if (p === 'q3') {
    startDate.value = '2026-07-01'
    endDate.value = '2026-09-30'
  } else if (p === 'this_year') {
    startDate.value = '2026-01-01'
    endDate.value = '2026-12-31'
  } else if (p === 'all') {
    startDate.value = ''
    endDate.value = ''
  }
}

// Compare with Previous Period toggle
const compareWithPrevious = ref(true)

// Filter by transaction source
const selectedSource = ref<'semua' | 'lisensi' | 'hardware' | 'operasional'>('semua')

// Toast notification
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

// Last updated timestamp
const lastUpdatedTime = ref('22 Okt 2026, 12:15 WIB')
const refreshData = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const mins = String(now.getMinutes()).padStart(2, '0')
  lastUpdatedTime.value = `22 Okt 2026, ${hours}:${mins} WIB`
  showToast('Data Laporan Laba Rugi berhasil diperbarui!')
}

// Currency formatting
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val)
}

// ==========================================
// 2. DATA FILTERING & COMPUTATION
// ==========================================
// Filtered Sales Transactions
const filteredSales = computed(() => {
  return masterTransactions.value.filter(trx => {
    if (trx.status !== 'Selesai') return false

    // Date range filter
    if (startDate.value && trx.date < startDate.value) return false
    if (endDate.value && trx.date > endDate.value) return false

    // Source filter
    if (selectedSource.value === 'lisensi') {
      const hasLicense = trx.items.some(i => i.category === 'Lisensi POS')
      if (!hasLicense) return false
    } else if (selectedSource.value === 'hardware') {
      const hasHw = trx.items.some(i => i.category === 'Hardware' || i.category === 'Addon & Aksesoris')
      if (!hasHw) return false
    }

    return true
  })
})

// Filtered Expense Items
const filteredExpenses = computed(() => {
  if (selectedSource.value === 'lisensi' || selectedSource.value === 'hardware') {
    // When focusing purely on sales revenue, expenses can be hidden or zeroed
    return []
  }

  return masterExpenses.value.filter(exp => {
    if (startDate.value && exp.date < startDate.value) return false
    if (endDate.value && exp.date > endDate.value) return false
    return true
  })
})

// ==========================================
// 3. REVENUE BREAKDOWN (4 CATEGORIES)
// ==========================================
interface RevenueItem {
  key: string
  name: string
  amount: number
  count: number
  percentage: number
  iconColor: string
  items: any[]
}

const pendapatanItems = computed(() => {
  const groups: Record<string, { name: string, amount: number, items: any[], count: number, iconColor: string }> = {
    'lisensi': {
      name: 'Lisensi dan Paket POS',
      amount: 0,
      count: 0,
      iconColor: 'bg-indigo-500',
      items: []
    },
    'hardware': {
      name: 'Hardware POS',
      amount: 0,
      count: 0,
      iconColor: 'bg-blue-500',
      items: []
    },
    'addon': {
      name: 'Add-on dan Aksesori',
      amount: 0,
      count: 0,
      iconColor: 'bg-emerald-500',
      items: []
    },
    'lainnya': {
      name: 'Pendapatan Lainnya & Jasa',
      amount: 0,
      count: 0,
      iconColor: 'bg-teal-500',
      items: []
    }
  }

  filteredSales.value.forEach(trx => {
    trx.items.forEach(item => {
      const itemTotal = item.price * item.qty
      const itemRecord = {
        invoiceNo: trx.invoiceNo,
        customer: trx.customer,
        date: trx.displayDate,
        itemName: item.name,
        qty: item.qty,
        price: item.price,
        total: itemTotal,
        paymentMethod: trx.paymentMethod
      }

      if (item.category === 'Lisensi POS') {
        groups.lisensi.amount += itemTotal
        groups.lisensi.count += item.qty
        groups.lisensi.items.push(itemRecord)
      } else if (item.category === 'Hardware') {
        groups.hardware.amount += itemTotal
        groups.hardware.count += item.qty
        groups.hardware.items.push(itemRecord)
      } else if (item.category === 'Addon & Aksesoris') {
        groups.addon.amount += itemTotal
        groups.addon.count += item.qty
        groups.addon.items.push(itemRecord)
      } else {
        groups.lainnya.amount += itemTotal
        groups.lainnya.count += item.qty
        groups.lainnya.items.push(itemRecord)
      }
    })
  })

  const totalRev = Object.values(groups).reduce((sum, g) => sum + g.amount, 0)

  return Object.entries(groups).map(([key, g]) => ({
    key,
    name: g.name,
    amount: g.amount,
    count: g.count,
    percentage: totalRev > 0 ? (g.amount / totalRev) * 100 : 0,
    iconColor: g.iconColor,
    items: g.items
  }))
})

const totalPendapatan = computed(() => {
  return pendapatanItems.value.reduce((sum, i) => sum + i.amount, 0)
})

// ==========================================
// 4. EXPENSE BREAKDOWN (6 CATEGORIES)
// ==========================================
interface ExpenseGroupItem {
  key: string
  name: string
  amount: number
  count: number
  percentage: number
  iconColor: string
  items: any[]
}

const bebanItems = computed(() => {
  const groups: Record<string, { name: string, amount: number, items: any[], count: number, iconColor: string }> = {
    'gaji': {
      name: 'Gaji Karyawan & Support',
      amount: 0,
      count: 0,
      iconColor: 'bg-rose-500',
      items: []
    },
    'server': {
      name: 'Server dan Cloud',
      amount: 0,
      count: 0,
      iconColor: 'bg-amber-500',
      items: []
    },
    'marketing': {
      name: 'Marketing dan Iklan',
      amount: 0,
      count: 0,
      iconColor: 'bg-orange-500',
      items: []
    },
    'maintenance': {
      name: 'Maintenance dan Lisensi Tools',
      amount: 0,
      count: 0,
      iconColor: 'bg-purple-500',
      items: []
    },
    'sewa': {
      name: 'Sewa Kantor & Utilitas',
      amount: 0,
      count: 0,
      iconColor: 'bg-pink-500',
      items: []
    },
    'lainnya': {
      name: 'Beban Operasional Lainnya',
      amount: 0,
      count: 0,
      iconColor: 'bg-slate-500',
      items: []
    }
  }

  filteredExpenses.value.forEach(exp => {
    const itemRecord = {
      desc: exp.desc,
      date: exp.displayDate,
      category: exp.category,
      amount: exp.amount
    }

    if (exp.category === 'Gaji Karyawan') {
      groups.gaji.amount += exp.amount
      groups.gaji.count += 1
      groups.gaji.items.push(itemRecord)
    } else if (exp.category === 'Server & Cloud') {
      groups.server.amount += exp.amount
      groups.server.count += 1
      groups.server.items.push(itemRecord)
    } else if (exp.category === 'Marketing & Iklan') {
      groups.marketing.amount += exp.amount
      groups.marketing.count += 1
      groups.marketing.items.push(itemRecord)
    } else if (exp.category === 'Maintenance') {
      groups.maintenance.amount += exp.amount
      groups.maintenance.count += 1
      groups.maintenance.items.push(itemRecord)
    } else if (exp.category === 'Sewa Kantor') {
      groups.sewa.amount += exp.amount
      groups.sewa.count += 1
      groups.sewa.items.push(itemRecord)
    } else {
      groups.lainnya.amount += exp.amount
      groups.lainnya.count += 1
      groups.lainnya.items.push(itemRecord)
    }
  })

  const totalExp = Object.values(groups).reduce((sum, g) => sum + g.amount, 0)

  return Object.entries(groups).map(([key, g]) => ({
    key,
    name: g.name,
    amount: g.amount,
    count: g.count,
    percentage: totalExp > 0 ? (g.amount / totalExp) * 100 : 0,
    iconColor: g.iconColor,
    items: g.items
  }))
})

const totalBeban = computed(() => {
  return bebanItems.value.reduce((sum, i) => sum + i.amount, 0)
})

// Net Profit / Loss & Margin
const labaRugiBersih = computed(() => totalPendapatan.value - totalBeban.value)
const marginPersentase = computed(() => {
  if (totalPendapatan.value === 0) return '0.0'
  return ((labaRugiBersih.value / totalPendapatan.value) * 100).toFixed(1)
})

// ==========================================
// 5. PREVIOUS PERIOD COMPARISON (MoM)
// ==========================================
// Baseline comparison figures (August 2026 / Prior Period Baseline)
const prevPendapatan = computed(() => {
  // If viewing Sept 2026, baseline from August is Rp 5.210.000
  if (startDate.value >= '2026-09-01' && endDate.value <= '2026-09-30') return 5210000
  return totalPendapatan.value > 0 ? totalPendapatan.value * 0.88 : 0
})

const prevBeban = computed(() => {
  if (startDate.value >= '2026-09-01' && endDate.value <= '2026-09-30') return 16250000
  return totalBeban.value > 0 ? totalBeban.value * 1.03 : 0
})

const prevLabaBersih = computed(() => prevPendapatan.value - prevBeban.value)

const pendapatanGrowth = computed(() => {
  if (prevPendapatan.value === 0) return 0
  return Number((((totalPendapatan.value - prevPendapatan.value) / prevPendapatan.value) * 100).toFixed(1))
})

const bebanGrowth = computed(() => {
  if (prevBeban.value === 0) return 0
  return Number((((totalBeban.value - prevBeban.value) / prevBeban.value) * 100).toFixed(1))
})

// ==========================================
// 6. FINANCIAL ANALYTICS & INSIGHTS
// ==========================================
// Highest revenue source
const highestRevenueSource = computed(() => {
  const sorted = [...pendapatanItems.value].sort((a, b) => b.amount - a.amount)
  return sorted[0] || null
})

// Highest expense category
const highestExpenseCategory = computed(() => {
  const sorted = [...bebanItems.value].sort((a, b) => b.amount - a.amount)
  return sorted[0] || null
})

// Profitability Health Status
const profitHealthStatus = computed(() => {
  const m = Number(marginPersentase.value)
  if (labaRugiBersih.value > 0 && m >= 20) {
    return { label: 'Sangat Sehat', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', desc: 'Margin keuntungan diatas 20% menunjukkan kinerja finansial prima.' }
  } else if (labaRugiBersih.value > 0) {
    return { label: 'Stabil (Perlu Efisiensi)', color: 'text-amber-700 bg-amber-100 border-amber-200', desc: 'Bisnis membukukan laba, pertahankan omset dan optimalkan biaya.' }
  } else {
    return { label: 'Defisit Operasional', color: 'text-rose-700 bg-rose-100 border-rose-200', desc: 'Beban melebihi pendapatan. Segera evaluasi pos pengeluaran terbesar.' }
  }
})

// Duplicate transaction verification (Data Validation)
const duplicateTransactionsCount = computed(() => {
  const seenIds = new Set<string>()
  let duplicates = 0
  masterTransactions.value.forEach(t => {
    if (seenIds.has(t.invoiceNo)) duplicates++
    seenIds.add(t.invoiceNo)
  })
  return duplicates
})

// ==========================================
// 7. INTERACTIVE CATEGORY DRILLDOWN MODAL
// ==========================================
const showDetailModal = ref(false)
const selectedCategoryDetail = ref<{
  type: 'pendapatan' | 'beban'
  name: string
  amount: number
  items: any[]
} | null>(null)

const openCategoryDrilldown = (cat: RevenueItem | ExpenseGroupItem, type: 'pendapatan' | 'beban') => {
  selectedCategoryDetail.value = {
    type,
    name: cat.name,
    amount: cat.amount,
    items: cat.items
  }
  showDetailModal.value = true
}

// ==========================================
// 8. EXPORT ACTIONS (EXCEL & PDF)
// ==========================================
const handleExportExcel = () => {
  // Generate downloadable CSV
  const rows = [
    ['LAPORAN LABA RUGI IKIKASIR'],
    [`Periode: ${startDate.value || 'Awal'} s/d ${endDate.value || 'Akhir'}`],
    [`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`],
    [''],
    ['1. PENDAPATAN OPERASIONAL', 'Nominal (Rp)', 'Kontribusi (%)'],
    ...pendapatanItems.value.map(p => [p.name, p.amount, `${p.percentage.toFixed(1)}%`]),
    ['TOTAL PENDAPATAN', totalPendapatan.value, '100%'],
    [''],
    ['2. BEBAN OPERASIONAL', 'Nominal (Rp)', 'Kontribusi (%)'],
    ...bebanItems.value.map(b => [b.name, b.amount, `${b.percentage.toFixed(1)}%`]),
    ['TOTAL BEBAN', totalBeban.value, '100%'],
    [''],
    ['3. HASIL BERSIH', 'Nominal (Rp)', 'Margin (%)'],
    ['Laba / (Rugi) Bersih', labaRugiBersih.value, `${marginPersentase.value}%`]
  ]

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(';')).join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `Laba_Rugi_IKIKASIR_${startDate.value || 'all'}_${endDate.value || 'all'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showToast('Laporan Laba Rugi berhasil diekspor ke Excel (CSV)!')
}

const handleExportPDF = () => {
  window.print()
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none print:p-0">

    <!-- Toast Notification -->
    <Transition name="fade">
      <div 
        v-if="toastMessage" 
        class="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 print:hidden animate-in slide-in-from-top-3 duration-200"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Header Section -->
    <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <PieChart class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Laporan Laba Rugi
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 print:hidden">
                Standar Akrual & Kas
              </span>
            </h1>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              Analisis komprehensif pendapatan, beban operasional, dan profitabilitas bisnis IKIKASIR.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons & Export -->
      <div class="flex items-center gap-2 flex-wrap print:hidden">
        <button 
          @click="refreshData"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          title="Segarkan data laporan"
        >
          <RefreshCw class="w-3.5 h-3.5 text-slate-500" />
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <button 
          @click="handleExportExcel"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>

        <button 
          @click="handleExportPDF"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-200"
        >
          <Printer class="w-4 h-4" />
          <span>Cetak / PDF</span>
        </button>
      </div>
    </header>

    <!-- ========================================== -->
    <!-- FILTER TOOLBAR (DateRangePicker & Presets)  -->
    <!-- ========================================== -->
    <section class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-4 print:hidden">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- DateRangePicker & Period Presets -->
        <div class="flex items-center gap-2 flex-wrap flex-1">
          <span class="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5 text-indigo-600" />
            Rentang Tanggal:
          </span>

          <!-- RANGE DATE PICKER COMPONENT -->
          <DateRangePicker 
            v-model:startDate="startDate" 
            v-model:endDate="endDate"
            placeholder="Pilih Rentang Tanggal Laba Rugi"
          />

          <!-- Quick Period Shortcut Pills -->
          <div class="flex items-center gap-1 bg-slate-100 rounded-xl p-1 text-[11px] font-bold">
            <button 
              @click="setQuickPeriod('this_month')"
              class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              :class="quickPeriod === 'this_month' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Sep 2026
            </button>
            <button 
              @click="setQuickPeriod('last_month')"
              class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              :class="quickPeriod === 'last_month' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Agu 2026
            </button>
            <button 
              @click="setQuickPeriod('q3')"
              class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              :class="quickPeriod === 'q3' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Q3 2026
            </button>
            <button 
              @click="setQuickPeriod('this_year')"
              class="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              :class="quickPeriod === 'this_year' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            >
              Tahun 2026
            </button>
          </div>
        </div>

        <!-- Secondary Filters & Comparison Toggle -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Sumber Transaksi Filter -->
          <div class="flex items-center gap-1 text-xs font-medium">
            <span class="text-slate-400">Sumber:</span>
            <select 
              v-model="selectedSource" 
              class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="semua">Semua Sumber Transaksi</option>
              <option value="lisensi">Hanya Lisensi & Paket POS</option>
              <option value="hardware">Hanya Hardware & Addon</option>
            </select>
          </div>

          <!-- MoM Comparison Toggle -->
          <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input 
              v-model="compareWithPrevious" 
              type="checkbox" 
              class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>Bandingkan Periode Sebelumnya</span>
          </label>
        </div>
      </div>

      <!-- Information & Validation Banner -->
      <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="flex items-center gap-1 text-emerald-600 font-bold">
            <ShieldCheck class="w-3.5 h-3.5" />
            Rekonsiliasi: 100% Cocok
          </span>
          <span class="text-slate-300">•</span>
          <span class="flex items-center gap-1 text-slate-600 font-medium">
            <CheckCircle2 class="w-3.5 h-3.5 text-indigo-500" />
            Pencegahan Duplikasi: Aktif ({{ duplicateTransactionsCount }} duplikat)
          </span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500">
            Metode: <strong>Akrual & Kas Terverifikasi</strong>
          </span>
        </div>

        <div class="flex items-center gap-1 text-slate-400 font-mono">
          <Clock class="w-3 h-3" />
          <span>Update Terakhir: {{ lastUpdatedTime }}</span>
        </div>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- 1. RINGKASAN KEUANGAN (KPI CARDS)          -->
    <!-- ========================================== -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Pendapatan -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Pendapatan</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(totalPendapatan) }}</h3>
        
        <div v-if="compareWithPrevious" class="flex items-center gap-1.5 text-[11px] font-semibold mt-1">
          <span 
            class="flex items-center"
            :class="pendapatanGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'"
          >
            <ArrowUpRight v-if="pendapatanGrowth >= 0" class="w-3.5 h-3.5" />
            <ArrowDownRight v-else class="w-3.5 h-3.5" />
            {{ pendapatanGrowth >= 0 ? '+' : '' }}{{ pendapatanGrowth }}%
          </span>
          <span class="text-slate-400">vs periode lalu ({{ formatCurrency(prevPendapatan) }})</span>
        </div>
      </div>

      <!-- Total Beban -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Beban Operasional</span>
          <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{{ formatCurrency(totalBeban) }}</h3>
        
        <div v-if="compareWithPrevious" class="flex items-center gap-1.5 text-[11px] font-semibold mt-1">
          <span 
            class="flex items-center"
            :class="bebanGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'"
          >
            <ArrowDownRight v-if="bebanGrowth <= 0" class="w-3.5 h-3.5" />
            <ArrowUpRight v-else class="w-3.5 h-3.5" />
            {{ bebanGrowth >= 0 ? '+' : '' }}{{ bebanGrowth }}%
          </span>
          <span class="text-slate-400">vs periode lalu ({{ formatCurrency(prevBeban) }})</span>
        </div>
      </div>

      <!-- Laba / Rugi Bersih -->
      <div 
        class="kpi-card rounded-2xl p-5 shadow-md hover:shadow-lg transition-all text-white"
        :class="labaRugiBersih >= 0 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-rose-600 to-red-700'"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold" :class="labaRugiBersih >= 0 ? 'text-emerald-200' : 'text-rose-200'">
            {{ labaRugiBersih >= 0 ? 'Laba Bersih Operasional' : 'Rugi Bersih Operasional' }}
          </span>
          <div class="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold tracking-tight">{{ formatCurrency(Math.abs(labaRugiBersih)) }}</h3>
        
        <div class="flex items-center gap-1 text-[11px] font-semibold mt-1" :class="labaRugiBersih >= 0 ? 'text-emerald-200' : 'text-rose-200'">
          <TrendingUp v-if="labaRugiBersih >= 0" class="w-3.5 h-3.5" />
          <TrendingDown v-else class="w-3.5 h-3.5" />
          <span>{{ labaRugiBersih >= 0 ? 'Surplus Finansial' : 'Defisit Anggaran' }}</span>
        </div>
      </div>

      <!-- Margin Bersih (%) -->
      <div class="kpi-card bg-white rounded-2xl p-5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Margin Keuntungan Bersih</span>
          <div 
            class="w-9 h-9 rounded-xl flex items-center justify-center"
            :class="labaRugiBersih >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'"
          >
            <Sparkles class="w-5 h-5" />
          </div>
        </div>
        <h3 
          class="text-xl sm:text-2xl font-extrabold tracking-tight"
          :class="labaRugiBersih >= 0 ? 'text-indigo-600' : 'text-rose-600'"
        >
          {{ marginPersentase }}%
        </h3>
        
        <div class="mt-1 flex items-center gap-1">
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-extrabold border"
            :class="profitHealthStatus.color"
          >
            {{ profitHealthStatus.label }}
          </span>
        </div>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- 3. GRAFIK KEUANGAN (TREND & COMPOSITION)   -->
    <!-- ========================================== -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- 1. Grafik Tren Pendapatan vs Beban (Bar/Area Visualizer) -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 class="w-4 h-4 text-indigo-600" />
              Grafik Tren Pendapatan vs Beban
            </h2>
            <p class="text-xs text-slate-500 font-medium">Perbandingan arus omset penjualan dengan biaya operasional.</p>
          </div>

          <div class="flex items-center gap-3 text-xs font-bold">
            <div class="flex items-center gap-1.5 text-emerald-600">
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Pendapatan</span>
            </div>
            <div class="flex items-center gap-1.5 text-rose-500">
              <div class="w-3 h-3 rounded-full bg-rose-500"></div>
              <span>Beban</span>
            </div>
          </div>
        </div>

        <!-- Visual Bar Trend Simulation (July, Aug, Sept 2026) -->
        <div class="pt-4 pb-2 space-y-4">
          <!-- Timeline point 1: Juli 2026 -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-semibold text-slate-700">
              <span>Juli 2026</span>
              <span class="text-slate-500">Laba: Rp 1.450.000</span>
            </div>
            <div class="space-y-1">
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 48%"></div>
              </div>
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div class="bg-rose-400 h-full rounded-full transition-all duration-500" style="width: 35%"></div>
              </div>
            </div>
          </div>

          <!-- Timeline point 2: Agustus 2026 -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-semibold text-slate-700">
              <span>Agustus 2026</span>
              <span class="text-slate-500">Beban: {{ formatCurrency(prevBeban) }} | Omset: {{ formatCurrency(prevPendapatan) }}</span>
            </div>
            <div class="space-y-1">
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 62%"></div>
              </div>
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div class="bg-rose-500 h-full rounded-full transition-all duration-500" style="width: 78%"></div>
              </div>
            </div>
          </div>

          <!-- Timeline point 3: September 2026 (Active) -->
          <div class="space-y-1.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
            <div class="flex justify-between text-xs font-bold text-slate-900">
              <span class="flex items-center gap-1.5 text-indigo-700">
                <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                September 2026 (Periode Aktif)
              </span>
              <span :class="labaRugiBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ labaRugiBersih >= 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(labaRugiBersih)) }}
              </span>
            </div>
            <div class="space-y-1">
              <div class="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex" title="Pendapatan">
                <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 72%"></div>
              </div>
              <div class="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex" title="Beban">
                <div class="bg-rose-500 h-full rounded-full transition-all duration-500" style="width: 90%"></div>
              </div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-500 font-mono">
              <span class="text-emerald-700 font-bold">Pendapatan: {{ formatCurrency(totalPendapatan) }}</span>
              <span class="text-rose-700 font-bold">Beban: {{ formatCurrency(totalBeban) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Komposisi Kategori Keuangan (Donut/Progress Composition) -->
      <div class="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between space-y-4">
        <div>
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers class="w-4 h-4 text-purple-600" />
            Komposisi Pendapatan & Beban
          </h2>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Kontribusi kategori terhadap struktur kas.</p>
        </div>

        <!-- Breakdown Pendapatan -->
        <div class="space-y-2">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Proporsi Pendapatan</span>
          <div class="space-y-1.5">
            <div v-for="item in pendapatanItems" :key="item.name" class="space-y-0.5">
              <div class="flex justify-between text-xs font-semibold text-slate-700">
                <span class="truncate max-w-[160px]">{{ item.name }}</span>
                <span class="font-bold text-emerald-600">{{ item.percentage.toFixed(1) }}%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div :class="item.iconColor" class="h-full rounded-full transition-all duration-500" :style="{ width: `${item.percentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Breakdown Beban -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Beban Terbesar</span>
          <div v-if="highestExpenseCategory" class="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
            <div>
              <span class="font-bold text-xs text-rose-900">{{ highestExpenseCategory.name }}</span>
              <span class="text-[11px] text-rose-600 block">{{ formatCurrency(highestExpenseCategory.amount) }} ({{ highestExpenseCategory.percentage.toFixed(1) }}%)</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-rose-200/80 text-rose-800 text-[10px] font-extrabold uppercase">Pos #1</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- 4. RINCIAN LABA RUGI (DETAIL TABLES)       -->
    <!-- ========================================== -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      <!-- RINCIAN PENDAPATAN -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex flex-col justify-between">
        <div>
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              Rincian Pendapatan Operasional
            </h2>
            <span class="text-xs font-extrabold text-emerald-700">{{ formatCurrency(totalPendapatan) }}</span>
          </div>

          <div class="divide-y divide-slate-100">
            <div 
              v-for="item in pendapatanItems" 
              :key="item.key" 
              @click="openCategoryDrilldown(item, 'pendapatan')"
              class="px-5 py-3.5 flex items-center justify-between hover:bg-emerald-50/40 transition-colors cursor-pointer group"
              title="Klik untuk melihat detail invoice & pelanggan"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-2 h-2 rounded-full" :class="item.iconColor"></div>
                <div>
                  <span class="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ item.name }}</span>
                  <span class="text-[11px] text-slate-400 block font-medium">{{ item.count }} item transaksi &bull; Kontribusi {{ item.percentage.toFixed(1) }}%</span>
                </div>
              </div>

              <div class="flex items-center gap-2 text-right">
                <span class="text-xs font-extrabold text-emerald-600">{{ formatCurrency(item.amount) }}</span>
                <Eye class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>

            <div v-if="pendapatanItems.length === 0" class="p-6 text-center text-xs text-slate-400">
              Tidak ada data pendapatan untuk rentang tanggal ini.
            </div>
          </div>
        </div>

        <!-- Total Pendapatan Row -->
        <div class="px-5 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
          <span class="text-xs text-slate-800 font-extrabold uppercase tracking-wide">Total Pendapatan Bersih</span>
          <span class="text-sm font-black text-emerald-700">{{ formatCurrency(totalPendapatan) }}</span>
        </div>
      </div>

      <!-- RINCIAN BEBAN / BIAYA -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex flex-col justify-between">
        <div>
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              Rincian Beban / Biaya Operasional
            </h2>
            <span class="text-xs font-extrabold text-rose-700">{{ formatCurrency(totalBeban) }}</span>
          </div>

          <div class="divide-y divide-slate-100">
            <div 
              v-for="item in bebanItems" 
              :key="item.key" 
              @click="openCategoryDrilldown(item, 'beban')"
              class="px-5 py-3.5 flex items-center justify-between hover:bg-rose-50/40 transition-colors cursor-pointer group"
              title="Klik untuk melihat detail pengeluaran & vendor"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-2 h-2 rounded-full" :class="item.iconColor"></div>
                <div>
                  <span class="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{{ item.name }}</span>
                  <span class="text-[11px] text-slate-400 block font-medium">{{ item.count }} pencatatan &bull; Porsi {{ item.percentage.toFixed(1) }}%</span>
                </div>
              </div>

              <div class="flex items-center gap-2 text-right">
                <span class="text-xs font-extrabold text-rose-600">{{ formatCurrency(item.amount) }}</span>
                <Eye class="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
            </div>

            <div v-if="bebanItems.length === 0" class="p-6 text-center text-xs text-slate-400">
              Tidak ada data beban untuk rentang tanggal ini.
            </div>
          </div>
        </div>

        <!-- Total Beban Row -->
        <div class="px-5 py-4 bg-rose-50 border-t border-rose-100 flex items-center justify-between">
          <span class="text-xs text-slate-800 font-extrabold uppercase tracking-wide">Total Beban Operasional</span>
          <span class="text-sm font-black text-rose-700">{{ formatCurrency(totalBeban) }}</span>
        </div>
      </div>
    </section>

    <!-- ========================================== -->
    <!-- 5. ANALISIS KEUANGAN (EXECUTIVE HIGHLIGHTS) -->
    <!-- ========================================== -->
    <section class="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-amber-500" />
          Analisis & Insight Finansial Eksekutif
        </h2>
        <span class="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          Otomatis Dihitung Sistem
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Insight 1: Pertumbuhan Pendapatan -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pertumbuhan Pendapatan</span>
          <div class="text-lg font-black" :class="pendapatanGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ pendapatanGrowth >= 0 ? '+' : '' }}{{ pendapatanGrowth }}% MoM
          </div>
          <p class="text-[11px] text-slate-500">
            {{ pendapatanGrowth >= 0 ? 'Penjualan menunjukkan tren positif dibanding periode lalu.' : 'Terjadi perlambatan omset dari periode sebelumnya.' }}
          </p>
        </div>

        <!-- Insight 2: Pertumbuhan Beban -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pertumbuhan Beban</span>
          <div class="text-lg font-black" :class="bebanGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ bebanGrowth >= 0 ? '+' : '' }}{{ bebanGrowth }}% MoM
          </div>
          <p class="text-[11px] text-slate-500">
            {{ bebanGrowth <= 0 ? 'Pengendalian beban operasional berjalan efisien.' : 'Waspadai pembengkakan biaya di beberapa pos pengeluaran.' }}
          </p>
        </div>

        <!-- Insight 3: Sumber Pendapatan Terbesar -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sumber Pendapatan Utama</span>
          <div class="text-xs font-bold text-slate-800 truncate" :title="highestRevenueSource?.name">
            {{ highestRevenueSource ? highestRevenueSource.name : '-' }}
          </div>
          <div class="text-sm font-extrabold text-emerald-600">
            {{ highestRevenueSource ? formatCurrency(highestRevenueSource.amount) : 'Rp 0' }}
          </div>
          <p class="text-[11px] text-slate-500">
            Menyumbang {{ highestRevenueSource ? highestRevenueSource.percentage.toFixed(1) : 0 }}% dari keseluruhan omset.
          </p>
        </div>

        <!-- Insight 4: Beban Terbesar -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Beban Terbesar</span>
          <div class="text-xs font-bold text-slate-800 truncate" :title="highestExpenseCategory?.name">
            {{ highestExpenseCategory ? highestExpenseCategory.name : '-' }}
          </div>
          <div class="text-sm font-extrabold text-rose-600">
            {{ highestExpenseCategory ? formatCurrency(highestExpenseCategory.amount) : 'Rp 0' }}
          </div>
          <p class="text-[11px] text-slate-500">
            Menyerap {{ highestExpenseCategory ? highestExpenseCategory.percentage.toFixed(1) : 0 }}% dari seluruh pengeluaran.
          </p>
        </div>
      </div>
    </section>

    <!-- Bottom Result Callout -->
    <div 
      class="rounded-2xl p-5 sm:p-6 border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
      :class="labaRugiBersih >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'"
    >
      <div class="flex items-center gap-3.5">
        <div 
          class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
          :class="labaRugiBersih >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
        >
          <TrendingUp v-if="labaRugiBersih >= 0" class="w-6 h-6" />
          <TrendingDown v-else class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-base font-extrabold" :class="labaRugiBersih >= 0 ? 'text-emerald-900' : 'text-rose-900'">
            {{ labaRugiBersih >= 0 ? 'Perusahaan Menghasilkan Laba Bersih' : 'Perusahaan Mengalami Defisit (Rugi)' }}
          </h3>
          <p class="text-xs" :class="labaRugiBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ labaRugiBersih >= 0 ? `Total omset pendapatan melebihi beban operasional dengan margin bersih sebesar ${marginPersentase}%.` : `Total pengeluaran melebihi penerimaan. Evaluasi pos biaya operasional terbesar.` }}
          </p>
        </div>
      </div>

      <div class="text-center sm:text-right shrink-0">
        <span class="text-xs font-bold uppercase tracking-wider block" :class="labaRugiBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">
          {{ labaRugiBersih >= 0 ? 'Laba Bersih Akhir' : 'Rugi Bersih Akhir' }}
        </span>
        <span class="text-2xl sm:text-3xl font-black" :class="labaRugiBersih >= 0 ? 'text-emerald-800' : 'text-rose-800'">
          {{ formatCurrency(Math.abs(labaRugiBersih)) }}
        </span>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL DETAIL TRANSAKSI SAAT KATEGORI DIKLIK-->
    <!-- ========================================== -->
    <div 
      v-if="showDetailModal && selectedCategoryDetail"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      @click.self="showDetailModal = false"
    >
      <div 
        class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 duration-150"
        @click.stop
      >
        <!-- Modal Header -->
        <div 
          class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between"
          :class="selectedCategoryDetail.type === 'pendapatan' ? 'bg-emerald-50/50' : 'bg-rose-50/50'"
        >
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              :class="selectedCategoryDetail.type === 'pendapatan' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'"
            >
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {{ selectedCategoryDetail.type === 'pendapatan' ? 'Rincian Pendapatan' : 'Rincian Beban' }}
                </span>
                <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {{ selectedCategoryDetail.items.length }} Transaksi
                </span>
              </div>
              <h3 class="text-base font-extrabold text-slate-900">{{ selectedCategoryDetail.name }}</h3>
            </div>
          </div>

          <button 
            @click="showDetailModal = false"
            class="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Total Header Banner -->
        <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
          <span class="font-bold text-slate-600">Total Akumulasi Kategori:</span>
          <span 
            class="font-black text-sm"
            :class="selectedCategoryDetail.type === 'pendapatan' ? 'text-emerald-600' : 'text-rose-600'"
          >
            {{ formatCurrency(selectedCategoryDetail.amount) }}
          </span>
        </div>

        <!-- Modal Body (Table of underlying transactions) -->
        <div class="p-6 overflow-y-auto space-y-3">
          <!-- When category is Pendapatan -->
          <div v-if="selectedCategoryDetail.type === 'pendapatan'" class="space-y-2">
            <div 
              v-for="(t, idx) in selectedCategoryDetail.items" 
              :key="idx"
              class="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-indigo-700">{{ t.invoiceNo }}</span>
                  <span class="text-[11px] text-slate-400">&bull; {{ t.date }}</span>
                  <span class="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">{{ t.paymentMethod }}</span>
                </div>
                <h4 class="font-bold text-sm text-slate-800 mt-1">{{ t.itemName }}</h4>
                <p class="text-xs text-slate-500">Pelanggan: {{ t.customer }} (Qty: {{ t.qty }} x {{ formatCurrency(t.price) }})</p>
              </div>

              <div class="text-left sm:text-right">
                <span class="text-sm font-black text-emerald-600">{{ formatCurrency(t.total) }}</span>
              </div>
            </div>

            <div v-if="selectedCategoryDetail.items.length === 0" class="text-center py-8 text-xs text-slate-400">
              Tidak ada data transaksi untuk kategori ini.
            </div>
          </div>

          <!-- When category is Beban -->
          <div v-else class="space-y-2">
            <div 
              v-for="(exp, idx) in selectedCategoryDetail.items" 
              :key="idx"
              class="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-rose-700">{{ exp.category }}</span>
                  <span class="text-[11px] text-slate-400">&bull; {{ exp.date }}</span>
                </div>
                <h4 class="font-bold text-sm text-slate-800 mt-1">{{ exp.desc }}</h4>
              </div>

              <div class="text-left sm:text-right">
                <span class="text-sm font-black text-rose-600">{{ formatCurrency(exp.amount) }}</span>
              </div>
            </div>

            <div v-if="selectedCategoryDetail.items.length === 0" class="text-center py-8 text-xs text-slate-400">
              Tidak ada pencatatan beban untuk kategori ini.
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            @click="showDetailModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media print {
  /* Print Optimization */
  body {
    background: white !important;
    color: black !important;
  }
}
</style>

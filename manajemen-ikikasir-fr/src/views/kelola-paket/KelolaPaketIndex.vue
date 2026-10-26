<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'
import type { PricingPackage } from '../../composables/useAppData'
import { useAppData } from '../../composables/useAppData'
import { usePagination } from '../../composables/usePagination'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import DateRangePicker from '../../components/common/DateRangePicker.vue'

const {
  packages,
  addPackage,
  updatePackage,
  deletePackage,
  togglePackageActive
} = useAppData()

// Filter & Search states
const searchQuery = ref('')
const filterStatus = ref('Semua Status')
const filterType = ref('Semua Tipe')

// Toast notification state
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 3500)
}

// Modal Form states
const isModalOpen = ref(false)
const isEditing = ref(false)
const form = ref<{
  id: string
  name: string
  cardSub: string
  isConsultation: boolean
  price: number
  periodType: 'bulanan' | 'tahunan' | 'custom'
  period: string
  startDate: string
  endDate: string
  featuresText: string
  isActive: boolean
}>({
  id: '',
  name: '',
  cardSub: '',
  isConsultation: false,
  price: 0,
  periodType: 'bulanan',
  period: '/bulan',
  startDate: '',
  endDate: '',
  featuresText: '',
  isActive: true
})

// Auto-generate period label when custom dates change
const autoGeneratePeriodText = () => {
  if (form.value.periodType !== 'custom') return
  if (!form.value.startDate && !form.value.endDate) {
    form.value.period = '/custom'
    return
  }

  if (form.value.startDate && !form.value.endDate) {
    const d1 = new Date(form.value.startDate)
    if (!isNaN(d1.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      form.value.period = `/mulai ${months[d1.getMonth()]} ${d1.getFullYear()}`
    }
    return
  }

  if (!form.value.startDate && form.value.endDate) {
    const d2 = new Date(form.value.endDate)
    if (!isNaN(d2.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      form.value.period = `/s.d ${months[d2.getMonth()]} ${d2.getFullYear()}`
    }
    return
  }

  const d1 = new Date(form.value.startDate)
  const d2 = new Date(form.value.endDate)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    form.value.period = '/custom'
    return
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const m1 = months[d1.getMonth()]
  const y1 = d1.getFullYear()
  const m2 = months[d2.getMonth()]
  const y2 = d2.getFullYear()

  if (y1 === y2 && d1.getMonth() === d2.getMonth()) {
    form.value.period = `/${m1} ${y1}`
  } else if (y1 === y2) {
    form.value.period = `/${m1} - ${m2} ${y1}`
  } else {
    form.value.period = `/${m1} ${y1} - ${m2} ${y2}`
  }
}

watch(
  [() => form.value.startDate, () => form.value.endDate],
  ([newStart, newEnd]) => {
    if (form.value.periodType === 'custom' && (newStart || newEnd)) {
      autoGeneratePeriodText()
    }
  }
)

const handlePeriodTypeChange = () => {
  if (form.value.periodType === 'bulanan') {
    form.value.period = '/bulan'
  } else if (form.value.periodType === 'tahunan') {
    form.value.period = '/tahun'
  } else if (form.value.periodType === 'custom') {
    if (!form.value.startDate || !form.value.endDate) {
      const today = new Date()
      const end = new Date()
      end.setMonth(end.getMonth() + 2) // default 3 bulan
      const pad = (n: number) => String(n).padStart(2, '0')

      form.value.startDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`
      const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
      form.value.endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(lastDay)}`
    }
    autoGeneratePeriodText()
  }
}

// Delete confirmation modal states
const packageToDelete = ref<PricingPackage | null>(null)
const isDeleteConfirmOpen = ref(false)

// Computed metrics
const totalPackagesCount = computed(() => packages.value.length)
const activePackagesCount = computed(() => packages.value.filter(p => p.isActive).length)

// Filtered list
const filteredPackages = computed(() => {
  let list = packages.value

  if (filterStatus.value === 'Aktif') {
    list = list.filter(p => p.isActive)
  } else if (filterStatus.value === 'Nonaktif') {
    list = list.filter(p => !p.isActive)
  }

  if (filterType.value === 'Berlangganan') {
    list = list.filter(p => !p.isConsultation)
  } else if (filterType.value === 'Konsultasi') {
    list = list.filter(p => p.isConsultation)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => {
      const name = (p.name || '').toLowerCase()
      const desc = (p.cardSub || p.description || '').toLowerCase()
      const features = (p.features || []).join(' ').toLowerCase()
      const priceStr = p.price ? p.price.toString() : ''
      return name.includes(q) || desc.includes(q) || features.includes(q) || priceStr.includes(q)
    })
  }

  return list
})

// Pagination
const {
  currentPage,
  pageSize,
  totalItems,
  startIndex,
  paginatedItems: paginatedPackages,
  resetPage
} = usePagination(filteredPackages, 10)

watch([searchQuery, filterStatus, filterType], () => {
  resetPage()
})

const resetFilters = () => {
  searchQuery.value = ''
  filterStatus.value = 'Semua Status'
  filterType.value = 'Semua Tipe'
  resetPage()
}

// Modal open handlers
const openAddModal = () => {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    cardSub: '',
    isConsultation: false,
    price: 0,
    periodType: 'bulanan',
    period: '/bulan',
    startDate: '',
    endDate: '',
    featuresText: '',
    isActive: true
  }
  isModalOpen.value = true
}

const openEditModal = (pkg: PricingPackage) => {
  isEditing.value = true
  let pType: 'bulanan' | 'tahunan' | 'custom' = pkg.periodType || 'bulanan'
  const rawPeriod = (pkg.period || '').trim().toLowerCase()

  if (!pkg.periodType) {
    if (rawPeriod === '/bulan' || rawPeriod === 'bulan' || rawPeriod === '/bln') {
      pType = 'bulanan'
    } else if (rawPeriod === '/tahun' || rawPeriod === 'tahun' || rawPeriod === '/thn') {
      pType = 'tahunan'
    } else if (rawPeriod) {
      pType = 'custom'
    }
  }

  form.value = {
    id: pkg.id,
    name: pkg.name,
    cardSub: pkg.description || pkg.cardSub || '',
    isConsultation: pkg.isConsultation ?? false,
    price: pkg.price ?? 0,
    periodType: pType,
    period: pkg.period || '/bulan',
    startDate: pkg.startDate || '',
    endDate: pkg.endDate || '',
    featuresText: (pkg.features || []).join('\n'),
    isActive: pkg.isActive ?? true
  }
  isModalOpen.value = true
}

const savePackage = () => {
  if (!form.value.name.trim()) {
    alert('Nama paket wajib diisi.')
    return
  }

  const features = form.value.featuresText
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f)

  // Determine final period string
  let finalPeriod = ''
  if (!form.value.isConsultation) {
    if (form.value.periodType === 'bulanan') {
      finalPeriod = '/bulan'
    } else if (form.value.periodType === 'tahunan') {
      finalPeriod = '/tahun'
    } else {
      finalPeriod = form.value.period.trim() || '/custom'
    }
  }

  const packageData: Omit<PricingPackage, 'id'> = {
    name: form.value.name.trim(),
    cardSub: form.value.cardSub.trim(),
    description: form.value.cardSub.trim(),
    isConsultation: form.value.isConsultation,
    price: form.value.isConsultation ? 0 : form.value.price,
    period: finalPeriod,
    periodType: form.value.periodType,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    features: features,
    isActive: form.value.isActive
  }

  if (isEditing.value && form.value.id) {
    updatePackage({ ...packageData, id: form.value.id })
    showToast(`Paket "${packageData.name}" berhasil diperbarui!`)
  } else {
    addPackage(packageData)
    showToast(`Paket baru "${packageData.name}" berhasil ditambahkan!`)
  }
  isModalOpen.value = false
}

const handleToggleActive = (pkg: PricingPackage) => {
  togglePackageActive(pkg.id)
  showToast(`Status paket "${pkg.name}" diubah menjadi ${!pkg.isActive ? 'Aktif' : 'Nonaktif'}.`)
}

const confirmDelete = (pkg: PricingPackage) => {
  packageToDelete.value = pkg
  isDeleteConfirmOpen.value = true
}

const executeDelete = () => {
  if (packageToDelete.value) {
    const deletedName = packageToDelete.value.name
    deletePackage(packageToDelete.value.id)
    showToast(`Paket "${deletedName}" berhasil dihapus.`)
    packageToDelete.value = null
  }
  isDeleteConfirmOpen.value = false
}
</script>

<template>
  <div class="space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 text-sm font-medium"
    >
      <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Header Section -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Package class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kelola Paket
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atur daftar paket berlangganan, harga, dan fitur yang tampil di Landing Page.
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
          <span>Total: <strong class="text-slate-900 dark:text-white font-bold">{{ totalPackagesCount }}</strong></span>
          <span class="text-slate-300 dark:text-slate-600">•</span>
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ activePackagesCount }} Aktif</span>
        </div>
        <button 
          @click="openAddModal"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none shrink-0 cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Paket</span>
        </button>
      </div>
    </header>

    <!-- Toolbar Filters Card -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari paket berdasarkan nama, deskripsi, atau fitur..." 
          class="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-all placeholder-slate-400"
        />
        <button 
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center flex-wrap gap-2 text-xs">
        <!-- Status Filter -->
        <select
          v-model="filterStatus"
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Nonaktif</option>
        </select>

        <!-- Tipe Paket Filter -->
        <select
          v-model="filterType"
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option>Semua Tipe</option>
          <option>Berlangganan</option>
          <option>Konsultasi</option>
        </select>

        <!-- Reset Button -->
        <button 
          v-if="searchQuery || filterStatus !== 'Semua Status' || filterType !== 'Semua Tipe'"
          @click="resetFilters"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Reset Filter"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>

    <!-- Table Container & Card Wrapper -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/60 overflow-hidden">
      <!-- Desktop Table (Visible on md and up) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[750px]">
          <thead class="bg-slate-50/75 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th class="px-5 py-3.5 w-16">No</th>
              <th class="px-5 py-3.5">Nama Paket</th>
              <th class="px-5 py-3.5">Harga & Periode</th>
              <th class="px-5 py-3.5">Fitur Unggulan</th>
              <th class="px-5 py-3.5 text-center">Status</th>
              <th class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr
              v-for="(pkg, index) in paginatedPackages"
              :key="pkg.id"
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/25 transition-colors group"
            >
              <!-- Index Number -->
              <td class="px-5 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs font-semibold">
                {{ startIndex + index + 1 }}
              </td>

              <!-- Nama Paket -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Package class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      <span>{{ pkg.name }}</span>
                      <span v-if="pkg.badge" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {{ pkg.badge }}
                      </span>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                      {{ pkg.cardSub || pkg.description || '-' }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Harga & Periode -->
              <td class="px-5 py-4">
                <template v-if="!pkg.isConsultation">
                  <div class="font-extrabold text-slate-800 dark:text-slate-100">
                    Rp {{ (pkg.price || 0).toLocaleString('id-ID') }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">
                    {{ pkg.period || '/bulan' }}
                  </div>
                </template>
                <template v-else>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    Konsultasi / Custom
                  </span>
                </template>
              </td>

              <!-- Fitur -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {{ pkg.features?.length || 0 }} Fitur
                  </span>
                  <span v-if="pkg.features && pkg.features.length > 0" class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" :title="pkg.features.join(', ')">
                    ({{ pkg.features[0] }}<span v-if="pkg.features.length > 1">, ...</span>)
                  </span>
                </div>
              </td>

              <!-- Status Toggle -->
              <td class="px-5 py-4 text-center">
                <button
                  @click="handleToggleActive(pkg)"
                  title="Klik untuk mengubah status paket"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors active:scale-95"
                  :class="
                    pkg.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  "
                >
                  <CheckCircle2 v-if="pkg.isActive" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  <span>{{ pkg.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                </button>
              </td>

              <!-- Aksi -->
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click="openEditModal(pkg)"
                    class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Paket"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(pkg)"
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Paket"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state desktop -->
            <tr v-if="filteredPackages.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="max-w-xs mx-auto space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                    <Package class="w-6 h-6" />
                  </div>
                  <div class="space-y-1">
                    <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada paket ditemukan</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500">Coba ubah kata kunci pencarian atau filter status Anda.</p>
                  </div>
                  <button
                    v-if="searchQuery || filterStatus !== 'Semua Status' || filterType !== 'Semua Tipe'"
                    @click="resetFilters"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List/Cards View (Visible on < md) -->
      <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        <div
          v-for="(pkg, index) in paginatedPackages"
          :key="pkg.id"
          class="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <Package class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-slate-400 font-mono font-bold">#{{ startIndex + index + 1 }}</span>
                  <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm">{{ pkg.name }}</h4>
                  <span v-if="pkg.badge" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {{ pkg.badge }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{{ pkg.cardSub || pkg.description || '-' }}</p>
              </div>
            </div>
            <button
              @click="handleToggleActive(pkg)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors shrink-0"
              :class="
                pkg.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              "
            >
              <CheckCircle2 v-if="pkg.isActive" class="w-3 h-3" />
              <XCircle v-else class="w-3 h-3" />
              <span>{{ pkg.isActive ? 'Aktif' : 'Nonaktif' }}</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/40">
            <div>
              <template v-if="!pkg.isConsultation">
                <span class="font-bold text-slate-900 dark:text-white">Rp {{ (pkg.price || 0).toLocaleString('id-ID') }}</span>
                <span class="text-slate-500 text-[11px]">{{ pkg.period }}</span>
              </template>
              <template v-else>
                <span class="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">Konsultasi</span>
              </template>
              <span class="ml-2 text-slate-400 text-[11px]">• {{ pkg.features?.length || 0 }} fitur</span>
            </div>

            <div class="flex items-center gap-1">
              <button
                @click="openEditModal(pkg)"
                class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Edit Paket"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                @click="confirmDelete(pkg)"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Hapus Paket"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state mobile -->
        <div v-if="filteredPackages.length === 0" class="p-8 text-center">
          <div class="max-w-xs mx-auto space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
              <Package class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada paket ditemukan</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">Coba ubah kata kunci atau filter.</p>
            </div>
            <button
              v-if="searchQuery || filterStatus !== 'Semua Status' || filterType !== 'Semua Tipe'"
              @click="resetFilters"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredPackages.length > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <!-- Modal Form Tambah/Edit Paket -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div
          class="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Package class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ isEditing ? 'Edit Data Paket' : 'Tambah Paket Baru' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Atur paket langganan yang tampil di Landing Page</p>
            </div>
          </div>
          <button
            @click="isModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <!-- Nama Paket -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Paket <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Contoh: Basic, Pro, atau Enterprise"
            />
          </div>

          <!-- Subjudul / Deskripsi Singkat -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Subjudul / Deskripsi Singkat
            </label>
            <input
              v-model="form.cardSub"
              type="text"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Contoh: Cocok untuk usaha kecil, menengah, dan pemula..."
            />
          </div>

          <!-- Mode Konsultasi / Harga -->
          <div class="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
            <div class="flex items-center">
              <input
                v-model="form.isConsultation"
                type="checkbox"
                id="isConsultation"
                class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                for="isConsultation"
                class="ml-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Mode Konsultasi (Harga disembunyikan / Hubungi Admin)
              </label>
            </div>

            <div v-if="!form.isConsultation" class="space-y-3 pt-2">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Harga Paket (Rp)
                  </label>
                  <input
                    v-model.number="form.price"
                    type="number"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Periode / Satuan
                  </label>
                  <select
                    v-model="form.periodType"
                    @change="handlePeriodTypeChange"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="bulanan">Bulanan (/bulan)</option>
                    <option value="tahunan">Tahunan (/tahun)</option>
                    <option value="custom">Custom (Rentang Bulan/Tanggal)</option>
                  </select>
                </div>
              </div>

              <!-- Field Custom Range Date Picker (Mulai Bulan Ini s/d Bulan Ini) -->
              <div
                v-if="form.periodType === 'custom'"
                class="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in duration-200"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Calendar class="w-4 h-4 text-indigo-600" />
                    Rentang Periode Custom
                  </span>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400">Pilih rentang bulan / tanggal aktif</span>
                </div>

                <!-- Range Date Picker Dropdown Kalender -->
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Cepat via Kalender
                  </label>
                  <DateRangePicker
                    v-model:startDate="form.startDate"
                    v-model:endDate="form.endDate"
                    placeholder="Klik untuk pilih rentang tanggal pada kalender"
                  />
                </div>

                <!-- Input Tanggal/Bulan Mulai & Selesai -->
                <div class="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Mulai (Bulan / Tanggal)
                    </label>
                    <input
                      v-model="form.startDate"
                      type="date"
                      class="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Sampai (Bulan / Tanggal)
                    </label>
                    <input
                      v-model="form.endDate"
                      type="date"
                      class="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <!-- Teks Satuan Periode & Live Preview -->
                <div class="pt-2 border-t border-indigo-100/80 dark:border-indigo-900/50">
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Teks Satuan Periode (Tampil di Web & Landing Page)
                    </label>
                    <button
                      type="button"
                      @click="autoGeneratePeriodText"
                      class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      Format Otomatis
                    </button>
                  </div>
                  <input
                    v-model="form.period"
                    type="text"
                    class="w-full px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-700 text-indigo-900 dark:text-indigo-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="Contoh: /Okt - Des 2026"
                  />
                  <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    <span>Tampilan harga di kartu:</span>
                    <span class="font-extrabold text-slate-800 dark:text-slate-200">
                      Rp {{ (form.price || 0).toLocaleString('id-ID') }}
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ form.period }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Daftar Fitur -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Daftar Fitur Unggulan (Tulis 1 baris untuk setiap fitur)
            </label>
            <textarea
              v-model="form.featuresText"
              rows="5"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400 font-mono text-xs"
              placeholder="Manajemen produk tanpa batas&#10;Transaksi kasir cepat & akurat&#10;Laporan penjualan lengkap&#10;Support bantuan pelanggan"
            ></textarea>
            <p class="text-[11px] text-slate-400 mt-1">Tekan Enter untuk menambah baris fitur baru.</p>
          </div>

          <!-- Status Aktif Checkbox -->
          <div class="flex items-center pt-2">
            <input
              v-model="form.isActive"
              type="checkbox"
              id="isActive"
              class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              for="isActive"
              class="ml-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Tampilkan paket ini secara aktif di website (Landing Page)
            </label>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div
          class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end gap-3"
        >
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="savePackage"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
          >
            {{ isEditing ? 'Simpan Perubahan' : 'Simpan Paket' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Paket -->
    <div
      v-if="isDeleteConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-700">
        <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Hapus Paket?</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus paket <strong>{{ packageToDelete?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex items-center gap-3 mt-6">
          <button
            @click="isDeleteConfirmOpen = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="executeDelete"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>

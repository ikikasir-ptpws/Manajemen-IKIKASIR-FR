<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Tag,
  Search,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Percent,
  Banknote,
  AlertCircle
} from 'lucide-vue-next'

export interface PromoItem {
  id: string
  name: string
  code: string
  type: 'Percentage' | 'Fixed'
  value: string
  rawValue: number
  status: 'Active' | 'Expired'
  validUntil: string
}

const STORAGE_KEY_PROMOS = 'ikikasir_promos_v1'

const initialPromos: PromoItem[] = [
  { id: 'prm-1', name: 'Diskon Akhir Tahun', code: 'YEAREND2026', type: 'Percentage', value: '20%', rawValue: 20, status: 'Active', validUntil: '31 Des 2026' },
  { id: 'prm-2', name: 'Promo Pengguna Baru', code: 'NEWUSER50', type: 'Fixed', value: 'Rp 50.000', rawValue: 50000, status: 'Active', validUntil: 'Tidak terbatas' },
  { id: 'prm-3', name: 'Flash Sale Agustus', code: 'FLASH88', type: 'Percentage', value: '15%', rawValue: 15, status: 'Expired', validUntil: '15 Agu 2026' }
]

const promos = ref<PromoItem[]>([])
const searchQuery = ref('')
const filterStatus = ref('Semua Status')
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedPromo = ref<PromoItem | null>(null)
const promoToDelete = ref<PromoItem | null>(null)
const isDeleteConfirmOpen = ref(false)
const toastMessage = ref<string | null>(null)

const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 3500)
}

// Form state
const form = ref({
  id: '',
  name: '',
  code: '',
  type: 'Percentage' as 'Percentage' | 'Fixed',
  rawValue: 10,
  hasExpiry: true,
  expiryDate: '',
  status: 'Active' as 'Active' | 'Expired'
})
const formErrors = ref<Record<string, string>>({})

const loadPromos = () => {
  if (typeof localStorage === 'undefined') {
    promos.value = [...initialPromos]
    return
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROMOS)
    if (saved) {
      promos.value = JSON.parse(saved)
    } else {
      promos.value = [...initialPromos]
      localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos.value))
    }
  } catch {
    promos.value = [...initialPromos]
  }
}

const savePromosToStorage = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos.value))
  }
}

onMounted(() => {
  loadPromos()
})

const filteredPromos = computed(() => {
  let list = promos.value
  if (filterStatus.value !== 'Semua Status') {
    list = list.filter(p => p.status === filterStatus.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.value.toLowerCase().includes(q)
    )
  }
  return list
})

const formatIndoDate = (dateStr: string) => {
  if (!dateStr) return 'Tidak terbatas'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const openAddModal = () => {
  isEditing.value = false
  selectedPromo.value = null
  // Default expiry date 30 days from now
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)
  const defaultIso = nextMonth.toISOString().split('T')[0] ?? ''

  form.value = {
    id: '',
    name: '',
    code: '',
    type: 'Percentage',
    rawValue: 10,
    hasExpiry: true,
    expiryDate: defaultIso,
    status: 'Active'
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (p: PromoItem) => {
  isEditing.value = true
  selectedPromo.value = p
  form.value = {
    id: p.id,
    name: p.name,
    code: p.code,
    type: p.type,
    rawValue: p.rawValue,
    hasExpiry: p.validUntil !== 'Tidak terbatas',
    expiryDate: '',
    status: p.status
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const validateForm = () => {
  const errs: Record<string, string> = {}
  if (!form.value.name.trim()) {
    errs.name = 'Nama promo wajib diisi.'
  }
  if (!form.value.code.trim()) {
    errs.code = 'Kode promo wajib diisi.'
  } else {
    const normalizedCode = form.value.code.trim().toUpperCase()
    const duplicate = promos.value.some(
      p => p.code.toUpperCase() === normalizedCode && p.id !== form.value.id
    )
    if (duplicate) {
      errs.code = 'Kode promo ini sudah digunakan.'
    }
  }

  if (form.value.rawValue <= 0) {
    errs.rawValue = 'Nilai diskon harus lebih besar dari 0.'
  } else if (form.value.type === 'Percentage' && form.value.rawValue > 100) {
    errs.rawValue = 'Nilai diskon persen maksimal 100%.'
  }

  if (form.value.hasExpiry && !form.value.expiryDate && !isEditing.value) {
    errs.expiryDate = 'Tanggal masa berlaku wajib dipilih.'
  }

  formErrors.value = errs
  return Object.keys(errs).length === 0
}

const handleSavePromo = () => {
  if (!validateForm()) return

  const cleanCode = form.value.code.trim().toUpperCase()
  const displayVal = form.value.type === 'Percentage'
    ? `${form.value.rawValue}%`
    : `Rp ${Number(form.value.rawValue).toLocaleString('id-ID')}`

  let validUntilStr = 'Tidak terbatas'
  if (form.value.hasExpiry) {
    if (form.value.expiryDate) {
      validUntilStr = formatIndoDate(form.value.expiryDate)
    } else if (isEditing.value && selectedPromo.value) {
      validUntilStr = selectedPromo.value.validUntil
    }
  }

  if (isEditing.value && form.value.id) {
    const target = promos.value.find(p => p.id === form.value.id)
    if (target) {
      target.name = form.value.name.trim()
      target.code = cleanCode
      target.type = form.value.type
      target.rawValue = form.value.rawValue
      target.value = displayVal
      target.status = form.value.status
      target.validUntil = validUntilStr
      savePromosToStorage()
      showToast(`Promo "${cleanCode}" berhasil diperbarui!`)
    }
  } else {
    const newPromo: PromoItem = {
      id: 'prm-' + Date.now(),
      name: form.value.name.trim(),
      code: cleanCode,
      type: form.value.type,
      rawValue: form.value.rawValue,
      value: displayVal,
      status: form.value.status,
      validUntil: validUntilStr
    }
    promos.value.unshift(newPromo)
    savePromosToStorage()
    showToast(`Promo baru "${newPromo.code}" berhasil dibuat!`)
  }

  isModalOpen.value = false
}

const confirmDelete = (p: PromoItem) => {
  promoToDelete.value = p
  isDeleteConfirmOpen.value = true
}

const executeDelete = () => {
  if (promoToDelete.value) {
    const deletedName = promoToDelete.value.name
    promos.value = promos.value.filter(p => p.id !== promoToDelete.value!.id)
    savePromosToStorage()
    showToast(`Promo "${deletedName}" berhasil dihapus.`)
  }
  isDeleteConfirmOpen.value = false
  promoToDelete.value = null
}

const toggleStatus = (p: PromoItem) => {
  p.status = p.status === 'Active' ? 'Expired' : 'Active'
  savePromosToStorage()
  showToast(`Status promo ${p.code} diubah menjadi ${p.status}.`)
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 text-sm font-medium"
    >
      <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Tag class="w-6 h-6 text-indigo-600" />
          Manajemen Promo
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola kode promo, diskon harga, dan penawaran spesial aplikasi kasir.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <!-- Filter Status -->
        <select
          v-model="filterStatus"
          class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option>Semua Status</option>
          <option>Active</option>
          <option>Expired</option>
        </select>

        <!-- Search Input -->
        <div class="relative flex-1 sm:w-60">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari promo / kode..." 
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
          />
        </div>

        <!-- Add Button -->
        <button 
          @click="openAddModal"
          class="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none shrink-0 cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Promo</span>
        </button>
      </div>
    </header>

    <!-- Table Container -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/60 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px]">
          <thead class="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60">
            <tr>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 w-16">No</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Nama Promo</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Kode</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Nilai Diskon</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Masa Berlaku</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th class="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr v-for="(promo, index) in filteredPromos" :key="promo.id" class="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
              <td class="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{{ index + 1 }}</td>
              <td class="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{{ promo.name }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  {{ promo.code }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800 dark:text-slate-100">{{ promo.value }}</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">
                  {{ promo.type === 'Percentage' ? 'Diskon Persen' : 'Potongan Nominal' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  {{ promo.validUntil }}
                </div>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="toggleStatus(promo)"
                  title="Klik untuk mengubah status promo"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors active:scale-95"
                  :class="promo.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'"
                >
                  <CheckCircle2 v-if="promo.status === 'Active'" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{ promo.status }}
                </button>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openEditModal(promo)"
                    class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Promo"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="confirmDelete(promo)"
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Promo"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredPromos.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400 text-sm">
                Tidak ada data promo yang sesuai dengan pencarian atau filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah/Edit Promo -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Tag class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ isEditing ? 'Edit Data Promo' : 'Buat Promo Baru' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Atur penawaran diskon untuk pelanggan IKI KASIR</p>
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
        <form @submit.prevent="handleSavePromo" class="p-6 space-y-4">
          <!-- Nama Promo -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Promo <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Contoh: Diskon Pelanggan Baru"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p v-if="formErrors.name" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.name }}
            </p>
          </div>

          <!-- Kode Promo -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Kode Promo (Voucher) <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="form.code"
                type="text"
                placeholder="Contoh: IKIKASIR20"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold uppercase text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                @input="form.code = form.code.toUpperCase()"
              />
            </div>
            <p v-if="formErrors.code" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.code }}
            </p>
          </div>

          <!-- Tipe Diskon & Nilai -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipe Diskon
              </label>
              <select
                v-model="form.type"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Percentage">Persentase (%)</option>
                <option value="Fixed">Potongan Nominal (Rp)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nilai Diskon <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model.number="form.rawValue"
                  type="number"
                  :min="1"
                  :max="form.type === 'Percentage' ? 100 : undefined"
                  :placeholder="form.type === 'Percentage' ? 'Contoh: 20' : 'Contoh: 50000'"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {{ form.type === 'Percentage' ? '%' : 'IDR' }}
                </span>
              </div>
              <p v-if="formErrors.rawValue" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.rawValue }}
              </p>
            </div>
          </div>

          <!-- Masa Berlaku -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Masa Berlaku
              </label>
              <label class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" v-model="form.hasExpiry" class="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Ada tanggal kedaluwarsa</span>
              </label>
            </div>

            <div v-if="form.hasExpiry" class="relative">
              <input
                v-model="form.expiryDate"
                type="date"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p v-if="formErrors.expiryDate" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.expiryDate }}
              </p>
            </div>
            <div v-else class="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Promo ini tidak memiliki tanggal kedaluwarsa (berlaku seterusnya).
            </div>
          </div>

          <!-- Status Promo -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Status Promo
            </label>
            <select
              v-model="form.status"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Active">Active (Aktif dapat digunakan)</option>
              <option value="Expired">Expired (Nonaktif / Kedaluwarsa)</option>
            </select>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              @click="isModalOpen = false"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              {{ isEditing ? 'Simpan Perubahan' : 'Buat Promo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div
      v-if="isDeleteConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-700">
        <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Hapus Promo?</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus promo <strong>{{ promoToDelete?.name }} ({{ promoToDelete?.code }})</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex items-center gap-3 mt-6">
          <button
            @click="isDeleteConfirmOpen = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
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

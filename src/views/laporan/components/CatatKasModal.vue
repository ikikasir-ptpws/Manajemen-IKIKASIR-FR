<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  X,
  PlusCircle,
  MinusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  CreditCard,
  Building,
  Tag,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  defaultType?: 'masuk' | 'keluar'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit-income', payload: {
    date: string
    displayDate: string
    customer: string
    desc: string
    category: string
    amount: number
    paymentMethod: string
  }): void
  (e: 'submit-expense', payload: {
    date: string
    displayDate: string
    desc: string
    category: string
    amount: number
    paymentMethod: string
  }): void
}>()

// Active transaction type ('masuk' for Income, 'keluar' for Expense)
const activeType = ref<'masuk' | 'keluar'>('masuk')

// Form fields
const form = ref({
  amount: '' as string | number,
  category: 'Lisensi POS',
  date: '2026-09-12',
  customerOrVendor: '',
  desc: '',
  paymentMethod: 'Transfer Bank'
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Preset Categories
const incomeCategories = [
  'Lisensi POS',
  'Hardware',
  'Addon & Aksesoris',
  'Jasa Setup & Layanan',
  'Pendapatan Lain-lain'
]

const expenseCategories = [
  'Gaji Karyawan',
  'Server & Cloud',
  'Marketing & Iklan',
  'Sewa Kantor',
  'Maintenance',
  'Operasional & Utilitas',
  'Pengeluaran Lainnya'
]

const paymentMethodsIncome = ['Transfer Bank', 'QRIS', 'Tunai', 'Kartu Debit']
const paymentMethodsExpense = ['Kas Operasional (Tunai)', 'Rekening BCA Perusahaan', 'Rekening Mandiri', 'Petty Cash']

// Quick preset chips
const incomeQuickAmounts = [250000, 500000, 1000000, 2500000, 5000000]
const expenseQuickAmounts = [100000, 250000, 500000, 1500000, 3000000]

const resetForm = () => {
  errors.value = {}
  form.value = {
    amount: '',
    category: activeType.value === 'masuk' ? 'Lisensi POS' : 'Server & Cloud',
    date: '2026-09-12',
    customerOrVendor: '',
    desc: '',
    paymentMethod: activeType.value === 'masuk' ? 'Transfer Bank' : 'Rekening BCA Perusahaan'
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      activeType.value = props.defaultType || 'masuk'
      resetForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.defaultType,
  (val) => {
    if (val) {
      activeType.value = val
      form.value.category = val === 'masuk' ? 'Lisensi POS' : 'Server & Cloud'
      form.value.paymentMethod = val === 'masuk' ? 'Transfer Bank' : 'Rekening BCA Perusahaan'
    }
  }
)

const setType = (type: 'masuk' | 'keluar') => {
  activeType.value = type
  errors.value = {}
  form.value.category = type === 'masuk' ? 'Lisensi POS' : 'Server & Cloud'
  form.value.paymentMethod = type === 'masuk' ? 'Transfer Bank' : 'Rekening BCA Perusahaan'
}

const formatNumberToIdr = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num)
}

const formattedPreviewAmount = computed(() => {
  const val = Number(form.value.amount)
  if (!val || isNaN(val) || val <= 0) return ''
  return formatNumberToIdr(val)
})

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parts[2]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${day} ${months[monthIdx] || parts[1]} ${year}`
}

const setPresetAmount = (val: number) => {
  form.value.amount = val
  if (errors.value.amount) {
    delete errors.value.amount
  }
}

const setTodayDate = () => {
  form.value.date = new Date().toISOString().slice(0, 10)
}

const setDemoDate = () => {
  form.value.date = '2026-09-12'
}

const validate = () => {
  const errs: Record<string, string> = {}
  const amt = Number(form.value.amount)
  if (!amt || isNaN(amt) || amt <= 0) {
    errs.amount = 'Nominal harus lebih besar dari 0'
  }
  if (!form.value.date) {
    errs.date = 'Tanggal wajib dipilih'
  }
  if (!form.value.category) {
    errs.category = 'Kategori transaksi wajib dipilih'
  }
  if (!form.value.customerOrVendor?.trim()) {
    errs.customerOrVendor = activeType.value === 'masuk' ? 'Nama pelanggan / entitas wajib diisi' : 'Nama penerima / vendor wajib diisi'
  }
  if (!form.value.desc?.trim()) {
    errs.desc = 'Keterangan transaksi wajib diisi'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

const handleSubmit = () => {
  if (!validate()) return

  const displayDate = formatDisplayDate(form.value.date)
  const amt = Number(form.value.amount)

  if (activeType.value === 'masuk') {
    emit('submit-income', {
      date: form.value.date,
      displayDate,
      customer: form.value.customerOrVendor.trim(),
      desc: form.value.desc.trim(),
      category: form.value.category,
      amount: amt,
      paymentMethod: form.value.paymentMethod
    })
  } else {
    emit('submit-expense', {
      date: form.value.date,
      displayDate,
      desc: form.value.desc.trim(),
      category: form.value.category,
      amount: amt,
      paymentMethod: form.value.paymentMethod
    })
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200"
      @click.stop
    >
      <!-- Modal Header -->
      <div 
        class="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between transition-colors"
        :class="activeType === 'masuk' ? 'bg-emerald-50/60' : 'bg-rose-50/60'"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors"
            :class="activeType === 'masuk' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'"
          >
            <PlusCircle v-if="activeType === 'masuk'" class="w-5 h-5" />
            <MinusCircle v-else class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{{ activeType === 'masuk' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas' }}</span>
              <span 
                class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                :class="activeType === 'masuk' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                {{ activeType === 'masuk' ? 'Uang Masuk' : 'Uang Keluar' }}
              </span>
            </h3>
            <p class="text-xs text-slate-500 font-medium">
              {{ activeType === 'masuk' ? 'Catat transaksi pemasukan dari penjualan lisensi atau layanan kasir.' : 'Catat beban biaya operasional, gaji, atau pemeliharaan sistem.' }}
            </p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Segmented Type Switcher -->
      <div class="px-5 sm:px-7 pt-4 pb-2 bg-slate-50/70 border-b border-slate-100">
        <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            @click="setType('masuk')"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="activeType === 'masuk' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
          >
            <ArrowUpRight class="w-4 h-4 text-emerald-200" v-if="activeType === 'masuk'" />
            <PlusCircle class="w-3.5 h-3.5" v-else />
            <span>Pemasukan (+ Kas)</span>
          </button>

          <button
            type="button"
            @click="setType('keluar')"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="activeType === 'keluar' 
              ? 'bg-rose-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
          >
            <ArrowDownRight class="w-4 h-4 text-rose-200" v-if="activeType === 'keluar'" />
            <MinusCircle class="w-3.5 h-3.5" v-else />
            <span>Pengeluaran (- Kas)</span>
          </button>
        </div>
      </div>

      <!-- Modal Body Form (Scrollable) -->
      <form @submit.prevent="handleSubmit" class="p-5 sm:p-7 space-y-4 overflow-y-auto">

        <!-- 1. Nominal Field -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nominal Transaksi (Rp) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">Rp</span>
            <input
              v-model="form.amount"
              type="number"
              min="1"
              step="1000"
              inputmode="numeric"
              placeholder="0"
              class="w-full pl-11 pr-4 py-2.5 rounded-2xl border text-base font-extrabold text-slate-800 focus:outline-none transition-all placeholder:text-slate-300"
              :class="errors.amount 
                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-100' 
                : (activeType === 'masuk' ? 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' : 'border-slate-200 bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100')"
            />
          </div>

          <!-- Preview Terbilang / Format -->
          <div v-if="formattedPreviewAmount" class="mt-1.5 flex items-center gap-1.5 text-xs font-semibold" :class="activeType === 'masuk' ? 'text-emerald-700' : 'text-rose-700'">
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ formattedPreviewAmount }}</span>
          </div>

          <!-- Quick Amount Chips -->
          <div class="flex items-center gap-1.5 flex-wrap mt-2">
            <span class="text-[11px] font-semibold text-slate-400 mr-1">Cepat:</span>
            <button
              v-for="preset in (activeType === 'masuk' ? incomeQuickAmounts : expenseQuickAmounts)"
              :key="preset"
              type="button"
              @click="setPresetAmount(preset)"
              class="px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer active:scale-95"
              :class="form.amount === preset 
                ? (activeType === 'masuk' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600')
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'"
            >
              {{ formatNumberToIdr(preset) }}
            </button>
          </div>

          <p v-if="errors.amount" class="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ errors.amount }}
          </p>
        </div>

        <!-- 2. Grid Tanggal & Kategori -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Tanggal -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tanggal <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-1 text-[11px]">
                <button type="button" @click="setDemoDate" class="text-indigo-600 hover:underline font-semibold cursor-pointer">12 Sep (Demo)</button>
                <span class="text-slate-300">|</span>
                <button type="button" @click="setTodayDate" class="text-slate-500 hover:underline font-semibold cursor-pointer">Hari Ini</button>
              </div>
            </div>
            <div class="relative">
              <input
                v-model="form.date"
                type="date"
                class="w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold text-slate-700 focus:outline-none transition-all"
                :class="errors.date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'"
              />
            </div>
            <p v-if="errors.date" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ errors.date }}
            </p>
          </div>

          <!-- Kategori -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori <span class="text-rose-500">*</span>
            </label>
            <select
              v-model="form.category"
              class="w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold text-slate-700 focus:outline-none transition-all cursor-pointer"
              :class="errors.category ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'"
            >
              <option 
                v-for="cat in (activeType === 'masuk' ? incomeCategories : expenseCategories)" 
                :key="cat" 
                :value="cat"
              >
                {{ cat }}
              </option>
            </select>
            <p v-if="errors.category" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ errors.category }}
            </p>
          </div>
        </div>

        <!-- 4. Deskripsi / Keperluan -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Keterangan / Keperluan <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <FileText class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <textarea
              v-model="form.desc"
              rows="2"
              :placeholder="activeType === 'masuk' ? 'Contoh: Pembayaran Paket POS Pro 1 Tahun + Tambahan Printer' : 'Contoh: Biaya tagihan sewa cloud server database AWS bulan September 2026'"
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold text-slate-800 focus:outline-none transition-all resize-none"
              :class="errors.desc ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'"
            ></textarea>
          </div>
          <p v-if="errors.desc" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ errors.desc }}
          </p>
        </div>

        <!-- 5. Metode Pembayaran / Sumber Kas -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {{ activeType === 'masuk' ? 'Metode Pembayaran' : 'Sumber Dana / Kas' }}
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="method in (activeType === 'masuk' ? paymentMethodsIncome : paymentMethodsExpense)"
              :key="method"
              type="button"
              @click="form.paymentMethod = method"
              class="px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              :class="form.paymentMethod === method
                ? (activeType === 'masuk' ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-2xs' : 'bg-rose-50 text-rose-700 border-rose-500 shadow-2xs')
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
            >
              <CreditCard class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate">{{ method }}</span>
            </button>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            :class="activeType === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>{{ activeType === 'masuk' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  X, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  Building,
  QrCode,
  Wallet
} from 'lucide-vue-next'
import type { Customer, PackageType } from '../types/dashboard'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', customer: Customer, transactionAmount: number): void
}>()

const currentStep = ref(1)
const isSubmitting = ref(false)

// Form fields
const form = ref({
  name: '',
  businessName: '',
  phone: '',
  email: '',
  category: 'Retail & Toko Kelontong',
  address: '',
  packageType: 'Basic' as PackageType,
  durationMonths: 1,
  paymentMethod: 'qris' as 'qris' | 'bca' | 'mandiri' | 'cash',
  recordCashflow: true,
  notes: ''
})

const businessCategories = [
  'Retail & Toko Kelontong',
  'Coffee Shop & Cafe',
  'Restoran & Rumah Makan',
  'Fashion & Butik',
  'Barbershop & Salon',
  'Bengkel & Cuci Kendaraan',
  'Apotek & Toko Obat',
  'Jasa & Bisnis Lainnya'
]

const packages = [
  {
    type: 'Basic' as PackageType,
    name: 'Paket Basic',
    pricePerMonth: 99000,
    features: ['1 Outlet & 1 Kasir', 'Hingga 500 Produk', 'Laporan Penjualan Standar', 'Support WhatsApp'],
    color: 'from-blue-600 to-indigo-600',
    badge: 'Paling Populer UMKM'
  },
  {
    type: 'Pro' as PackageType,
    name: 'Paket Pro',
    pricePerMonth: 199000,
    features: ['3 Akun Kasir', 'Produk & Stok Unlimited', 'Manajemen Meja & QR Order', 'Laporan Laba Rugi Harian'],
    color: 'from-emerald-600 to-teal-600',
    badge: 'Bisnis Berkembang'
  },
  {
    type: 'Premium' as PackageType,
    name: 'Paket Premium',
    pricePerMonth: 349000,
    features: ['Multi-Outlet (3 Cabang)', 'Fitur CRM & Loyalitas Poin', 'Neraca & Buku Besar Lengkap', 'Integrasi Mesin EDC/QRIS'],
    color: 'from-violet-600 to-purple-700',
    badge: 'Fitur Terlengkap'
  }
]

const durations = [
  { months: 1, label: '1 Bulan', discount: 0 },
  { months: 3, label: '3 Bulan', discount: 5 },
  { months: 6, label: '6 Bulan', discount: 10, recommended: true },
  { months: 12, label: '1 Tahun', discount: 20, bestValue: true }
]

// Calculations
const selectedPackageInfo = computed(() => {
  return packages.find(p => p.type === form.value.packageType) || packages[0]
})

const selectedDurationInfo = computed(() => {
  return durations.find(d => d.months === form.value.durationMonths) || durations[0]
})

const calculatedTotal = computed(() => {
  const base = selectedPackageInfo.value.pricePerMonth * form.value.durationMonths
  const disc = (base * selectedDurationInfo.value.discount) / 100
  return base - disc
})

const calculatedExpiredDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + form.value.durationMonths)
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthName = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${monthName} ${year}`
})

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

const handleNext = () => {
  if (currentStep.value === 1) {
    if (!form.value.name.trim()) {
      form.value.name = 'Pelanggan Baru'
    }
    if (!form.value.businessName.trim()) {
      form.value.businessName = 'Usaha ' + form.value.name
    }
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    currentStep.value = 3
  }
}

const handlePrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleSubmit = () => {
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      no: 1,
      name: form.value.name,
      businessName: form.value.businessName,
      packageType: form.value.packageType,
      expiredDate: calculatedExpiredDate.value,
      daysLeft: form.value.durationMonths * 30,
      status: 'active',
      phone: form.value.phone || '0812' + Math.floor(10000000 + Math.random() * 90000000),
      email: form.value.email || `${form.value.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      category: form.value.category,
      amount: calculatedTotal.value,
      paymentMethod: form.value.paymentMethod.toUpperCase()
    }

    emit('saved', newCust, calculatedTotal.value)
    emit('close')

    // Reset form
    form.value = {
      name: '',
      businessName: '',
      phone: '',
      email: '',
      category: 'Retail & Toko Kelontong',
      address: '',
      packageType: 'Basic',
      durationMonths: 1,
      paymentMethod: 'qris',
      recordCashflow: true,
      notes: ''
    }
    currentStep.value = 1
  }, 600)
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
    <!-- Backdrop Blur -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      @click="emit('close')"
    ></div>

    <!-- Modal Dialog -->
    <div class="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
      
      <!-- Top Bar / Gradient Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Store class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900">Registrasi Pelanggan & Toko Kasir Baru</h2>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                <Sparkles class="w-3 h-3" /> FORM PREMIUM
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Lengkapi data usaha, aktivasi lisensi kasir, dan kelola sistem pelanggan.</p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Step Indicator Navigation -->
      <div class="px-8 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-4 w-full">
          <!-- Step 1 -->
          <button 
            @click="currentStep = 1"
            class="flex items-center gap-2 cursor-pointer group"
          >
            <span 
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              :class="currentStep === 1 ? 'bg-indigo-600 text-white shadow-xs' : (currentStep > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')"
            >
              <CheckCircle2 v-if="currentStep > 1" class="w-4 h-4" />
              <span v-else>1</span>
            </span>
            <span class="text-xs font-bold" :class="currentStep === 1 ? 'text-indigo-600' : 'text-slate-600'">
              1. Identitas Usaha
            </span>
          </button>

          <div class="flex-1 h-[2px]" :class="currentStep >= 2 ? 'bg-emerald-400' : 'bg-slate-200'"></div>

          <!-- Step 2 -->
          <button 
            @click="currentStep = 2"
            class="flex items-center gap-2 cursor-pointer group"
          >
            <span 
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              :class="currentStep === 2 ? 'bg-indigo-600 text-white shadow-xs' : (currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')"
            >
              <CheckCircle2 v-if="currentStep > 2" class="w-4 h-4" />
              <span v-else>2</span>
            </span>
            <span class="text-xs font-bold" :class="currentStep === 2 ? 'text-indigo-600' : 'text-slate-600'">
              2. Paket Kasir
            </span>
          </button>

          <div class="flex-1 h-[2px]" :class="currentStep >= 3 ? 'bg-emerald-400' : 'bg-slate-200'"></div>

          <!-- Step 3 -->
          <button 
            @click="currentStep = 3"
            class="flex items-center gap-2 cursor-pointer group"
          >
            <span 
              class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              :class="currentStep === 3 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'"
            >
              3
            </span>
            <span class="text-xs font-bold" :class="currentStep === 3 ? 'text-indigo-600' : 'text-slate-600'">
              3. Pembayaran & Kas
            </span>
          </button>
        </div>
      </div>

      <!-- Main Body Container (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        
        <!-- STEP 1: IDENTITAS USAHA & PEMILIK -->
        <div v-if="currentStep === 1" class="space-y-6 animate-in fade-in duration-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Nama Usaha / Toko -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Usaha / Outlet Kasir <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Store class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="form.businessName"
                  type="text" 
                  placeholder="Contoh: Toko Berkah Mandiri / Kopi Senja"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                  required
                />
              </div>
            </div>

            <!-- Nama Pemilik / Penanggung Jawab -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Pemilik / PIC <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="form.name"
                  type="text" 
                  placeholder="Contoh: Andi Wijaya / Siti Rahma"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                  required
                />
              </div>
            </div>

            <!-- WhatsApp Phone -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. WhatsApp / Handphone <span class="text-rose-500">*</span>
              </label>
              <div class="relative flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold">
                  🇮🇩 +62
                </span>
                <input 
                  v-model="form.phone"
                  type="tel" 
                  placeholder="81234567890"
                  class="flex-1 pl-3 pr-3 py-2.5 rounded-r-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Digunakan untuk pengingat masa aktif & notifikasi tagihan.</p>
            </div>

            <!-- Email Bisnis -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Bisnis (Opsional)
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="form.email"
                  type="email" 
                  placeholder="owner@tokoberkah.com"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
            </div>

            <!-- Kategori Usaha -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Industri / Bidang Usaha
              </label>
              <div class="relative">
                <Tag class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select 
                  v-model="form.category"
                  class="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white appearance-none cursor-pointer"
                >
                  <option v-for="cat in businessCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
            </div>

            <!-- Alamat Toko -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lokasi Kota / Alamat Toko
              </label>
              <div class="relative">
                <MapPin class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="form.address"
                  type="text" 
                  placeholder="Contoh: Jl. Sudirman No. 12, Jakarta Selatan"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: PAKET LANGGANAN & DURASI -->
        <div v-if="currentStep === 2" class="space-y-6 animate-in fade-in duration-200">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Pilih Paket Langganan Kasir
            </label>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                v-for="pkg in packages" 
                :key="pkg.type"
                @click="form.packageType = pkg.type"
                class="relative rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                :class="form.packageType === pkg.type ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300 bg-white'"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="form.packageType === pkg.type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'">
                      {{ pkg.badge }}
                    </span>
                    <div 
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      :class="form.packageType === pkg.type ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'"
                    >
                      <CheckCircle2 v-if="form.packageType === pkg.type" class="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 class="text-base font-bold text-slate-800">{{ pkg.name }}</h3>
                  <div class="mt-2 mb-4">
                    <span class="text-xl font-extrabold text-slate-900">{{ formatRupiah(pkg.pricePerMonth) }}</span>
                    <span class="text-xs text-slate-400 font-medium"> / bulan</span>
                  </div>

                  <ul class="space-y-2 border-t border-slate-100 pt-3">
                    <li v-for="(feat, fIdx) in pkg.features" :key="fIdx" class="text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{{ feat }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Durasi Paket -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Masa Aktif / Siklus Tagihan
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                v-for="dur in durations" 
                :key="dur.months"
                type="button"
                @click="form.durationMonths = dur.months"
                class="p-3.5 rounded-xl border text-center transition-all cursor-pointer relative"
                :class="form.durationMonths === dur.months ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs' : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'"
              >
                <span v-if="dur.discount > 0" class="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                  Hemat {{ dur.discount }}%
                </span>
                <div class="text-sm font-bold">{{ dur.label }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  Berakhir: {{ calculatedExpiredDate }}
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 3: PEMBAYARAN & PREVIEW KARTU LISENSI -->
        <div v-if="currentStep === 3" class="space-y-6 animate-in fade-in duration-200">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left 7 Cols: Payment Methods & Details -->
            <div class="lg:col-span-7 space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Metode Pembayaran Kasir
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <!-- QRIS -->
                  <div 
                    @click="form.paymentMethod = 'qris'"
                    class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3"
                    :class="form.paymentMethod === 'qris' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold shadow-xs' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
                  >
                    <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      QRIS
                    </div>
                    <div>
                      <div class="text-xs font-bold">QRIS Instant</div>
                      <div class="text-[10px] text-slate-400">Gopay, OVO, ShopeePay, BCA</div>
                    </div>
                  </div>

                  <!-- BCA -->
                  <div 
                    @click="form.paymentMethod = 'bca'"
                    class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3"
                    :class="form.paymentMethod === 'bca' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold shadow-xs' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
                  >
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      BCA
                    </div>
                    <div>
                      <div class="text-xs font-bold">Transfer BCA</div>
                      <div class="text-[10px] text-slate-400">Virtual Account Otomatis</div>
                    </div>
                  </div>

                  <!-- Mandiri -->
                  <div 
                    @click="form.paymentMethod = 'mandiri'"
                    class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3"
                    :class="form.paymentMethod === 'mandiri' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold shadow-xs' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
                  >
                    <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                      BMRI
                    </div>
                    <div>
                      <div class="text-xs font-bold">Bank Mandiri</div>
                      <div class="text-[10px] text-slate-400">VA Mandiri Livin</div>
                    </div>
                  </div>

                  <!-- Tunai / Cash -->
                  <div 
                    @click="form.paymentMethod = 'cash'"
                    class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3"
                    :class="form.paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold shadow-xs' : 'border-slate-200 text-slate-700 hover:border-slate-300'"
                  >
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      KAS
                    </div>
                    <div>
                      <div class="text-xs font-bold">Tunai / Kas Langsung</div>
                      <div class="text-[10px] text-slate-400">Diterima di kasir toko</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rincian Biaya -->
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Paket: {{ selectedPackageInfo.name }} ({{ form.durationMonths }} Bulan)</span>
                  <span class="font-semibold">{{ formatRupiah(selectedPackageInfo.pricePerMonth * form.durationMonths) }}</span>
                </div>
                <div v-if="selectedDurationInfo.discount > 0" class="flex justify-between text-emerald-600">
                  <span>Diskon Promo Paket ({{ selectedDurationInfo.discount }}%)</span>
                  <span class="font-semibold">- {{ formatRupiah((selectedPackageInfo.pricePerMonth * form.durationMonths * selectedDurationInfo.discount) / 100) }}</span>
                </div>
                <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span class="font-bold text-slate-800 text-sm">Total Tagihan</span>
                  <span class="font-extrabold text-indigo-600 text-base">{{ formatRupiah(calculatedTotal) }}</span>
                </div>
              </div>

              <!-- Toggle Catat Kas Otomatis -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div class="flex items-center gap-2.5">
                  <Wallet class="w-4 h-4 text-indigo-600" />
                  <span class="text-xs font-semibold text-slate-800">Catat transaksi otomatis ke Grafik Arus Kas</span>
                </div>
                <input 
                  type="checkbox" 
                  v-model="form.recordCashflow" 
                  class="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <!-- Right 5 Cols: Live Digital License Card -->
            <div class="lg:col-span-5">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Preview Kartu Lisensi Digital</span>
                <span class="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                </span>
              </div>

              <!-- Modern Membership Card -->
              <div 
                class="rounded-2xl p-5 text-white shadow-xl relative overflow-hidden bg-gradient-to-br"
                :class="selectedPackageInfo.color"
              >
                <!-- Background Geometric Glow -->
                <div class="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                <div class="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>

                <div class="flex items-center justify-between relative z-10 mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs">
                      IK
                    </div>
                    <span class="font-extrabold text-sm tracking-wide">IKI KASIR</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-white/25 backdrop-blur-xs">
                    {{ form.packageType }}
                  </span>
                </div>

                <div class="relative z-10 space-y-1 mb-4">
                  <p class="text-[11px] uppercase tracking-wider text-white/70">Nama Outlet / Bisnis</p>
                  <h4 class="text-base font-extrabold truncate">{{ form.businessName || 'Toko Kasir Mitra' }}</h4>
                  <p class="text-xs text-white/85 font-medium truncate">Owner: {{ form.name || 'Nama Pelanggan' }}</p>
                </div>

                <div class="relative z-10 flex items-center justify-between pt-3 border-t border-white/20 text-[11px]">
                  <div>
                    <span class="text-white/70 block text-[10px]">BERLAKU HINGGA</span>
                    <span class="font-bold tracking-wide">{{ calculatedExpiredDate }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-white/70 block text-[10px]">STATUS</span>
                    <span class="font-extrabold text-emerald-300">AKTIF 🟢</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
                💡 <span class="font-medium">Data pelanggan langsung disinkronkan</span> ke metrik dashboard, tabel pelanggan aktif, dan laporan penjualan.
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Modal Footer / Action Buttons -->
      <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <button 
          v-if="currentStep > 1"
          @click="handlePrev"
          type="button"
          class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button 
            @click="emit('close')"
            type="button"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button 
            v-if="currentStep < 3"
            @click="handleNext"
            type="button"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <span>Lanjutkan</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <button 
            v-else
            @click="handleSubmit"
            :disabled="isSubmitting"
            type="button"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ isSubmitting ? 'Memproses Aktivasi...' : 'Simpan & Aktifkan Kasir' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

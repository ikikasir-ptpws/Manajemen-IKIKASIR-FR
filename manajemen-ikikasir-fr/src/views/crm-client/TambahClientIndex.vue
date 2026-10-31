<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Save,
  Share2,
  Sparkles,
  Store,
  User,
  UserPlus,
  Users,
  Wallet
} from 'lucide-vue-next'
import { customersApi, packagesApi, type PackageItem } from '../../api'
import { useReferral } from '../../composables/useReferral'

const router = useRouter()
const { validation, isValidating, error: referralError, validateReferralCode, resetValidation } = useReferral()

const businessTypeOptions = [
  'Kafe / Restoran / Warung makan',
  'Toko kelontong / Minimarket',
  'Fashion / Pakaian',
  'Laundry',
  'Barbershop / Salon',
  'Bengkel',
  'Lainnya'
]

const sourceOptions = [
  'Website',
  'Instagram',
  'WhatsApp',
  'Facebook Ads',
  'Referral',
  'Direct / Walk-in'
]

const countryOptions = ['+62 (Indonesia)']

const formData = ref({
  name: '',
  phone: '',
  email: '',
  businessName: '',
  businessType: '',
  packageId: '',
  source: 'Website',
  country: '+62 (Indonesia)',
  address: '',
  village: '',
  district: '',
  city: '',
  referralCode: '',
  notes: ''
})

const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)
const isLoadingPackages = ref(false)
const packages = ref<PackageItem[]>([])
const createdCustomer = ref<any>(null)
const copied = ref(false)

const isReferralSource = computed(() => formData.value.source === 'Referral')
const rewardPerActiveUser = computed(() => validation.value?.rewardPerActiveUser || 15000)

const clearError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const loadPackages = async () => {
  isLoadingPackages.value = true
  try {
    const res = await packagesApi.getAll({ isActive: true })
    packages.value = res.data || []
    if (!formData.value.packageId && packages.value.length > 0) {
      formData.value.packageId = packages.value[0]?.id || ''
    }
  } catch (err: any) {
    console.error('[TambahClient] gagal memuat paket:', err)
  } finally {
    isLoadingPackages.value = false
  }
}

onMounted(loadPackages)

const handleSourceChange = () => {
  if (!isReferralSource.value) {
    formData.value.referralCode = ''
    resetValidation()
  }
}

const handleValidateReferral = async () => {
  clearError('referralCode')
  const result = await validateReferralCode(formData.value.referralCode)
  if (result && !result.valid) {
    errors.value.referralCode = result.message
  }
}

const copyReferralCode = async () => {
  const code = createdCustomer.value?.referralCode
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}

const validateForm = () => {
  const errs: Record<string, string> = {}

  if (!formData.value.name.trim()) {
    errs.name = 'Nama lengkap client wajib diisi.'
  }

  const normalizedPhone = formData.value.phone.replace(/[\s()-]/g, '')
  if (!formData.value.phone.trim()) {
    errs.phone = 'Nomor WhatsApp client wajib diisi.'
  } else if (!/^(?:08|628|\+628)\d{8,11}$/.test(normalizedPhone)) {
    errs.phone = 'Format nomor WhatsApp tidak valid. Gunakan 08xx, 628xx, atau +628xx.'
  }

  if (!formData.value.email.trim()) {
    errs.email = 'Email client wajib diisi.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email.trim())) {
    errs.email = 'Format email tidak valid (contoh: nama@domain.com).'
  }

  if (!formData.value.businessName.trim()) {
    errs.businessName = 'Nama toko / usaha wajib diisi.'
  }
  if (!formData.value.businessType) {
    errs.businessType = 'Jenis usaha wajib dipilih.'
  }
  if (!formData.value.city.trim()) {
    errs.city = 'Kabupaten / Kota wajib diisi.'
  }
  if (isReferralSource.value && !formData.value.referralCode.trim()) {
    errs.referralCode = 'Kode referral wajib diisi karena sumber client adalah Referral.'
  }

  errors.value = errs
  return Object.keys(errs).length === 0
}

const handleSubmit = async () => {
  submitError.value = null
  if (!validateForm()) {
    submitError.value = '⚠️ Harap lengkapi kolom wajib sebelum menyimpan.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await customersApi.create({
      name: formData.value.name.trim(),
      businessName: formData.value.businessName.trim(),
      email: formData.value.email.trim().toLowerCase(),
      phone: formData.value.phone.trim(),
      address: formData.value.address.trim(),
      village: formData.value.village.trim(),
      district: formData.value.district.trim(),
      city: formData.value.city.trim(),
      packageId: formData.value.packageId || undefined,
      paymentMethod: 'QRIS',
      notes: formData.value.notes.trim() || undefined,
      source: formData.value.source,
      referralCode: isReferralSource.value ? formData.value.referralCode.trim().toUpperCase() : undefined,
      referralSource: isReferralSource.value ? 'Manual' : undefined
    })

    createdCustomer.value = res.data
  } catch (err: any) {
    submitError.value = err?.message || 'Gagal menyimpan client. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    phone: '',
    email: '',
    businessName: '',
    businessType: '',
    packageId: packages.value[0]?.id || '',
    source: 'Website',
    country: '+62 (Indonesia)',
    address: '',
    village: '',
    district: '',
    city: '',
    referralCode: '',
    notes: ''
  }
  errors.value = {}
  submitError.value = null
  createdCustomer.value = null
  resetValidation()
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-start gap-3">
        <button
          type="button"
          @click="router.push('/semua-pelanggan')"
          class="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          title="Kembali ke Semua Pelanggan"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <UserPlus class="w-6 h-6 text-indigo-600" />
            Tambah Client
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Daftarkan client baru ke sistem. Client otomatis mendapat kode referral untuk mengInvite pelanggan lain.
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="router.push('/semua-pelanggan')"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Kembali ke Daftar Pelanggan</span>
      </button>
    </header>

    <!-- Sukses -->
    <div
      v-if="createdCustomer"
      class="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-5 sm:p-7 space-y-5"
    >
      <div class="flex items-start gap-3">
        <span class="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
          <CheckCircle2 class="w-6 h-6" />
        </span>
        <div>
          <h2 class="text-lg font-extrabold text-slate-800">Client Berhasil Ditambahkan</h2>
          <p class="text-xs text-slate-500 mt-1">
            {{ createdCustomer.name }} ({{ createdCustomer.businessName }}) sudah tersimpan di sistem.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kode Referral Milik Client</p>
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm font-extrabold text-indigo-700">{{ createdCustomer.referralCode }}</span>
            <button
              type="button"
              @click="copyReferralCode"
              class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center cursor-pointer transition-colors"
              title="Salin kode referral"
            >
              <ClipboardCopy class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="copied" class="text-[10px] text-emerald-600 font-semibold mt-1">Kode referral berhasil disalin.</p>
          <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Client dapat membagikan kode ini di halaman Referral aplikasi IKIKASIR.
          </p>
        </div>

        <div v-if="createdCustomer.referredByCustomerId" class="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
          <p class="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Terhubung ke Pelanggan Pengundang</p>
          <p class="text-sm font-extrabold text-purple-950">{{ createdCustomer.referredByCustomerName }}</p>
          <p class="text-[11px] text-purple-700">{{ createdCustomer.referredByBusinessName }}</p>
          <p class="text-[11px] text-purple-600 mt-1.5 leading-relaxed">
            Client tercatat di daftar yang di-invite oleh pelanggan tersebut pada halaman Referral aplikasi IKIKASIR.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="router.push('/semua-pelanggan')"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Users class="w-4 h-4" />
          <span>Lihat Semua Pelanggan</span>
        </button>
        <button
          type="button"
          @click="resetForm"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
        >
          <UserPlus class="w-4 h-4" />
          <span>Tambah Client Lain</span>
        </button>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6" @submit.prevent="handleSubmit">
      <div class="lg:col-span-2 space-y-6">
        <!-- Data Diri -->
        <section class="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User class="w-4 h-4 text-indigo-600" />
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Diri & Kontak</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. HP / WhatsApp <span class="text-rose-500">*</span>
              </label>
              <div class="relative flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold">
                  🇮🇩 +62
                </span>
                <input
                  v-model="formData.phone"
                  type="tel"
                  placeholder="81234567890"
                  class="flex-1 pl-3 pr-3 py-2.5 rounded-r-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  :class="errors.phone ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                  @input="clearError('phone')"
                />
              </div>
              <p v-if="errors.phone" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.phone }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  :class="errors.name ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                  @input="clearError('name')"
                />
              </div>
              <p v-if="errors.name" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.name }}
              </p>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="formData.email"
                  type="email"
                  placeholder="budi@email.com"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  :class="errors.email ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                  @input="clearError('email')"
                />
              </div>
              <p v-if="errors.email" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.email }}
              </p>
            </div>
          </div>
        </section>

        <!-- Data Usaha -->
        <section class="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store class="w-4 h-4 text-indigo-600" />
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Usaha</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Toko / Usaha <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Building2 class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="formData.businessName"
                  type="text"
                  placeholder="Contoh: Toko Berkah Jaya"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  :class="errors.businessName ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                  @input="clearError('businessName')"
                />
              </div>
              <p v-if="errors.businessName" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.businessName }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jenis Usaha <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formData.businessType"
                class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white"
                :class="errors.businessType ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                @change="clearError('businessType')"
              >
                <option value="" disabled>Pilih jenis usaha</option>
                <option v-for="option in businessTypeOptions" :key="option" :value="option">{{ option }}</option>
              </select>
              <p v-if="errors.businessType" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.businessType }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Paket Langganan
              </label>
              <select
                v-model="formData.packageId"
                :disabled="isLoadingPackages"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
              >
                <option value="">Belum dipilih</option>
                <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">
                  {{ pkg.name }} — Rp {{ Number(pkg.price || 0).toLocaleString('id-ID') }} {{ pkg.period }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sumber Client
              </label>
              <select
                v-model="formData.source"
                @change="handleSourceChange"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
              >
                <option v-for="option in sourceOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Alamat -->
        <section class="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin class="w-4 h-4 text-indigo-600" />
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Alamat Lokasi Usaha</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Negara</label>
              <select
                v-model="formData.country"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
              >
                <option v-for="option in countryOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Lengkap <span class="text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea
                v-model="formData.address"
                rows="2"
                placeholder="Contoh: Jl. Merdeka No. 10, RT 01 RW 02"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Desa / Kelurahan</label>
              <input
                v-model="formData.village"
                type="text"
                placeholder="Contoh: Sukamaju"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kecamatan</label>
              <input
                v-model="formData.district"
                type="text"
                placeholder="Contoh: Cibinong"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kabupaten / Kota <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.city"
                type="text"
                placeholder="Contoh: Kabupaten Bogor"
                class="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                :class="errors.city ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'"
                @input="clearError('city')"
              />
              <p v-if="errors.city" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.city }}
              </p>
            </div>
          </div>
        </section>

        <!-- Catatan -->
        <section class="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-3">
          <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles class="w-4 h-4 text-indigo-600" />
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Catatan Internal</h2>
          </div>
          <textarea
            v-model="formData.notes"
            rows="3"
            placeholder="Contoh: Client perlu demo aplikasi kasir, butuh pendampingan setup printer."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          ></textarea>
        </section>
      </div>

      <!-- Panel kanan: Referal -->
      <aside class="space-y-6">
        <section
          class="rounded-3xl border shadow-xs p-5 space-y-4 transition-colors"
          :class="isReferralSource ? 'border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60' : 'border-slate-100 bg-white'"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              :class="isReferralSource ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'"
            >
              <Share2 class="w-4 h-4" />
            </span>
            <div>
              <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Kode Referal Client</h2>
              <p class="text-[11px] text-slate-500">Mengikuti halaman Referral aplikasi IKIKASIR</p>
            </div>
          </div>

          <p class="text-[11px] leading-relaxed text-slate-600">
            Pilih sumber <strong class="text-slate-800">Referral</strong> untuk menghubungkan client dengan pelanggan
            pengundang melalui kode referal. Client akan masuk ke daftar yang di-invite oleh pelanggan tersebut.
          </p>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Kode Referal <span v-if="isReferralSource" class="text-purple-600">*</span>
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                v-model="formData.referralCode"
                type="text"
                placeholder="Contoh: IKIKASIR-8F3KD"
                :disabled="!isReferralSource"
                class="flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono font-bold uppercase tracking-wider transition-all disabled:bg-slate-50 disabled:text-slate-400"
                :class="isReferralSource
                  ? (errors.referralCode ? 'border-rose-300 bg-rose-50/30' : 'border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100')
                  : 'border-slate-200'"
                @input="formData.referralCode = (formData.referralCode || '').toUpperCase(); clearError('referralCode'); resetValidation()"
              />
              <button
                type="button"
                @click="handleValidateReferral"
                :disabled="!isReferralSource || isValidating || !formData.referralCode.trim()"
                class="px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Loader2 v-if="isValidating" class="w-3.5 h-3.5 animate-spin" />
                <Link2 v-else class="w-3.5 h-3.5" />
                <span>Validasi</span>
              </button>
            </div>
            <p v-if="errors.referralCode" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3 h-3" /> {{ errors.referralCode }}
            </p>
            <p v-else-if="referralError" class="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3 h-3" /> {{ referralError }}
            </p>
          </div>

          <div v-if="validation?.valid && validation.upline" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
            <div class="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span class="text-xs font-bold">Tersambung ke Pelanggan Pengundang</span>
            </div>
            <div class="space-y-1 text-[11px] text-emerald-900">
              <div class="flex justify-between gap-2">
                <span class="text-emerald-700">Nama Pelanggan</span>
                <span class="font-bold text-right">{{ validation.upline.name }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-emerald-700">Nama Toko</span>
                <span class="font-bold text-right">{{ validation.upline.businessName }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-emerald-700">Kode Referal</span>
                <span class="font-mono font-bold text-right">{{ validation.upline.referralCode }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-emerald-700">No. WhatsApp</span>
                <span class="font-mono text-right">{{ validation.upline.phone }}</span>
              </div>
            </div>
            <p class="text-[11px] text-emerald-700 leading-relaxed">
              Client akan tercatat pada halaman Referral pelanggan tersebut dengan status
              <strong>Menunggu Verifikasi</strong> sampai client berstatus aktif.
            </p>
          </div>

          <div
            v-else-if="validation && !validation.valid"
            class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2"
          >
            <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{{ validation.message }}</span>
          </div>
        </section>

        <!-- Alur referral -->
        <section class="rounded-3xl border border-slate-100 bg-white shadow-xs p-5 space-y-3.5">
          <div class="flex items-center gap-2">
            <Wallet class="w-4 h-4 text-indigo-600" />
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Alur Referral IKIKASIR</h2>
          </div>

          <ol class="space-y-2.5 text-[11px] text-slate-600">
            <li class="flex gap-2.5">
              <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              <span>Client mendaftar memakai kode referal pelanggan pengundang.</span>
            </li>
            <li class="flex gap-2.5">
              <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
              <span>Client masuk daftar <strong class="text-slate-700">Menunggu Verifikasi</strong> di halaman Referral pengundang.</span>
            </li>
            <li class="flex gap-2.5">
              <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
              <span>Setelah client aktif, komisi <strong class="text-slate-700">Rp {{ rewardPerActiveUser.toLocaleString('id-ID') }}</strong> masuk ke saldo pengundang.</span>
            </li>
            <li class="flex gap-2.5">
              <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
              <span>Pengundang menarik saldo: <strong class="text-slate-700">Tarik Saldo → Menunggu Verifikasi Finance → Selesai</strong>.</span>
            </li>
          </ol>

          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
            Client yang baru ditambahkan otomatis mendapatkan kode referal sendiri (format
            <span class="font-mono font-bold text-indigo-600">IKIKASIR-XXXXX</span>) untuk dibagikan dari aplikasi IKIKASIR.
          </div>
        </section>

        <!-- Aksi -->
        <section class="rounded-3xl border border-slate-100 bg-white shadow-xs p-5 space-y-3">
          <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-[11px] font-semibold">
            <AlertCircle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{{ submitError }}</span>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Client' }}</span>
          </button>

          <button
            type="button"
            @click="router.push('/semua-pelanggan')"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
        </section>
      </aside>
    </form>
  </div>
</template>

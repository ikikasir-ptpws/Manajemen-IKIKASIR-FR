<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, CheckCircle2, AlertCircle, Sparkles, Store, User, Phone, Mail, MapPin, Package, Loader2 } from 'lucide-vue-next'
import { useAppData } from '../composables/useAppData'

const props = defineProps<{
  isOpen: boolean
  defaultPackage?: 'Basic' | 'Custom / IT One'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted', leadId: string): void
}>()

const { addRegistration } = useAppData()

// Form Data
const formData = ref({
  name: '',
  businessName: '',
  businessCategory: 'Retail',
  phone: '',
  email: '',
  address: '',
  packageInterest: 'Basic' as 'Basic' | 'Custom / IT One'
})

// Validation Errors
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submittedData = ref<any>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)

// Watch default package prop
watch(() => props.defaultPackage, (newPkg) => {
  if (newPkg) {
    formData.value.packageInterest = newPkg
  }
}, { immediate: true })

// Reset form when modal opens
watch(() => props.isOpen, (open) => {
  if (open) {
    isSuccess.value = false
    errors.value = {}
    submitError.value = null
    formData.value = {
      name: '',
      businessName: '',
      businessCategory: 'Retail',
      phone: '',
      email: '',
      address: '',
      packageInterest: props.defaultPackage || 'Basic'
    }
  }
})

const clearError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const validateForm = () => {
  const errs: Record<string, string> = {}

  if (!formData.value.name.trim()) {
    errs.name = 'Nama lengkap wajib diisi.'
  }

  if (!formData.value.businessName.trim()) {
    errs.businessName = 'Nama bisnis/toko wajib diisi.'
  }

  const cleanPhone = formData.value.phone.replace(/[^0-9]/g, '')
  if (!formData.value.phone.trim()) {
    errs.phone = 'Nomor WhatsApp wajib diisi.'
  } else if (cleanPhone.length < 9) {
    errs.phone = 'Nomor WhatsApp tidak valid (minimal 9 digit angka).'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.email.trim()) {
    errs.email = 'Email wajib diisi.'
  } else if (!emailRegex.test(formData.value.email.trim())) {
    errs.email = 'Format email tidak valid (contoh: nama@domain.com).'
  }

  // Alamat bersifat opsional — tidak blocking submit
  // (field ada untuk kelengkapan data, bukan syarat minimum pendaftaran)

  if (!formData.value.packageInterest) {
    errs.packageInterest = 'Paket wajib dipilih.'
  }

  errors.value = errs
  return Object.keys(errs).length === 0
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  submitError.value = null

  if (!validateForm()) {
    // Hitung jumlah field yang belum diisi
    const errCount = Object.keys(errors.value).length
    const errLabels: Record<string, string> = {
      name: 'Nama Lengkap',
      businessName: 'Nama Bisnis',
      phone: 'Nomor WhatsApp',
      email: 'Email',
      address: 'Alamat Usaha',
      packageInterest: 'Paket'
    }
    const missing = Object.keys(errors.value).map(k => errLabels[k] || k).join(', ')
    submitError.value = `⚠️ Harap lengkapi ${errCount} field wajib: ${missing}`
    // Scroll ke atas form agar user melihat error
    await nextTick()
    scrollAreaRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true
  try {
    const newLead = addRegistration({
      name: formData.value.name,
      businessName: formData.value.businessName,
      businessCategory: formData.value.businessCategory,
      phone: formData.value.phone,
      email: formData.value.email,
      address: formData.value.address,
      packageInterest: formData.value.packageInterest,
      source: 'Website',
      notes: `Pendaftaran mandiri via Form Website. Paket dipilih: ${formData.value.packageInterest}.`
    })

    if (!newLead || !newLead.id) {
      throw new Error('Gagal menyimpan data pendaftaran ke database.')
    }

    submittedData.value = newLead
    isSuccess.value = true
    emit('submitted', newLead.id)
  } catch (err: any) {
    console.error(err)
    submitError.value = `❌ ${err?.message || 'Pendaftaran gagal dikirim. Silakan coba lagi.'}`
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <!-- Modal Container Box with Explicit Fixed Height (82vh max 620px) -->
      <div 
        class="relative w-full max-w-lg h-[82vh] max-h-[620px] min-h-[450px] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
        @click.stop
      >
        <!-- 1. Modal Header (Fixed at top, non-scrollable) -->
        <div class="px-5 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold mb-0.5">
              <Sparkles class="w-3.5 h-3.5 text-amber-300" />
              <span>Form Pendaftaran Official</span>
            </div>
            <h3 class="text-base sm:text-lg font-extrabold tracking-tight">Pendaftaran Sistem IKIKASIR</h3>
          </div>

          <button 
            @click="closeModal"
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- SUCCESS STATE -->
        <div v-if="isSuccess" class="p-6 text-center space-y-5 overflow-y-auto flex-1 min-h-0">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 class="w-10 h-10" />
          </div>

          <div class="space-y-1.5">
            <h4 class="text-xl font-bold text-slate-800">✅ Pendaftaran berhasil dikirim</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              Data pendaftaran Anda telah berhasil dikirim dan sedang diproses oleh Super Admin.
            </p>
          </div>

          <!-- Submission Data Summary Box -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div class="flex justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700">
              <span>ID Pendaftaran:</span>
              <span class="text-indigo-600">{{ submittedData?.id }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">Nama Pendaftar:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.name }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">Nama Bisnis:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.businessName }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">Nomor WhatsApp:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.phone }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">Paket Dipilih:</span>
              <span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{{ submittedData?.packageInterest }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">Sumber:</span>
              <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Website</span>
            </div>
          </div>

          <p class="text-[11px] text-slate-400">
            Tim Super Admin kami akan segera memverifikasi dan menghubungi Anda via WhatsApp.
          </p>

          <button 
            @click="closeModal"
            class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

        <!-- 2. FORM STATE WITH DEDICATED INTERNAL SCROLLBAR -->
        <form v-else @submit.prevent="handleSubmit" class="flex-1 min-h-0 flex flex-col overflow-hidden">
          
          <!-- Inner Scrollable Form Inputs Container (with bottom padding pb-8) -->
          <div ref="scrollAreaRef" class="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 space-y-3.5 text-xs">
            
            <!-- Alert Note -->
            <div class="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 flex items-start gap-2 text-[11px]">
              <Sparkles class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                Isi form pendaftaran di bawah ini. Data Anda akan langsung tersimpan di sistem Super Admin untuk proses aktivasi akun.
              </p>
            </div>

            <!-- Error Banner -->
            <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-bold">
              <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
              <span>{{ submitError }}</span>
            </div>

            <!-- Nama Lengkap -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-indigo-500" />
                Nama Lengkap <span class="text-rose-500">*</span>
              </label>
              <input 
                v-model="formData.name"
                @input="clearError('name')"
                type="text"
                placeholder="Contoh: Budi Santoso"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.name ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.name" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.name }}
              </p>
            </div>

            <!-- Nama Bisnis & Kategori Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Store class="w-3.5 h-3.5 text-indigo-500" />
                  Nama Bisnis / Usaha <span class="text-rose-500">*</span>
                </label>
                <input 
                  v-model="formData.businessName"
                  @input="clearError('businessName')"
                  type="text"
                  placeholder="Contoh: Toko Berkah Jaya"
                  class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                  :class="errors.businessName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
                />
                <p v-if="errors.businessName" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle class="w-3 h-3" /> {{ errors.businessName }}
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Kategori Bisnis
                </label>
                <select 
                  v-model="formData.businessCategory"
                  class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium bg-white"
                >
                  <option value="Retail">Retail & Kelontong</option>
                  <option value="Kuliner & F&B">Kuliner & F&B / Resto</option>
                  <option value="Fashion & Butik">Fashion & Butik</option>
                  <option value="Minimarket & Grosir">Minimarket & Grosir</option>
                  <option value="Jasa & Servis">Jasa & Servis</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <!-- WhatsApp & Email Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone class="w-3.5 h-3.5 text-indigo-500" />
                  Nomor WhatsApp <span class="text-rose-500">*</span>
                </label>
                <input 
                  v-model="formData.phone"
                  @input="clearError('phone')"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                  :class="errors.phone ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
                />
                <p v-if="errors.phone" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle class="w-3 h-3" /> {{ errors.phone }}
                </p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail class="w-3.5 h-3.5 text-indigo-500" />
                  Email <span class="text-rose-500">*</span>
                </label>
                <input 
                  v-model="formData.email"
                  @input="clearError('email')"
                  type="email"
                  placeholder="budi@email.com"
                  class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                  :class="errors.email ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
                />
                <p v-if="errors.email" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle class="w-3 h-3" /> {{ errors.email }}
                </p>
              </div>
            </div>

            <!-- Paket Dipilih -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package class="w-3.5 h-3.5 text-indigo-500" />
                Paket yang Dipilih <span class="text-rose-500">*</span>
              </label>

              <div class="grid grid-cols-2 gap-2.5 pt-0.5">
                <label 
                  class="p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between"
                  :class="formData.packageInterest === 'Basic' ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-800">Basic</span>
                    <input type="radio" v-model="formData.packageInterest" @change="clearError('packageInterest')" value="Basic" class="text-indigo-600" />
                  </div>
                  <div class="mt-1">
                    <span class="text-xs font-bold text-indigo-600">Rp 250.000</span>
                    <span class="text-[10px] text-slate-500 block">/ bulan</span>
                  </div>
                </label>

                <label 
                  class="p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between"
                  :class="formData.packageInterest === 'Custom / IT One' ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-800">Custom / IT One</span>
                    <input type="radio" v-model="formData.packageInterest" @change="clearError('packageInterest')" value="Custom / IT One" class="text-indigo-600" />
                  </div>
                  <div class="mt-1">
                    <span class="text-xs font-bold text-purple-600">Konsultasi</span>
                    <span class="text-[10px] text-slate-500 block">Fitur Kustom</span>
                  </div>
                </label>
              </div>
              <p v-if="errors.packageInterest" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.packageInterest }}
              </p>
            </div>

            <!-- Alamat Usaha -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5 text-indigo-500" />
                Alamat Lengkap Usaha <span class="text-slate-400 text-xs font-normal">(Opsional)</span>
              </label>
              <textarea 
                v-model="formData.address"
                @input="clearError('address')"
                rows="2"
                placeholder="Contoh: Jl. Merdeka No. 10, Kel. Gambir, Jakarta Pusat"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.address ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              ></textarea>
              <p v-if="errors.address" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.address }}
              </p>
            </div>

          </div>

          <!-- 3. Modal Footer (Fixed at bottom of card, non-scrollable) -->
          <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button 
              type="button" 
              @click="closeModal"
              class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-colors cursor-pointer text-xs"
            >
              Batal
            </button>

            <button 
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Menyimpan...' : 'Kirim Pendaftaran' }}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  </Teleport>
</template>

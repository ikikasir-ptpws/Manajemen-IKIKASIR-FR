<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  UserPlus, 
  User, 
  Store, 
  Mail, 
  MapPin, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Package,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Share2,
  AlertCircle,
  Link2
} from 'lucide-vue-next'
import type { ClientLead, LeadStatus, LeadSource } from '../../types/crm'
import { useAppData, getOrCreateCustomerReferralCode } from '../../composables/useAppData'

const props = defineProps<{
  isOpen: boolean
  clientToEdit?: ClientLead | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', client: ClientLead): void
}>()

const { addRegistration, updateLead, customers } = useAppData()
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const activeTab = ref<'contact' | 'business'>('contact')

const formData = ref({
  name: '',
  businessName: '',
  businessCategory: 'Retail',
  phone: '',
  email: '',
  address: '',
  status: 'New' as LeadStatus,
  source: 'Website' as LeadSource,
  packageInterest: 'Basic' as 'Basic' | 'Pro' | 'Add on' | 'Custom / IT One' | string,
  estimatedDeal: 250000,
  notes: '',
  followUpSchedule: 'Hari ini' as 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat',
  referralCode: '',
  referredByCustomerId: '',
  referredByCustomerName: '',
  referredByBusinessName: ''
})

const categories = ['Retail', 'F&B / Kuliner', 'Fashion & Butik', 'Jasa & Servis', 'Minimarket & Grosir', 'Lainnya']
const sources: LeadSource[] = ['Website', 'Instagram', 'WhatsApp', 'Facebook Ads', 'Referral', 'Direct / Walk-in']
const statuses: LeadStatus[] = ['New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost']

const statusColors: Record<LeadStatus, { bg: string, text: string }> = {
  New: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
  Contacted: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
  'Follow Up': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600' },
  Interested: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-600' },
  Converted: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  Lost: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-600' },
}

const handlePackageChange = () => {
  const deals: Record<string, number> = {
    'Basic': 250000,
    'Pro': 500000,
    'Add on': 150000,
    'Custom / IT One': 1500000
  }
  formData.value.estimatedDeal = deals[formData.value.packageInterest] || 250000
}

// Pencocokan otomatis kode referral dengan pelanggan terdaftar
const matchedCustomer = computed(() => {
  if (formData.value.source !== 'Referral') return null
  const code = formData.value.referralCode?.trim().toUpperCase()
  if (!code) return null
  return customers.value.find(c => 
    (c.referralCode && c.referralCode.toUpperCase() === code) ||
    c.id.toUpperCase() === code ||
    (c.phone && c.phone.replace(/[^0-9]/g, '') === code.replace(/[^0-9]/g, ''))
  ) || null
})

// Ketika pelanggan pengundang dipilih dari dropdown quick select
const selectReferringCustomer = (customerId: string) => {
  if (!customerId) {
    formData.value.referralCode = ''
    formData.value.referredByCustomerId = ''
    formData.value.referredByCustomerName = ''
    formData.value.referredByBusinessName = ''
    return
  }
  const cust = customers.value.find(c => c.id === customerId)
  if (cust) {
    formData.value.referralCode = cust.referralCode || getOrCreateCustomerReferralCode(cust)
    formData.value.referredByCustomerId = cust.id
    formData.value.referredByCustomerName = cust.name
    formData.value.referredByBusinessName = cust.businessName
  }
}

// Sinkronkan data pengundang jika kode referal cocok otomatis
watch(matchedCustomer, (cust) => {
  if (cust) {
    formData.value.referredByCustomerId = cust.id
    formData.value.referredByCustomerName = cust.name
    formData.value.referredByBusinessName = cust.businessName
  }
})

// Watch for editing client
watch(() => props.clientToEdit, (val) => {
  if (val) {
    formData.value = {
      name: val.name,
      businessName: val.businessName,
      businessCategory: val.businessCategory || 'Retail',
      phone: val.phone,
      email: val.email,
      address: val.address || '',
      status: val.status,
      source: val.source,
      packageInterest: val.packageInterest || 'Basic',
      estimatedDeal: val.estimatedDeal || 250000,
      notes: val.notes || '',
      followUpSchedule: val.followUpSchedule || 'Hari ini',
      referralCode: val.referralCode || '',
      referredByCustomerId: val.referredByCustomerId || '',
      referredByCustomerName: val.referredByCustomerName || '',
      referredByBusinessName: val.referredByBusinessName || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    businessName: '',
    businessCategory: 'Retail',
    phone: '',
    email: '',
    address: '',
    status: 'New',
    source: 'Website',
    packageInterest: 'Basic',
    estimatedDeal: 250000,
    notes: '',
    followUpSchedule: 'Hari ini',
    referralCode: '',
    referredByCustomerId: '',
    referredByCustomerName: '',
    referredByBusinessName: ''
  }
  activeTab.value = 'contact'
}

const handleSubmit = () => {
  submitError.value = null

  if (!formData.value.name.trim()) {
    submitError.value = 'Nama lengkap wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.businessName.trim()) {
    submitError.value = 'Nama bisnis/usaha wajib diisi pada Profil Usaha.'
    activeTab.value = 'business'
    return
  }

  isSubmitting.value = true

  try {
    let savedClient: ClientLead
    const isReferral = formData.value.source === 'Referral'
    const finalReferralCode = isReferral ? formData.value.referralCode.trim().toUpperCase() : undefined
    const finalReferredCustomerId = isReferral ? (formData.value.referredByCustomerId || matchedCustomer.value?.id || undefined) : undefined
    const finalReferredCustomerName = isReferral ? (formData.value.referredByCustomerName || matchedCustomer.value?.name || undefined) : undefined
    const finalReferredBusinessName = isReferral ? (formData.value.referredByBusinessName || matchedCustomer.value?.businessName || undefined) : undefined

    if (props.clientToEdit) {
      // MODE EDIT — update data yang sudah ada di store
      const nowIso = new Date().toISOString()
      savedClient = {
        ...props.clientToEdit,
        name: formData.value.name,
        businessName: formData.value.businessName,
        businessCategory: formData.value.businessCategory,
        phone: formData.value.phone || props.clientToEdit.phone,
        email: formData.value.email || props.clientToEdit.email,
        address: formData.value.address || props.clientToEdit.address || '',
        status: formData.value.status,
        source: formData.value.source,
        packageInterest: formData.value.packageInterest,
        estimatedDeal: formData.value.estimatedDeal,
        notes: formData.value.notes || props.clientToEdit.notes || '',
        followUpSchedule: formData.value.followUpSchedule,
        referralCode: finalReferralCode,
        referredByCustomerId: finalReferredCustomerId,
        referredByCustomerName: finalReferredCustomerName,
        referredByBusinessName: finalReferredBusinessName,
        updated_at: nowIso
      }
      updateLead(savedClient)
    } else {
      // MODE TAMBAH — simpan ke store via addRegistration
      savedClient = addRegistration({
        name: formData.value.name,
        businessName: formData.value.businessName,
        businessCategory: formData.value.businessCategory,
        phone: formData.value.phone || '08' + Math.floor(100000000 + Math.random() * 900000000),
        email: formData.value.email || `${formData.value.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
        address: formData.value.address || 'Belum diisi',
        packageInterest: formData.value.packageInterest,
        source: formData.value.source,
        notes: formData.value.notes || `Calon client ditambahkan manual via CRM Admin. Paket: ${formData.value.packageInterest}.${isReferral && finalReferralCode ? ` Referral dari: ${finalReferredCustomerName || finalReferralCode}.` : ''}`,
        referralCode: finalReferralCode,
        referredByCustomerId: finalReferredCustomerId,
        referredByCustomerName: finalReferredCustomerName,
        referredByBusinessName: finalReferredBusinessName
      })
      // Terapkan fields tambahan jika diperlukan
      if (formData.value.status !== 'New' || formData.value.estimatedDeal !== 250000 || formData.value.followUpSchedule !== 'Hari ini') {
        updateLead({
          ...savedClient,
          status: formData.value.status,
          estimatedDeal: formData.value.estimatedDeal,
          followUpSchedule: formData.value.followUpSchedule
        })
      }
    }

    emit('saved', savedClient)
    emit('close')
    resetForm()
  } catch (err: any) {
    console.error('[ClientFormModal] handleSubmit error:', err)
    submitError.value = err?.message || 'Gagal menyimpan data. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5">
    <!-- Backdrop Blur -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      @click="emit('close')"
    ></div>

    <!-- Modal Dialog -->
    <div class="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[94vh]">
      
      <!-- Top Bar / Gradient Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <UserPlus class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                {{ clientToEdit ? 'Edit Calon Client' : 'Tambah Calon Client' }}
              </h2>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-100 text-indigo-700">
                <Sparkles class="w-2.5 h-2.5" /> CRM
              </span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Kelola prospek calon pelanggan kasir.</p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Tabs (2 Tabs Ringkas) -->
      <div class="px-4 sm:px-6 border-b border-slate-100 bg-white flex items-center gap-2 text-xs font-bold pt-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button 
          type="button"
          @click="activeTab = 'contact'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="activeTab === 'contact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <User class="w-3.5 h-3.5" />
          <span>1. Kontak & Personal</span>
        </button>
        <button 
          type="button"
          @click="activeTab = 'business'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="activeTab === 'business' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <Store class="w-3.5 h-3.5" />
          <span>2. Profil Usaha & Kebutuhan Kasir</span>
        </button>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-5">
        
        <!-- Error Banner -->
        <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-bold">
          <span>⚠️ {{ submitError }}</span>
        </div>

        <!-- TAB 1: KONTAK & PERSONAL -->
        <div v-if="activeTab === 'contact'" class="space-y-4 animate-in fade-in duration-150">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Client <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.name"
                  type="text" 
                  placeholder="Contoh: Budi Santoso"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp <span class="text-rose-500">*</span>
              </label>
              <div class="relative flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold">
                  🇮🇩 +62
                </span>
                <input 
                  v-model="formData.phone"
                  type="tel" 
                  placeholder="81234567890"
                  class="flex-1 pl-3 pr-3 py-2.5 rounded-r-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.email"
                  type="email" 
                  placeholder="budi@email.com"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: PROFIL USAHA & KEBUTUHAN KASIR -->
        <div v-if="activeTab === 'business'" class="space-y-5 animate-in fade-in duration-150">
          
          <!-- Section 1: Profil Usaha -->
          <div class="space-y-3.5">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Store class="w-4 h-4 text-indigo-600" />
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Profil Usaha</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Bisnis / Toko <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Store class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="formData.businessName"
                    type="text" 
                    placeholder="Contoh: Toko ABC / Kopi Senja"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis / Kategori Bisnis
                </label>
                <div class="relative">
                  <Tag class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    v-model="formData.businessCategory"
                    class="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white appearance-none cursor-pointer"
                  >
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Lokasi Toko
                </label>
                <div class="relative">
                  <MapPin class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="formData.address"
                    type="text" 
                    placeholder="Contoh: Jl. Merdeka No. 10, Jakarta Pusat"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Kebutuhan Paket & Prospek -->
          <div class="space-y-3.5 pt-2">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Package class="w-4 h-4 text-indigo-600" />
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Kebutuhan Paket & Catatan</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Minat Paket -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Minat Paket Kasir
                </label>
                <select 
                  v-model="formData.packageInterest"
                  @change="handlePackageChange"
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white"
                >
                  <option value="Basic">Paket Basic (Rp 250.000 / bln)</option>
                  <option value="Pro">Paket Pro (Rp 500.000 / bln)</option>
                  <option value="Add on">Paket Add on (Rp 150.000)</option>
                  <option value="Custom / IT One">Paket Custom / IT One (Konsultasi)</option>
                </select>
              </div>

              <!-- Sumber Lead -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sumber Prospek (Lead Source)
                </label>
                <select 
                  v-model="formData.source"
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white"
                >
                  <option v-for="src in sources" :key="src" :value="src">{{ src }}</option>
                </select>
              </div>

              <!-- Input Kode Referal & Sambungan Pelanggan (Hanya jika Sumber = Referral) -->
              <div 
                v-if="formData.source === 'Referral'" 
                class="md:col-span-2 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/60 to-pink-50/50 border border-purple-200/90 shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Share2 class="w-4 h-4" />
                    </span>
                    <div>
                      <h4 class="text-xs font-bold text-purple-950 uppercase tracking-wide">Kode Referal & Pelanggan Pengundang</h4>
                      <p class="text-[11px] text-purple-700/80">Calon client akan otomatis terhubung ke pelanggan IKI KASIR yang meng-invite</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold text-purple-700 bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Link2 class="w-3 h-3 text-purple-600" />
                    Tersambung Pelanggan
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Input Kode Referal Manual -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Input Kode Referal <span class="text-purple-600">*</span>
                    </label>
                    <div class="relative">
                      <input 
                        v-model="formData.referralCode"
                        @input="formData.referralCode = (formData.referralCode || '').toUpperCase()"
                        type="text"
                        placeholder="Contoh: REF-BUDI101"
                        class="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-mono font-bold uppercase tracking-wider text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                      />
                      <span v-if="matchedCustomer" class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                        <CheckCircle2 class="w-4 h-4" />
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-1">Ketik kode referal milik pelanggan yang mengundang.</p>
                  </div>

                  <!-- Dropdown Quick Select Pelanggan Pengundang -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Atau Pilih Pelanggan Pengundang
                    </label>
                    <select 
                      @change="(e: any) => selectReferringCustomer(e.target.value)"
                      class="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                    >
                      <option value="">-- Cari / Pilih Pelanggan --</option>
                      <option 
                        v-for="c in customers" 
                        :key="c.id" 
                        :value="c.id"
                        :selected="matchedCustomer?.id === c.id || formData.referredByCustomerId === c.id"
                      >
                        {{ c.name }} ({{ c.businessName }}) — {{ c.referralCode || c.id }}
                      </option>
                    </select>
                    <p class="text-[10px] text-slate-500 mt-1">Otomatis terisi jika memilih dari daftar pelanggan.</p>
                  </div>
                </div>

                <!-- Status Terhubung ke Pelanggan -->
                <div 
                  v-if="matchedCustomer" 
                  class="p-3 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
                >
                  <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-bold text-emerald-800">Tersambung ke Pelanggan:</span>
                      <span class="font-extrabold text-emerald-950">{{ matchedCustomer.name }}</span>
                      <span class="text-[11px] text-emerald-700 font-medium">({{ matchedCustomer.businessName }})</span>
                      <span class="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                        {{ matchedCustomer.referralCode || matchedCustomer.id }}
                      </span>
                    </div>
                    <p class="text-[11px] text-emerald-700 mt-0.5">
                      Calon client ini berhasil terhubung ke pelanggan pengundang dan akan tercatat otomatis di daftar calon klien yang di-invite oleh pelanggan tersebut.
                    </p>
                  </div>
                </div>

                <div 
                  v-else-if="formData.referralCode.trim()" 
                  class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2"
                >
                  <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kode referral belum cocok dengan data pelanggan terdaftar. Anda tetap dapat menyimpannya atau memilih pelanggan langsung dari dropdown di samping.</span>
                </div>
              </div>

              <!-- Status Prospek (Hanya ditampilkan saat EDIT data) -->
              <div v-if="clientToEdit" class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status Prospek Lead
                </label>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button 
                    v-for="st in statuses" 
                    :key="st"
                    type="button"
                    @click="formData.status = st"
                    class="py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center"
                    :class="formData.status === st ? `${statusColors[st].bg} ${statusColors[st].text} shadow-xs ring-2 ring-indigo-300` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'"
                  >
                    {{ st }}
                  </button>
                </div>
              </div>

              <!-- Catatan Kebutuhan -->
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Kebutuhan Client
                </label>
                <textarea 
                  v-model="formData.notes"
                  rows="2"
                  placeholder="Contoh: Client tertarik dengan paket Basic. Membutuhkan panduan setting printer dan demo aplikasi kasir."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                ></textarea>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button 
          @click="emit('close')"
          type="button"
          class="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Batal
        </button>

        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Tombol Kembali jika di Tab 2 -->
          <button 
            v-if="activeTab === 'business'"
            type="button"
            @click="activeTab = 'contact'"
            class="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <!-- Tombol Selanjutnya jika di Tab 1 -->
          <button 
            v-if="activeTab === 'contact'"
            type="button"
            @click="activeTab = 'business'"
            class="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <!-- Tombol Simpan -->
          <button 
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <CheckCircle2 v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : (clientToEdit ? 'Simpan Perubahan' : 'Simpan Client') }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  UserPlus, 
  User, 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Compass, 
  ArrowRight,
  ShieldCheck,
  DollarSign
} from 'lucide-vue-next'
import type { ClientLead, LeadStatus, LeadSource } from '../../types/crm'

const props = defineProps<{
  isOpen: boolean
  clientToEdit?: ClientLead | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', client: ClientLead): void
}>()

const isSubmitting = ref(false)
const activeTab = ref<'contact' | 'business' | 'crm'>('contact')

const formData = ref({
  name: '',
  businessName: '',
  businessCategory: 'Retail',
  phone: '',
  email: '',
  address: '',
  status: 'New' as LeadStatus,
  source: 'Website' as LeadSource,
  packageInterest: 'Premium' as 'Basic' | 'Pro' | 'Premium',
  estimatedDeal: 349000,
  notes: '',
  followUpSchedule: 'Hari ini' as 'Hari ini' | 'Besok' | '2 Hari lagi' | '3 Hari lagi' | '5 Hari lagi' | 'Terlambat'
})

const categories = ['Retail', 'F&B / Kuliner', 'Fashion & Butik', 'Jasa & Servis', 'Minimarket & Grosir', 'Lainnya']
const sources: LeadSource[] = ['Website', 'Instagram', 'WhatsApp', 'Facebook Ads', 'Referral', 'Direct / Walk-in']
const statuses: LeadStatus[] = ['New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost']

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
      packageInterest: val.packageInterest || 'Premium',
      estimatedDeal: val.estimatedDeal || 349000,
      notes: val.notes || '',
      followUpSchedule: val.followUpSchedule || 'Hari ini'
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
    packageInterest: 'Premium',
    estimatedDeal: 349000,
    notes: '',
    followUpSchedule: 'Hari ini'
  }
  activeTab.value = 'contact'
}

const statusColors: Record<LeadStatus, { bg: string, text: string }> = {
  New: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
  Contacted: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
  'Follow Up': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600' },
  Interested: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-600' },
  Converted: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  Lost: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-600' },
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const handleSubmit = () => {
  if (!formData.value.name.trim()) {
    formData.value.name = 'Calon Client Baru'
  }
  if (!formData.value.businessName.trim()) {
    formData.value.businessName = 'Toko ' + formData.value.name
  }

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    const savedClient: ClientLead = {
      id: props.clientToEdit ? props.clientToEdit.id : 'lead-' + Date.now(),
      no: props.clientToEdit ? props.clientToEdit.no : 1,
      name: formData.value.name,
      businessName: formData.value.businessName,
      businessCategory: formData.value.businessCategory,
      phone: formData.value.phone || '0812' + Math.floor(10000000 + Math.random() * 90000000),
      email: formData.value.email || `${formData.value.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
      address: formData.value.address || 'Jl. Sudirman, Jakarta',
      status: formData.value.status,
      source: formData.value.source,
      lastFollowUp: '04 Sep 2026',
      packageInterest: formData.value.packageInterest,
      estimatedDeal: formData.value.estimatedDeal,
      notes: formData.value.notes || 'Tertarik dengan fitur kasir POS dan manajemen CRM.',
      followUpSchedule: formData.value.followUpSchedule,
      followUpHistory: props.clientToEdit ? props.clientToEdit.followUpHistory : [
        {
          id: 'fu-1',
          date: '04 Sep 2026',
          time: '11:00',
          channel: 'Sistem',
          notes: 'Client baru terdaftar melalui formulir CRM.'
        }
      ]
    }

    emit('saved', savedClient)
    emit('close')
    resetForm()
  }, 400)
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
    <!-- Backdrop Blur -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      @click="emit('close')"
    ></div>

    <!-- Modal Dialog -->
    <div class="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
      
      <!-- Top Bar / Gradient Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <UserPlus class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900">
                {{ clientToEdit ? 'Edit Data Calon Client' : 'Tambah Calon Client Baru' }}
              </h2>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                <Sparkles class="w-3 h-3" /> FORM CRM
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Kelola prospek calon pelanggan kasir dan rencana follow up.</p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="px-6 border-b border-slate-100 bg-white flex items-center gap-2 text-xs font-bold pt-2">
        <button 
          type="button"
          @click="activeTab = 'contact'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'contact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <User class="w-3.5 h-3.5" />
          <span>1. Kontak & Personal</span>
        </button>
        <button 
          type="button"
          @click="activeTab = 'business'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'business' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <Store class="w-3.5 h-3.5" />
          <span>2. Profil Usaha</span>
        </button>
        <button 
          type="button"
          @click="activeTab = 'crm'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'crm' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <Compass class="w-3.5 h-3.5" />
          <span>3. Status CRM & Follow Up</span>
        </button>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5">
        
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

        <!-- TAB 2: PROFIL BISNIS -->
        <div v-if="activeTab === 'business'" class="space-y-4 animate-in fade-in duration-150">
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

        <!-- TAB 3: STATUS CRM & PROSPEK -->
        <div v-if="activeTab === 'crm'" class="space-y-4 animate-in fade-in duration-150">
          <!-- Status Selector Grid -->
          <div>
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <!-- Minat Paket -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Minat Paket Kasir
              </label>
              <select 
                v-model="formData.packageInterest"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white"
              >
                <option value="Basic">Paket Basic (Rp 99.000 / bln)</option>
                <option value="Pro">Paket Pro (Rp 199.000 / bln)</option>
                <option value="Premium">Paket Premium (Rp 349.000 / bln)</option>
              </select>
            </div>

            <!-- Jadwal Follow Up -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jadwal Follow Up
              </label>
              <select 
                v-model="formData.followUpSchedule"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white"
              >
                <option value="Hari ini">Hari ini</option>
                <option value="Besok">Besok</option>
                <option value="2 Hari lagi">2 Hari lagi</option>
                <option value="3 Hari lagi">3 Hari lagi</option>
                <option value="5 Hari lagi">5 Hari lagi</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>

            <!-- Estimasi Deal -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimasi Potensi Nilai Deal
              </label>
              <input 
                v-model.number="formData.estimatedDeal"
                type="number"
                step="50000"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
              />
            </div>

            <!-- Catatan Kebutuhan -->
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan Kebutuhan Client
              </label>
              <textarea 
                v-model="formData.notes"
                rows="2"
                placeholder="Contoh: Client tertarik dengan paket premium. Membutuhkan integrasi QRIS dan demo aplikasi minggu depan."
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
              ></textarea>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <button 
          @click="emit('close')"
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Batal
        </button>

        <div class="flex items-center gap-2">
          <button 
            v-if="activeTab !== 'crm'"
            type="button"
            @click="activeTab = activeTab === 'contact' ? 'business' : 'crm'"
            class="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <button 
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Menyimpan...' : (clientToEdit ? 'Simpan Perubahan' : 'Simpan Calon Client') }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

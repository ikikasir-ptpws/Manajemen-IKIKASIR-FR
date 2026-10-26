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
  CreditCard,
  Upload,
  Image,
  Trash2,
  Eye,
  FileText,
  Check,
  Building2,
  Receipt
} from 'lucide-vue-next'
import type { Customer, PackageType } from '../../types/dashboard'
import { 
  useAppData, 
  getOrCreateCustomerReferralCode, 
  SAMPLE_RECEIPT_BCA, 
  SAMPLE_RECEIPT_QRIS 
} from '../../composables/useAppData'

const props = defineProps<{
  isOpen: boolean
  customerToEdit?: Customer | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', customer: Customer): void
}>()

const { customers, invoices } = useAppData()

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const activeTab = ref<'contact' | 'business' | 'payment'>('contact')
const isReceiptZoomOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const categories = ['Retail', 'F&B / Kuliner', 'Fashion & Butik', 'Jasa & Servis', 'Minimarket & Grosir', 'Lainnya']
const sources = ['Website', 'Instagram', 'WhatsApp', 'Facebook Ads', 'Referral', 'Direct / Walk-in']
const packageOptions: PackageType[] = ['Basic', 'Pro', 'Add on', 'Custom / IT One']

const paymentMethods = [
  { id: 'Transfer BCA (PT PUNDI MAS BERKAH)', name: 'Transfer BCA', desc: 'Rek: 8831-299-888 a.n PT Pundi Mas Berkah', icon: 'BCA' },
  { id: 'Transfer Mandiri', name: 'Transfer Mandiri', desc: 'Rekening Mandiri Corporate', icon: 'Mandiri' },
  { id: 'Transfer BRI', name: 'Transfer BRI', desc: 'Rekening BRI Bisnis', icon: 'BRI' },
  { id: 'QRIS', name: 'QRIS Instant', desc: 'Gopay, OVO, ShopeePay, BCA QRIS', icon: 'QRIS' },
  { id: 'Tunai / Cash', name: 'Tunai / Cash', desc: 'Pembayaran langsung di kantor / kasir', icon: 'Cash' }
]

const packagePrices: Record<string, number> = {
  'Basic': 250000,
  'Pro': 500000,
  'Add on': 150000,
  'Custom': 1500000,
  'Custom / IT One': 1500000
}

const formData = ref({
  name: '',
  businessName: '',
  category: 'Retail',
  phone: '',
  email: '',
  address: '',
  packageType: 'Basic' as PackageType,
  amount: 250000,
  source: 'Website',
  referralCode: '',
  referredByCustomerId: '',
  referredByCustomerName: '',
  referredByBusinessName: '',
  notes: '',
  // Fields khusus Pembayaran & Bukti Transfer
  paymentMethod: 'Transfer BCA (PT PUNDI MAS BERKAH)',
  paymentDate: new Date().toISOString().substring(0, 10),
  paymentStatus: 'Paid' as 'Paid' | 'Pending',
  paymentProofUrl: '',
  paymentProofFileName: ''
})

const handlePackageChange = () => {
  formData.value.amount = packagePrices[formData.value.packageType] || 250000
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
    formData.value.referredByBusinessName = cust.businessName || cust.business || ''
  }
}

// Sinkronkan data pengundang jika kode referal cocok otomatis
watch(matchedCustomer, (cust) => {
  if (cust) {
    formData.value.referredByCustomerId = cust.id
    formData.value.referredByCustomerName = cust.name
    formData.value.referredByBusinessName = cust.businessName || cust.business || ''
  }
})

// Watch for editing customer
watch(() => props.customerToEdit, (val) => {
  if (val) {
    formData.value = {
      name: val.name,
      businessName: val.businessName || val.business || '',
      category: val.category || 'Retail',
      phone: val.phone || '',
      email: val.email || '',
      address: val.address || '',
      packageType: (val.packageType as PackageType) || 'Basic',
      amount: val.amount || packagePrices[val.packageType] || 250000,
      source: 'Website',
      referralCode: val.referralCode || '',
      referredByCustomerId: val.referredByCustomerId || '',
      referredByCustomerName: val.referredByCustomerName || '',
      referredByBusinessName: '',
      notes: val.notes || '',
      paymentMethod: val.paymentMethod || 'Transfer BCA (PT PUNDI MAS BERKAH)',
      paymentDate: new Date().toISOString().substring(0, 10),
      paymentStatus: 'Paid',
      paymentProofUrl: val.paymentProofUrl || '',
      paymentProofFileName: val.paymentProofUrl ? 'bukti_transfer.jpg' : ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    businessName: '',
    category: 'Retail',
    phone: '',
    email: '',
    address: '',
    packageType: 'Basic',
    amount: 250000,
    source: 'Website',
    referralCode: '',
    referredByCustomerId: '',
    referredByCustomerName: '',
    referredByBusinessName: '',
    notes: '',
    paymentMethod: 'Transfer BCA (PT PUNDI MAS BERKAH)',
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentStatus: 'Paid',
    paymentProofUrl: '',
    paymentProofFileName: ''
  }
  activeTab.value = 'contact'
  submitError.value = null
}

// Upload Handler
const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    processFile(e.dataTransfer.files[0])
  }
}

const processFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    submitError.value = 'Harap upload file gambar bukti transfer (JPG, PNG, atau WEBP).'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    submitError.value = 'Ukuran file gambar maksimal 5MB.'
    return
  }

  submitError.value = null
  const reader = new FileReader()
  reader.onload = (event) => {
    formData.value.paymentProofUrl = event.target?.result as string
    formData.value.paymentProofFileName = file.name
  }
  reader.readAsDataURL(file)
}

const useSampleReceipt = (type: 'BCA' | 'QRIS') => {
  formData.value.paymentProofUrl = type === 'BCA' ? SAMPLE_RECEIPT_BCA : SAMPLE_RECEIPT_QRIS
  formData.value.paymentProofFileName = type === 'BCA' ? 'contoh_transfer_bca.jpg' : 'contoh_transfer_qris.jpg'
  formData.value.paymentMethod = type === 'BCA' ? 'Transfer BCA (PT PUNDI MAS BERKAH)' : 'QRIS'
}

const removePaymentProof = () => {
  formData.value.paymentProofUrl = ''
  formData.value.paymentProofFileName = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const handleSubmit = () => {
  submitError.value = null

  if (!formData.value.name.trim()) {
    submitError.value = 'Nama lengkap pelanggan wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.businessName.trim()) {
    submitError.value = 'Nama bisnis/usaha wajib diisi pada Profil Usaha.'
    activeTab.value = 'business'
    return
  }
  if (!formData.value.phone.trim()) {
    submitError.value = 'Nomor telepon/WhatsApp pelanggan wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.paymentMethod) {
    submitError.value = 'Metode pembayaran wajib dipilih pada tab Pembayaran.'
    activeTab.value = 'payment'
    return
  }

  isSubmitting.value = true

  try {
    let savedCustomer: Customer
    const cleanPhone = formData.value.phone.replace(/[^0-9]/g, '')
    const finalPhone = cleanPhone.startsWith('0') ? cleanPhone : (cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : '0' + cleanPhone)

    if (props.customerToEdit) {
      // MODE EDIT
      const idx = customers.value.findIndex(c => c.id === props.customerToEdit?.id)
      if (idx !== -1) {
        const curr = customers.value[idx]
        savedCustomer = {
          ...curr,
          name: formData.value.name.trim(),
          businessName: formData.value.businessName.trim(),
          business: formData.value.businessName.trim(),
          category: formData.value.category,
          phone: finalPhone,
          email: formData.value.email.trim() || curr.email,
          address: formData.value.address.trim() || curr.address,
          packageType: formData.value.packageType,
          amount: Number(formData.value.amount) || curr.amount || 250000,
          paymentMethod: formData.value.paymentMethod,
          paymentProofUrl: formData.value.paymentProofUrl || curr.paymentProofUrl,
          notes: formData.value.notes || curr.notes
        }
        customers.value[idx] = savedCustomer
      } else {
        throw new Error('Data pelanggan tidak ditemukan.')
      }
    } else {
      // MODE TAMBAH BARU
      const newId = 'cust-' + Date.now()
      const expDate = new Date()
      expDate.setMonth(expDate.getMonth() + 1)
      const expISO = expDate.toISOString().substring(0, 10)

      savedCustomer = {
        id: newId,
        no: customers.value.length + 1,
        name: formData.value.name.trim(),
        businessName: formData.value.businessName.trim(),
        business: formData.value.businessName.trim(),
        category: formData.value.category,
        phone: finalPhone,
        email: formData.value.email.trim() || `${formData.value.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
        address: formData.value.address.trim() || 'Indonesia',
        packageType: formData.value.packageType,
        amount: Number(formData.value.amount) || 250000,
        paymentMethod: formData.value.paymentMethod,
        paymentProofUrl: formData.value.paymentProofUrl || undefined,
        joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        expiredDate: expISO,
        status: 'active',
        technicianStatus: 'pending_setup',
        referralCode: getOrCreateCustomerReferralCode({ name: formData.value.name, id: newId }),
        referredByCustomerId: formData.value.referredByCustomerId || undefined,
        referredByCustomerName: formData.value.referredByCustomerName || undefined,
        notes: formData.value.notes || `Pelanggan baru ditambahkan manual via Admin CRM. Paket: ${formData.value.packageType}.`
      }

      customers.value.unshift(savedCustomer)

      // Otomatis buat Invoice pertama di data langganan
      const newInvoice = {
        id: 'INV-' + Date.now().toString().slice(-8),
        customerId: savedCustomer.id,
        customerName: savedCustomer.name,
        businessName: savedCustomer.businessName || '',
        phone: savedCustomer.phone || '',
        package: savedCustomer.packageType,
        amount: savedCustomer.amount || 250000,
        billingCycleMonths: 1,
        date: formData.value.paymentDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        paymentMethod: savedCustomer.paymentMethod || 'Transfer BCA',
        status: (formData.value.paymentStatus === 'Pending' ? 'Pending' : 'Paid') as 'Paid' | 'Pending',
        paymentProofUrl: savedCustomer.paymentProofUrl,
        notes: formData.value.notes || 'Pembayaran aktivasi langganan pelanggan baru.'
      }
      invoices.value.unshift(newInvoice)
    }

    // Persist to storage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ikikasir_customers', JSON.stringify(customers.value))
      localStorage.setItem('ikikasir_invoices', JSON.stringify(invoices.value))
    }

    emit('saved', savedCustomer)
    emit('close')
    resetForm()
  } catch (err: any) {
    console.error('[CustomerFormModal] handleSubmit error:', err)
    submitError.value = err?.message || 'Gagal menyimpan data pelanggan.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5 select-none">
    <!-- Backdrop Blur -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      @click="emit('close')"
    ></div>

    <!-- Modal Dialog Box -->
    <div class="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[94vh]">
      
      <!-- Top Bar / Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <UserPlus class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <h2 class="text-base sm:text-lg font-bold text-slate-900">
                {{ customerToEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru' }}
              </h2>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Sparkles class="w-2.5 h-2.5" /> Pelanggan Aktif
              </span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Kelola data pelanggan, paket kasir, dan konfirmasi bukti bayar.</p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Tabs (3 Tabs: Kontak, Usaha & Paket, Pembayaran) -->
      <div class="px-4 sm:px-6 border-b border-slate-100 bg-white flex items-center gap-2 text-xs font-bold pt-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <!-- Tab 1: Kontak -->
        <button 
          type="button"
          @click="activeTab = 'contact'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="activeTab === 'contact' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <User class="w-3.5 h-3.5" />
          <span>1. Kontak & Personal</span>
        </button>

        <!-- Tab 2: Usaha & Paket -->
        <button 
          type="button"
          @click="activeTab = 'business'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="activeTab === 'business' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <Store class="w-3.5 h-3.5" />
          <span>2. Profil Usaha & Paket</span>
        </button>

        <!-- Tab 3: Pembayaran & Bukti Transfer -->
        <button 
          type="button"
          @click="activeTab = 'payment'"
          class="pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          :class="activeTab === 'payment' ? 'border-indigo-600 text-indigo-600 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <CreditCard class="w-3.5 h-3.5" />
          <span>3. Pembayaran & Bukti Transfer</span>
          <span v-if="formData.paymentProofUrl" class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-5">
        
        <!-- Error Banner -->
        <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span>{{ submitError }}</span>
        </div>

        <!-- ========================================== -->
        <!-- TAB 1: KONTAK & PERSONAL -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'contact'" class="space-y-4 animate-in fade-in duration-150">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nama Lengkap Pelanggan -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Pelanggan <span class="text-rose-500">*</span>
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

            <!-- Nomor WhatsApp / Telepon -->
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
                  required
                />
              </div>
            </div>

            <!-- Alamat Email -->
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email Pelanggan
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.email"
                  type="email" 
                  placeholder="budi.santoso@email.com"
                  class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: PROFIL USAHA & PAKET KASIR -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'business'" class="space-y-5 animate-in fade-in duration-150">
          
          <!-- Section 1: Profil Usaha -->
          <div class="space-y-3.5">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Store class="w-4 h-4 text-indigo-600" />
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Profil Usaha & Toko</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nama Bisnis / Toko -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Bisnis / Toko <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <Store class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="formData.businessName"
                    type="text" 
                    placeholder="Contoh: Toko Berkah / Kafe Senja"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <!-- Kategori Bisnis -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis / Kategori Bisnis
                </label>
                <div class="relative">
                  <Tag class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    v-model="formData.category"
                    class="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white cursor-pointer"
                  >
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
              </div>

              <!-- Alamat Toko -->
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

          <!-- Section 2: Kebutuhan Paket & Referral -->
          <div class="space-y-3.5 pt-2">
            <div class="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Package class="w-4 h-4 text-indigo-600" />
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Paket Langganan Kasir</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Paket Kasir -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Paket Kasir
                </label>
                <div class="relative">
                  <Package class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select 
                    v-model="formData.packageType"
                    @change="handlePackageChange"
                    class="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-indigo-700 bg-white cursor-pointer"
                  >
                    <option v-for="pkg in packageOptions" :key="pkg" :value="pkg">
                      {{ pkg }} — Rp {{ Number(packagePrices[pkg] || 250000).toLocaleString('id-ID') }}/bln
                    </option>
                  </select>
                </div>
              </div>

              <!-- Nominal Biaya Tagihan -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Biaya Langganan (Rp)
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input 
                    v-model.number="formData.amount"
                    type="number" 
                    step="10000"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <!-- Sumber Pendaftaran -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sumber Masuk Pendaftaran
                </label>
                <select 
                  v-model="formData.source"
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium bg-white cursor-pointer"
                >
                  <option v-for="src in sources" :key="src" :value="src">{{ src }}</option>
                </select>
              </div>

              <!-- Referral / Rekomendasi Section (Jika Sumber = Referral) -->
              <div v-if="formData.source === 'Referral'" class="md:col-span-2 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-3">
                <div class="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Share2 class="w-4 h-4 text-purple-600" />
                  <span>Jalur Referral Pelanggan</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <!-- Input Kode Referral -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Kode Referral
                    </label>
                    <div class="relative">
                      <input 
                        v-model="formData.referralCode"
                        @input="formData.referralCode = (formData.referralCode || '').toUpperCase()"
                        type="text"
                        placeholder="Contoh: REF-BUDI101"
                        class="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono font-bold uppercase tracking-wider text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                      <span v-if="matchedCustomer" class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                        <CheckCircle2 class="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <!-- Dropdown Quick Select Pelanggan Pengundang -->
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Pelanggan Pengundang
                    </label>
                    <select 
                      @change="(e: any) => selectReferringCustomer(e.target.value)"
                      class="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- Pilih dari Pelanggan --</option>
                      <option 
                        v-for="c in customers" 
                        :key="c.id" 
                        :value="c.id"
                        :selected="matchedCustomer?.id === c.id || formData.referredByCustomerId === c.id"
                      >
                        {{ c.name }} ({{ c.businessName || c.business }})
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Info Tersambung -->
                <div v-if="matchedCustomer" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tersambung ke pengundang: <strong>{{ matchedCustomer.name }}</strong> ({{ matchedCustomer.businessName || matchedCustomer.business }})</span>
                </div>
              </div>

              <!-- Catatan Tambahan -->
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Pelanggan / Sistem
                </label>
                <textarea 
                  v-model="formData.notes"
                  rows="2"
                  placeholder="Contoh: Pelanggan baru mendaftar paket Basic. Membutuhkan printer thermal bluetooth."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                ></textarea>
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- TAB 3: PEMBAYARAN & BUKTI TRANSFER -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'payment'" class="space-y-5 animate-in fade-in duration-150">
          
          <!-- Section 1: Pilihan Metode Pembayaran -->
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-1 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-indigo-600" />
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Pilih Metode Pembayaran</h3>
              </div>
              <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Nominal: Rp {{ Number(formData.amount || 250000).toLocaleString('id-ID') }}
              </span>
            </div>

            <!-- Cards Selector Metode Pembayaran -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div 
                v-for="m in paymentMethods" 
                :key="m.id"
                @click="formData.paymentMethod = m.id"
                class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between"
                :class="formData.paymentMethod === m.id ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300 bg-white'"
              >
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                    :class="formData.paymentMethod === m.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'"
                  >
                    {{ m.icon.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-xs font-extrabold text-slate-800 leading-tight">{{ m.name }}</div>
                    <div class="text-[10px] text-slate-500 leading-tight mt-0.5">{{ m.desc }}</div>
                  </div>
                </div>

                <div 
                  class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2"
                  :class="formData.paymentMethod === m.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'"
                >
                  <Check v-if="formData.paymentMethod === m.id" class="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Upload Bukti Pembayaran -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between pb-1 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <Receipt class="w-4 h-4 text-indigo-600" />
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Upload Bukti Transfer / Pembayaran</h3>
              </div>

              <!-- Shortcut Bantuan Contoh Bukti -->
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] text-slate-400 font-semibold hidden sm:inline">Gunakan Contoh:</span>
                <button 
                  type="button"
                  @click="useSampleReceipt('BCA')"
                  class="px-2 py-0.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  Contoh BCA
                </button>
                <button 
                  type="button"
                  @click="useSampleReceipt('QRIS')"
                  class="px-2 py-0.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  Contoh QRIS
                </button>
              </div>
            </div>

            <!-- Area Upload File & Pratinjau -->
            <div>
              <!-- Belum Ada Bukti: Area Dropzone -->
              <div 
                v-if="!formData.paymentProofUrl"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleFileDrop"
                @click="fileInputRef?.click()"
                class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                :class="isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'"
              >
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Upload class="w-6 h-6" />
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800">
                    <span class="text-indigo-600 hover:underline">Klik untuk pilih file</span> atau seret file gambar ke sini
                  </p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Mendukung format PNG, JPG, JPEG, atau WEBP (Maksimal 5MB)</p>
                </div>

                <input 
                  ref="fileInputRef"
                  type="file" 
                  accept="image/*"
                  class="hidden" 
                  @change="handleFileUpload"
                />
              </div>

              <!-- Sudah Ada Bukti: Pratinjau Gambar -->
              <div 
                v-else 
                class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150"
              >
                <div class="flex items-center gap-3 w-full sm:w-auto">
                  <div 
                    @click="isReceiptZoomOpen = true"
                    class="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 bg-white shrink-0 group cursor-pointer shadow-xs"
                    title="Klik untuk zoom pratinjau"
                  >
                    <img :src="formData.paymentProofUrl" alt="Bukti Transfer" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye class="w-4 h-4" />
                    </div>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                      <span class="text-xs font-bold text-slate-800 truncate block">
                        {{ formData.paymentProofFileName || 'Bukti Pembayaran Terunggah' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">Bukti transfer siap disimpan bersama data pelanggan.</p>
                  </div>
                </div>

                <!-- Tombol Aksi Pratinjau & Hapus -->
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    type="button"
                    @click="isReceiptZoomOpen = true"
                    class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </button>
                  <button 
                    type="button"
                    @click="removePaymentProof"
                    class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Footer Action Buttons -->
      <div class="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <button 
          @click="emit('close')"
          type="button"
          class="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Batal
        </button>

        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Tombol Kembali jika di Tab 2 atau Tab 3 -->
          <button 
            v-if="activeTab === 'business'"
            type="button"
            @click="activeTab = 'contact'"
            class="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <button 
            v-if="activeTab === 'payment'"
            type="button"
            @click="activeTab = 'business'"
            class="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <!-- Tombol Selanjutnya -->
          <button 
            v-if="activeTab === 'contact'"
            type="button"
            @click="activeTab = 'business'"
            class="px-3 sm:px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <button 
            v-if="activeTab === 'business'"
            type="button"
            @click="activeTab = 'payment'"
            class="px-3 sm:px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Lanjut Pembayaran</span>
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
            <span>{{ isSubmitting ? 'Menyimpan...' : (customerToEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan') }}</span>
          </button>
        </div>
      </div>

    </div>

    <!-- ZOOM LIGHTBOX MODAL BUKTI TRANSFER -->
    <Teleport to="body">
      <div 
        v-if="isReceiptZoomOpen && formData.paymentProofUrl"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
        @click.self="isReceiptZoomOpen = false"
      >
        <div class="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800">Pratinjau Bukti Pembayaran</span>
            <button @click="isReceiptZoomOpen = false" class="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="flex items-center justify-center overflow-auto max-h-[75vh]">
            <img :src="formData.paymentProofUrl" alt="Zoom Bukti Transfer" class="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-md" />
          </div>

          <div class="text-center pt-2">
            <button 
              @click="isReceiptZoomOpen = false"
              class="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

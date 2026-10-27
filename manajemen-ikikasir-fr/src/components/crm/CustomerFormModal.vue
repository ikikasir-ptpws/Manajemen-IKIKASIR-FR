<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  Eye, 
  EyeOff, 
  Upload, 
  Check,
  User,
  Store,
  Mail,
  Key,
  MapPin,
  ArrowRight
} from 'lucide-vue-next'
import type { Customer, PackageType } from '../../types/dashboard'
import { customersApi, uploadApi } from '../../api'
import { 
  useAppData, 
  getPackageDurationMonths,
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

const { customers, invoices, packages } = useAppData()

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const activeTab = ref<'contact' | 'business'>('contact')
const isReceiptZoomOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showPassword = ref(false)

const categories = ['Retail', 'F&B / Kuliner', 'Fashion & Butik', 'Jasa & Servis', 'Minimarket & Grosir', 'Lainnya']

const paymentMethods = [
  { id: 'Transfer BCA', name: 'Transfer BCA' },
  { id: 'Transfer Mandiri', name: 'Transfer Mandiri' },
  { id: 'Transfer BRI', name: 'Transfer BRI' },
  { id: 'QRIS', name: 'QRIS' },
  { id: 'Tunai / Cash', name: 'Tunai / Cash' }
]

// Paket dinamis tersinkronisasi dari menu Kelola Paket & Backend
const defaultFallbackPackages = [
  { id: 'basic', name: 'Basic', price: 250000, period: '/bulan' },
  { id: 'pro', name: 'Pro', price: 500000, period: '/bulan' },
  { id: 'custom', name: 'Custom / IT One', price: 1500000, period: '/bulan' }
]

const availablePackages = computed(() => {
  const active = packages.value.filter(p => p.isActive !== false)
  if (active.length > 0) return active
  if (packages.value.length > 0) return packages.value
  return defaultFallbackPackages
})

const formData = ref({
  name: '',
  businessName: '',
  category: 'Retail',
  phone: '',
  email: '',
  password: '',
  address: '',
  packageId: '',
  packageType: 'Basic' as PackageType | string,
  amount: 250000,
  notes: '',
  paymentMethod: 'Transfer BCA (PT PUNDI MAS BERKAH)',
  paymentDate: new Date().toISOString().substring(0, 10),
  paymentStatus: 'Paid' as 'Paid' | 'Pending',
  paymentProofUrl: '',
  paymentProofFileName: ''
})

const handlePackageChange = () => {
  const selected = availablePackages.value.find(p => p.id === formData.value.packageId || p.name === formData.value.packageId)
  if (selected) {
    formData.value.packageId = selected.id
    formData.value.packageType = selected.name
    formData.value.amount = selected.price ?? 0
  }
}

watch(() => props.customerToEdit, (val) => {
  if (val) {
    const matchedPkg = availablePackages.value.find(p => 
      (val.packageId && p.id === val.packageId) ||
      (val.packageType && p.name.toLowerCase() === String(val.packageType).toLowerCase()) ||
      (val.packageName && p.name.toLowerCase() === String(val.packageName).toLowerCase())
    ) || availablePackages.value[0]

    formData.value = {
      name: val.name,
      businessName: val.businessName || val.business || '',
      category: val.category || 'Retail',
      phone: val.phone ? val.phone.replace(/^(\+62|62|0)/, '') : '',
      email: val.email || '',
      password: val.appPassword || '',
      address: val.address || '',
      packageId: matchedPkg?.id || val.packageId || '',
      packageType: matchedPkg?.name || val.packageType || 'Basic',
      amount: val.amount !== undefined ? val.amount : (matchedPkg?.price ?? 250000),
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

watch(availablePackages, (newPkgs) => {
  if (!props.customerToEdit && newPkgs.length > 0 && !formData.value.packageId) {
    const p = newPkgs[0]
    formData.value.packageId = p.id
    formData.value.packageType = p.name
    formData.value.amount = p.price ?? 250000
  }
}, { immediate: true })

function resetForm() {
  const initialPkg = availablePackages.value[0]
  formData.value = {
    name: '',
    businessName: '',
    category: 'Retail',
    phone: '',
    email: '',
    password: '',
    address: '',
    packageId: initialPkg?.id || '',
    packageType: initialPkg?.name || 'Basic',
    amount: initialPkg?.price ?? 250000,
    notes: '',
    paymentMethod: 'Transfer BCA (PT PUNDI MAS BERKAH)',
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentStatus: 'Paid',
    paymentProofUrl: '',
    paymentProofFileName: ''
  }
  activeTab.value = 'contact'
  submitError.value = null
  showPassword.value = false
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (!file.type.startsWith('image/')) {
      submitError.value = 'File harus berupa gambar (JPG, PNG, atau WEBP).'
      return
    }
    submitError.value = null
    const reader = new FileReader()
    reader.onload = (event) => {
      formData.value.paymentProofUrl = event.target?.result as string
      formData.value.paymentProofFileName = file.name

      // Upload file ke server storage
      uploadApi.uploadFile(file).then(res => {
        if (res.data?.url) {
          formData.value.paymentProofUrl = res.data.url
        }
      }).catch(err => {
        console.warn('Upload server storage fallback ke base64:', err)
      })
    }
    reader.readAsDataURL(file)
  }
}

const useSampleReceipt = (type: 'BCA' | 'QRIS') => {
  formData.value.paymentProofUrl = type === 'BCA' ? SAMPLE_RECEIPT_BCA : SAMPLE_RECEIPT_QRIS
  formData.value.paymentProofFileName = type === 'BCA' ? 'bukti_transfer_bca.jpg' : 'bukti_transfer_qris.jpg'
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
    submitError.value = 'Nama pelanggan wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.phone.trim()) {
    submitError.value = 'Nomor WhatsApp wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.email.trim()) {
    submitError.value = 'Email pelanggan wajib diisi untuk pendaftaran Firebase.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.password.trim()) {
    submitError.value = 'Password akun wajib diisi.'
    activeTab.value = 'contact'
    return
  }
  if (!formData.value.businessName.trim()) {
    submitError.value = 'Nama bisnis/toko wajib diisi.'
    activeTab.value = 'business'
    return
  }

  isSubmitting.value = true

  try {
    let savedCustomer: Customer
    const cleanPhone = formData.value.phone.replace(/[^0-9]/g, '')
    const finalPhone = cleanPhone.startsWith('0') ? cleanPhone : (cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : '0' + cleanPhone)

    const selectedPkg = availablePackages.value.find(p => p.id === formData.value.packageId || p.name === formData.value.packageType)
    const durationMonths = getPackageDurationMonths(selectedPkg)

    if (props.customerToEdit) {
      const idx = customers.value.findIndex(c => c.id === props.customerToEdit?.id)
      if (idx !== -1) {
        const curr = customers.value[idx]

        let updatedExpDate = curr.expiredDate
        if (formData.value.packageId !== curr.packageId || formData.value.packageType !== curr.packageType) {
          const exp = new Date()
          exp.setMonth(exp.getMonth() + durationMonths)
          updatedExpDate = exp.toISOString().substring(0, 10)
        }

        savedCustomer = {
          ...curr,
          name: formData.value.name.trim(),
          businessName: formData.value.businessName.trim(),
          business: formData.value.businessName.trim(),
          category: formData.value.category,
          phone: finalPhone,
          email: formData.value.email.trim(),
          appPassword: formData.value.password.trim(),
          appUsername: formData.value.email.trim(),
          address: formData.value.address.trim() || curr.address,
          packageId: formData.value.packageId || curr.packageId,
          packageType: formData.value.packageType || curr.packageType,
          packageName: formData.value.packageType || curr.packageName,
          amount: Number(formData.value.amount) || curr.amount || 250000,
          expiredDate: updatedExpDate,
          paymentMethod: formData.value.paymentMethod,
          paymentProofUrl: formData.value.paymentProofUrl || curr.paymentProofUrl,
          notes: formData.value.notes || curr.notes
        }
        customers.value[idx] = savedCustomer

        // Sync update to backend
        customersApi.update(curr.id, {
          name: savedCustomer.name,
          businessName: savedCustomer.businessName,
          email: savedCustomer.email,
          phone: savedCustomer.phone,
          address: savedCustomer.address,
          packageId: formData.value.packageId || undefined,
          notes: savedCustomer.notes,
          paymentProofUrl: savedCustomer.paymentProofUrl,
          paymentMethod: savedCustomer.paymentMethod,
          paymentAmount: savedCustomer.amount,
          appUsername: savedCustomer.appUsername,
          appPassword: savedCustomer.appPassword,
          technicianStatus: savedCustomer.technicianStatus
        }).catch(err => console.warn('Backend customersApi.update warning:', err))
      } else {
        throw new Error('Data pelanggan tidak ditemukan.')
      }
    } else {
      const newId = 'cust-' + Date.now()
      const expDate = new Date()
      expDate.setMonth(expDate.getMonth() + durationMonths)
      const expISO = expDate.toISOString().substring(0, 10)

      savedCustomer = {
        id: newId,
        no: customers.value.length + 1,
        name: formData.value.name.trim(),
        businessName: formData.value.businessName.trim(),
        business: formData.value.businessName.trim(),
        category: formData.value.category,
        phone: finalPhone,
        email: formData.value.email.trim(),
        appPassword: formData.value.password.trim(),
        appUsername: formData.value.email.trim(),
        address: formData.value.address.trim() || 'Indonesia',
        packageId: formData.value.packageId,
        packageType: formData.value.packageType,
        packageName: formData.value.packageType,
        amount: Number(formData.value.amount) || 250000,
        paymentMethod: formData.value.paymentMethod,
        paymentProofUrl: formData.value.paymentProofUrl || undefined,
        joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        expiredDate: expISO,
        status: 'active',
        technicianStatus: 'pending_setup',
        referralCode: getOrCreateCustomerReferralCode({ name: formData.value.name, id: newId }),
        notes: formData.value.notes || undefined
      }

      customers.value.unshift(savedCustomer)

      // Sync create to backend
      customersApi.create({
        name: savedCustomer.name,
        businessName: savedCustomer.businessName || '',
        email: savedCustomer.email,
        phone: savedCustomer.phone,
        address: savedCustomer.address,
        packageId: formData.value.packageId || undefined,
        billingCycleMonths: durationMonths,
        paymentMethod: savedCustomer.paymentMethod,
        paymentAmount: savedCustomer.amount,
        paymentProofUrl: savedCustomer.paymentProofUrl,
        appUsername: savedCustomer.appUsername,
        appPassword: savedCustomer.appPassword,
        technicianStatus: savedCustomer.technicianStatus,
        notes: savedCustomer.notes
      }).then(res => {
        if (res.data?.id) {
          savedCustomer.id = res.data.id
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ikikasir_customers_v4', JSON.stringify(customers.value))
          }
        }
      }).catch(err => console.warn('Backend customersApi.create warning:', err))

      const newInvoice = {
        id: 'INV-' + Date.now().toString().slice(-8),
        customerId: savedCustomer.id,
        customerName: savedCustomer.name,
        businessName: savedCustomer.businessName || '',
        phone: savedCustomer.phone || '',
        package: savedCustomer.packageType,
        amount: savedCustomer.amount || 250000,
        billingCycleMonths: durationMonths,
        date: formData.value.paymentDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        paymentMethod: savedCustomer.paymentMethod || 'Transfer BCA',
        status: 'Paid' as 'Paid',
        paymentProofUrl: savedCustomer.paymentProofUrl,
        notes: formData.value.notes || `Pembayaran aktivasi pelanggan baru (${durationMonths >= 12 ? '1 Tahun' : durationMonths + ' Bulan'}).`
      }
      invoices.value.unshift(newInvoice)
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ikikasir_customers_v4', JSON.stringify(customers.value))
      localStorage.setItem('ikikasir_invoices_v4', JSON.stringify(invoices.value))
    }

    emit('saved', savedCustomer)
    emit('close')
    resetForm()
  } catch (err: any) {
    submitError.value = err?.message || 'Gagal menyimpan data.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 select-none">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      @click="emit('close')"
    ></div>

    <!-- Modal Box -->
    <div class="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col my-auto z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
      
      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800">
            {{ customerToEdit ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru' }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">Kelola data pelanggan, paket langganan, dan akun kasir.</p>
        </div>

        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Tabs Navigation (Sama persis seperti Calon Client) -->
      <div class="px-5 border-b border-slate-100 bg-white flex items-center gap-6 text-xs font-semibold pt-1">
        <button 
          type="button"
          @click="activeTab = 'contact'"
          class="pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'contact' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <User class="w-3.5 h-3.5" />
          <span>1. Kontak & Akun</span>
        </button>
        <button 
          type="button"
          @click="activeTab = 'business'"
          class="pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'business' ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'"
        >
          <Store class="w-3.5 h-3.5" />
          <span>2. Profil Usaha & Pembayaran</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        
        <!-- Error Alert -->
        <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {{ submitError }}
        </div>

        <!-- ========================================== -->
        <!-- TAB 1: KONTAK & AKUN -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'contact'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nama Pelanggan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.name"
                  type="text" 
                  placeholder="Contoh: Budi Santoso"
                  class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <!-- Nomor WhatsApp -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor WhatsApp <span class="text-rose-500">*</span>
              </label>
              <div class="relative flex">
                <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium font-mono">
                  +62
                </span>
                <input 
                  v-model="formData.phone"
                  type="tel" 
                  placeholder="81234567890"
                  class="flex-1 px-3 py-2 rounded-r-xl border border-slate-200 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <!-- Email Pelanggan (Firebase) -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Pelanggan (Firebase) <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.email"
                  type="email" 
                  placeholder="budi@email.com"
                  class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <span class="text-[11px] text-slate-400 mt-1 block">Untuk pendaftaran akun oleh teknisi di Firebase</span>
            </div>

            <!-- Password Akun (Input Manual Milik Client) -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Password Akun Kasir <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Key class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="Masukkan password akun client..."
                  class="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 placeholder:font-sans placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button 
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabindex="-1"
                >
                  <EyeOff v-if="showPassword" class="w-3.5 h-3.5" />
                  <Eye v-else class="w-3.5 h-3.5" />
                </button>
              </div>
              <span class="text-[11px] text-slate-400 mt-1 block">Password akun kasir yang ditentukan client</span>
            </div>

            <!-- Alamat -->
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Toko / Domisili
              </label>
              <div class="relative">
                <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.address"
                  type="text" 
                  placeholder="Contoh: Jl. Merdeka No. 10, Jakarta"
                  class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: PROFIL USAHA & PEMBAYARAN -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'business'" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nama Bisnis / Toko -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Bisnis / Toko <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Store class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  v-model="formData.businessName"
                  type="text" 
                  placeholder="Contoh: Toko Kopi Senja"
                  class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <!-- Kategori Bisnis -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori Bisnis
              </label>
              <select 
                v-model="formData.category"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- Paket Kasir -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Paket Kasir
              </label>
              <select 
                v-model="formData.packageId"
                @change="handlePackageChange"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option v-for="pkg in availablePackages" :key="pkg.id" :value="pkg.id">
                  {{ pkg.name }} (Rp {{ Number(pkg.price || 0).toLocaleString('id-ID') }} {{ pkg.period || '/bulan' }})
                </option>
              </select>
              <div class="mt-1.5 flex items-center justify-between text-[11px] px-0.5">
                <span class="text-slate-500">Masa Aktif:</span>
                <span class="font-semibold text-indigo-600 dark:text-indigo-400">
                  {{ getPackageDurationMonths(availablePackages.find(p => p.id === formData.packageId || p.name === formData.packageType)) >= 12 ? 'Setahun (12 Bulan)' : '1 Bulan' }}
                </span>
              </div>
            </div>

            <!-- Biaya Langganan -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Biaya Langganan (Rp)
              </label>
              <input 
                v-model.number="formData.amount"
                type="number" 
                step="10000"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <!-- Metode Pembayaran -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Metode Pembayaran <span class="text-rose-500">*</span>
              </label>
              <select 
                v-model="formData.paymentMethod"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option v-for="m in paymentMethods" :key="m.id" :value="m.id">
                  {{ m.name }}
                </option>
              </select>
            </div>

            <!-- Upload Bukti Transfer -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-slate-700">
                  Bukti Pembayaran
                </label>
                <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Contoh:</span>
                  <button type="button" @click="useSampleReceipt('BCA')" class="text-indigo-600 hover:underline cursor-pointer">BCA</button>
                  <span>•</span>
                  <button type="button" @click="useSampleReceipt('QRIS')" class="text-indigo-600 hover:underline cursor-pointer">QRIS</button>
                </div>
              </div>

              <!-- Upload box jika belum ada file -->
              <div 
                v-if="!formData.paymentProofUrl"
                @click="fileInputRef?.click()"
                class="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
              >
                <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                  <Upload class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <span class="text-xs font-medium text-slate-700 block truncate">Upload bukti transfer</span>
                  <span class="text-[10px] text-slate-400 block">JPG, PNG, atau WEBP</span>
                </div>
                <input 
                  ref="fileInputRef"
                  type="file" 
                  accept="image/*"
                  class="hidden" 
                  @change="handleFileUpload"
                />
              </div>

              <!-- Preview box jika sudah ada file -->
              <div 
                v-else
                class="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50/60"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <img 
                    :src="formData.paymentProofUrl" 
                    alt="Bukti Transfer" 
                    class="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                    @click="isReceiptZoomOpen = true"
                  />
                  <div class="min-w-0">
                    <span class="text-xs font-medium text-slate-800 block truncate">
                      {{ formData.paymentProofFileName || 'bukti_transfer.jpg' }}
                    </span>
                    <span class="text-[10px] text-emerald-600 font-medium block">File terlampir</span>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button 
                    type="button"
                    @click="isReceiptZoomOpen = true"
                    class="px-2 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Lihat
                  </button>
                  <button 
                    type="button"
                    @click="removePaymentProof"
                    class="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <!-- Catatan Tambahan -->
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan (Opsional)
              </label>
              <textarea 
                v-model="formData.notes"
                rows="2"
                placeholder="Catatan tambahan untuk pelanggan ini..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              ></textarea>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <button 
          @click="emit('close')"
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          Batal
        </button>

        <div class="flex items-center gap-2">
          <button 
            v-if="activeTab === 'business'"
            type="button"
            @click="activeTab = 'contact'"
            class="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Kembali
          </button>

          <button 
            v-if="activeTab === 'contact'"
            type="button"
            @click="activeTab = 'business'"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Selanjutnya</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <button 
            v-if="activeTab === 'business'"
            type="button"
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check class="w-3.5 h-3.5" />
            <span>{{ isSubmitting ? 'Menyimpan...' : (customerToEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan') }}</span>
          </button>
        </div>
      </div>

    </div>

    <!-- Zoom Preview Bukti Transfer -->
    <Teleport to="body">
      <div 
        v-if="isReceiptZoomOpen && formData.paymentProofUrl"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150"
        @click.self="isReceiptZoomOpen = false"
      >
        <div class="relative max-w-md w-full bg-white rounded-2xl p-4 shadow-2xl space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800">Bukti Pembayaran</span>
            <button @click="isReceiptZoomOpen = false" class="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="flex items-center justify-center max-h-[70vh] overflow-auto">
            <img :src="formData.paymentProofUrl" alt="Bukti Transfer" class="max-w-full max-h-[65vh] rounded-xl object-contain" />
          </div>

          <div class="text-right pt-1">
            <button 
              @click="isReceiptZoomOpen = false"
              class="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>


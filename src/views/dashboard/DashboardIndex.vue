<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { 
  Users, 
  UserCheck, 
  Clock, 
  XCircle, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Bell, 
  ChevronDown, 
  Eye, 
  UserPlus, 
  CreditCard, 
  FileText, 
  MessageCircle, 
  ChevronRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Zap,
  Send,
  Copy,
  Phone
} from 'lucide-vue-next'
import CashFlowChart from '../../components/CashFlowChart.vue'
import CustomerDetailModal from '../../components/CustomerDetailModal.vue'
import type { Customer, ActivityItem } from '../../types/dashboard'

const router = useRouter()

// State for Modals
const isDetailModalOpen = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const showNotificationDropdown = ref(false)
const showDateDropdown = ref(false)
const showProfileDropdown = ref(false)
const selectedDateLabel = ref('05 Sep 2026')
const notificationsRead = ref(false)

// Close all dropdowns on click outside
const closeAllDropdowns = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-trigger')) {
    showNotificationDropdown.value = false
    showDateDropdown.value = false
    showProfileDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeAllDropdowns)
  // Animate KPI counters on mount
  setTimeout(() => {
    animateCounter('totalPelanggan', metrics.value.totalPelanggan)
    animateCounter('pelangganAktif', metrics.value.pelangganAktif)
    animateCounter('akanExpired', metrics.value.akanExpired)
    animateCounter('pelangganExpired', metrics.value.pelangganExpired)
  }, 200)
})
onUnmounted(() => {
  document.removeEventListener('click', closeAllDropdowns)
})

const markAllRead = () => {
  notificationsRead.value = true
  showNotificationDropdown.value = false
}

const selectDate = (label: string) => {
  selectedDateLabel.value = label
  showDateDropdown.value = false
}

// Toast notification state
const toastMessage = ref<string | null>(null)

const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

const greeting = ref(getGreeting())
const currentDate = ref(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

// KPI Metrics State
const metrics = ref({
  totalPelanggan: 1250,
  pelangganAktif: 980,
  akanExpired: 120,
  pelangganExpired: 150
})

// Animated counter
const displayMetrics = ref({
  totalPelanggan: 0,
  pelangganAktif: 0,
  akanExpired: 0,
  pelangganExpired: 0
})

const animateCounter = (key: keyof typeof displayMetrics.value, target: number) => {
  const duration = 800
  const steps = 30
  const increment = target / steps
  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      displayMetrics.value[key] = target
      clearInterval(timer)
    } else {
      displayMetrics.value[key] = Math.round(current)
    }
  }, duration / steps)
}

// Copy phone number
const copiedPhone = ref<string | null>(null)
const copyPhone = (phone: string) => {
  navigator.clipboard.writeText(phone)
  copiedPhone.value = phone
  setTimeout(() => { copiedPhone.value = null }, 1500)
}

// List of Recent Activities matching screenshot
const activities = ref<ActivityItem[]>([
  {
    id: 'act-1',
    title: 'Budi Santoso',
    description: 'berhasil dikonversi menjadi pelanggan',
    time: '10:30',
    relativeTime: '2 menit yang lalu',
    type: 'convert'
  },
  {
    id: 'act-2',
    title: 'Pembayaran langganan dari',
    highlightText: 'Toko ABC',
    description: 'Rp 1.250.000',
    time: '10:15',
    relativeTime: '15 menit yang lalu',
    type: 'payment'
  },
  {
    id: 'act-3',
    title: 'Andi Wijaya',
    description: 'akan expired dalam 3 hari',
    time: '09:10',
    relativeTime: '1 jam yang lalu',
    type: 'warning'
  },
  {
    id: 'act-4',
    title: 'Siti Aisyah',
    description: 'menambahkan follow up baru',
    time: '08:45',
    relativeTime: '2 jam yang lalu',
    type: 'followup'
  },
  {
    id: 'act-5',
    title: 'Laporan Arus Kas',
    description: 'berhasil diekspor',
    time: '07:30',
    relativeTime: '3 jam yang lalu',
    type: 'export'
  }
])

// Table: Pelanggan Akan Expired
const akanExpiredList = ref<Customer[]>([
  { id: 'exp-1', no: 1, name: 'Andi Wijaya', businessName: 'Warung Wijaya', packageType: 'Basic', expiredDate: '10 Sep 2026', daysLeft: 5, status: 'expiring', phone: '081298412891' },
  { id: 'exp-2', no: 2, name: 'Dewi Lestari', businessName: 'Lestari Butik', packageType: 'Premium', expiredDate: '12 Sep 2026', daysLeft: 7, status: 'expiring', phone: '081392817292' },
  { id: 'exp-3', no: 3, name: 'Rudi Hermawan', businessName: 'Kopi Rudi', packageType: 'Basic', expiredDate: '14 Sep 2026', daysLeft: 9, status: 'expiring', phone: '085718291029' },
  { id: 'exp-4', no: 4, name: 'Toko Makmur', businessName: 'Toko Makmur Grosir', packageType: 'Premium', expiredDate: '15 Sep 2026', daysLeft: 10, status: 'expiring', phone: '082190182736' },
  { id: 'exp-5', no: 5, name: 'Sari Collection', businessName: 'Sari Muslim Fashion', packageType: 'Basic', expiredDate: '16 Sep 2026', daysLeft: 11, status: 'expiring', phone: '081291827364' }
])

// Table: Pelanggan Expired
const expiredList = ref<Customer[]>([
  { id: 'expd-1', no: 1, name: 'Siti Aisyah', businessName: 'Aisyah Hijab Store', packageType: 'Basic', expiredDate: '01 Sep 2026', daysExpired: 4, status: 'expired', phone: '081391827461' },
  { id: 'expd-2', no: 2, name: 'Donni Cell', businessName: 'Donni Pulsa & Aksesoris', packageType: 'Basic', expiredDate: '31 Agu 2026', daysExpired: 5, status: 'expired', phone: '085619283746' },
  { id: 'expd-3', no: 3, name: 'Fajar Store', businessName: 'Fajar Elektronik', packageType: 'Premium', expiredDate: '28 Agu 2026', daysExpired: 8, status: 'expired', phone: '081298471928' },
  { id: 'expd-4', no: 4, name: 'Yuni Collection', businessName: 'Yuni Baby Shop', packageType: 'Basic', expiredDate: '27 Agu 2026', daysExpired: 9, status: 'expired', phone: '087819283746' },
  { id: 'expd-5', no: 5, name: 'Toko Sejahtera', businessName: 'Minimarket Sejahtera', packageType: 'Basic', expiredDate: '25 Agu 2026', daysExpired: 11, status: 'expired', phone: '081283746192' }
])

// Handler to view customer detail
const openCustomerDetail = (cust: Customer) => {
  selectedCustomer.value = cust
  isDetailModalOpen.value = true
}

// Handler when new customer is saved from form
const handleCustomerSaved = (newCust: Customer, amount: number) => {
  metrics.value.totalPelanggan++
  metrics.value.pelangganAktif++

  // Add to top of activities
  activities.value.unshift({
    id: 'act-' + Date.now(),
    title: `Pembayaran langganan dari`,
    highlightText: newCust.businessName || newCust.name,
    description: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount),
    time: 'Baru saja',
    relativeTime: 'Baru saja',
    type: 'payment'
  })

  showToast(`Pelanggan baru "${newCust.businessName || newCust.name}" berhasil didaftarkan!`)
}

// Handler for customer renewal
const handleCustomerRenewed = (customerId: string, days: number) => {
  // Remove from expired list if exists
  const expIndex = expiredList.value.findIndex(c => c.id === customerId)
  if (expIndex !== -1) {
    const cust = expiredList.value.splice(expIndex, 1)[0]
    if (cust) {
      metrics.value.pelangganExpired--
      metrics.value.pelangganAktif++
      showToast(`Masa aktif ${cust.name} berhasil diperpanjang ${days} hari!`)
    }
    return
  }

  // If in expiring list, update days
  const willExpIndex = akanExpiredList.value.findIndex(c => c.id === customerId)
  if (willExpIndex !== -1) {
    const target = akanExpiredList.value[willExpIndex]
    if (target) {
      target.daysLeft = (target.daysLeft || 0) + days
      showToast(`Masa aktif ${target.name} berhasil diperpanjang!`)
    }
  }
}
</script>

<template>
  <div class="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Top Header Bar -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <!-- Title & Subtitle with Greeting -->
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{{ greeting }}, Admin! 👋</h1>
        <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">{{ currentDate }} · Ringkasan aktivitas bisnis Anda hari ini.</p>
      </div>

      <!-- Right Header Actions (Bell, User, Date) -->
      <div class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap">
        <!-- Date Selector Dropdown Button -->
        <div class="relative dropdown-trigger">
          <button 
            @click.stop="showDateDropdown = !showDateDropdown; showNotificationDropdown = false; showProfileDropdown = false"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar class="w-3.5 h-3.5 text-slate-500" />
            <span class="text-xs">{{ selectedDateLabel }}</span>
            <ChevronDown class="w-3 h-3 text-slate-400" />
          </button>

          <div 
            v-if="showDateDropdown"
            class="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <button @click="selectDate('05 Sep 2026')" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 cursor-pointer">Hari Ini (05 Sep)</button>
            <button @click="selectDate('7 Hari Terakhir')" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 cursor-pointer">7 Hari Terakhir</button>
            <button @click="selectDate('Sep 2026')" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 cursor-pointer">Bulan Ini (Sep 2026)</button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Notification Bell Icon -->
          <div class="relative dropdown-trigger">
            <button 
              @click.stop="showNotificationDropdown = !showNotificationDropdown; showDateDropdown = false; showProfileDropdown = false"
              class="relative text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
            >
              <Bell class="w-4 h-4" />
              <!-- Red notification dot -->
              <span v-if="!notificationsRead" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            <!-- Notification Dropdown -->
            <div 
              v-if="showNotificationDropdown"
              class="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
            >
              <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span class="font-bold text-slate-800">Notifikasi</span>
                <span @click="markAllRead" class="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">Tandai dibaca</span>
              </div>
              <div class="space-y-2">
                <div class="p-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors">
                  <p class="font-bold text-slate-800 text-[11px]">Pembayaran Langganan Masuk</p>
                  <p class="text-[10px] text-slate-500">Toko ABC telah membayar Rp 1.250.000</p>
                </div>
                <div class="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <p class="font-bold text-slate-800 text-[11px]">5 Pelanggan Akan Expired</p>
                  <p class="text-[10px] text-slate-500">Kirim pengingat WhatsApp perpanjangan</p>
                </div>
              </div>
            </div>
          </div>

          <!-- User Profile Avatar & Role -->
          <div class="relative dropdown-trigger">
            <button 
              @click.stop="showProfileDropdown = !showProfileDropdown; showDateDropdown = false; showNotificationDropdown = false"
              class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
            >
              <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                👤
              </div>
              <span class="text-xs font-semibold text-slate-700 hidden sm:inline">Super Admin</span>
              <ChevronDown class="w-3 h-3 text-slate-400" />
            </button>

            <!-- Profile Dropdown -->
            <div 
              v-if="showProfileDropdown"
              class="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
            >
              <a href="#" class="block px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium">Profil Akun</a>
              <a href="#" class="block px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium">Pengaturan Sistem</a>
              <div class="border-t border-slate-100 my-1"></div>
              <a href="#" class="block px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-medium">Keluar</a>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Top 4 KPI Metrics Summary Cards (2 cols on mobile, 4 on desktop) -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      
      <!-- Card 1: Total Pelanggan -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-1 cursor-pointer" @click="router.push('/semua-pelanggan')">
        <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-900/40 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1">
          <span class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pelanggan</span>
          <h3 class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
            {{ displayMetrics.totalPelanggan.toLocaleString('id-ID') }}
          </h3>
          <div class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-0.5">
            <ArrowUp class="w-3 h-3 stroke-[2.5]" />
            <span>+12%</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Pelanggan Aktif -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-2 cursor-pointer" @click="router.push('/langganan')">
        <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-[#ECFDF5] dark:bg-emerald-900/40 text-[#10B981] dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UserCheck class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1">
          <span class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Pelanggan Aktif</span>
          <h3 class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
            {{ displayMetrics.pelangganAktif.toLocaleString('id-ID') }}
          </h3>
          <div class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-0.5">
            <ArrowUp class="w-3 h-3 stroke-[2.5]" />
            <span>+10%</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Akan Expired -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-3 cursor-pointer" @click="router.push('/expired')">
        <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-[#FFFBEB] dark:bg-amber-900/40 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center shrink-0">
          <Clock class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1 w-full">
          <span class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Akan Expired</span>
          <h3 class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
            {{ displayMetrics.akanExpired.toLocaleString('id-ID') }}
          </h3>
          <div class="w-full bg-amber-100 rounded-full h-1.5 mt-2">
            <div class="bg-amber-500 h-1.5 rounded-full animate-progress" :style="{ width: Math.min((metrics.akanExpired / metrics.totalPelanggan) * 100 * 5, 100) + '%' }"></div>
          </div>
          <div class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-600 mt-1">
            <Clock class="w-3 h-3" />
            <span>&lt; 14 Hari</span>
          </div>
        </div>
      </div>

      <!-- Card 4: Pelanggan Expired -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-4 cursor-pointer" @click="router.push('/expired')">
        <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-[#FEF2F2] dark:bg-rose-900/40 text-[#EF4444] dark:text-rose-400 flex items-center justify-center shrink-0">
          <XCircle class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1 w-full">
          <span class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Expired</span>
          <h3 class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5">
            {{ displayMetrics.pelangganExpired.toLocaleString('id-ID') }}
          </h3>
          <div class="w-full bg-rose-100 rounded-full h-1.5 mt-2">
            <div class="bg-rose-500 h-1.5 rounded-full animate-progress" :style="{ width: Math.min((metrics.pelangganExpired / metrics.totalPelanggan) * 100 * 5, 100) + '%' }"></div>
          </div>
          <div class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-600 mt-1">
            <ArrowDown class="w-3 h-3 stroke-[2.5]" />
            <span>Perlu Follow Up</span>
          </div>
        </div>
      </div>

    </section>

    <!-- Quick Action Shortcut Cards -->
    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button @click="router.push('/calon-client')" class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group cursor-pointer">
        <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
          <UserPlus class="w-4 h-4" />
        </div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Calon Client</span>
      </button>
      <button @click="router.push('/follow-up')" class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all group cursor-pointer">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
          <Send class="w-4 h-4" />
        </div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Follow Up</span>
      </button>
      <button @click="router.push('/arus-kas')" class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all group cursor-pointer">
        <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
          <BarChart3 class="w-4 h-4" />
        </div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">Arus Kas</span>
      </button>
      <button @click="router.push('/laporan-harian')" class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-200 dark:hover:border-amber-500/50 transition-all group cursor-pointer">
        <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
          <Zap class="w-4 h-4" />
        </div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">Laporan</span>
      </button>
    </section>

    <!-- Middle Section: Cash Flow Chart & Recent Activities (2 Columns) -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      
      <!-- Left: Grafik Arus Kas (~62% width) -->
      <div class="lg:col-span-7 xl:col-span-7 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700">
        <CashFlowChart class="h-full" />
      </div>

      <!-- Right: Aktivitas Terbaru (~38% width) -->
      <div class="lg:col-span-5 xl:col-span-5 flex flex-col">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700 flex-1 flex flex-col justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-800 dark:text-white tracking-tight mb-4">Aktivitas Terbaru</h2>

            <div class="space-y-4">
              <!-- Item 1: Budi Santoso (Convert) -->
              <div class="flex items-start justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#ECFDF5] dark:bg-emerald-900/40 text-[#10B981] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      <span class="font-bold dark:text-white">Budi Santoso</span> berhasil dikonversi menjadi pelanggan
                    </p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">2 menit yang lalu</p>
                  </div>
                </div>
                <span class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0">10:30</span>
              </div>

              <!-- Item 2: Toko ABC (Payment) -->
              <div class="flex items-start justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#EEF2FF] dark:bg-indigo-900/40 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      Pembayaran langganan dari <span class="font-bold dark:text-white">Toko ABC</span>
                    </p>
                    <p class="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                      Rp 1.250.000 <span class="text-slate-400 dark:text-slate-500 font-normal">· 15 menit yang lalu</span>
                    </p>
                  </div>
                </div>
                <span class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0">10:15</span>
              </div>

              <!-- Item 3: Andi Wijaya (Warning) -->
              <div class="flex items-start justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#FFFBEB] dark:bg-amber-900/40 text-[#F59E0B] dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      <span class="font-bold dark:text-white">Andi Wijaya</span> akan expired dalam 3 hari
                    </p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">1 jam yang lalu</p>
                  </div>
                </div>
                <span class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0">09:10</span>
              </div>

              <!-- Item 4: Siti Aisyah (Follow Up) -->
              <div class="flex items-start justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#FEF2F2] dark:bg-rose-900/40 text-[#EF4444] dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <UserPlus class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      <span class="font-bold dark:text-white">Siti Aisyah</span> menambahkan follow up baru
                    </p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">2 jam yang lalu</p>
                  </div>
                </div>
                <span class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0">08:45</span>
              </div>

              <!-- Item 5: Laporan Arus Kas (Export) -->
              <div class="flex items-start justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-900/40 text-[#3B82F6] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      <span class="font-bold dark:text-white">Laporan Arus Kas</span> berhasil diekspor
                    </p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">3 jam yang lalu</p>
                  </div>
                </div>
                <span class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0">07:30</span>
              </div>
            </div>
          </div>

          <!-- Footer Button: Lihat Semua Aktivitas -->
          <div class="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/50">
            <button @click="router.push('/laporan-harian')" class="w-full flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1 transition-colors cursor-pointer">
              <span>Lihat Semua Aktivitas</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </section>

    <!-- Bottom Section: Dual Tables (Pelanggan Akan Expired & Pelanggan Expired) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      <!-- Table 1: Pelanggan Akan Expired -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 dark:border-slate-700">
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <h2 class="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">Pelanggan Akan Expired</h2>
          <button @click="router.push('/expired')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            Lihat Semua
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr class="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <th class="py-2.5 font-semibold w-10">No</th>
                <th class="py-2.5 font-semibold">Nama Pelanggan</th>
                <th class="py-2.5 font-semibold">Paket</th>
                <th class="py-2.5 font-semibold">Expired Date</th>
                <th class="py-2.5 font-semibold">Sisa Hari</th>
                <th class="py-2.5 font-semibold text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
              <tr 
                v-for="cust in akanExpiredList" 
                :key="cust.id"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <td class="py-3 text-slate-500 dark:text-slate-400 font-medium">{{ cust.no }}</td>
                <td class="py-3 font-semibold text-slate-800 dark:text-slate-200">{{ cust.name }}</td>
                <td class="py-3">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    :class="cust.packageType === 'Premium' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'"
                  >
                    {{ cust.packageType }}
                  </span>
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300">{{ cust.expiredDate }}</td>
                <td class="py-3 text-slate-600 dark:text-slate-300 font-medium">{{ cust.daysLeft }} Hari</td>
                <td class="py-3 text-center">
                  <button 
                    @click="openCustomerDetail(cust)"
                    title="Lihat Detail & Perpanjang"
                    class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table 2: Pelanggan Expired -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 dark:border-slate-700">
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <h2 class="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight">Pelanggan Expired</h2>
          <button @click="router.push('/expired')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            Lihat Semua
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr class="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <th class="py-2.5 font-semibold w-10">No</th>
                <th class="py-2.5 font-semibold">Nama Pelanggan</th>
                <th class="py-2.5 font-semibold">Paket</th>
                <th class="py-2.5 font-semibold">Expired Date</th>
                <th class="py-2.5 font-semibold">Lama Expired</th>
                <th class="py-2.5 font-semibold text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
              <tr 
                v-for="cust in expiredList" 
                :key="cust.id"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <td class="py-3 text-slate-500 dark:text-slate-400 font-medium">{{ cust.no }}</td>
                <td class="py-3 font-semibold text-slate-800 dark:text-slate-200">{{ cust.name }}</td>
                <td class="py-3">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    :class="cust.packageType === 'Premium' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'"
                  >
                    {{ cust.packageType }}
                  </span>
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300">{{ cust.expiredDate }}</td>
                <td class="py-3 text-slate-600 dark:text-slate-300 font-medium">{{ cust.daysExpired }} Hari</td>
                <td class="py-3 text-center">
                  <button 
                    @click="openCustomerDetail(cust)"
                    title="Lihat Detail & Perpanjang"
                    class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- Footer matching screenshot: '© 2026 IKI KASIR. Semua hak dilindungi.' -->
    <footer class="pt-6 pb-2 text-center text-xs text-slate-400">
      © 2026 IKI KASIR. Semua hak dilindungi.
    </footer>

    <!-- Customer Detail & Quick Renewal Modal -->
    <CustomerDetailModal 
      :is-open="isDetailModalOpen"
      :customer="selectedCustomer"
      @close="isDetailModalOpen = false"
      @renew="handleCustomerRenewed"
    />

    <!-- Interactive Toast Notification Alert -->
    <div 
      v-if="toastMessage"
      class="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-slate-700 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
        <CheckCircle2 class="w-4 h-4" />
      </div>
      <span>{{ toastMessage }}</span>
    </div>

  </div>
</template>

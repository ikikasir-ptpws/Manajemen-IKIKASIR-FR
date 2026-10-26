<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  X, 
  MessageSquare, 
  Edit3, 
  UserCheck, 
  User, 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Share2,
  CreditCard,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Package,
  Sparkles,
  Eye,
  ExternalLink
} from 'lucide-vue-next'
import type { ClientLead, LeadStatus } from '../../types/crm'

const props = defineProps<{
  client: ClientLead | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', client: ClientLead): void
  (e: 'convert', client: ClientLead): void
  (e: 'addFollowUp', clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem'): void
}>()

const showAddFollowUp = ref(false)
const newNote = ref('')
const newChannel = ref<'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem'>('WhatsApp')
const isReceiptZoomOpen = ref(false)
const copiedField = ref<string | null>(null)

const copyToClipboard = (text: string, fieldName: string) => {
  if (!text) return
  navigator.clipboard.writeText(text)
  copiedField.value = fieldName
  setTimeout(() => {
    copiedField.value = null
  }, 2000)
}

const statusBadges: Record<LeadStatus, { bg: string, text: string, border: string, label: string }> = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Baru' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Diproses' },
  'Follow Up': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Follow Up' },
  Interested: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Tertarik' },
  Converted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Disetujui (Pelanggan)' },
  Lost: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Ditolak (Lost)' },
}

const getPackageBadgeClass = (pkg?: string) => {
  switch (pkg) {
    case 'Pro':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Add on':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Custom':
    case 'Custom / IT One':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Basic':
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
}

// Cek apakah ada data kuesioner tambahan yang memang terisi (bukan kosong/strip)
const hasSurveyData = computed(() => {
  if (!props.client) return false
  const c = props.client
  return Boolean(
    c.outletCount ||
    c.employeeAppCount ||
    c.employeeCount ||
    c.currentRecordingMethod ||
    (c.neededFeatures && c.neededFeatures.length > 0) ||
    c.specialNeed ||
    c.city ||
    (c.knownFrom && c.knownFrom !== '-')
  )
})

const sendWhatsApp = () => {
  if (!props.client) return
  const phone = props.client.phone.replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const message = encodeURIComponent(`Halo Kak ${props.client.name} (${props.client.businessName}), salam dari tim IKI KASIR. Kami ingin menanyakan apakah ada hal yang bisa kami bantu seputar demo dan fitur aplikasi kasir kami? Terima kasih!`)
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}

const handleSaveFollowUp = () => {
  if (!newNote.value.trim() || !props.client) return
  emit('addFollowUp', props.client.id, newNote.value.trim(), newChannel.value)
  newNote.value = ''
  showAddFollowUp.value = false
}
</script>

<template>
  <div v-if="isOpen && client" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5 select-none">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      @click="emit('close')"
    ></div>

    <!-- Modal Box -->
    <div class="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Top Header with Breadcrumbs & Actions -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/80">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
              <span class="hover:text-slate-600 cursor-pointer" @click="emit('close')">Calon Client</span>
              <ChevronRight class="w-3.5 h-3.5" />
              <span class="text-slate-700 font-semibold">Detail Client</span>
            </div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Detail Calon Client</span>
              <span class="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-slate-200/80 text-slate-700">{{ client.id }}</span>
            </h2>
          </div>

          <button 
            @click="emit('close')"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Action Buttons Row (Responsive) -->
        <div class="flex items-center flex-wrap gap-2">
          <!-- Follow Up WhatsApp button (Green) -->
          <button 
            @click="sendWhatsApp"
            class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <!-- Edit Client button -->
          <button 
            @click="emit('edit', client)"
            class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Edit3 class="w-3.5 h-3.5" />
            <span>Edit Data</span>
          </button>

          <!-- Konversi ke Pelanggan -->
          <button 
            v-if="client.status !== 'Converted'"
            @click="emit('convert', client)"
            class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <UserCheck class="w-3.5 h-3.5 text-emerald-400" />
            <span>Setujui & Jadikan Pelanggan</span>
          </button>
        </div>
      </div>

      <!-- Main Modal Content (2 Columns: Left Profile Card, Right Data from Table) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          <!-- Left Column (4 cols): Profil & Kontak Singkat -->
          <div class="md:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <!-- Avatar with initial letter -->
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold shadow-md mb-2 sm:mb-3">
              {{ client.name?.charAt(0) || 'C' }}
            </div>

            <h3 class="text-base font-bold text-slate-800">{{ client.name }}</h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">{{ client.businessName }}</p>
            
            <!-- Badges: Status Prospek & Status Bayar -->
            <div class="mt-2 mb-3 sm:mb-4 flex flex-wrap items-center justify-center gap-1.5">
              <span 
                class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                :class="statusBadges[client.status]?.bg + ' ' + statusBadges[client.status]?.text + ' ' + statusBadges[client.status]?.border"
              >
                {{ statusBadges[client.status]?.label || client.status }}
              </span>

              <span 
                v-if="client.paymentStatus === 'pending_verification'"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Menunggu Acc</span>
              </span>
              <span 
                v-else-if="client.paymentStatus === 'verified'"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                Lunas
              </span>
            </div>

            <!-- Detail List Sidebar -->
            <div class="w-full border-t border-slate-100 pt-3 sm:pt-4 space-y-3 text-left text-xs">
              <!-- WhatsApp -->
              <div>
                <span class="text-slate-400 block text-[11px] font-semibold">No. WhatsApp:</span>
                <div class="flex items-center justify-between mt-0.5">
                  <p class="font-bold text-slate-800 font-mono">{{ client.phone }}</p>
                  <button 
                    @click="copyToClipboard(client.phone, 'phone')"
                    class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Salin Nomor WhatsApp"
                  >
                    <Check v-if="copiedField === 'phone'" class="w-3.5 h-3.5 text-emerald-600" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Email -->
              <div>
                <span class="text-slate-400 block text-[11px] font-semibold">Email:</span>
                <div class="flex items-center justify-between mt-0.5">
                  <p class="font-medium text-slate-700 break-all text-[11px]">{{ client.email || '-' }}</p>
                  <button 
                    v-if="client.email"
                    @click="copyToClipboard(client.email, 'email')"
                    class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                    title="Salin Email"
                  >
                    <Check v-if="copiedField === 'email'" class="w-3.5 h-3.5 text-emerald-600" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Sumber Prospek -->
              <div>
                <span class="text-slate-400 block text-[11px] font-semibold">Sumber Prospek:</span>
                <p class="font-bold text-slate-700 mt-0.5">{{ client.source || 'Website' }}</p>
              </div>

              <!-- Tanggal Masuk Pendaftaran -->
              <div>
                <span class="text-slate-400 block text-[11px] font-semibold">Tanggal Pendaftaran:</span>
                <p class="font-medium text-slate-700 mt-0.5">
                  {{ client.registrationDate || client.lastFollowUp || '-' }}
                </p>
              </div>

              <!-- Referral Badge & Info Card -->
              <div v-if="client.source === 'Referral' || client.referralCode" class="p-2.5 rounded-xl bg-purple-50 border border-purple-200/80 text-left">
                <div class="flex items-center gap-1.5 text-purple-800 font-bold text-[11px]">
                  <Share2 class="w-3.5 h-3.5 text-purple-600" />
                  <span>Jalur Referral</span>
                </div>
                <div class="mt-1.5 space-y-1">
                  <div>
                    <span class="text-slate-400 block text-[10px]">Kode Referral:</span>
                    <span class="font-mono font-extrabold text-purple-900 text-xs">{{ client.referralCode || '-' }}</span>
                  </div>
                  <div v-if="client.referredByCustomerName">
                    <span class="text-slate-400 block text-[10px]">Pelanggan Pengundang:</span>
                    <p class="font-bold text-slate-800 text-[11px] leading-tight">{{ client.referredByCustomerName }}</p>
                    <p v-if="client.referredByBusinessName" class="text-[10px] text-slate-500">{{ client.referredByBusinessName }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tombol Kirim Pesan WA Langsung -->
            <button 
              @click="sendWhatsApp"
              class="w-full mt-4 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare class="w-3.5 h-3.5 text-emerald-600" />
              <span>Chat WhatsApp</span>
            </button>
          </div>

          <!-- Right Column (8 cols): Data Pendaftar (Sesuai Kolom Daftar/Tabel) -->
          <div class="md:col-span-8 space-y-4 sm:space-y-5">
            
            <!-- Card 1: Informasi Pendaftaran (Sesuai Kolom Daftar) -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Store class="w-4 h-4" />
                  </div>
                  <h4 class="text-sm font-bold text-slate-800">Informasi Pendaftaran Calon Client</h4>
                </div>
                <span class="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  ID: {{ client.id }}
                </span>
              </div>
              
              <!-- Grid Data Utama: Nama, Bisnis, Kategori, Alamat -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <!-- Nama Lengkap -->
                <div>
                  <span class="text-slate-400 block text-[11px] font-semibold">Nama Lengkap:</span>
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ client.name }}</p>
                </div>

                <!-- Nama Toko / Usaha -->
                <div>
                  <span class="text-slate-400 block text-[11px] font-semibold">Nama Toko / Usaha:</span>
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ client.businessName }}</p>
                </div>

                <!-- Kategori / Jenis Usaha -->
                <div>
                  <span class="text-slate-400 block text-[11px] font-semibold">Kategori / Jenis Usaha:</span>
                  <p class="font-medium text-slate-700 mt-0.5">{{ client.businessCategory || client.businessType || 'Retail' }}</p>
                </div>

                <!-- Tanggal Pendaftaran -->
                <div>
                  <span class="text-slate-400 block text-[11px] font-semibold">Tanggal Pendaftaran:</span>
                  <p class="font-medium text-slate-700 mt-0.5">{{ client.registrationDate || client.lastFollowUp || '-' }}</p>
                </div>

                <!-- Alamat Lengkap Toko -->
                <div class="sm:col-span-2">
                  <span class="text-slate-400 block text-[11px] font-semibold">Alamat Toko / Usaha:</span>
                  <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 flex items-start gap-2">
                    <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p class="font-medium text-slate-700 leading-relaxed">
                      {{ client.address || 'Alamat belum diisi' }}
                      <span v-if="client.city" class="text-slate-500"> ({{ client.city }})</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Section: Paket Kasir & Pembayaran (Sesuai Daftar) -->
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-slate-50/70 to-blue-50/50 border border-indigo-100/80 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Package class="w-3.5 h-3.5 text-indigo-600" />
                    <span>Paket Kasir & Pembayaran</span>
                  </span>
                  
                  <span 
                    class="px-2.5 py-0.5 rounded-md text-xs font-bold border"
                    :class="getPackageBadgeClass(client.packageInterest)"
                  >
                    Paket: {{ client.packageInterest || 'Basic' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <!-- Biaya / Estimasi Paket -->
                  <div class="bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <span class="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Biaya / Estimasi Tagihan:</span>
                    <p class="text-sm font-extrabold text-indigo-700 mt-0.5">
                      Rp {{ Number(client.paymentAmount || client.harga_paket || client.estimatedDeal || 250000).toLocaleString('id-ID') }}
                    </p>
                  </div>

                  <!-- Status Pembayaran -->
                  <div class="bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <span class="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">Status Pembayaran:</span>
                    <div class="mt-0.5 flex items-center gap-1.5">
                      <span 
                        v-if="client.paymentStatus === 'pending_verification'"
                        class="inline-flex items-center gap-1 font-bold text-amber-700 text-xs"
                      >
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Menunggu Acc Finance</span>
                      </span>
                      <span 
                        v-else-if="client.paymentStatus === 'verified'"
                        class="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs"
                      >
                        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lunas & Terverifikasi</span>
                      </span>
                      <span 
                        v-else-if="client.paymentStatus === 'rejected'"
                        class="font-bold text-rose-600 text-xs"
                      >
                        Ditolak Finance
                      </span>
                      <span 
                        v-else
                        class="font-semibold text-slate-500 text-xs"
                      >
                        Belum Melakukan Pembayaran
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Bukti Transfer Pembayaran jika ada -->
                <div v-if="client.paymentProofUrl" class="bg-white/90 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-xs font-bold text-slate-800 block">Bukti Transfer Pembayaran</span>
                      <span class="text-[10px] text-slate-400 font-medium">Metode: {{ client.paymentMethod || 'Transfer Bank' }}</span>
                    </div>
                  </div>

                  <button 
                    @click="isReceiptZoomOpen = true"
                    class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                    title="Klik untuk melihat bukti transfer"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>Lihat Bukti Transfer</span>
                  </button>
                </div>
              </div>

              <!-- Catatan Pendaftaran / Keterangan -->
              <div>
                <span class="text-slate-400 block text-[11px] font-semibold">Catatan Pendaftaran / Sistem:</span>
                <p class="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 text-xs leading-relaxed">
                  {{ client.notes || 'Pendaftaran calon client via CRM.' }}
                </p>
              </div>

              <!-- Informasi Tambahan Kuesioner (HANYA MUNCUL JIKA ADA DATA YANG TERISI) -->
              <div v-if="hasSurveyData" class="pt-3 border-t border-slate-100 space-y-2">
                <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
                  <span>Informasi Tambahan Kuesioner</span>
                </span>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div v-if="client.outletCount">
                    <span class="text-slate-400 block text-[10px]">Jumlah Outlet:</span>
                    <p class="font-bold text-slate-800">{{ client.outletCount }}</p>
                  </div>

                  <div v-if="client.employeeAppCount || client.employeeCount">
                    <span class="text-slate-400 block text-[10px]">Pemakai Aplikasi:</span>
                    <p class="font-bold text-emerald-700">{{ client.employeeAppCount || client.employeeCount }} orang</p>
                  </div>

                  <div v-if="client.currentRecordingMethod">
                    <span class="text-slate-400 block text-[10px]">Metode Pencatatan Saat Ini:</span>
                    <p class="font-medium text-slate-700">{{ client.currentRecordingMethod }}</p>
                  </div>

                  <div v-if="client.neededFeatures && client.neededFeatures.length > 0" class="sm:col-span-2">
                    <span class="text-slate-400 block text-[10px]">Fitur yang Dibutuhkan:</span>
                    <p class="font-medium text-slate-700">{{ client.neededFeatures.join(', ') }}{{ client.otherNeededFeature ? ` (${client.otherNeededFeature})` : '' }}</p>
                  </div>

                  <div v-if="client.specialNeed" class="sm:col-span-2">
                    <span class="text-slate-400 block text-[10px]">Kebutuhan Khusus / Kendala:</span>
                    <p class="font-medium text-slate-700">{{ client.specialNeed }}</p>
                  </div>

                  <div v-if="client.knownFrom && client.knownFrom !== '-'">
                    <span class="text-slate-400 block text-[10px]">Mengetahui IKI KASIR Dari:</span>
                    <p class="font-medium text-slate-700">{{ client.knownFrom === 'Lainnya' && client.otherKnownFrom ? `Lainnya (${client.otherKnownFrom})` : client.knownFrom }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Card 2: Riwayat Follow Up Timeline -->
            <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
              <div class="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock class="w-4 h-4" />
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-slate-800">Riwayat Follow Up</h4>
                    <span class="text-[10px] text-slate-400">{{ client.followUpHistory?.length || 0 }} catatan interaksi</span>
                  </div>
                </div>

                <button 
                  @click="showAddFollowUp = !showAddFollowUp"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <!-- Quick Add Follow Up Input -->
              <div v-if="showAddFollowUp" class="mb-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs animate-in fade-in duration-150">
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select v-model="newChannel" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer">
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Sistem">Sistem</option>
                  </select>
                  <input 
                    v-model="newNote"
                    type="text" 
                    placeholder="Tulis catatan hasil follow up..."
                    class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                    @keyup.enter="handleSaveFollowUp"
                  />
                  <button 
                    @click="handleSaveFollowUp"
                    class="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              <!-- Timeline Items -->
              <div v-if="client.followUpHistory && client.followUpHistory.length > 0" class="space-y-3.5 sm:space-y-4 text-xs">
                <div 
                  v-for="(fu, idx) in client.followUpHistory" 
                  :key="fu.id || idx"
                  class="relative pl-6 pb-3 border-l-2 border-indigo-200 last:border-transparent last:pb-0"
                >
                  <!-- Timeline circle dot -->
                  <div class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>

                  <div class="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <span class="font-bold text-slate-800">{{ fu.date }} {{ fu.time }}</span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {{ fu.channel }}
                    </span>
                  </div>
                  <p class="text-slate-600 leading-relaxed">{{ fu.notes }}</p>
                </div>
              </div>

              <!-- Empty state riwayat follow up -->
              <div v-else class="text-center py-6 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                <p>Belum ada catatan follow up untuk calon client ini.</p>
                <button 
                  @click="showAddFollowUp = true"
                  class="mt-2 text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  + Tambah catatan follow up pertama
                </button>
              </div>

              <!-- Button at bottom: + Tambah Follow Up -->
              <div class="mt-4 pt-3 border-t border-slate-100">
                <button 
                  @click="showAddFollowUp = true"
                  class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Tambah Follow Up</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- RECEIPT LIGHTBOX ZOOM MODAL -->
    <Teleport to="body">
      <div 
        v-if="isReceiptZoomOpen && client.paymentProofUrl"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
        @click.self="isReceiptZoomOpen = false"
      >
        <div class="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800">Pratinjau Bukti Transfer Pembayaran</span>
            <button @click="isReceiptZoomOpen = false" class="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="flex items-center justify-center overflow-auto max-h-[75vh]">
            <img :src="client.paymentProofUrl" alt="Bukti Transfer" class="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-md" />
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

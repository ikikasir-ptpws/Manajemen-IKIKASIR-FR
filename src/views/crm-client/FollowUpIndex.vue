<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search, 
  MessageSquare, 
  Calendar, 
  Clock, 
  ChevronRight, 
  User, 
  Store,
  CheckCircle2
} from 'lucide-vue-next'
import ClientDetailModal from '../../components/crm/ClientDetailModal.vue'
import ClientFormModal from '../../components/crm/ClientFormModal.vue'
import ConvertClientModal from '../../components/crm/ConvertClientModal.vue'
import type { ClientLead } from '../../types/crm'

const activeTab = ref<'all' | 'today' | 'overdue' | 'upcoming'>('all')
const searchQuery = ref('')
const selectedClient = ref<ClientLead | null>(null)
const isDetailModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isConvertModalOpen = ref(false)

const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

const followUpList = ref<ClientLead[]>([
  {
    id: 'fu-1',
    no: 1,
    name: 'Budi Santoso',
    businessName: 'Toko ABC',
    businessCategory: 'Retail',
    phone: '081234567890',
    email: 'budi@email.com',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    status: 'Interested',
    source: 'Website',
    lastFollowUp: '03 Sep 2026',
    followUpSchedule: 'Hari ini',
    notes: 'Client tertarik dengan paket premium. Akan follow up minggu depan.',
    followUpHistory: [
      { id: 'fh-1', date: '04 Sep 2026', time: '10:30', channel: 'WhatsApp', notes: 'Client meminta informasi harga dan demo aplikasi.' },
      { id: 'fh-2', date: '02 Sep 2026', time: '14:20', channel: 'WhatsApp', notes: 'Sudah menghubungi client, belum ada respon.' },
      { id: 'fh-3', date: '01 Sep 2026', time: '09:15', channel: 'Sistem', notes: 'Client masuk ke CRM dari form website.' }
    ]
  },
  {
    id: 'fu-2',
    no: 2,
    name: 'Andi Wijaya',
    businessName: 'Andi Store',
    businessCategory: 'Retail',
    phone: '081398765432',
    email: 'andi@email.com',
    address: 'Jl. Ahmad Yani No. 45, Bandung',
    status: 'Contacted',
    source: 'Instagram',
    lastFollowUp: '02 Sep 2026',
    followUpSchedule: 'Hari ini',
    notes: 'Tertarik dengan fitur inventori multi-cabang.',
    followUpHistory: [
      { id: 'fh-4', date: '02 Sep 2026', time: '11:15', channel: 'WhatsApp', notes: 'Menjelaskan paket Basic dan sistem stok.' }
    ]
  },
  {
    id: 'fu-3',
    no: 3,
    name: 'Siti Aisyah',
    businessName: 'Siti Collection',
    businessCategory: 'Fashion & Butik',
    phone: '085711223344',
    email: 'siti@email.com',
    address: 'Jl. Malioboro No. 12, Yogyakarta',
    status: 'Follow Up',
    source: 'WhatsApp',
    lastFollowUp: '01 Sep 2026',
    followUpSchedule: 'Besok',
    notes: 'Minta follow up untuk meeting demo online.',
    followUpHistory: [
      { id: 'fh-5', date: '01 Sep 2026', time: '15:00', channel: 'WhatsApp', notes: 'Konfirmasi jadwal meeting demo.' }
    ]
  },
  {
    id: 'fu-4',
    no: 4,
    name: 'Rudi Hermawan',
    businessName: 'Rudi Mart',
    businessCategory: 'Minimarket & Grosir',
    phone: '082155667788',
    email: 'rudi@email.com',
    address: 'Jl. Pemuda No. 88, Semarang',
    status: 'Interested',
    source: 'Facebook Ads',
    lastFollowUp: '31 Agu 2026',
    followUpSchedule: '2 Hari lagi',
    notes: 'Ingin memastikan kompatibilitas mesin struk thermal.',
    followUpHistory: [
      { id: 'fh-6', date: '31 Agu 2026', time: '16:45', channel: 'Telepon', notes: 'Diskusi perangkat keras kasir.' }
    ]
  },
  {
    id: 'fu-5',
    no: 5,
    name: 'Dewi Lestari',
    businessName: 'Dewi Fashion',
    businessCategory: 'Fashion & Butik',
    phone: '081988990011',
    email: 'dewi@email.com',
    address: 'Jl. Diponegoro No. 23, Surabaya',
    status: 'Contacted',
    source: 'Referral',
    lastFollowUp: '30 Agu 2026',
    followUpSchedule: '3 Hari lagi',
    notes: 'Tertarik diskon langganan tahunan.',
    followUpHistory: [
      { id: 'fh-7', date: '30 Agu 2026', time: '10:00', channel: 'WhatsApp', notes: 'Kirim penawaran promo paket.' }
    ]
  },
  {
    id: 'fu-6',
    no: 6,
    name: 'Agus Setiawan',
    businessName: 'Agus Furniture',
    businessCategory: 'Jasa & Servis',
    phone: '087822334455',
    email: 'agus@email.com',
    address: 'Jl. Pahlawan No. 7, Malang',
    status: 'Follow Up',
    source: 'Direct / Walk-in',
    lastFollowUp: '29 Agu 2026',
    followUpSchedule: '5 Hari lagi',
    notes: 'Menunggu persetujuan manajemen toko.',
    followUpHistory: [
      { id: 'fh-8', date: '29 Agu 2026', time: '13:20', channel: 'WhatsApp', notes: 'Follow up pertama proposal kerja sama.' }
    ]
  }
])

const filteredList = computed(() => {
  return followUpList.value.filter(item => {
    const matchSearch = !searchQuery.value.trim() ||
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.businessName.toLowerCase().includes(searchQuery.value.toLowerCase())

    if (activeTab.value === 'today') {
      return matchSearch && item.followUpSchedule === 'Hari ini'
    } else if (activeTab.value === 'overdue') {
      return matchSearch && item.followUpSchedule === 'Terlambat'
    } else if (activeTab.value === 'upcoming') {
      return matchSearch && (item.followUpSchedule === 'Besok' || item.followUpSchedule?.includes('Hari lagi'))
    }
    return matchSearch
  })
})

const sendWhatsApp = (client: ClientLead) => {
  const phone = client.phone.replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const message = encodeURIComponent(`Halo Kak ${client.name} (${client.businessName}), ini dari tim IKI KASIR. Kami ingin menanyakan kabar seputar kebutuhan sistem kasir Anda hari ini. Ada yang bisa kami bantu?`)
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}

const openDetail = (client: ClientLead) => {
  selectedClient.value = client
  isDetailModalOpen.value = true
}

const handleAddFollowUp = (clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem') => {
  const c = followUpList.value.find(item => item.id === clientId)
  if (c) {
    c.followUpHistory.unshift({
      id: 'fh-' + Date.now(),
      date: '05 Sep 2026',
      time: '13:30',
      channel: channel,
      notes: note
    })
    c.lastFollowUp = '05 Sep 2026'
    showToast(`Follow up dicatat untuk ${c.name}!`)
  }
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Top Header matching screenshot -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Follow Up Client</h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">Kelola client yang perlu dihubungi kembali.</p>
      </div>
    </header>

    <!-- Toolbar: Tabs on Left, Search on Right matching screenshot -->
    <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <!-- Tabs matching screenshot: Semua (12) | Hari Ini (4) | Terlambat (3) | Akan Follow Up (5) -->
      <div class="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        <button 
          @click="activeTab = 'all'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          :class="activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          Semua (12)
        </button>

        <button 
          @click="activeTab = 'today'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          :class="activeTab === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          Hari Ini (4)
        </button>

        <button 
          @click="activeTab = 'overdue'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          :class="activeTab === 'overdue' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          Terlambat (3)
        </button>

        <button 
          @click="activeTab = 'upcoming'"
          class="px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          :class="activeTab === 'upcoming' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          Akan Follow Up (5)
        </button>
      </div>

      <!-- Search Input matching screenshot -->
      <div class="relative w-full sm:w-64">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari client..."
          class="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>
    </div>

    <!-- Grid of Follow Up Cards matching screenshot -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="item in filteredList" 
        :key="item.id"
        class="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-200"
      >
        <div>
          <!-- Top Row: Avatar, Name, Business -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200/80 shrink-0">
              {{ item.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">{{ item.name }}</h3>
              <p class="text-xs text-slate-400 font-medium">{{ item.businessName }}</p>
            </div>
          </div>

          <!-- Schedule & Last Contact Info -->
          <div class="space-y-1.5 py-3 border-t border-slate-100 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-500">Follow Up:</span>
              <span class="font-bold" :class="item.followUpSchedule === 'Hari ini' ? 'text-amber-600' : 'text-slate-800'">
                {{ item.followUpSchedule }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Last Contact:</span>
              <span class="font-medium text-slate-600">{{ item.lastFollowUp }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons: WhatsApp (Green) + Detail (White) matching screenshot -->
        <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button 
            @click="sendWhatsApp(item)"
            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button 
            @click="openDetail(item)"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Detail</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ClientDetailModal 
      :is-open="isDetailModalOpen"
      :client="selectedClient"
      @close="isDetailModalOpen = false"
      @edit="(c) => { isDetailModalOpen = false; isEditModalOpen = true }"
      @convert="(c) => { isDetailModalOpen = false; isConvertModalOpen = true }"
      @add-follow-up="handleAddFollowUp"
    />

    <ClientFormModal 
      :is-open="isEditModalOpen"
      :client-to-edit="selectedClient"
      @close="isEditModalOpen = false"
      @saved="(c) => { showToast(`Data ${c.name} diperbarui!`) }"
    />

    <ConvertClientModal 
      :is-open="isConvertModalOpen"
      :client="selectedClient"
      @close="isConvertModalOpen = false"
      @confirmed="(c) => { showToast(`${c.name} berhasil dikonversi!`) }"
    />

    <!-- Toast Notification Alert -->
    <div 
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-slate-700 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
        <CheckCircle2 class="w-4 h-4" />
      </div>
      <span>{{ toastMessage }}</span>
    </div>

  </div>
</template>

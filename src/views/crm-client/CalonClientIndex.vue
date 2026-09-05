<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Search, 
  Calendar, 
  RotateCcw, 
  Edit3, 
  Eye, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import ClientFormModal from '../../components/crm/ClientFormModal.vue'
import ClientDetailModal from '../../components/crm/ClientDetailModal.vue'
import ConvertClientModal from '../../components/crm/ConvertClientModal.vue'
import type { ClientLead, LeadStatus, LeadSource } from '../../types/crm'

// View state: 'table' or 'detail' matching screenshots
const currentView = ref<'table' | 'detail'>('table')

// Modals state
const isFormModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isConvertModalOpen = ref(false)
const clientToEdit = ref<ClientLead | null>(null)
const selectedClient = ref<ClientLead | null>(null)

// New follow up in detail view
const showAddFollowUp = ref(false)
const newNote = ref('')
const newChannel = ref<'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem'>('WhatsApp')

// Toast message
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Search & Filter state
const searchQuery = ref('')
const selectedStatus = ref<string>('Semua Status')
const selectedSource = ref<string>('Semua Sumber')
const currentPage = ref(1)

// Dropdown toggles
const showStatusDropdown = ref(false)
const showSourceDropdown = ref(false)
const showDateDropdown = ref(false)

// Sample client leads matching the reference image exactly
const clients = ref<ClientLead[]>([
  {
    id: 'c-1',
    no: 1,
    name: 'Budi Santoso',
    businessName: 'Toko ABC',
    businessCategory: 'Retail',
    phone: '081234567890',
    email: 'budi@email.com',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    status: 'New',
    source: 'Website',
    lastFollowUp: '04 Sep 2026',
    packageInterest: 'Premium',
    notes: 'Client tertarik dengan paket premium. Akan follow up minggu depan.',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-1', date: '04 Sep 2026', time: '10:30', channel: 'WhatsApp', notes: 'Client meminta informasi harga dan demo aplikasi.' },
      { id: 'fh-2', date: '02 Sep 2026', time: '14:20', channel: 'WhatsApp', notes: 'Sudah menghubungi client, belum ada respon.' },
      { id: 'fh-3', date: '01 Sep 2026', time: '09:15', channel: 'Sistem', notes: 'Client masuk ke CRM dari form website.' }
    ]
  },
  {
    id: 'c-2',
    no: 2,
    name: 'Andi Wijaya',
    businessName: 'Andi Store',
    businessCategory: 'Retail',
    phone: '081398765432',
    email: 'andi@email.com',
    address: 'Jl. Ahmad Yani No. 45, Bandung',
    status: 'Contacted',
    source: 'Instagram',
    lastFollowUp: '03 Sep 2026',
    packageInterest: 'Basic',
    notes: 'Sudah dihubungi via DM Instagram dan dilanjutkan ke WhatsApp.',
    followUpSchedule: 'Hari ini',
    followUpHistory: [
      { id: 'fh-4', date: '03 Sep 2026', time: '11:15', channel: 'WhatsApp', notes: 'Menjelaskan paket Basic dan sistem pencatatan stok.' }
    ]
  },
  {
    id: 'c-3',
    no: 3,
    name: 'Siti Aisyah',
    businessName: 'Siti Collection',
    businessCategory: 'Fashion & Butik',
    phone: '085711223344',
    email: 'siti@email.com',
    address: 'Jl. Malioboro No. 12, Yogyakarta',
    status: 'Follow Up',
    source: 'WhatsApp',
    lastFollowUp: '02 Sep 2026',
    packageInterest: 'Pro',
    notes: 'Meminta jadwal meeting zoom untuk demonstrasi fitur kasir cabang.',
    followUpSchedule: 'Besok',
    followUpHistory: [
      { id: 'fh-5', date: '02 Sep 2026', time: '15:00', channel: 'WhatsApp', notes: 'Konfirmasi jadwal meeting demo aplikasi kasir.' }
    ]
  },
  {
    id: 'c-4',
    no: 4,
    name: 'Rudi Hermawan',
    businessName: 'Rudi Mart',
    businessCategory: 'Minimarket & Grosir',
    phone: '082155667788',
    email: 'rudi@email.com',
    address: 'Jl. Pemuda No. 88, Semarang',
    status: 'Interested',
    source: 'Facebook Ads',
    lastFollowUp: '01 Sep 2026',
    packageInterest: 'Pro',
    notes: 'Sangat tertarik dengan integrasi scan barcode dan printer thermal.',
    followUpSchedule: '2 Hari lagi',
    followUpHistory: [
      { id: 'fh-6', date: '01 Sep 2026', time: '16:45', channel: 'Telepon', notes: 'Panggilan telepon 10 menit diskusi printer kasir bluetooth.' }
    ]
  },
  {
    id: 'c-5',
    no: 5,
    name: 'Dewi Lestari',
    businessName: 'Dewi Fashion',
    businessCategory: 'Fashion & Butik',
    phone: '081988990011',
    email: 'dewi@email.com',
    address: 'Jl. Diponegoro No. 23, Surabaya',
    status: 'Converted',
    source: 'Referral',
    lastFollowUp: '31 Agu 2026',
    packageInterest: 'Premium',
    notes: 'Telah berlangganan paket Premium 1 Tahun dan aktif digunakan.',
    followUpSchedule: '3 Hari lagi',
    followUpHistory: [
      { id: 'fh-7', date: '31 Agu 2026', time: '10:00', channel: 'WhatsApp', notes: 'Pembayaran langganan terkonfirmasi. Akun diaktifkan.' }
    ]
  },
  {
    id: 'c-6',
    no: 6,
    name: 'Agus Setiawan',
    businessName: 'Agus Furniture',
    businessCategory: 'Jasa & Servis',
    phone: '087822334455',
    email: 'agus@email.com',
    address: 'Jl. Pahlawan No. 7, Malang',
    status: 'Lost',
    source: 'Direct / Walk-in',
    lastFollowUp: '30 Agu 2026',
    packageInterest: 'Basic',
    notes: 'Belum membutuhkan sistem kasir digital dalam waktu dekat.',
    followUpSchedule: '5 Hari lagi',
    followUpHistory: [
      { id: 'fh-8', date: '30 Agu 2026', time: '13:20', channel: 'WhatsApp', notes: 'Client menginformasikan belum ada budget untuk langganan sistem.' }
    ]
  }
])

const statusOptions = ['Semua Status', 'New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost']
const sourceOptions = ['Semua Sumber', 'Website', 'Instagram', 'WhatsApp', 'Facebook Ads', 'Referral', 'Direct / Walk-in']

// Badges colors matching reference image
const statusBadges: Record<LeadStatus, { bg: string, text: string }> = {
  New: { bg: 'bg-blue-50 text-blue-600', text: 'text-blue-600' },
  Contacted: { bg: 'bg-amber-50 text-amber-600', text: 'text-amber-600' },
  'Follow Up': { bg: 'bg-purple-50 text-purple-600', text: 'text-purple-600' },
  Interested: { bg: 'bg-teal-50 text-teal-600', text: 'text-teal-600' },
  Converted: { bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
  Lost: { bg: 'bg-rose-50 text-rose-600', text: 'text-rose-600' },
}

// Filtered clients
const filteredClients = computed(() => {
  return clients.value.filter(c => {
    const matchSearch = !searchQuery.value.trim() || 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.phone.includes(searchQuery.value) ||
      c.businessName.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchStatus = selectedStatus.value === 'Semua Status' || c.status === selectedStatus.value
    const matchSource = selectedSource.value === 'Semua Sumber' || c.source === selectedSource.value

    return matchSearch && matchStatus && matchSource
  })
})

const resetFilter = () => {
  searchQuery.value = ''
  selectedStatus.value = 'Semua Status'
  selectedSource.value = 'Semua Sumber'
}

// Actions
const openAddModal = () => {
  clientToEdit.value = null
  isFormModalOpen.value = true
}

const openEditModal = (client: ClientLead) => {
  clientToEdit.value = client
  isFormModalOpen.value = true
}

const openDetailModal = (client: ClientLead) => {
  selectedClient.value = client
  isDetailModalOpen.value = true
}

const openConvertModal = (client: ClientLead) => {
  selectedClient.value = client
  isConvertModalOpen.value = true
}

const handleClientSaved = (savedClient: ClientLead) => {
  const index = clients.value.findIndex(c => c.id === savedClient.id)
  if (index !== -1) {
    clients.value[index] = savedClient
    showToast(`Data client "${savedClient.name}" berhasil diperbarui!`)
  } else {
    savedClient.no = clients.value.length + 1
    clients.value.unshift(savedClient)
    showToast(`Calon client baru "${savedClient.name}" berhasil ditambahkan!`)
  }
}

const handleConvertConfirmed = (client: ClientLead) => {
  const index = clients.value.findIndex(c => c.id === client.id)
  if (index !== -1) {
    clients.value[index].status = 'Converted'
    showToast(`Client "${client.name}" berhasil dikonversi menjadi Pelanggan Aktif!`)
  }
}

const handleAddFollowUp = (clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem') => {
  const client = clients.value.find(c => c.id === clientId)
  if (client) {
    client.followUpHistory.unshift({
      id: 'fu-' + Date.now(),
      date: '05 Sep 2026',
      time: '13:20',
      channel: channel,
      notes: note
    })
    client.lastFollowUp = '05 Sep 2026'
    showToast(`Follow up baru berhasil dicatat untuk ${client.name}!`)
  }
}

const deleteClient = (id: string, name: string) => {
  if (confirm(`Hapus calon client "${name}"?`)) {
    clients.value = clients.value.filter(c => c.id !== id)
    showToast(`Client "${name}" telah dihapus.`)
  }
}

const sendWhatsAppDirect = (client: ClientLead) => {
  const phone = client.phone.replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const message = encodeURIComponent(`Halo Kak ${client.name}, salam dari tim IKI KASIR. Kami ingin konfirmasi tindak lanjut kebutuhan sistem kasir Anda.`)
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- VIEW 1: TABLE VIEW -->
    <div v-if="currentView === 'table'" class="space-y-6 animate-in fade-in duration-150">
      <!-- Top Header matching screenshot -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Calon Client</h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">Kelola data calon pelanggan dan proses follow up.</p>
        </div>

        <!-- "+ Tambah Client" button matching screenshot -->
        <div>
          <button 
            @click="openAddModal"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Client</span>
          </button>
        </div>
      </header>

      <!-- Filter & Search Toolbar matching screenshot -->
      <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari nama / HP / email..."
            class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <!-- Filter Controls -->
        <div class="flex items-center flex-wrap gap-2.5 text-xs">
          
          <!-- Dropdown Status -->
          <div class="relative">
            <button 
              @click="showStatusDropdown = !showStatusDropdown"
              class="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{{ selectedStatus }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div 
              v-if="showStatusDropdown"
              class="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button 
                v-for="st in statusOptions" 
                :key="st"
                @click="selectedStatus = st; showStatusDropdown = false"
                class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
                :class="selectedStatus === st ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
              >
                <span>{{ st }}</span>
                <span v-if="selectedStatus === st" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              </button>
            </div>
          </div>

          <!-- Dropdown Sumber -->
          <div class="relative">
            <button 
              @click="showSourceDropdown = !showSourceDropdown"
              class="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{{ selectedSource }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div 
              v-if="showSourceDropdown"
              class="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button 
                v-for="src in sourceOptions" 
                :key="src"
                @click="selectedSource = src; showSourceDropdown = false"
                class="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 flex items-center justify-between text-xs"
                :class="selectedSource === src ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''"
              >
                <span>{{ src }}</span>
                <span v-if="selectedSource === src" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              </button>
            </div>
          </div>

          <!-- Filter Tanggal -->
          <div class="relative">
            <button 
              @click="showDateDropdown = !showDateDropdown"
              class="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Tanggal</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div 
              v-if="showDateDropdown"
              class="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
            >
              <button @click="showDateDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 text-xs">Semua Tanggal</button>
              <button @click="showDateDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 text-xs">Hari Ini</button>
              <button @click="showDateDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 text-xs">Minggu Ini</button>
              <button @click="showDateDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 font-medium text-slate-700 text-xs">Bulan Ini</button>
            </div>
          </div>

          <!-- Reset Button -->
          <button 
            @click="resetFilter"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>

      <!-- Data Table Card matching screenshot -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th class="py-3 px-4 font-semibold w-12">No</th>
                <th class="py-3 px-4 font-semibold">Nama Client</th>
                <th class="py-3 px-4 font-semibold">No. WhatsApp</th>
                <th class="py-3 px-4 font-semibold">Email</th>
                <th class="py-3 px-4 font-semibold">Status</th>
                <th class="py-3 px-4 font-semibold">Follow Up Terakhir</th>
                <th class="py-3 px-4 font-semibold text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="(client, idx) in filteredClients" 
                :key="client.id"
                class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                @click="openDetailModal(client)"
              >
                <td class="py-3.5 px-4 text-slate-400 font-medium">{{ idx + 1 }}</td>
                
                <!-- Nama Client & Toko -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-800 hover:text-indigo-600 transition-colors">{{ client.name }}</div>
                  <div class="text-[11px] text-slate-400 font-medium">{{ client.businessName }}</div>
                </td>

                <!-- No WhatsApp -->
                <td class="py-3.5 px-4 text-slate-600 font-medium font-mono text-[11px]">
                  {{ client.phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-xxxx') }}
                </td>

                <!-- Email -->
                <td class="py-3.5 px-4 text-slate-600 font-medium">
                  {{ client.email }}
                </td>

                <!-- Status Badge -->
                <td class="py-3.5 px-4">
                  <span 
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold inline-block"
                    :class="statusBadges[client.status]?.bg"
                  >
                    {{ client.status }}
                  </span>
                </td>

                <!-- Follow Up Terakhir -->
                <td class="py-3.5 px-4 text-slate-600 font-medium">
                  {{ client.lastFollowUp }}
                </td>

                <!-- Aksi (Edit, Eye, WhatsApp, Trash) matching screenshot -->
                <td class="py-3.5 px-4" @click.stop>
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Edit Button -->
                    <button 
                      @click="openEditModal(client)"
                      title="Edit Data Client"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>

                    <!-- Detail / Eye Button -->
                    <button 
                      @click="openDetailModal(client)"
                      title="Lihat Detail Client"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <!-- Direct WhatsApp Button -->
                    <button 
                      @click="sendWhatsAppDirect(client)"
                      title="Kirim Pesan WhatsApp"
                      class="w-7 h-7 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                    </button>

                    <!-- Delete Button -->
                    <button 
                      @click="deleteClient(client.id, client.name)"
                      title="Hapus Client"
                      class="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredClients.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                  Tidak ada calon client yang cocok dengan pencarian / filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer matching screenshot -->
        <div class="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan 1 - {{ filteredClients.length }} dari 24 data
          </div>

          <div class="flex items-center gap-1.5 select-none">
            <button 
              @click="currentPage = Math.max(1, currentPage - 1)"
              class="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
              :disabled="currentPage === 1"
            >
              <ChevronLeft class="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button 
              @click="currentPage = 1"
              class="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer"
              :class="currentPage === 1 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'"
            >
              1
            </button>

            <button 
              @click="currentPage = 2"
              class="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer"
              :class="currentPage === 2 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'"
            >
              2
            </button>

            <button 
              @click="currentPage = 3"
              class="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer"
              :class="currentPage === 3 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'"
            >
              3
            </button>

            <button 
              @click="currentPage = 4"
              class="w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer"
              :class="currentPage === 4 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'"
            >
              4
            </button>

            <span class="px-1 text-slate-400">...</span>

            <button 
              @click="currentPage = currentPage + 1"
              class="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight class="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: DETAIL CLIENT FULL PAGE VIEW (MATCHING SCREENSHOT) -->
    <div v-else-if="currentView === 'detail' && selectedClient" class="space-y-6 animate-in fade-in duration-150">
      <!-- Breadcrumb Navigation -->
      <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <button 
          @click="currentView = 'table'"
          class="hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer font-semibold text-slate-500"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
          <span>Calon Client</span>
        </button>
        <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
        <span class="text-slate-700 font-semibold">Detail Client</span>
      </div>

      <!-- Detail Client Header matching screenshot -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Detail Client</h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">Kelola informasi lengkap calon client.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Follow Up WhatsApp Button (Green) -->
          <button 
            @click="sendWhatsAppDirect(selectedClient)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Follow Up WhatsApp</span>
          </button>

          <!-- Edit Client Button (Purple) -->
          <button 
            @click="openEditModal(selectedClient)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit3 class="w-4 h-4" />
            <span>Edit Client</span>
          </button>

          <!-- Konversi ke Pelanggan Button -->
          <button 
            v-if="selectedClient.status !== 'Converted'"
            @click="openConvertModal(selectedClient)"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Konversi ke Pelanggan</span>
          </button>
        </div>
      </header>

      <!-- Main Detail Grid matching screenshot: Left Profile Card, Right Info & Timeline Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Profile Card (4 cols) -->
        <div class="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center">
          <!-- Avatar Picture -->
          <div class="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-3xl font-extrabold text-slate-700 mb-3 shadow-inner">
            👤
          </div>

          <h2 class="text-base font-bold text-slate-800">{{ selectedClient.name }}</h2>

          <!-- Status badge matching screenshot -->
          <div class="mt-1.5 mb-5">
            <span 
              class="px-3 py-0.5 rounded-full text-xs font-bold inline-block"
              :class="statusBadges[selectedClient.status]?.bg"
            >
              {{ selectedClient.status }}
            </span>
          </div>

          <!-- Contact info list matching screenshot -->
          <div class="w-full border-t border-slate-100 pt-4 space-y-3.5 text-left text-xs">
            <div>
              <span class="text-slate-400 block text-[11px] mb-0.5">No. WhatsApp:</span>
              <p class="font-bold text-slate-800 font-mono">{{ selectedClient.phone }}</p>
            </div>

            <div>
              <span class="text-slate-400 block text-[11px] mb-0.5">Email:</span>
              <p class="font-bold text-slate-800">{{ selectedClient.email }}</p>
            </div>

            <div>
              <span class="text-slate-400 block text-[11px] mb-0.5">Sumber:</span>
              <p class="font-bold text-slate-800">{{ selectedClient.source }}</p>
            </div>

            <div>
              <span class="text-slate-400 block text-[11px] mb-0.5">Status:</span>
              <p class="font-bold text-slate-800">{{ selectedClient.status }}</p>
            </div>
          </div>
        </div>

        <!-- Right Column (8 cols): Informasi Client & Riwayat Follow Up -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- Card 1: Informasi Client matching screenshot -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
            <h3 class="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4">Informasi Client</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-slate-400 block text-[11px]">Nama Bisnis:</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ selectedClient.businessName }}</p>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Jenis Bisnis:</span>
                <p class="font-bold text-slate-800 mt-0.5">{{ selectedClient.businessCategory || 'Retail' }}</p>
              </div>

              <div class="sm:col-span-2">
                <span class="text-slate-400 block text-[11px]">Alamat:</span>
                <p class="font-medium text-slate-700 mt-0.5">{{ selectedClient.address || 'Jl. Merdeka No. 10, Jakarta Pusat' }}</p>
              </div>

              <div class="sm:col-span-2">
                <span class="text-slate-400 block text-[11px]">Catatan:</span>
                <p class="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                  {{ selectedClient.notes || 'Client tertarik dengan paket premium. Akan follow up minggu depan.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Card 2: Riwayat Follow Up Timeline matching screenshot -->
          <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 class="text-sm font-bold text-slate-800">Riwayat Follow Up</h3>
              <button 
                @click="showAddFollowUp = !showAddFollowUp"
                class="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Follow Up</span>
              </button>
            </div>

            <!-- Inline Input for Add Follow Up -->
            <div v-if="showAddFollowUp" class="mb-5 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs">
              <div class="flex items-center gap-2">
                <select v-model="newChannel" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telepon">Telepon</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Sistem">Sistem</option>
                </select>
                <input 
                  v-model="newNote"
                  type="text" 
                  placeholder="Tulis ringkasan hasil follow up client..."
                  class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                  @keyup.enter="() => { handleAddFollowUp(selectedClient.id, newNote, newChannel); newNote = ''; showAddFollowUp = false; }"
                />
                <button 
                  @click="() => { handleAddFollowUp(selectedClient.id, newNote, newChannel); newNote = ''; showAddFollowUp = false; }"
                  class="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>

            <!-- Timeline items matching screenshot -->
            <div class="space-y-4 text-xs">
              <div 
                v-for="fu in selectedClient.followUpHistory" 
                :key="fu.id"
                class="relative pl-6 pb-4 border-l-2 border-indigo-200 last:border-transparent last:pb-0"
              >
                <!-- Blue dot on timeline -->
                <div class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>

                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-slate-800">{{ fu.date }} {{ fu.time }}</span>
                  <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {{ fu.channel }}
                  </span>
                </div>
                <p class="text-slate-600 leading-relaxed">{{ fu.notes }}</p>
              </div>
            </div>

            <!-- Bottom Action Button: + Tambah Follow Up -->
            <div class="mt-5 pt-3 border-t border-slate-100">
              <button 
                @click="showAddFollowUp = true"
                class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Follow Up</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Modals -->
    <!-- Form Tambah / Edit Client ("Sangat Bagus") -->
    <ClientFormModal 
      :is-open="isFormModalOpen"
      :client-to-edit="clientToEdit"
      @close="isFormModalOpen = false"
      @saved="handleClientSaved"
    />

    <!-- Detail Client Drawer Modal -->
    <ClientDetailModal 
      :is-open="isDetailModalOpen"
      :client="selectedClient"
      @close="isDetailModalOpen = false"
      @edit="(c) => { isDetailModalOpen = false; openEditModal(c) }"
      @convert="(c) => { isDetailModalOpen = false; openConvertModal(c) }"
      @add-follow-up="handleAddFollowUp"
    />

    <!-- Konversi ke Pelanggan Modal -->
    <ConvertClientModal 
      :is-open="isConvertModalOpen"
      :client="selectedClient"
      @close="isConvertModalOpen = false"
      @confirmed="handleConvertConfirmed"
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

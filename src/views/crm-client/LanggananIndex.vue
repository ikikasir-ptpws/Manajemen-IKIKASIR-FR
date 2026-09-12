<script setup lang="ts">
import { ref, computed } from 'vue'
import { Receipt, Search, Download, CheckCircle2, XCircle, Clock, Eye, X, ChevronDown, Filter } from 'lucide-vue-next'

const searchQuery = ref('')
const filterStatus = ref('Semua')
const showFilterDropdown = ref(false)
const showInvoiceModal = ref(false)
const selectedInvoice = ref<any>(null)
const toastMessage = ref<string | null>(null)

const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

const subscriptions = ref([
  { id: 'INV-001', customer: 'Budi Santoso', business: 'Toko Budi Jaya', amount: 349000, package: 'Premium', status: 'Paid', date: '10 Sep 2026', method: 'QRIS' },
  { id: 'INV-002', customer: 'Siti Aisyah', business: 'Warung Bu Siti', amount: 99000, package: 'Basic', status: 'Pending', date: '09 Sep 2026', method: 'Transfer BCA' },
  { id: 'INV-003', customer: 'Andi Wijaya', business: 'Kopi Kenangan Andi', amount: 199000, package: 'Pro', status: 'Failed', date: '08 Sep 2026', method: 'Transfer Mandiri' },
  { id: 'INV-004', customer: 'Dewi Lestari', business: 'Butik Dewi', amount: 349000, package: 'Premium', status: 'Paid', date: '07 Sep 2026', method: 'QRIS' },
  { id: 'INV-005', customer: 'Rudi Hermawan', business: 'Kopi Rudi', amount: 99000, package: 'Basic', status: 'Paid', date: '06 Sep 2026', method: 'Cash' },
])

const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

const filteredSubs = computed(() => {
  let list = subscriptions.value
  if (filterStatus.value !== 'Semua') {
    list = list.filter(s => s.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.customer.toLowerCase().includes(q) || s.business.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  return list
})

const openInvoice = (sub: any) => {
  selectedInvoice.value = sub
  showInvoiceModal.value = true
}

const handleExport = () => {
  showToast('Data langganan berhasil diekspor! (Demo)')
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast -->
    <Transition name="slide-fade">
      <div v-if="toastMessage" class="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
        ✅ {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Receipt class="w-6 h-6 text-indigo-600" />
          Data Langganan
        </h1>
        <p class="text-xs text-slate-500 mt-1">Riwayat pembayaran dan tagihan langganan kasir.</p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari invoice/pelanggan..." 
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <!-- Filter -->
        <div class="relative">
          <button 
            @click="showFilterDropdown = !showFilterDropdown"
            class="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <Filter class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">{{ filterStatus }}</span>
            <ChevronDown class="w-3 h-3" />
          </button>
          <div v-if="showFilterDropdown" class="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 text-xs">
            <button v-for="s in ['Semua', 'Paid', 'Pending', 'Failed']" :key="s"
              @click="filterStatus = s; showFilterDropdown = false"
              class="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
              :class="filterStatus === s ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'"
            >{{ s === 'Paid' ? '✅ Lunas' : s === 'Pending' ? '⏳ Menunggu' : s === 'Failed' ? '❌ Gagal' : 'Semua' }}</button>
          </div>
        </div>
        <button 
          @click="handleExport"
          class="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0 cursor-pointer"
        >
          <Download class="w-4 h-4" />
          <span class="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 font-semibold text-slate-600">No. Invoice</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Pelanggan</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Paket</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Total Tagihan</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Tanggal</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Status Pembayaran</th>
              <th class="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="sub in filteredSubs" :key="sub.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-indigo-700 text-xs">{{ sub.id }}</td>
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800">{{ sub.customer }}</div>
                <div class="text-xs text-slate-500">{{ sub.business }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700 font-medium">{{ sub.package }}</td>
              <td class="px-6 py-4 font-extrabold text-slate-800">{{ formatCurrency(sub.amount) }}</td>
              <td class="px-6 py-4 text-slate-500 text-xs font-medium">{{ sub.date }}</td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': sub.status === 'Paid',
                    'bg-amber-50 text-amber-600': sub.status === 'Pending',
                    'bg-rose-50 text-rose-600': sub.status === 'Failed'
                  }"
                >
                  <CheckCircle2 v-if="sub.status === 'Paid'" class="w-3 h-3" />
                  <Clock v-else-if="sub.status === 'Pending'" class="w-3 h-3" />
                  <XCircle v-else class="w-3 h-3" />
                  {{ sub.status === 'Paid' ? 'Lunas' : sub.status === 'Pending' ? 'Menunggu' : 'Gagal' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button @click="openInvoice(sub)" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                  Lihat Invoice
                </button>
              </td>
            </tr>
            <tr v-if="filteredSubs.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-slate-400 text-sm">
                Belum ada data langganan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <div v-if="showInvoiceModal && selectedInvoice" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showInvoiceModal = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-slate-800">Detail Invoice</h3>
          <button @click="showInvoiceModal = false" class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X class="w-4 h-4 text-slate-400" /></button>
        </div>
        
        <div class="bg-slate-50 rounded-xl p-4 mb-4 text-center">
          <div class="text-xs text-slate-500 font-medium">No. Invoice</div>
          <div class="text-lg font-mono font-extrabold text-indigo-700 mt-0.5">{{ selectedInvoice.id }}</div>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Pelanggan</span><span class="font-semibold text-slate-800">{{ selectedInvoice.customer }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Bisnis</span><span class="font-semibold text-slate-800">{{ selectedInvoice.business }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Paket</span><span class="font-semibold text-slate-800">{{ selectedInvoice.package }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Metode Pembayaran</span><span class="font-semibold text-slate-800">{{ selectedInvoice.method }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Tanggal</span><span class="font-semibold text-slate-800">{{ selectedInvoice.date }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50">
            <span class="text-slate-500">Status</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold"
              :class="{
                'bg-emerald-50 text-emerald-600': selectedInvoice.status === 'Paid',
                'bg-amber-50 text-amber-600': selectedInvoice.status === 'Pending',
                'bg-rose-50 text-rose-600': selectedInvoice.status === 'Failed',
              }"
            >{{ selectedInvoice.status === 'Paid' ? 'Lunas' : selectedInvoice.status === 'Pending' ? 'Menunggu' : 'Gagal' }}</span>
          </div>
          <div class="flex justify-between py-3 bg-indigo-50 rounded-xl px-4 -mx-1">
            <span class="text-indigo-700 font-semibold">Total Tagihan</span>
            <span class="font-extrabold text-indigo-700 text-lg">{{ formatCurrency(selectedInvoice.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { transform: translateX(30px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(30px); opacity: 0; }
</style>

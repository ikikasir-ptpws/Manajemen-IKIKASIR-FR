<script setup lang="ts">
import { ref, computed } from 'vue'
import { Users, Search, Plus, Eye, Edit2, Trash2, ShieldCheck, MapPin, Filter, X, ChevronDown } from 'lucide-vue-next'

const searchQuery = ref('')
const showFilterDropdown = ref(false)
const filterType = ref('Semua')
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const showAddEditModal = ref(false)
const editMode = ref(false)
const selectedCustomer = ref<any>(null)
const toastMessage = ref<string | null>(null)

const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

const customers = ref([
  { id: 1, name: 'Budi Santoso', business: 'Toko Budi Jaya', type: 'Premium', phone: '081234567890', address: 'Jl. Merdeka No 1', joinDate: '12 Jan 2026', status: 'Active' },
  { id: 2, name: 'Siti Aisyah', business: 'Warung Bu Siti', type: 'Basic', phone: '085712345678', address: 'Jl. Sudirman 45', joinDate: '05 Feb 2026', status: 'Active' },
  { id: 3, name: 'Andi Wijaya', business: 'Kopi Kenangan Andi', type: 'Pro', phone: '081398765432', address: 'Ruko Baru No 7', joinDate: '20 Mar 2026', status: 'Inactive' },
  { id: 4, name: 'Dewi Lestari', business: 'Butik Dewi', type: 'Premium', phone: '082123456789', address: 'Mall ABC, Lt 2', joinDate: '15 Apr 2026', status: 'Active' },
])

// Form state
const form = ref({ name: '', business: '', type: 'Basic', phone: '', address: '' })

const filteredCustomers = computed(() => {
  let list = customers.value
  if (filterType.value !== 'Semua') {
    list = list.filter(c => c.type === filterType.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.business.toLowerCase().includes(q) || c.phone.includes(q))
  }
  return list
})

const openDetail = (cust: any) => {
  selectedCustomer.value = cust
  showDetailModal.value = true
}

const openEdit = (cust: any) => {
  editMode.value = true
  form.value = { name: cust.name, business: cust.business, type: cust.type, phone: cust.phone, address: cust.address }
  selectedCustomer.value = cust
  showAddEditModal.value = true
}

const openAdd = () => {
  editMode.value = false
  form.value = { name: '', business: '', type: 'Basic', phone: '', address: '' }
  showAddEditModal.value = true
}

const saveCustomer = () => {
  if (!form.value.name || !form.value.business) return
  if (editMode.value && selectedCustomer.value) {
    const idx = customers.value.findIndex(c => c.id === selectedCustomer.value.id)
    if (idx !== -1) {
      customers.value[idx] = { ...customers.value[idx], ...form.value }
      showToast(`Data "${form.value.name}" berhasil diperbarui!`)
    }
  } else {
    customers.value.push({
      id: Date.now(),
      name: form.value.name,
      business: form.value.business,
      type: form.value.type,
      phone: form.value.phone,
      address: form.value.address,
      joinDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active'
    })
    showToast(`Pelanggan "${form.value.name}" berhasil ditambahkan!`)
  }
  showAddEditModal.value = false
}

const confirmDelete = (cust: any) => {
  selectedCustomer.value = cust
  showDeleteConfirm.value = true
}

const deleteCustomer = () => {
  customers.value = customers.value.filter(c => c.id !== selectedCustomer.value.id)
  showToast(`Pelanggan "${selectedCustomer.value.name}" berhasil dihapus!`)
  showDeleteConfirm.value = false
  selectedCustomer.value = null
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast -->
    <Transition name="slide-fade">
      <div v-if="toastMessage" class="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
        ✅ {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Users class="w-6 h-6 text-indigo-600" />
          Semua Pelanggan
        </h1>
        <p class="text-xs text-slate-500 mt-1">Daftar lengkap semua pelanggan IKI KASIR Anda.</p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari pelanggan..." 
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <!-- Filter -->
        <div class="relative">
          <button 
            @click="showFilterDropdown = !showFilterDropdown"
            class="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            <Filter class="w-4 h-4" />
            <span class="hidden sm:inline">{{ filterType }}</span>
            <ChevronDown class="w-3 h-3" />
          </button>
          <div v-if="showFilterDropdown" class="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 text-xs">
            <button v-for="t in ['Semua', 'Basic', 'Pro', 'Premium']" :key="t"
              @click="filterType = t; showFilterDropdown = false"
              class="w-full text-left px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 font-medium cursor-pointer"
              :class="filterType === t ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'"
            >{{ t }}</button>
          </div>
        </div>
        <button 
          @click="openAdd"
          class="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Tambah Pelanggan</span>
        </button>
      </div>
    </header>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[900px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 font-semibold text-slate-600 w-16">No</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Info Pelanggan & Bisnis</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Kontak</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Tipe Paket</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Tanggal Gabung</th>
              <th class="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="(cust, index) in filteredCustomers" :key="cust.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-6 py-4 text-slate-500 font-medium">{{ index + 1 }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {{ cust.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-sm">{{ cust.name }}</div>
                    <div class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <ShieldCheck class="w-3 h-3 text-slate-400" />
                      {{ cust.business }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-700">{{ cust.phone }}</div>
                <div class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin class="w-3 h-3 text-slate-400" />
                  <span class="truncate max-w-[150px]">{{ cust.address }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-md text-[11px] font-bold"
                  :class="{
                    'bg-amber-50 text-amber-600 border border-amber-100': cust.type === 'Premium',
                    'bg-blue-50 text-blue-600 border border-blue-100': cust.type === 'Pro',
                    'bg-slate-100 text-slate-600 border border-slate-200': cust.type === 'Basic'
                  }"
                >
                  {{ cust.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-xs font-medium">{{ cust.joinDate }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openDetail(cust)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Lihat Detail">
                    <Eye class="w-4 h-4" />
                  </button>
                  <button @click="openEdit(cust)" class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button @click="confirmDelete(cust)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Hapus">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">
                Belum ada data pelanggan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal && selectedCustomer" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showDetailModal = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800">Detail Pelanggan</h3>
          <button @click="showDetailModal = false" class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X class="w-4 h-4 text-slate-400" /></button>
        </div>
        <div class="flex items-center gap-3 mb-5">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">{{ selectedCustomer.name.charAt(0) }}</div>
          <div>
            <div class="font-bold text-slate-800">{{ selectedCustomer.name }}</div>
            <div class="text-xs text-slate-500">{{ selectedCustomer.business }}</div>
          </div>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Telepon</span><span class="font-semibold text-slate-800">{{ selectedCustomer.phone }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Alamat</span><span class="font-semibold text-slate-800 text-right max-w-[200px]">{{ selectedCustomer.address }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Paket</span><span class="font-semibold text-slate-800">{{ selectedCustomer.type }}</span></div>
          <div class="flex justify-between py-2 border-b border-slate-50"><span class="text-slate-500">Tanggal Gabung</span><span class="font-semibold text-slate-800">{{ selectedCustomer.joinDate }}</span></div>
          <div class="flex justify-between py-2"><span class="text-slate-500">Status</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" :class="selectedCustomer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'">{{ selectedCustomer.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddEditModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showAddEditModal = false">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-slate-800">{{ editMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru' }}</h3>
          <button @click="showAddEditModal = false" class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"><X class="w-4 h-4 text-slate-400" /></button>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Nama Pelanggan *</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Masukkan nama..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Nama Bisnis *</label>
            <input v-model="form.business" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Masukkan nama bisnis..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">No. Telepon</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="08xxx..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Alamat</label>
            <input v-model="form.address" type="text" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Alamat..." />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 mb-1 block">Tipe Paket</label>
            <select v-model="form.type" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500">
              <option>Basic</option>
              <option>Pro</option>
              <option>Premium</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-6">
          <button @click="showAddEditModal = false" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Batal</button>
          <button @click="saveCustomer" class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer">{{ editMode ? 'Simpan Perubahan' : 'Tambah Pelanggan' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm && selectedCustomer" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
        <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center">Hapus Pelanggan?</h3>
        <p class="text-sm text-slate-500 text-center mt-1">Data <strong>{{ selectedCustomer.name }}</strong> akan dihapus secara permanen.</p>
        <div class="flex items-center gap-3 mt-6">
          <button @click="showDeleteConfirm = false" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Batal</button>
          <button @click="deleteCustomer" class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 cursor-pointer">Ya, Hapus</button>
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  User,
  Shield,
  KeyRound,
  AlertCircle,
  RotateCcw,
  Clock
} from 'lucide-vue-next'
import { usePagination } from '../../composables/usePagination'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import { usersApi, rolesApi } from '../../api'

export interface AppUser {
  id: string
  name: string
  email: string
  role: 'Super Admin' | 'Finance' | 'Teknisi' | 'Admin' | 'Staff' | 'Kasir'
  status: 'Active' | 'Inactive'
  lastLogin: string
}

const STORAGE_KEY_USERS = 'ikikasir_users_v3'

const initialUsers: AppUser[] = [
  { id: 'usr-1', name: 'Budi Santoso', email: 'budi@ikikasir.com', role: 'Super Admin', status: 'Active', lastLogin: '2 jam yang lalu' },
  { id: 'usr-fin', name: 'Rina Finance', email: 'finance@ikikasir.com', role: 'Finance', status: 'Active', lastLogin: 'Baru saja' },
  { id: 'usr-tek', name: 'Doni Teknisi', email: 'teknisi@ikikasir.com', role: 'Teknisi', status: 'Active', lastLogin: '10 menit yang lalu' },
  { id: 'usr-2', name: 'Siti Aisyah', email: 'siti@ikikasir.com', role: 'Admin', status: 'Active', lastLogin: '1 hari yang lalu' },
  { id: 'usr-3', name: 'Andi Wijaya', email: 'andi@ikikasir.com', role: 'Staff', status: 'Inactive', lastLogin: '1 minggu yang lalu' },
  { id: 'usr-4', name: 'Dewi Lestari', email: 'dewi.kasir@ikikasir.com', role: 'Kasir', status: 'Active', lastLogin: '3 jam yang lalu' },
  { id: 'usr-5', name: 'Hendra Kurniawan', email: 'hendra.tek@ikikasir.com', role: 'Teknisi', status: 'Active', lastLogin: '4 jam yang lalu' },
  { id: 'usr-6', name: 'Maya Putri', email: 'maya.finance@ikikasir.com', role: 'Finance', status: 'Active', lastLogin: '5 jam yang lalu' },
  { id: 'usr-7', name: 'Rizky Pratama', email: 'rizky.admin@ikikasir.com', role: 'Admin', status: 'Active', lastLogin: '2 hari yang lalu' },
  { id: 'usr-8', name: 'Linda Kusuma', email: 'linda.kasir@ikikasir.com', role: 'Kasir', status: 'Active', lastLogin: '30 menit yang lalu' },
  { id: 'usr-9', name: 'Fajar Ramadhan', email: 'fajar.staff@ikikasir.com', role: 'Staff', status: 'Inactive', lastLogin: '3 minggu yang lalu' },
  { id: 'usr-10', name: 'Nia Safitri', email: 'nia.kasir@ikikasir.com', role: 'Kasir', status: 'Active', lastLogin: '1 hari yang lalu' }
]

const users = ref<AppUser[]>([])
const searchQuery = ref('')
const filterRole = ref('Semua Role')
const isModalOpen = ref(false)
const isEditing = ref(false)
const selectedUser = ref<AppUser | null>(null)
const userToDelete = ref<AppUser | null>(null)
const isDeleteConfirmOpen = ref(false)
const toastMessage = ref<string | null>(null)
const isLoadingUsers = ref(false)
const isSaving = ref(false)
const availableRoles = ref<string[]>(['Super Admin', 'Finance', 'Teknisi', 'Admin', 'Staff', 'Kasir'])

const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = null
  }, 3500)
}

// Form state
const form = ref({
  id: '',
  name: '',
  email: '',
  role: 'Finance' as 'Super Admin' | 'Finance' | 'Teknisi' | 'Admin' | 'Staff' | 'Kasir',
  status: 'Active' as 'Active' | 'Inactive',
  password: ''
})
const formErrors = ref<Record<string, string>>({})

const loadUsers = async () => {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          users.value = parsed
        }
      }
    } catch {
      users.value = [...initialUsers]
    }
  }

  isLoadingUsers.value = true
  try {
    const [usersRes, rolesRes] = await Promise.allSettled([
      usersApi.getAll(),
      rolesApi.getAll()
    ])

    if (rolesRes.status === 'fulfilled' && rolesRes.value.data) {
      const rolesList = rolesRes.value.data.map((r: any) => r.name)
      if (rolesList.length > 0) {
        availableRoles.value = rolesList
      }
    }

    if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
      const apiUsers: AppUser[] = usersRes.value.data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role || u.roleDetail?.name || 'Admin') as any,
        status: (u.status || (u.isActive ? 'Active' : 'Inactive')) as any,
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Belum pernah'
      }))

      if (apiUsers.length > 0) {
        users.value = apiUsers
        saveUsersToStorage()
      }
    }
  } catch (e) {
    console.warn('Backend users API not accessible, using cached users:', e)
  } finally {
    isLoadingUsers.value = false
  }
}

const saveUsersToStorage = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users.value))
  }
}

onMounted(() => {
  loadUsers()
})

const filteredUsers = computed(() => {
  let list = users.value
  if (filterRole.value !== 'Semua Role') {
    list = list.filter(u => u.role === filterRole.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }
  return list
})

// Pagination composable with default page size 10 (options: 5, 10, 25, 50)
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedItems: paginatedUsers,
  resetPage
} = usePagination(filteredUsers, 10)

watch([searchQuery, filterRole], () => {
  resetPage()
})

const resetFilters = () => {
  searchQuery.value = ''
  filterRole.value = 'Semua Role'
  resetPage()
}

const totalUsersCount = computed(() => users.value.length)
const activeUsersCount = computed(() => users.value.filter(u => u.status === 'Active').length)

const openAddModal = () => {
  isEditing.value = false
  selectedUser.value = null
  form.value = {
    id: '',
    name: '',
    email: '',
    role: 'Admin',
    status: 'Active',
    password: ''
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const openEditModal = (u: AppUser) => {
  isEditing.value = true
  selectedUser.value = u
  form.value = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    password: ''
  }
  formErrors.value = {}
  isModalOpen.value = true
}

const validateForm = () => {
  const errs: Record<string, string> = {}
  if (!form.value.name.trim()) {
    errs.name = 'Nama lengkap wajib diisi.'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email.trim()) {
    errs.email = 'Email wajib diisi.'
  } else if (!emailRegex.test(form.value.email.trim())) {
    errs.email = 'Format email tidak valid.'
  } else {
    // Check duplicate email
    const exists = users.value.some(
      u => u.email.toLowerCase() === form.value.email.trim().toLowerCase() && u.id !== form.value.id
    )
    if (exists) {
      errs.email = 'Email ini sudah terdaftar oleh pengguna lain.'
    }
  }

  formErrors.value = errs
  return Object.keys(errs).length === 0
}

const handleSaveUser = async () => {
  if (!validateForm()) return

  isSaving.value = true
  try {
    if (isEditing.value && form.value.id) {
      try {
        await usersApi.update(form.value.id, {
          name: form.value.name.trim(),
          email: form.value.email.trim(),
          role: form.value.role,
          status: form.value.status,
          password: form.value.password ? form.value.password : undefined
        })
      } catch (err: any) {
        console.warn('API update failed, updating locally:', err)
      }

      const target = users.value.find(u => u.id === form.value.id)
      if (target) {
        target.name = form.value.name.trim()
        target.email = form.value.email.trim()
        target.role = form.value.role
        target.status = form.value.status
        saveUsersToStorage()
        showToast(`Pengguna "${form.value.name}" berhasil diperbarui!`)
      }
    } else {
      let createdId = 'usr-' + Date.now()
      try {
        const res = await usersApi.create({
          name: form.value.name.trim(),
          email: form.value.email.trim(),
          password: form.value.password || 'Ikikasir#2026',
          role: form.value.role,
          status: form.value.status
        })
        if (res.data?.id) createdId = res.data.id
      } catch (err: any) {
        console.warn('API create failed, saving locally:', err)
      }

      const newUser: AppUser = {
        id: createdId,
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        role: form.value.role,
        status: form.value.status,
        lastLogin: 'Baru saja'
      }
      users.value.unshift(newUser)
      saveUsersToStorage()
      showToast(`Pengguna baru "${newUser.name}" berhasil ditambahkan!`)
    }

    isModalOpen.value = false
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan pengguna.')
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (u: AppUser) => {
  userToDelete.value = u
  isDeleteConfirmOpen.value = true
}

const executeDelete = async () => {
  if (userToDelete.value) {
    const deletedId = userToDelete.value.id
    const deletedName = userToDelete.value.name
    try {
      await usersApi.delete(deletedId)
    } catch (err: any) {
      console.warn('API delete failed, removing locally:', err)
    }

    users.value = users.value.filter(u => u.id !== deletedId)
    saveUsersToStorage()
    showToast(`Pengguna "${deletedName}" berhasil dihapus.`)
  }
  isDeleteConfirmOpen.value = false
  userToDelete.value = null
}

const toggleStatus = async (u: AppUser) => {
  const newStatus = u.status === 'Active' ? 'Inactive' : 'Active'
  try {
    await usersApi.toggleStatus(u.id, newStatus)
  } catch (err: any) {
    console.warn('API toggleStatus failed, toggling locally:', err)
  }
  u.status = newStatus
  saveUsersToStorage()
  showToast(`Status pengguna ${u.name} diubah menjadi ${u.status}.`)
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 text-sm font-medium"
    >
      <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manajemen Pengguna
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kelola data pengguna, hak akses, dan status akun sistem.</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
          <span>Total: <strong class="text-slate-900 dark:text-white font-bold">{{ totalUsersCount }}</strong></span>
          <span class="text-slate-300 dark:text-slate-600">•</span>
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ activeUsersCount }} Aktif</span>
        </div>
        <button 
          @click="openAddModal"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none shrink-0 cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>
    </header>

    <!-- Toolbar Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari pengguna berdasarkan nama, email, atau role..." 
          class="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-all placeholder-slate-400"
        />
        <button 
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center flex-wrap gap-2 text-xs">
        <!-- Role Filter -->
        <select
          v-model="filterRole"
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option>Semua Role</option>
          <option>Super Admin</option>
          <option>Finance</option>
          <option>Teknisi</option>
          <option>Admin</option>
          <option>Staff</option>
          <option>Kasir</option>
        </select>

        <!-- Reset Button -->
        <button 
          v-if="searchQuery || filterRole !== 'Semua Role'"
          @click="resetFilters"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Reset Filter"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>

    <!-- Table Container & Card Wrapper -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700/60 overflow-hidden">
      <!-- Desktop Table (Visible on md and up) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[750px]">
          <thead class="bg-slate-50/75 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th class="px-5 py-3.5 w-16">No</th>
              <th class="px-5 py-3.5">Pengguna</th>
              <th class="px-5 py-3.5">Role</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5">Login Terakhir</th>
              <th class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr 
              v-for="(u, index) in paginatedUsers" 
              :key="u.id" 
              class="hover:bg-slate-50/80 dark:hover:bg-slate-700/25 transition-colors group"
            >
              <td class="px-5 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs font-semibold">
                {{ startIndex + index + 1 }}
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {{ u.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {{ u.name }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span 
                  class="px-2.5 py-1 rounded-md text-xs font-semibold"
                  :class="{
                    'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800': u.role === 'Super Admin',
                    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800': u.role === 'Finance',
                    'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800': u.role === 'Teknisi',
                    'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800': u.role === 'Admin',
                    'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800': u.role === 'Staff',
                    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800': u.role === 'Kasir'
                  }"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="px-5 py-4">
                <button
                  @click="toggleStatus(u)"
                  title="Klik untuk mengubah status"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors active:scale-95"
                  :class="u.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'"
                >
                  <CheckCircle2 v-if="u.status === 'Active'" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  <span>{{ u.status }}</span>
                </button>
              </td>
              <td class="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                <div class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ u.lastLogin }}</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    @click="openEditModal(u)"
                    class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Pengguna"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    @click="confirmDelete(u)"
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Pengguna"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state desktop -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="max-w-xs mx-auto space-y-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                    <Users class="w-6 h-6" />
                  </div>
                  <div class="space-y-1">
                    <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada pengguna ditemukan</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500">Coba ubah kata kunci pencarian atau role filter Anda.</p>
                  </div>
                  <button 
                    v-if="searchQuery || filterRole !== 'Semua Role'"
                    @click="resetFilters"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List/Cards View (Visible on < md) -->
      <div class="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        <div 
          v-for="(u, index) in paginatedUsers" 
          :key="u.id" 
          class="p-4 space-y-3 hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {{ u.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-slate-400 font-mono font-bold">#{{ startIndex + index + 1 }}</span>
                  <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm">{{ u.name }}</h4>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ u.email }}</p>
              </div>
            </div>
            <button
              @click="toggleStatus(u)"
              title="Klik untuk mengubah status"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors shrink-0"
              :class="u.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'"
            >
              <CheckCircle2 v-if="u.status === 'Active'" class="w-3 h-3" />
              <XCircle v-else class="w-3 h-3" />
              <span>{{ u.status }}</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/40">
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                :class="{
                  'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300': u.role === 'Super Admin',
                  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300': u.role === 'Finance',
                  'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300': u.role === 'Teknisi',
                  'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': u.role === 'Admin',
                  'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': u.role === 'Staff',
                  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300': u.role === 'Kasir'
                }"
              >
                {{ u.role }}
              </span>
              <span class="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                <span>{{ u.lastLogin }}</span>
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button 
                @click="openEditModal(u)"
                class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Edit Pengguna"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button 
                @click="confirmDelete(u)"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Hapus Pengguna"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state mobile -->
        <div v-if="filteredUsers.length === 0" class="p-8 text-center">
          <div class="max-w-xs mx-auto space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
              <Users class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada pengguna ditemukan</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">Coba ubah kata kunci atau role filter.</p>
            </div>
            <button 
              v-if="searchQuery || filterRole !== 'Semua Role'"
              @click="resetFilters"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredUsers.length > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <!-- Modal Form Tambah/Edit Pengguna -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <User class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ isEditing ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru' }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Atur akses dan akun pengguna sistem</p>
            </div>
          </div>
          <button 
            @click="isModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body Form -->
        <form @submit.prevent="handleSaveUser" class="p-6 space-y-4">
          <!-- Nama Lengkap -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nama Lengkap <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="form.name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p v-if="formErrors.name" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.name }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Alamat Email <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="form.email"
                type="email"
                placeholder="user@ikikasir.com"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p v-if="formErrors.email" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ formErrors.email }}
            </p>
          </div>

          <!-- Role & Status -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Role Akses
              </label>
              <div class="relative">
                <Shield class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  v-model="form.role"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Finance">Finance (Acc Pembayaran)</option>
                  <option value="Teknisi">Teknisi (Penyiapan Aplikasi)</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Kasir">Kasir</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Status Akun
              </label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Active">Active (Aktif)</option>
                <option value="Inactive">Inactive (Nonaktif)</option>
              </select>
            </div>
          </div>

          <!-- Password (Opsional) -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {{ isEditing ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi' }}
            </label>
            <div class="relative">
              <KeyRound class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="form.password"
                type="password"
                :placeholder="isEditing ? 'Biarkan kosong jika tidak ingin ganti' : 'Minimal 6 karakter'"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              @click="isModalOpen = false"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              {{ isEditing ? 'Simpan Perubahan' : 'Tambah Pengguna' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div
      v-if="isDeleteConfirmOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-700">
        <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Hapus Pengguna?</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Apakah Anda yakin ingin menghapus <strong>{{ userToDelete?.name }}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex items-center gap-3 mt-6">
          <button
            @click="isDeleteConfirmOpen = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="executeDelete"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none cursor-pointer"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

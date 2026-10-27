<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ShieldCheck,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  RotateCcw,
  Users,
  Eye,
  Check,
  LayoutDashboard,
  Settings,
  Tag,
  Package,
  UserPlus,
  Receipt,
  Clock,
  TrendingUp,
  PieChart,
  Calculator,
  Globe,
  SlidersHorizontal,
  Info
} from 'lucide-vue-next'
import { usePagination } from '../../composables/usePagination'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import { rolesApi, type RoleItem, type RoleMenuAccess, type RolePermissions, type MenuCrudPermission } from '../../api/roles.api'
import { usersApi } from '../../api/users.api'

interface MenuCatalogItem {
  key: keyof RoleMenuAccess
  label: string
  section: string
  route: string
  description: string
  icon: any
}

const MENU_CATALOG: MenuCatalogItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    section: 'UTAMA',
    route: '/',
    description: 'Ringkasan performa dan metrik transaksi keseluruhan',
    icon: LayoutDashboard
  },
  {
    key: 'manajemenPengguna',
    label: 'Manajemen Pengguna',
    section: 'MANAJEMEN',
    route: '/manajemen-pengguna',
    description: 'Pengelolaan akun pengguna, status aktif, dan password',
    icon: Settings
  },
  {
    key: 'manajemenRole',
    label: 'Manajemen Role',
    section: 'MANAJEMEN',
    route: '/manajemen-role',
    description: 'Pengaturan role hak akses dan izin aksi CRUD per modul',
    icon: ShieldCheck
  },
  {
    key: 'manajemenPromo',
    label: 'Manajemen Promo',
    section: 'MANAJEMEN',
    route: '/manajemen-promo',
    description: 'Kelola voucher diskon, harga promo, dan kupon transaksi',
    icon: Tag
  },
  {
    key: 'kelolaPaket',
    label: 'Kelola Paket',
    section: 'MANAJEMEN',
    route: '/kelola-paket',
    description: 'Pengaturan paket langganan fitur aplikasi kasir',
    icon: Package
  },
  {
    key: 'calonClient',
    label: 'Calon Client',
    section: 'CRM CLIENT',
    route: '/calon-client',
    description: 'Pendaftaran calon client prospek & tindak lanjut sales',
    icon: UserPlus
  },
  {
    key: 'semuaPelanggan',
    label: 'Semua Pelanggan',
    section: 'DATA PELANGGAN',
    route: '/semua-pelanggan',
    description: 'Daftar semua merchant dan pelanggan yang terdaftar',
    icon: Users
  },
  {
    key: 'langganan',
    label: 'Langganan',
    section: 'DATA PELANGGAN',
    route: '/langganan',
    description: 'Monitoring masa aktif dan tagihan invoice langganan',
    icon: Receipt
  },
  {
    key: 'expired',
    label: 'Expired',
    section: 'DATA PELANGGAN',
    route: '/expired',
    description: 'Daftar klien yang masa langganannya telah habis',
    icon: Clock
  },
  {
    key: 'arusKas',
    label: 'Arus Kas',
    section: 'LAPORAN PENJUALAN',
    route: '/arus-kas',
    description: 'Laporan arus kas kasir dan rekapitulasi keuangan',
    icon: TrendingUp
  },
  {
    key: 'labaRugi',
    label: 'Laba Rugi',
    section: 'LAPORAN PENJUALAN',
    route: '/laba-rugi',
    description: 'Kalkulasi laba kotor, beban operasional, dan laba bersih',
    icon: PieChart
  },
  {
    key: 'neraca',
    label: 'Neraca',
    section: 'LAPORAN PENJUALAN',
    route: '/neraca',
    description: 'Laporan neraca keuangan aset, kewajiban, dan ekuitas',
    icon: Calculator
  },
  {
    key: 'laporanPenjualan',
    label: 'Laporan Penjualan',
    section: 'LAPORAN PENJUALAN',
    route: '/laporan-harian',
    description: 'Laporan riwayat transaksi penjualan harian kasir',
    icon: Receipt
  },
  {
    key: 'landingPage',
    label: 'Landing Page',
    section: 'LANDING PAGE',
    route: '/landing',
    description: 'Akses ke halaman depan publik profil IKIKASIR',
    icon: Globe
  }
]

const STORAGE_KEY_ROLES = 'ikikasir_roles_v2'

// Helper to create empty or default permissions
const createBlankPermissions = (): RolePermissions => {
  const perms: RolePermissions = {}
  MENU_CATALOG.forEach(m => {
    perms[m.key] = { create: false, read: false, update: false, delete: false }
  })
  return perms
}

const createFullPermissions = (): RolePermissions => {
  const perms: RolePermissions = {}
  MENU_CATALOG.forEach(m => {
    perms[m.key] = { create: true, read: true, update: true, delete: true }
  })
  return perms
}

const createBlankMenuAccess = (): RoleMenuAccess => {
  return {
    dashboard: false,
    manajemenPengguna: false,
    manajemenRole: false,
    manajemenPromo: false,
    kelolaPaket: false,
    calonClient: false,
    semuaPelanggan: false,
    langganan: false,
    expired: false,
    arusKas: false,
    labaRugi: false,
    neraca: false,
    laporanPenjualan: false,
    landingPage: false
  }
}

// Initial fallback roles
const initialRoles: RoleItem[] = [
  {
    id: 'role-superadmin',
    name: 'Super Admin',
    description: 'Hak akses penuh ke seluruh modul, aksi CRUD, dan konfigurasi sistem.',
    menuAccess: {
      dashboard: true,
      manajemenPengguna: true,
      manajemenRole: true,
      manajemenPromo: true,
      kelolaPaket: true,
      calonClient: true,
      semuaPelanggan: true,
      langganan: true,
      expired: true,
      arusKas: true,
      labaRugi: true,
      neraca: true,
      laporanPenjualan: true,
      landingPage: true
    },
    permissions: createFullPermissions(),
    userCount: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'role-finance',
    name: 'Finance',
    description: 'Akses konfirmasi pembayaran CRM, rekap tagihan, dan laporan keuangan.',
    menuAccess: {
      dashboard: false,
      manajemenPengguna: false,
      manajemenRole: false,
      manajemenPromo: false,
      kelolaPaket: false,
      calonClient: true,
      semuaPelanggan: true,
      langganan: true,
      expired: false,
      arusKas: true,
      labaRugi: true,
      neraca: true,
      laporanPenjualan: true,
      landingPage: false
    },
    permissions: {
      ...createBlankPermissions(),
      calonClient: { create: true, read: true, update: true, delete: false },
      semuaPelanggan: { create: false, read: true, update: true, delete: false },
      langganan: { create: true, read: true, update: true, delete: false },
      arusKas: { create: true, read: true, update: true, delete: false },
      labaRugi: { create: true, read: true, update: true, delete: false },
      neraca: { create: true, read: true, update: true, delete: false },
      laporanPenjualan: { create: false, read: true, update: false, delete: false }
    },
    userCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'role-teknisi',
    name: 'Teknisi',
    description: 'Setup akun kasir, penerbitan surat perjanjian, dan aktivasi merchant.',
    menuAccess: {
      dashboard: false,
      manajemenPengguna: false,
      manajemenRole: false,
      manajemenPromo: false,
      kelolaPaket: false,
      calonClient: false,
      semuaPelanggan: true,
      langganan: true,
      expired: true,
      arusKas: false,
      labaRugi: false,
      neraca: false,
      laporanPenjualan: false,
      landingPage: false
    },
    permissions: {
      ...createBlankPermissions(),
      semuaPelanggan: { create: false, read: true, update: true, delete: false },
      langganan: { create: false, read: true, update: true, delete: false },
      expired: { create: false, read: true, update: false, delete: false }
    },
    userCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Operasional harian, kelola paket, promo diskon, dan monitoring client.',
    menuAccess: {
      dashboard: true,
      manajemenPengguna: false,
      manajemenRole: false,
      manajemenPromo: true,
      kelolaPaket: true,
      calonClient: true,
      semuaPelanggan: true,
      langganan: true,
      expired: true,
      arusKas: true,
      labaRugi: true,
      neraca: true,
      laporanPenjualan: true,
      landingPage: true
    },
    permissions: {
      ...createBlankPermissions(),
      dashboard: { create: false, read: true, update: false, delete: false },
      manajemenPromo: { create: true, read: true, update: true, delete: false },
      kelolaPaket: { create: true, read: true, update: true, delete: false },
      calonClient: { create: true, read: true, update: true, delete: false },
      semuaPelanggan: { create: true, read: true, update: true, delete: false },
      langganan: { create: true, read: true, update: true, delete: false },
      expired: { create: false, read: true, update: false, delete: false },
      arusKas: { create: false, read: true, update: false, delete: false },
      labaRugi: { create: false, read: true, update: false, delete: false },
      neraca: { create: false, read: true, update: false, delete: false },
      laporanPenjualan: { create: true, read: true, update: true, delete: false },
      landingPage: { create: false, read: true, update: false, delete: false }
    },
    userCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'role-staff',
    name: 'Staff',
    description: 'Input pendaftaran calon client dan pengelolaan voucher diskon.',
    menuAccess: {
      dashboard: true,
      manajemenPengguna: false,
      manajemenRole: false,
      manajemenPromo: true,
      kelolaPaket: false,
      calonClient: true,
      semuaPelanggan: true,
      langganan: false,
      expired: false,
      arusKas: false,
      labaRugi: false,
      neraca: false,
      laporanPenjualan: true,
      landingPage: true
    },
    permissions: {
      ...createBlankPermissions(),
      dashboard: { create: false, read: true, update: false, delete: false },
      manajemenPromo: { create: true, read: true, update: true, delete: false },
      calonClient: { create: true, read: true, update: true, delete: false },
      semuaPelanggan: { create: false, read: true, update: false, delete: false },
      laporanPenjualan: { create: false, read: true, update: false, delete: false },
      landingPage: { create: false, read: true, update: false, delete: false }
    },
    userCount: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'role-kasir',
    name: 'Kasir',
    description: 'Akses transaksi kasir dan rekapan penjualan harian.',
    menuAccess: {
      dashboard: true,
      manajemenPengguna: false,
      manajemenRole: false,
      manajemenPromo: false,
      kelolaPaket: false,
      calonClient: false,
      semuaPelanggan: false,
      langganan: false,
      expired: false,
      arusKas: false,
      labaRugi: false,
      neraca: false,
      laporanPenjualan: true,
      landingPage: true
    },
    permissions: {
      ...createBlankPermissions(),
      dashboard: { create: false, read: true, update: false, delete: false },
      laporanPenjualan: { create: true, read: true, update: false, delete: false },
      landingPage: { create: false, read: true, update: false, delete: false }
    },
    userCount: 3,
    createdAt: new Date().toISOString()
  }
]

// Component state
const roles = ref<RoleItem[]>([])
const searchQuery = ref('')
const isModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const isEditing = ref(false)
const isLoadingRoles = ref(false)
const isSaving = ref(false)
const toastMessage = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

const selectedRole = ref<RoleItem | null>(null)
const roleToDelete = ref<RoleItem | null>(null)

// Form state
const form = ref({
  id: '',
  name: '',
  description: '',
  menuAccess: createBlankMenuAccess(),
  permissions: createBlankPermissions()
})
const formErrors = ref<Record<string, string>>({})

const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = { text, type }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Check if role is system default
const isSystemRole = (name: string): boolean => {
  const norm = name.toUpperCase().replace(/\s+/g, '')
  return ['SUPERADMIN', 'ADMIN', 'FINANCE', 'TEKNISI', 'STAFF', 'KASIR', 'SALES'].includes(norm)
}

// Get Badge Avatar and styling for a role
const getRoleBadgeStyle = (name: string) => {
  const norm = name.toUpperCase().replace(/\s+/g, '')
  switch (norm) {
    case 'SUPERADMIN':
      return {
        initials: 'SA',
        bg: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
      }
    case 'FINANCE':
      return {
        initials: 'FN',
        bg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
      }
    case 'TEKNISI':
      return {
        initials: 'TK',
        bg: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200'
      }
    case 'ADMIN':
      return {
        initials: 'AD',
        bg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
      }
    case 'STAFF':
      return {
        initials: 'ST',
        bg: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
      }
    case 'KASIR':
      return {
        initials: 'KS',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
      }
    default:
      const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || 'RL'
      return {
        initials,
        bg: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
      }
  }
}

// Calculate permission stats for a role
const getRoleStats = (role: RoleItem) => {
  let activeMenus = 0
  let canCreate = 0
  let canRead = 0
  let canUpdate = 0
  let canDelete = 0

  MENU_CATALOG.forEach(m => {
    const isMenuAccess = Boolean(role.menuAccess?.[m.key])
    const p = role.permissions?.[m.key]
    const hasAnyCrud = Boolean(p && (p.read || p.create || p.update || p.delete))

    if (isMenuAccess || hasAnyCrud) {
      activeMenus++
    }
    if (p?.create) canCreate++
    if (p?.read || (isMenuAccess && (!p || p.read))) canRead++
    if (p?.update) canUpdate++
    if (p?.delete) canDelete++
  })

  const totalCrud = canCreate + canRead + canUpdate + canDelete
  const canDeleteNone = canDelete === 0 && (canCreate > 0 || canUpdate > 0)

  return {
    activeMenus,
    totalMenus: MENU_CATALOG.length,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    totalCrud,
    canDeleteNone
  }
}

// Load roles from localStorage and API
const loadRoles = async () => {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLES)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          roles.value = parsed
        }
      } else {
        roles.value = [...initialRoles]
      }
    } catch {
      roles.value = [...initialRoles]
    }
  }

  isLoadingRoles.value = true
  try {
    const [rolesRes, usersRes] = await Promise.allSettled([
      rolesApi.getAll(),
      usersApi.getAll()
    ])

    // Compute user counts per role name
    const userCountMap: Record<string, number> = {}
    if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
      usersRes.value.data.forEach((u: any) => {
        const rName = u.role || u.roleDetail?.name
        if (rName) {
          userCountMap[rName] = (userCountMap[rName] || 0) + 1
        }
      })
    }

    if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value.data) && rolesRes.value.data.length > 0) {
      const apiRoles: RoleItem[] = rolesRes.value.data.map((r: any) => {
        // Normalize permissions
        const perms: RolePermissions = r.permissions || {}
        MENU_CATALOG.forEach(m => {
          if (!perms[m.key]) {
            const isAcc = Boolean(r.menuAccess?.[m.key])
            perms[m.key] = {
              create: isAcc,
              read: isAcc,
              update: isAcc,
              delete: isAcc
            }
          }
        })

        const mappedCount = userCountMap[r.name] ?? r.userCount ?? 0

        return {
          id: r.id,
          name: r.name,
          description: r.description || '',
          menuAccess: r.menuAccess || createBlankMenuAccess(),
          permissions: perms,
          userCount: mappedCount,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt
        }
      })

      roles.value = apiRoles
      saveRolesToStorage()
    }
  } catch (err) {
    console.warn('Backend roles API not reachable, using cached roles:', err)
  } finally {
    isLoadingRoles.value = false
  }
}

const saveRolesToStorage = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles.value))
  }
}

onMounted(() => {
  loadRoles()
})

// Filtered list
const filteredRoles = computed(() => {
  let list = roles.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    )
  }

  return list
})

// Global pagination composable
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedItems: paginatedRoles,
  resetPage
} = usePagination(filteredRoles, 10)

watch(searchQuery, () => {
  resetPage()
})

const resetFilters = () => {
  searchQuery.value = ''
  resetPage()
}

// Group catalog by section for organized UI
const catalogSections = computed(() => {
  const sections: { name: string; items: MenuCatalogItem[] }[] = []
  const map = new Map<string, MenuCatalogItem[]>()

  MENU_CATALOG.forEach(m => {
    if (!map.has(m.section)) {
      map.set(m.section, [])
    }
    map.get(m.section)!.push(m)
  })

  map.forEach((items, name) => {
    sections.push({ name, items })
  })

  return sections
})

// Modal Open Handlers
const openAddModal = () => {
  isEditing.value = false
  formErrors.value = {}
  form.value = {
    id: '',
    name: '',
    description: '',
    menuAccess: createBlankMenuAccess(),
    permissions: createBlankPermissions()
  }
  isModalOpen.value = true
}

const openEditModal = (role: RoleItem) => {
  isEditing.value = true
  formErrors.value = {}

  // Deep clone menuAccess & permissions
  const clonedAccess: RoleMenuAccess = {
    ...createBlankMenuAccess(),
    ...(role.menuAccess || {})
  }
  const clonedPerms: RolePermissions = createBlankPermissions()

  MENU_CATALOG.forEach(m => {
    if (role.permissions && role.permissions[m.key]) {
      clonedPerms[m.key] = { ...role.permissions[m.key] }
    } else {
      const isAcc = Boolean(clonedAccess[m.key])
      clonedPerms[m.key] = {
        create: isAcc,
        read: isAcc,
        update: isAcc,
        delete: isAcc
      }
    }
  })

  form.value = {
    id: role.id,
    name: role.name,
    description: role.description || '',
    menuAccess: clonedAccess,
    permissions: clonedPerms
  }

  isModalOpen.value = true
}

const openDetailModal = (role: RoleItem) => {
  selectedRole.value = role
  isDetailModalOpen.value = true
}

const openDeleteConfirm = (role: RoleItem) => {
  if (role.name.toUpperCase().replace(/\s+/g, '') === 'SUPERADMIN') {
    showToast('Role Super Admin merupakan role sistem inti dan tidak dapat dihapus.', 'error')
    return
  }
  if ((role.userCount || 0) > 0) {
    showToast(`Role '${role.name}' tidak dapat dihapus karena masih digunakan oleh ${role.userCount} pengguna.`, 'error')
    return
  }
  roleToDelete.value = role
  isDeleteConfirmOpen.value = true
}

// Checkbox and Menu Access Logic
const toggleMenuAccess = (key: keyof RoleMenuAccess) => {
  const current = form.value.menuAccess[key]
  const next = !current
  form.value.menuAccess[key] = next

  if (next) {
    // Enable at least read permission
    if (!form.value.permissions[key].read) {
      form.value.permissions[key].read = true
    }
  } else {
    // Disable all CRUD
    form.value.permissions[key] = {
      create: false,
      read: false,
      update: false,
      delete: false
    }
  }
}

const togglePermission = (key: keyof RoleMenuAccess, action: keyof MenuCrudPermission) => {
  const current = Boolean(form.value.permissions[key]?.[action])
  const next = !current
  form.value.permissions[key][action] = next

  // If user toggles create, update, or delete ON, ensure read and menuAccess are also ON
  if (next && (action === 'create' || action === 'update' || action === 'delete')) {
    form.value.permissions[key].read = true
    form.value.menuAccess[key] = true
  }

  // If read is toggled ON, ensure menuAccess is ON
  if (next && action === 'read') {
    form.value.menuAccess[key] = true
  }

  // If all CRUD are false, toggle menuAccess OFF
  const p = form.value.permissions[key]
  if (!p.read && !p.create && !p.update && !p.delete) {
    form.value.menuAccess[key] = false
  }
}

// Toggle all CRUD for a single menu row
const toggleRowAllCrud = (key: keyof RoleMenuAccess) => {
  const p = form.value.permissions[key]
  const isAllChecked = p.create && p.read && p.update && p.delete

  if (isAllChecked) {
    // Uncheck all
    form.value.permissions[key] = { create: false, read: false, update: false, delete: false }
    form.value.menuAccess[key] = false
  } else {
    // Check all CRUD
    form.value.permissions[key] = { create: true, read: true, update: true, delete: true }
    form.value.menuAccess[key] = true
  }
}

// Global batch permission presets
const setPresetFullCrud = () => {
  MENU_CATALOG.forEach(m => {
    form.value.menuAccess[m.key] = true
    form.value.permissions[m.key] = { create: true, read: true, update: true, delete: true }
  })
  showToast('Semua menu dan seluruh izin CRUD berhasil dicentang.', 'info')
}

const setPresetAddAndEditNoDelete = () => {
  MENU_CATALOG.forEach(m => {
    form.value.menuAccess[m.key] = true
    form.value.permissions[m.key] = { create: true, read: true, update: true, delete: false }
  })
  showToast('Preset aktif: Bisa tambah & edit data, tanpa izin hapus data.', 'info')
}

const setPresetReadOnly = () => {
  MENU_CATALOG.forEach(m => {
    form.value.menuAccess[m.key] = true
    form.value.permissions[m.key] = { create: false, read: true, update: false, delete: false }
  })
  showToast('Preset aktif: Hanya izin lihat data (Read-Only).', 'info')
}

const resetAllPermissions = () => {
  MENU_CATALOG.forEach(m => {
    form.value.menuAccess[m.key] = false
    form.value.permissions[m.key] = { create: false, read: false, update: false, delete: false }
  })
  showToast('Semua izin akses menu telah direset.', 'info')
}

// Save Role (Create / Update)
const handleSaveRole = async () => {
  formErrors.value = {}

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Nama role wajib diisi.'
    return
  }
  if (form.value.name.trim().length < 2) {
    formErrors.value.name = 'Nama role minimal 2 karakter.'
    return
  }

  // Duplicate name check
  const trimmedName = form.value.name.trim()
  const duplicate = roles.value.find(
    r => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== form.value.id
  )
  if (duplicate) {
    formErrors.value.name = `Role dengan nama '${trimmedName}' sudah terdaftar.`
    return
  }

  isSaving.value = true

  // Ensure menuAccess booleans are completely synchronized with permissions
  const finalMenuAccess: RoleMenuAccess = { ...form.value.menuAccess }
  MENU_CATALOG.forEach(m => {
    const p = form.value.permissions[m.key]
    if (p && (p.read || p.create || p.update || p.delete)) {
      finalMenuAccess[m.key] = true
    } else {
      finalMenuAccess[m.key] = false
    }
  })

  const payload = {
    name: trimmedName,
    description: form.value.description.trim() || undefined,
    menuAccess: finalMenuAccess,
    permissions: form.value.permissions
  }

  try {
    if (isEditing.value && form.value.id) {
      // Call Backend API
      const res = await rolesApi.update(form.value.id, payload).catch(err => {
        console.warn('API update role failed, updating local state:', err)
        return null
      })

      // Update local state
      const idx = roles.value.findIndex(r => r.id === form.value.id)
      if (idx !== -1) {
        roles.value[idx] = {
          ...roles.value[idx],
          name: trimmedName,
          description: form.value.description.trim() || '',
          menuAccess: finalMenuAccess,
          permissions: form.value.permissions,
          updatedAt: new Date().toISOString()
        }
      }

      saveRolesToStorage()
      showToast(`Role '${trimmedName}' berhasil diperbarui.`, 'success')
    } else {
      // Create new role
      let newId = 'role-' + Date.now()
      const res = await rolesApi.create(payload).catch(err => {
        console.warn('API create role failed, adding to local state:', err)
        return null
      })

      if (res && res.data?.id) {
        newId = res.data.id
      }

      const newRole: RoleItem = {
        id: newId,
        name: trimmedName,
        description: form.value.description.trim() || '',
        menuAccess: finalMenuAccess,
        permissions: form.value.permissions,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      roles.value.unshift(newRole)
      saveRolesToStorage()
      showToast(`Role baru '${trimmedName}' berhasil dibuat.`, 'success')
    }

    isModalOpen.value = false
  } catch (err: any) {
    showToast(err?.message || 'Gagal menyimpan role hak akses.', 'error')
  } finally {
    isSaving.value = false
  }
}

// Delete Role
const confirmDeleteRole = async () => {
  if (!roleToDelete.value) return

  const target = roleToDelete.value
  isDeleteConfirmOpen.value = false

  try {
    await rolesApi.delete(target.id).catch(err => {
      console.warn('API delete role warning, deleting from local state:', err)
    })

    roles.value = roles.value.filter(r => r.id !== target.id)
    saveRolesToStorage()
    showToast(`Role '${target.name}' berhasil dihapus.`, 'success')
  } catch (err: any) {
    showToast(err?.message || 'Gagal menghapus role.', 'error')
  } finally {
    roleToDelete.value = null
  }
}

// Stats counters
const totalRolesCount = computed(() => roles.value.length)
const totalCustomRolesCount = computed(() => roles.value.filter(r => !isSystemRole(r.name)).length)
const totalAssignedUsers = computed(() => roles.value.reduce((acc, r) => acc + (r.userCount || 0), 0))
</script>

<template>
  <div class="space-y-6 max-w-[1400px] mx-auto select-none">
    <!-- TOAST NOTIFICATION -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium backdrop-blur-md"
        :class="{
          'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800': toastMessage.type === 'success',
          'bg-rose-50/95 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800': toastMessage.type === 'error',
          'bg-indigo-50/95 dark:bg-indigo-950/90 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800': toastMessage.type === 'info'
        }"
      >
        <CheckCircle2 v-if="toastMessage.type === 'success'" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <AlertCircle v-else-if="toastMessage.type === 'error'" class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
        <Info v-else class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>{{ toastMessage.text }}</span>
        <button @click="toastMessage = null" class="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X class="w-4 h-4" />
        </button>
      </div>
    </transition>

    <!-- PAGE HEADER -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manajemen Role & Hak Akses
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola nama role, switch menu aktif, dan izin aksi CRUD (Lihat, Tambah, Edit, Hapus) untuk setiap modul.
            </p>
          </div>
        </div>
      </div>

      <!-- Action Button (Placed at the end) -->
      <div class="flex items-center gap-2 shrink-0 sm:ml-auto">
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
          <span>Total: <strong class="text-slate-900 dark:text-white font-bold">{{ totalRolesCount }}</strong></span>
          <span class="text-slate-300 dark:text-slate-600">•</span>
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ totalCustomRolesCount }} Kustom</span>
        </div>
        <button
          @click="openAddModal"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none shrink-0 cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Role Baru</span>
        </button>
      </div>
    </header>

    <!-- STATS CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Role</span>
          <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Shield class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalRolesCount }}</div>
        <p class="text-xs text-slate-400 mt-1">Role terdaftar dalam sistem</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Role Kustom</span>
          <div class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <SlidersHorizontal class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalCustomRolesCount }}</div>
        <p class="text-xs text-slate-400 mt-1">Dibuat khusus oleh Admin</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Pengguna</span>
          <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalAssignedUsers }}</div>
        <p class="text-xs text-slate-400 mt-1">Pengguna aktif terikat role</p>
      </div>

      <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Modul Menu</span>
          <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Package class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ MENU_CATALOG.length }}</div>
        <p class="text-xs text-slate-400 mt-1">Modul dengan granular CRUD</p>
      </div>
    </div>

    <!-- TOOLBAR SEARCH BAR -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari role berdasarkan nama atau deskripsi..."
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

      <!-- Reset Filter Button -->
      <div v-if="searchQuery" class="flex items-center gap-2 text-xs">
        <button
          @click="resetFilters"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Reset Pencarian"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>

    <!-- ROLE LIST TABLE -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="isLoadingRoles" class="p-8 text-center text-slate-400">
        <div class="inline-block animate-spin w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
        <p class="text-sm">Memuat data role hak akses...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredRoles.length === 0" class="p-12 text-center">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-3">
          <ShieldCheck class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-white">Tidak ada data role</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          Tidak ditemukan role yang cocok dengan kriteria pencarian Anda. Silakan coba kata kunci lain.
        </p>
        <button
          v-if="searchQuery"
          @click="resetFilters"
          class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          Reset Pencarian
        </button>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50/80 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
              <th class="py-3.5 px-4 md:px-5">Role & Deskripsi</th>
              <th class="py-3.5 px-4">Tipe Role</th>
              <th class="py-3.5 px-4">Pengguna</th>
              <th class="py-3.5 px-4">Akses Menu & Izin CRUD</th>
              <th class="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="role in paginatedRoles"
              :key="role.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition-colors"
            >
              <!-- Role Name & Desc -->
              <td class="py-4 px-4 md:px-5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                    :class="getRoleBadgeStyle(role.name).bg"
                  >
                    {{ getRoleBadgeStyle(role.name).initials }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 dark:text-white truncate">
                        {{ role.name }}
                      </span>
                      <span
                        v-if="isSystemRole(role.name)"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      >
                        Sistem
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {{ role.description || 'Tidak ada deskripsi khusus.' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Role Type Badge -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  :class="isSystemRole(role.name)
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="isSystemRole(role.name) ? 'bg-blue-500' : 'bg-emerald-500'"></span>
                  {{ isSystemRole(role.name) ? 'Role Bawaan' : 'Role Kustom' }}
                </span>
              </td>

              <!-- User Count -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  <Users class="w-3.5 h-3.5 text-slate-400" />
                  {{ role.userCount || 0 }} User
                </span>
              </td>

              <!-- Menu Access & CRUD Breakdown -->
              <td class="py-4 px-4">
                <div class="space-y-1.5 max-w-md">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-100 dark:border-indigo-800">
                      {{ getRoleStats(role).activeMenus }} / {{ MENU_CATALOG.length }} Modul
                    </span>

                    <span
                      v-if="getRoleStats(role).canDeleteNone"
                      class="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800"
                    >
                      Bisa Tambah & Edit (Tanpa Hapus)
                    </span>
                    <span
                      v-else-if="getRoleStats(role).canDelete > 0 && getRoleStats(role).canCreate > 0"
                      class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800"
                    >
                      Akses CRUD Lengkap
                    </span>
                    <span
                      v-else-if="getRoleStats(role).canCreate === 0 && getRoleStats(role).canUpdate === 0 && getRoleStats(role).canRead > 0"
                      class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold"
                    >
                      Lihat Saja (Read-Only)
                    </span>
                  </div>

                  <!-- CRUD Granular Counters -->
                  <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span title="Izin Tambah Data (Create)" class="inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {{ getRoleStats(role).canCreate }} Tambah
                    </span>
                    <span>•</span>
                    <span title="Izin Lihat Data (Read)" class="inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {{ getRoleStats(role).canRead }} Lihat
                    </span>
                    <span>•</span>
                    <span title="Izin Edit Data (Update)" class="inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {{ getRoleStats(role).canUpdate }} Edit
                    </span>
                    <span>•</span>
                    <span title="Izin Hapus Data (Delete)" class="inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full" :class="getRoleStats(role).canDelete > 0 ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'"></span>
                      {{ getRoleStats(role).canDelete }} Hapus
                    </span>
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="py-4 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5">
                  <!-- Detail View -->
                  <button
                    @click="openDetailModal(role)"
                    class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                    title="Lihat Matriks Hak Akses"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <!-- Edit -->
                  <button
                    @click="openEditModal(role)"
                    class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                    title="Edit Role & Konfigurasi CRUD"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>

                  <!-- Delete -->
                  <button
                    v-if="role.name.toUpperCase().replace(/\s+/g, '') !== 'SUPERADMIN'"
                    @click="openDeleteConfirm(role)"
                    :disabled="(role.userCount || 0) > 0"
                    class="p-2 rounded-xl transition-colors cursor-pointer"
                    :class="(role.userCount || 0) > 0
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700/60'"
                    :title="(role.userCount || 0) > 0 ? 'Tidak bisa dihapus karena masih digunakan user' : 'Hapus Role'"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <div
                    v-else
                    class="w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    title="Super Admin dilindungi sistem"
                  >
                    <Shield class="w-3.5 h-3.5 opacity-40" />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="filteredRoles.length > 0" class="p-4 border-t border-slate-100 dark:border-slate-700/60">
        <GlobalPagination
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :totalItems="totalItems"
        />
      </div>
    </div>

    <!-- MODAL FORM TAMBAH / EDIT ROLE & CHECKLIST CRUD -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      @click.self="isModalOpen = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                {{ isEditing ? 'Edit Konfigurasi Role' : 'Tambah Role Baru' }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Atur nama role, menu yang aktif, dan checklist aksi CRUD (Lihat, Tambah, Edit, Hapus)
              </p>
            </div>
          </div>
          <button
            @click="isModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          <!-- Role Name & Description -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Nama Role <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Contoh: Admin Gudang, Staff Keuangan, dll."
                class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 border rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                :class="formErrors.name ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30' : 'border-slate-200 dark:border-slate-600'"
              />
              <p v-if="formErrors.name" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle class="w-3.5 h-3.5" />
                {{ formErrors.name }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Deskripsi Role
              </label>
              <input
                v-model="form.description"
                type="text"
                placeholder="Ringkasan tugas dan ruang lingkup wewenang role..."
                class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <!-- PERMISSION HEADER & BATCH PRESETS -->
          <div class="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <SlidersHorizontal class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Konfigurasi Hak Akses Menu & Checklist CRUD
                </h4>
                <p class="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                  Centang aksi yang diperbolehkan untuk setiap menu. Anda bisa mengaktifkan tambah & edit tanpa izin hapus data.
                </p>
              </div>

              <!-- Quick Presets -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  @click="setPresetFullCrud"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                  title="Aktifkan semua modul dan centang seluruh CRUD"
                >
                  Pilih Semua CRUD
                </button>
                <button
                  type="button"
                  @click="setPresetAddAndEditNoDelete"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs cursor-pointer"
                  title="Bisa Tambah & Edit data, Hapus data dimatikan"
                >
                  Tambah & Edit (Tanpa Hapus)
                </button>
                <button
                  type="button"
                  @click="setPresetReadOnly"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                  title="Hanya centang izin lihat"
                >
                  Hanya Lihat
                </button>
                <button
                  type="button"
                  @click="resetAllPermissions"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                  title="Matikan semua"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <!-- GROUPED MENU CHECKLIST LIST -->
          <div class="space-y-6">
            <div
              v-for="section in catalogSections"
              :key="section.name"
              class="space-y-3"
            >
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {{ section.name }}
                </span>
                <div class="flex-1 border-t border-slate-100 dark:border-slate-700/60"></div>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="item in section.items"
                  :key="item.key"
                  class="p-3.5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  :class="form.menuAccess[item.key]
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40 opacity-75'"
                >
                  <!-- Left: Icon & Label -->
                  <div class="flex items-start gap-3 min-w-0 md:w-5/12">
                    <button
                      type="button"
                      @click="toggleMenuAccess(item.key)"
                      class="mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0"
                      :class="form.menuAccess[item.key]
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-700 text-transparent'"
                      :title="form.menuAccess[item.key] ? 'Nonaktifkan menu ini' : 'Aktifkan menu ini'"
                    >
                      <Check class="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div class="min-w-0 cursor-pointer" @click="toggleMenuAccess(item.key)">
                      <div class="flex items-center gap-2">
                        <component
                          :is="item.icon"
                          class="w-4 h-4 shrink-0"
                          :class="form.menuAccess[item.key] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'"
                        />
                        <span class="font-bold text-sm text-slate-900 dark:text-white select-none">
                          {{ item.label }}
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 select-none line-clamp-1">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>

                  <!-- Right: CRUD Checkboxes & Quick Row Toggle -->
                  <div class="flex items-center gap-2 sm:gap-3 flex-wrap md:justify-end">
                    <!-- Checkbox: Lihat (Read) -->
                    <label
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all"
                      :class="form.permissions[item.key]?.read
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                    >
                      <input
                        type="checkbox"
                        :checked="form.permissions[item.key]?.read"
                        @change="togglePermission(item.key, 'read')"
                        class="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>Lihat (Read)</span>
                    </label>

                    <!-- Checkbox: Tambah (Create) -->
                    <label
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all"
                      :class="form.permissions[item.key]?.create
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                    >
                      <input
                        type="checkbox"
                        :checked="form.permissions[item.key]?.create"
                        @change="togglePermission(item.key, 'create')"
                        class="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span>Tambah (Create)</span>
                    </label>

                    <!-- Checkbox: Edit (Update) -->
                    <label
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all"
                      :class="form.permissions[item.key]?.update
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                    >
                      <input
                        type="checkbox"
                        :checked="form.permissions[item.key]?.update"
                        @change="togglePermission(item.key, 'update')"
                        class="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span>Edit (Update)</span>
                    </label>

                    <!-- Checkbox: Hapus (Delete) -->
                    <label
                      class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all"
                      :class="form.permissions[item.key]?.delete
                        ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                    >
                      <input
                        type="checkbox"
                        :checked="form.permissions[item.key]?.delete"
                        @change="togglePermission(item.key, 'delete')"
                        class="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                      />
                      <span>Hapus (Delete)</span>
                    </label>

                    <!-- Quick Button: Toggle All CRUD for Row -->
                    <button
                      type="button"
                      @click="toggleRowAllCrud(item.key)"
                      class="px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer"
                      :class="form.permissions[item.key]?.create && form.permissions[item.key]?.read && form.permissions[item.key]?.update && form.permissions[item.key]?.delete
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200'"
                      title="Centang / Hilangkan semua CRUD modul ini"
                    >
                      CRUD Semua
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/80">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleSaveRole"
            :disabled="isSaving"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div v-if="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ isEditing ? 'Simpan Perubahan' : 'Buat Role' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL / PREVIEW HAK AKSES -->
    <div
      v-if="isDetailModalOpen && selectedRole"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      @click.self="isDetailModalOpen = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/80">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0"
              :class="getRoleBadgeStyle(selectedRole.name).bg"
            >
              {{ getRoleBadgeStyle(selectedRole.name).initials }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                  {{ selectedRole.name }}
                </h3>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="isSystemRole(selectedRole.name) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'"
                >
                  {{ isSystemRole(selectedRole.name) ? 'Role Sistem' : 'Role Kustom' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ selectedRole.description || 'Tidak ada deskripsi.' }}
              </p>
            </div>
          </div>
          <button
            @click="isDetailModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body: Matrix View -->
        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          <!-- Summary chips -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
              <span class="text-xs text-blue-600 dark:text-blue-400 font-bold block">Lihat (Read)</span>
              <span class="text-xl font-extrabold text-blue-900 dark:text-blue-200">{{ getRoleStats(selectedRole).canRead }} Modul</span>
            </div>
            <div class="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">Tambah (Create)</span>
              <span class="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">{{ getRoleStats(selectedRole).canCreate }} Modul</span>
            </div>
            <div class="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
              <span class="text-xs text-amber-600 dark:text-amber-400 font-bold block">Edit (Update)</span>
              <span class="text-xl font-extrabold text-amber-900 dark:text-amber-200">{{ getRoleStats(selectedRole).canUpdate }} Modul</span>
            </div>
            <div class="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
              <span class="text-xs text-rose-600 dark:text-rose-400 font-bold block">Hapus (Delete)</span>
              <span class="text-xl font-extrabold text-rose-900 dark:text-rose-200">{{ getRoleStats(selectedRole).canDelete }} Modul</span>
            </div>
          </div>

          <!-- Modules Table Matrix -->
          <div class="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                  <th class="py-3 px-4">Nama Modul</th>
                  <th class="py-3 px-2.5 text-center">Status</th>
                  <th class="py-3 px-2.5 text-center">Lihat</th>
                  <th class="py-3 px-2.5 text-center">Tambah</th>
                  <th class="py-3 px-2.5 text-center">Edit</th>
                  <th class="py-3 px-2.5 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
                <tr
                  v-for="item in MENU_CATALOG"
                  :key="item.key"
                  class="hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                >
                  <td class="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <component :is="item.icon" class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ item.label }}</span>
                  </td>
                  <td class="py-2.5 px-2.5 text-center">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="selectedRole.menuAccess?.[item.key]
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'"
                    >
                      {{ selectedRole.menuAccess?.[item.key] ? 'Aktif' : 'Off' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-2.5 text-center">
                    <CheckCircle2 v-if="selectedRole.permissions?.[item.key]?.read" class="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto" />
                    <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                  </td>
                  <td class="py-2.5 px-2.5 text-center">
                    <CheckCircle2 v-if="selectedRole.permissions?.[item.key]?.create" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                  </td>
                  <td class="py-2.5 px-2.5 text-center">
                    <CheckCircle2 v-if="selectedRole.permissions?.[item.key]?.update" class="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto" />
                    <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                  </td>
                  <td class="py-2.5 px-2.5 text-center">
                    <CheckCircle2 v-if="selectedRole.permissions?.[item.key]?.delete" class="w-4 h-4 text-rose-600 dark:text-rose-400 mx-auto" />
                    <span v-else class="text-slate-300 dark:text-slate-600">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/50 dark:bg-slate-800/80">
          <button
            type="button"
            @click="isDetailModalOpen = false; openEditModal(selectedRole)"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>Edit Role Ini</span>
          </button>
          <button
            type="button"
            @click="isDetailModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS ROLE -->
    <div
      v-if="isDeleteConfirmOpen && roleToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click.self="isDeleteConfirmOpen = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          Hapus Role '{{ roleToDelete.name }}'?
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Tindakan ini akan menghapus role hak akses ini secara permanen dari sistem. Pastikan tidak ada pengguna aktif yang masih terikat dengan role ini.
        </p>

        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            @click="isDeleteConfirmOpen = false"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="confirmDeleteRole"
            class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Ya, Hapus Role
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

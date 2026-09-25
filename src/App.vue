<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import IkiKasirLogo from './components/IkiKasirLogo.vue'
import { 
  LayoutDashboard, 
  UserPlus, 
  MessageCircle, 
  Users, 
  Receipt, 
  Clock, 
  TrendingUp, 
  PieChart, 
  Calculator, 
  BookOpen, 
  Globe, 
  LogOut,
  Sparkles,
  Menu,
  X,
  Settings,
  Tag,
  Search,
  Moon,
  Sun,
  ChevronRight,
  Bell
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const showLogoutConfirm = ref(false)
const isMobileDrawerOpen = ref(false)
const mainContent = ref<HTMLElement | null>(null)
const isDarkMode = ref(false)

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Close drawer and scroll to top whenever route changes, and handle landing page theme reset
watch(() => route.path, (newPath) => {
  isMobileDrawerOpen.value = false
  if (newPath === '/landing') {
    document.documentElement.classList.remove('dark')
  }
  if (mainContent.value) {
    mainContent.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}, { immediate: true })

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  showLogoutConfirm.value = false
  router.push('/login')
}
</script>

<template>
  <RouterView v-if="route.path === '/landing' || route.path === '/login'" />
  <div v-else class="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#F8F9FD] dark:bg-slate-900 transition-colors duration-300">
    
    <!-- MOBILE TOP BAR (Visible only on < md screens) -->
    <header class="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 z-30 shrink-0 select-none shadow-xs">
      <div class="flex items-center gap-3">
        <!-- Hamburger Menu Button -->
        <button 
          @click="isMobileDrawerOpen = true"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu class="w-5 h-5" />
        </button>

        <!-- Brand Logo -->
        <IkiKasirLogo size="sm" />
      </div>

      <!-- Quick Super Admin Avatar / Status -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
          SA
        </div>
      </div>
    </header>

    <!-- MOBILE OFF-CANVAS BACKDROP -->
    <div 
      v-if="isMobileDrawerOpen"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
      @click="isMobileDrawerOpen = false"
    ></div>

    <!-- SIDEBAR (Desktop: static left; Mobile: off-canvas drawer) -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-slate-100/90 dark:border-slate-700/50 flex flex-col justify-between select-none shadow-2xl transition-transform duration-300 ease-in-out md:static md:w-64 md:min-w-64 md:shadow-[2px_0_12px_-4px_rgba(0,0,0,0.03)] md:translate-x-0"
      :class="isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Top Section with Logo & Nav Items -->
      <div class="flex-1 overflow-y-auto px-4 py-5 md:py-6">
        
        <!-- Logo & Mobile Close Button -->
        <div class="flex items-center justify-between px-2 mb-6 md:mb-7">
          <IkiKasirLogo size="md" />

          <!-- Close button on mobile drawer -->
          <button 
            @click="isMobileDrawerOpen = false"
            class="md:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="space-y-5 md:space-y-6">
          <!-- Main / Dashboard -->
          <div>
            <RouterLink 
              to="/" 
              @click="isMobileDrawerOpen = false"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group"
              :class="route.path === '/' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
            >
              <LayoutDashboard class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/' ? 'text-[#4F46E5]' : 'text-slate-500'" />
              <span>Dashboard</span>
            </RouterLink>
          </div>

          <!-- Section: MANAJEMEN -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">MANAJEMEN</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/manajemen-pengguna" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/manajemen-pengguna' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Settings class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/manajemen-pengguna' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Manajemen Pengguna</span>
              </RouterLink>
              <RouterLink 
                to="/manajemen-promo" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/manajemen-promo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Tag class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/manajemen-promo' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Manajemen Promo</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: CRM CLIENT -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">CRM CLIENT</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/calon-client" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/calon-client' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <UserPlus class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/calon-client' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Calon Client</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: DATA PELANGGAN -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">DATA PELANGGAN</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/semua-pelanggan" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/semua-pelanggan' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Users class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Semua Pelanggan</span>
              </RouterLink>
              <RouterLink 
                to="/langganan" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/langganan' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Receipt class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Langganan</span>
              </RouterLink>
              <RouterLink 
                to="/expired" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/expired' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Clock class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Expired</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: LAPORAN PENJUALAN -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">LAPORAN PENJUALAN</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/arus-kas" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/arus-kas' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <TrendingUp class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Arus Kas</span>
              </RouterLink>
              <RouterLink 
                to="/laba-rugi" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/laba-rugi' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <PieChart class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Laba Rugi</span>
              </RouterLink>
              <RouterLink 
                to="/neraca" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/neraca' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Calculator class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Neraca</span>
              </RouterLink>
              <RouterLink 
                to="/laporan-harian" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/laporan-harian' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <BookOpen class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Laporan Penjualan</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: LANDING PAGE -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">LANDING PAGE</h3>
            <div>
              <RouterLink 
                to="/landing" 
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/landing' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <Globe class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/landing' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Landing Page</span>
              </RouterLink>
            </div>
          </div>
        </nav>
      </div>

      <!-- Bottom: Logout -->
      <div class="p-4 border-t border-slate-100">
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer group"
        >
          <LogOut class="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 min-w-0 flex flex-col h-full bg-[#F8F9FD] dark:bg-slate-900 transition-colors duration-300">
      
      <!-- DESKTOP TOP BAR (Visible only on md+ screens) -->
      <header class="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 z-20 shrink-0 shadow-sm transition-colors duration-300">
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-sm font-medium">
          <span class="text-slate-400 dark:text-slate-500">IKI KASIR</span>
          <ChevronRight class="w-4 h-4 text-slate-300 dark:text-slate-600" />
          <span class="text-slate-800 dark:text-slate-200 capitalize">{{ route.path === '/' ? 'Dashboard' : route.path.substring(1).replace('-', ' ') }}</span>
        </div>

        <!-- Right Side: Search, Theme, Profile -->
        <div class="flex items-center gap-4">
          <!-- Global Search -->
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search class="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input 
              type="text" 
              class="block w-64 pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl leading-5 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 sm:text-sm transition-all duration-300" 
              placeholder="Cari sesuatu (Ctrl+K)..." 
            />
          </div>

          <!-- Dark Mode Toggle -->
          <button 
            @click="toggleTheme"
            class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Moon v-if="!isDarkMode" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>

          <!-- Notifications -->
          <button class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>

          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <!-- Profile Info -->
          <div class="flex items-center gap-3">
            <div class="text-right hidden lg:block">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">Super Admin</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Admin Utama</p>
            </div>
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-400">
              SA
            </div>
          </div>
        </div>
      </header>

      <!-- Scrollable Content -->
      <div ref="mainContent" class="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- MOBILE BOTTOM NAVIGATION BAR (Visible only on < md screens) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none">
      <!-- Dashboard -->
      <RouterLink 
        to="/" 
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="route.path === '/' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <LayoutDashboard class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Dashboard</span>
      </RouterLink>

      <!-- Calon Client -->
      <RouterLink 
        to="/calon-client" 
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="route.path === '/calon-client' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <UserPlus class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Calon Client</span>
      </RouterLink>

      <!-- Semua Pelanggan -->
      <RouterLink 
        to="/semua-pelanggan" 
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="route.path === '/semua-pelanggan' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <Users class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Pelanggan</span>
      </RouterLink>

      <!-- Menu / More Drawer Trigger -->
      <button 
        @click="isMobileDrawerOpen = true"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <Menu class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>

    <!-- Logout Modal -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
        <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <LogOut class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center">Konfirmasi Keluar</h3>
        <p class="text-sm text-slate-500 text-center mt-1">Apakah Anda yakin ingin keluar dari sistem IKI KASIR?</p>
        <div class="flex items-center gap-3 mt-6">
          <button 
            @click="showLogoutConfirm = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
          <button 
            @click="confirmLogout"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

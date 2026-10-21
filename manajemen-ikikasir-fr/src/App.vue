<script setup lang="ts">
import {
  Bell,
  BookOpen,
  Calculator,
  ChevronRight,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  PieChart,
  Receipt,
  Search,
  Settings,
  Sun,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  Check,
  CheckCircle2,
  X,
} from "lucide-vue-next";
import { ref, computed, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import IkiKasirLogo from "./components/IkiKasirLogo.vue";
import { useAppData } from "./composables/useAppData";

const router = useRouter();
const route = useRoute();
const showLogoutConfirm = ref(false);
const isMobileDrawerOpen = ref(false);
const mainContent = ref<HTMLElement | null>(null);
const isDarkMode = ref(false);

const { 
  currentRole, 
  setRole, 
  notifications, 
  unreadNotificationCount, 
  markNotificationRead, 
  clearAllNotifications,
  financeQueue,
  technicianQueue
} = useAppData();

const isRoleDropdownOpen = ref(false);
const isNotificationOpen = ref(false);

const pendingFinanceCount = computed(() => {
  return financeQueue.value.filter(l => l.paymentStatus === 'pending_verification').length;
});

const pendingTeknisiCount = computed(() => {
  return technicianQueue.value.filter(c => c.technicianStatus === 'pending_setup' || c.technicianStatus === 'in_progress').length;
});

const roleMeta = computed(() => {
  switch (currentRole.value) {
    case 'Finance':
      return { 
        title: 'Finance Officer', 
        sub: 'Acc Konfirmasi Pembayaran CRM', 
        badge: 'FN', 
        color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700' 
      };
    case 'Teknisi':
      return { 
        title: 'Teknisi Sistem', 
        sub: 'Penyiapan Aplikasi & Dokumen', 
        badge: 'TK', 
        color: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700' 
      };
    case 'Admin':
      return { 
        title: 'Administrator', 
        sub: 'Operasional Sistem', 
        badge: 'AD', 
        color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700' 
      };
    case 'Staff':
      return { 
        title: 'Staff Operasional', 
        sub: 'Pelanggan & Promo', 
        badge: 'ST', 
        color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700' 
      };
    case 'Kasir':
      return { 
        title: 'Kasir', 
        sub: 'Transaksi & Penjualan', 
        badge: 'KS', 
        color: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' 
      };
    default:
      return { 
        title: 'Super Admin', 
        sub: 'Admin Utama (Akses Penuh)', 
        badge: 'SA', 
        color: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700' 
      };
  }
});

const handleSelectRole = (r: 'Super Admin' | 'Finance' | 'Teknisi' | 'Admin' | 'Staff' | 'Kasir') => {
  setRole(r);
  isRoleDropdownOpen.value = false;
  if (r === 'Finance') {
    router.push('/calon-client');
  } else if (r === 'Teknisi') {
    router.push('/semua-pelanggan');
  }
};

const handleNotificationClick = (item: import('./types/crm').SystemNotification) => {
  markNotificationRead(item.id);
  isNotificationOpen.value = false;
  if (item.link) {
    router.push(item.link);
  }
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Close drawer and scroll to top whenever route changes, and handle landing page theme reset
watch(
  () => route.path,
  (newPath) => {
    isMobileDrawerOpen.value = false;
    isRoleDropdownOpen.value = false;
    isNotificationOpen.value = false;
    if (newPath === "/landing") {
      document.documentElement.classList.remove("dark");
    }
    if (mainContent.value) {
      mainContent.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  { immediate: true },
);

const handleLogout = () => {
  showLogoutConfirm.value = true;
};

const confirmLogout = () => {
  showLogoutConfirm.value = false;
  router.push("/login");
};
</script>

<template>
  <RouterView v-if="route.path === '/landing' || route.path === '/login'" />
  <div
    v-else
    class="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
  >
    <!-- MOBILE TOP BAR (Visible only on < md screens) -->
    <header
      class="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 z-30 shrink-0 select-none shadow-xs"
    >
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

      <!-- Quick Role Avatar / Switcher Trigger -->
      <div class="flex items-center gap-2">
        <button
          @click="isRoleDropdownOpen = !isRoleDropdownOpen"
          class="px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          :class="roleMeta.color"
        >
          <span>{{ roleMeta.badge }}</span>
          <span class="text-[10px] font-semibold hidden xs:inline">{{ currentRole }}</span>
          <ChevronDown class="w-3 h-3 opacity-60" />
        </button>
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
      :class="
        isMobileDrawerOpen
          ? 'translate-x-0'
          : '-translate-x-full md:translate-x-0'
      "
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
              :class="
                route.path === '/'
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
              "
            >
              <LayoutDashboard
                class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                :class="
                  route.path === '/' ? 'text-indigo-600' : 'text-slate-500'
                "
              />
              <span>Dashboard</span>
            </RouterLink>
          </div>

          <!-- Section: MANAJEMEN -->
          <div>
            <h3
              class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2"
            >
              MANAJEMEN
            </h3>
            <div class="space-y-1">
              <RouterLink
                to="/manajemen-pengguna"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/manajemen-pengguna'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Settings
                  class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  :class="
                    route.path === '/manajemen-pengguna'
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  "
                />
                <span>Manajemen Pengguna</span>
              </RouterLink>
              <RouterLink
                to="/manajemen-promo"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/manajemen-promo'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Tag
                  class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  :class="
                    route.path === '/manajemen-promo'
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  "
                />
                <span>Manajemen Promo</span>
              </RouterLink>
              <RouterLink
                to="/kelola-paket"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/kelola-paket'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Package
                  class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  :class="
                    route.path === '/kelola-paket'
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  "
                />
                <span>Kelola Paket</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: CRM CLIENT -->
          <div>
            <h3
              class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2"
            >
              CRM CLIENT
            </h3>
            <div class="space-y-1">
              <RouterLink
                to="/calon-client"
                @click="isMobileDrawerOpen = false"
                class="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/calon-client'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <div class="flex items-center gap-3">
                  <UserPlus
                    class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                    :class="
                      route.path === '/calon-client'
                        ? 'text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    "
                  />
                  <span>Calon Client</span>
                </div>
                <span 
                  v-if="pendingFinanceCount > 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
                  title="Menunggu Verifikasi Finance"
                >
                  {{ pendingFinanceCount }}
                </span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: DATA PELANGGAN -->
          <div>
            <h3
              class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2"
            >
              DATA PELANGGAN
            </h3>
            <div class="space-y-1">
              <RouterLink
                to="/semua-pelanggan"
                @click="isMobileDrawerOpen = false"
                class="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/semua-pelanggan'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <div class="flex items-center gap-3">
                  <Users
                    class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                    :class="
                      route.path === '/semua-pelanggan'
                        ? 'text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    "
                  />
                  <span>Semua Pelanggan</span>
                </div>
                <span 
                  v-if="pendingTeknisiCount > 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700"
                  title="Menunggu Setup Teknisi"
                >
                  {{ pendingTeknisiCount }}
                </span>
              </RouterLink>
              <RouterLink
                to="/langganan"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/langganan'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Receipt
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Langganan</span>
              </RouterLink>
              <RouterLink
                to="/expired"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/expired'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Clock
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Expired</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: LAPORAN PENJUALAN -->
          <div>
            <h3
              class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2"
            >
              LAPORAN PENJUALAN
            </h3>
            <div class="space-y-1">
              <RouterLink
                to="/arus-kas"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/arus-kas'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <TrendingUp
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Arus Kas</span>
              </RouterLink>
              <RouterLink
                to="/laba-rugi"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/laba-rugi'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <PieChart
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Laba Rugi</span>
              </RouterLink>
              <RouterLink
                to="/neraca"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/neraca'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Calculator
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Neraca</span>
              </RouterLink>
              <RouterLink
                to="/laporan-harian"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/laporan-harian'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <BookOpen
                  class="w-4 h-4 text-slate-400 group-hover:text-slate-600"
                />
                <span>Laporan Penjualan</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: LANDING PAGE -->
          <div>
            <h3
              class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2"
            >
              LANDING PAGE
            </h3>
            <div>
              <RouterLink
                to="/landing"
                @click="isMobileDrawerOpen = false"
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="
                  route.path === '/landing'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                "
              >
                <Globe
                  class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                  :class="
                    route.path === '/landing'
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  "
                />
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
          <LogOut
            class="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors"
          />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main
      class="flex-1 min-w-0 flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
    >
      <!-- DESKTOP TOP BAR (Visible only on md+ screens) -->
      <header
        class="hidden md:flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/50 z-20 shrink-0 shadow-sm transition-colors duration-300"
      >
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-sm font-medium">
          <span class="text-slate-400 dark:text-slate-500">IKI KASIR</span>
          <ChevronRight class="w-4 h-4 text-slate-300 dark:text-slate-600" />
          <span class="text-slate-800 dark:text-slate-200 capitalize">{{
            route.path === "/"
              ? "Dashboard"
              : route.path.substring(1).replace("-", " ")
          }}</span>
        </div>

        <!-- Right Side: Search, Theme, Profile -->
        <div class="flex items-center gap-4">
          <!-- Global Search -->
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <Search
                class="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              />
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

          <!-- Notifications Dropdown -->
          <div class="relative">
            <button
              @click="isNotificationOpen = !isNotificationOpen; isRoleDropdownOpen = false"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative cursor-pointer"
              title="Notifikasi Sistem"
            >
              <Bell class="w-5 h-5" />
              <span
                v-if="unreadNotificationCount > 0"
                class="absolute top-2 right-2 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full border-2 border-white dark:border-slate-800 text-[9px] font-black flex items-center justify-center animate-pulse"
              >
                {{ unreadNotificationCount }}
              </span>
            </button>

            <!-- Notification Popover -->
            <div 
              v-if="isNotificationOpen"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div class="px-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-800 dark:text-white">Notifikasi Sistem</h4>
                  <p class="text-[10px] text-slate-400">{{ unreadNotificationCount }} notifikasi belum dibaca</p>
                </div>
                <button 
                  @click="clearAllNotifications"
                  class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Tandai Semua Dibaca
                </button>
              </div>

              <div class="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                <div 
                  v-for="item in notifications" 
                  :key="item.id"
                  @click="handleNotificationClick(item)"
                  class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors space-y-1"
                  :class="!item.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">{{ item.title }}</span>
                    <span class="text-[9px] text-slate-400 font-mono">{{ item.timestamp }}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{{ item.message }}</p>
                </div>

                <div v-if="notifications.length === 0" class="py-8 text-center text-xs text-slate-400">
                  Tidak ada notifikasi saat ini.
                </div>
              </div>
            </div>
          </div>

          <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <!-- Profile & Role Switcher -->
          <div class="relative">
            <button 
              @click="isRoleDropdownOpen = !isRoleDropdownOpen; isNotificationOpen = false"
              class="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            >
              <div class="text-right hidden lg:block">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight flex items-center justify-end gap-1.5">
                  <span>{{ roleMeta.title }}</span>
                  <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
                </p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">
                  {{ roleMeta.sub }}
                </p>
              </div>
              <div
                class="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black shadow-xs"
                :class="roleMeta.color"
              >
                {{ roleMeta.badge }}
              </div>
            </button>

            <!-- Role Switcher Dropdown Modal -->
            <div 
              v-if="isRoleDropdownOpen"
              class="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1"
            >
              <div class="px-3.5 pb-2 border-b border-slate-100 dark:border-slate-700">
                <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pilih Role Pengguna</p>
                <p class="text-[11px] text-slate-500">Uji langsung sistem dari perspektif role yang diinginkan:</p>
              </div>

              <div class="px-2 space-y-1 pt-1">
                <!-- Super Admin -->
                <button 
                  @click="handleSelectRole('Super Admin')"
                  class="w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  :class="currentRole === 'Super Admin' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">SA</span>
                    <div>
                      <p class="text-xs font-bold">Super Admin</p>
                      <p class="text-[10px] text-slate-400">Semua modul & data</p>
                    </div>
                  </div>
                  <Check v-if="currentRole === 'Super Admin'" class="w-4 h-4 text-indigo-600" />
                </button>

                <!-- Finance -->
                <button 
                  @click="handleSelectRole('Finance')"
                  class="w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  :class="currentRole === 'Finance' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">FN</span>
                    <div>
                      <p class="text-xs font-bold">Finance</p>
                      <p class="text-[10px] text-slate-400">Acc pembayaran & CRM</p>
                    </div>
                  </div>
                  <Check v-if="currentRole === 'Finance'" class="w-4 h-4 text-amber-600" />
                </button>

                <!-- Teknisi -->
                <button 
                  @click="handleSelectRole('Teknisi')"
                  class="w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  :class="currentRole === 'Teknisi' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs font-bold">TK</span>
                    <div>
                      <p class="text-xs font-bold">Teknisi</p>
                      <p class="text-[10px] text-slate-400">Setup akun & APK</p>
                    </div>
                  </div>
                  <Check v-if="currentRole === 'Teknisi'" class="w-4 h-4 text-cyan-600" />
                </button>

                <!-- Admin -->
                <button 
                  @click="handleSelectRole('Admin')"
                  class="w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  :class="currentRole === 'Admin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">AD</span>
                    <div>
                      <p class="text-xs font-bold">Admin</p>
                      <p class="text-[10px] text-slate-400">Operasional umum</p>
                    </div>
                  </div>
                  <Check v-if="currentRole === 'Admin'" class="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Scrollable Content -->
      <div
        ref="mainContent"
        class="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8"
      >
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- MOBILE BOTTOM NAVIGATION BAR (Visible only on < md screens) -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none"
    >
      <!-- Dashboard -->
      <RouterLink
        to="/"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="
          route.path === '/'
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        "
      >
        <LayoutDashboard class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Dashboard</span>
      </RouterLink>

      <!-- Calon Client -->
      <RouterLink
        to="/calon-client"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="
          route.path === '/calon-client'
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        "
      >
        <UserPlus class="w-5 h-5 mb-0.5" />
        <span class="text-[10px] tracking-tight">Calon Client</span>
      </RouterLink>

      <!-- Semua Pelanggan -->
      <RouterLink
        to="/semua-pelanggan"
        class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors group"
        :class="
          route.path === '/semua-pelanggan'
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        "
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
    <div
      v-if="showLogoutConfirm"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
      >
        <div
          class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto"
        >
          <LogOut class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center">
          Konfirmasi Keluar
        </h3>
        <p class="text-sm text-slate-500 text-center mt-1">
          Apakah Anda yakin ingin keluar dari sistem IKI KASIR?
        </p>
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

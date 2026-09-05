<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
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
  Sparkles
} from 'lucide-vue-next'

const route = useRoute()
const showLogoutConfirm = ref(false)

const handleLogout = () => {
  showLogoutConfirm.value = true
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-[#F8F9FD]">
    <!-- Sidebar -->
    <aside class="w-64 min-w-64 bg-white border-r border-slate-100/90 flex flex-col justify-between select-none shadow-[2px_0_12px_-4px_rgba(0,0,0,0.03)] z-20">
      
      <!-- Top Section with Logo & Nav Items -->
      <div class="flex-1 overflow-y-auto px-4 py-6">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-2 mb-7">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-indigo-200">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="4"></rect>
              <path d="M7 15h0"></path>
              <path d="M2 9.5h20"></path>
              <circle cx="16" cy="15" r="1"></circle>
              <circle cx="12" cy="15" r="1"></circle>
            </svg>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-extrabold tracking-tight text-slate-800">IKI KASIR</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="space-y-6">
          <!-- Main / Dashboard -->
          <div>
            <RouterLink 
              to="/" 
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 group"
              :class="route.path === '/' ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            >
              <LayoutDashboard class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/' ? 'text-[#4F46E5]' : 'text-slate-500'" />
              <span>Dashboard</span>
            </RouterLink>
          </div>

          <!-- Section: CRM CLIENT -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">CRM CLIENT</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/calon-client" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/calon-client' ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <UserPlus class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/calon-client' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Calon Client</span>
              </RouterLink>
              <RouterLink 
                to="/follow-up" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/follow-up' ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <MessageCircle class="w-4 h-4 transition-transform duration-200 group-hover:scale-110" :class="route.path === '/follow-up' ? 'text-[#4F46E5]' : 'text-slate-400 group-hover:text-slate-600'" />
                <span>Follow Up</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: DATA PELANGGAN -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">DATA PELANGGAN</h3>
            <div class="space-y-1">
              <RouterLink 
                to="/semua-pelanggan" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/semua-pelanggan' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <Users class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Semua Pelanggan</span>
              </RouterLink>
              <RouterLink 
                to="/langganan" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/langganan' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <Receipt class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Langganan</span>
              </RouterLink>
              <RouterLink 
                to="/expired" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/expired' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
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
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/arus-kas' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <TrendingUp class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Arus Kas</span>
              </RouterLink>
              <RouterLink 
                to="/laba-rugi" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/laba-rugi' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <PieChart class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Laba Rugi</span>
              </RouterLink>
              <RouterLink 
                to="/neraca" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/neraca' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <Calculator class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Neraca</span>
              </RouterLink>
              <RouterLink 
                to="/laporan-harian" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
                :class="route.path === '/laporan-harian' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
              >
                <BookOpen class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Laporan Harian / Buku Besar</span>
              </RouterLink>
            </div>
          </div>

          <!-- Section: LANDING PAGE -->
          <div>
            <h3 class="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">LANDING PAGE</h3>
            <div>
              <a 
                href="#" 
                class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group"
              >
                <Globe class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Landing Page</span>
              </a>
            </div>
          </div>
        </nav>
      </div>

      <!-- Bottom: Logout -->
      <div class="p-4 border-t border-slate-100">
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 cursor-pointer group"
        >
          <LogOut class="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto bg-[#F8F9FD]">
      <RouterView />
    </main>

    <!-- Logout Modal -->
    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
            @click="showLogoutConfirm = false"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


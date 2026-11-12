<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileText,
  RefreshCw,
  Send,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from "lucide-vue-next";
import CashFlowChart from "../../components/CashFlowChart.vue";
import CustomerDetailModal from "../../components/CustomerDetailModal.vue";
import DateRangePicker from "../../components/common/DateRangePicker.vue";
import type { ActivityItem, Customer, DashboardCustomerRow } from "../../types/dashboard";

import { useDashboard } from "../../composables/useDashboard";

const router = useRouter();
const {
  summary,
  metrics,
  expiringCustomers: rawExpiring,
  expiredCustomers: rawExpired,
  activities,
  cashFlowChart,
  loading,
  error,
  fetchDashboard,
} = useDashboard();

// State for Modals
const isDetailModalOpen = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const showNotificationDropdown = ref(false);
const showProfileDropdown = ref(false);
const notificationsRead = ref(false);

// Filter rentang tanggal (dipakai bersama oleh header & grafik arus kas)
const startDate = ref("");
const endDate = ref("");

// Close all dropdowns on click outside
const closeAllDropdowns = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".dropdown-trigger")) {
    showNotificationDropdown.value = false;
    showProfileDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", closeAllDropdowns);
  fetchDashboard();
});
onUnmounted(() => {
  document.removeEventListener("click", closeAllDropdowns);
});

const markAllRead = () => {
  notificationsRead.value = true;
  showNotificationDropdown.value = false;
};

// Toast notification state
const toastMessage = ref<string | null>(null);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

const greeting = ref(getGreeting());
const currentDate = ref(
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);

// KPI Metrics dari API dashboard
const displayMetrics = computed(() => ({
  totalPelanggan: metrics.value.totalPelanggan,
  pelangganAktif: metrics.value.pelangganAktif,
  akanExpired: metrics.value.akanExpired,
  pelangganExpired: metrics.value.pelangganExpired,
}));

// Live Table Lists computed dari data API dashboard
const akanExpiredList = computed(() =>
  rawExpiring.value.map((c, idx) => ({
    ...c,
    no: idx + 1,
    businessName: c.businessName || "Toko",
  })),
);

const expiredList = computed(() =>
  rawExpired.value.map((c, idx) => ({
    ...c,
    no: idx + 1,
    businessName: c.businessName || "Toko",
  })),
);

// Copy phone number
const copiedPhone = ref<string | null>(null);
const copyPhone = (phone: string) => {
  navigator.clipboard.writeText(phone);
  copiedPhone.value = phone;
  setTimeout(() => {
    copiedPhone.value = null;
  }, 1500);
};

// Handler to view customer detail
const openCustomerDetail = (cust: DashboardCustomerRow) => {
  selectedCustomer.value = {
    id: cust.id,
    no: 0,
    name: cust.name,
    businessName: cust.businessName,
    packageType: cust.packageType,
    expiredDate: cust.expiredDate,
    status: cust.status,
    phone: cust.phone,
    daysLeft: cust.daysLeft,
    daysExpired: cust.daysExpired,
    amount: cust.amount,
  };
  isDetailModalOpen.value = true;
};

// Handler when new customer is saved from form
// displayMetrics auto-updates dari API dashboard reaktif, tidak perlu dimutasi manual
const handleCustomerSaved = (newCust: Customer, amount: number) => {
  showToast(
    `Pelanggan baru "${newCust.businessName || newCust.name}" berhasil didaftarkan!`,
  );
  // Muat ulang data dashboard agar KPI & aktivitas terbaru ikut ter-update
  fetchDashboard();
};

// Handler for customer renewal — data di-refresh dari API setelah perpanjangan
const handleCustomerRenewed = (customerId: string, days: number) => {
  const found =
    expiredList.value.find((c) => c.id === customerId) ||
    akanExpiredList.value.find((c) => c.id === customerId);
  if (found) {
    showToast(`Masa aktif ${found.name} berhasil diperpanjang ${days} hari!`);
  } else {
    showToast(`Masa aktif pelanggan berhasil diperpanjang ${days} hari!`);
  }
  fetchDashboard();
};

// Mapping ikon & warna per jenis aktivitas
const activityIconMap = {
  convert: UserCheck,
  payment: CreditCard,
  warning: Clock,
  followup: UserPlus,
  export: FileText,
} as const;

const activityIconClassMap = {
  convert:
    "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400",
  payment:
    "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400",
  warning: "bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400",
  followup: "bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400",
  export: "bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400",
} as const;

const activityIcon = (type: ActivityItem["type"]) =>
  activityIconMap[type] ?? FileText;

const activityIconClass = (type: ActivityItem["type"]) =>
  activityIconClassMap[type] ?? activityIconClassMap.export;

// Filter rentang tanggal untuk seluruh data dashboard (KPI, daftar pelanggan, aktivitas, grafik)
const applyDateRange = () => {
  fetchDashboard({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  });
};

// Label rentang aktif untuk ditampilkan pada judul tabel
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const formatTanggal = (iso: string) => {
  const parts = iso.split("-").map((value) => parseInt(value, 10));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) return iso;
  return `${parts[2]} ${MONTHS_SHORT[parts[1] - 1]} ${parts[0]}`;
};

const activeRangeLabel = computed(() => {
  if (startDate.value && endDate.value) {
    return `Rentang: ${formatTanggal(startDate.value)} - ${formatTanggal(endDate.value)}`;
  }
  if (startDate.value) return `Mulai ${formatTanggal(startDate.value)}`;
  if (endDate.value) return `Sampai ${formatTanggal(endDate.value)}`;
  return "";
});

// Pantau perubahan rentang tanggal (dipakai oleh header & grafik arus kas)
watch([startDate, endDate], () => {
  applyDateRange();
});
</script>

<template>
  <div
    class="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto select-none"
  >
    <!-- Top Header Bar -->
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
    >
      <!-- Title & Subtitle with Greeting -->
      <div>
        <h1
          class="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight"
        >
          {{ greeting }}, Admin! 👋
        </h1>
        <p
          class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium"
        >
          {{ currentDate }} · Ringkasan aktivitas bisnis Anda hari ini.
        </p>
      </div>

      <!-- Right Header Actions (Bell, User, Date) -->
      <div
        class="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 flex-wrap"
      >
        <!-- Filter Rentang Tanggal -->
        <div class="flex items-center gap-2">
          <DateRangePicker
            v-model:startDate="startDate"
            v-model:endDate="endDate"
            placeholder="Filter Rentang Tanggal"
          />

          <!-- Tombol Refresh -->
          <button
            @click="applyDateRange"
            :disabled="loading"
            class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
            title="Segarkan data dari server"
          >
            <RefreshCw
              class="w-3.5 h-3.5 text-slate-500"
              :class="loading ? 'animate-spin text-indigo-600' : ''"
            />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <!-- Notification Bell Icon -->
          <div class="relative dropdown-trigger">
            <button
              @click.stop="
                showNotificationDropdown = !showNotificationDropdown;
                showProfileDropdown = false;
              "
              class="relative text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
            >
              <Bell class="w-4 h-4" />
              <!-- Red notification dot -->
              <span
                v-if="!notificationsRead"
                class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
              ></span>
            </button>

            <!-- Notification Dropdown -->
            <div
              v-if="showNotificationDropdown"
              class="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
            >
              <div
                class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2"
              >
                <span class="font-bold text-slate-800">Notifikasi</span>
                <span
                  @click="markAllRead"
                  class="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline"
                  >Tandai dibaca</span
                >
              </div>
              <div class="space-y-2">
                <div
                  class="p-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <p class="font-bold text-slate-800 text-[11px]">
                    Pembayaran Langganan Masuk
                  </p>
                  <p class="text-[10px] text-slate-500">
                    Toko ABC telah membayar Rp 1.250.000
                  </p>
                </div>
                <div
                  class="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <p class="font-bold text-slate-800 text-[11px]">
                    5 Pelanggan Akan Expired
                  </p>
                  <p class="text-[10px] text-slate-500">
                    Kirim pengingat WhatsApp perpanjangan
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- User Profile Avatar & Role -->
          <div class="relative dropdown-trigger">
            <button
              @click.stop="
                showProfileDropdown = !showProfileDropdown;
                showNotificationDropdown = false;
              "
              class="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
            >
              <div
                class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
              >
                👤
              </div>
              <span
                class="text-xs font-semibold text-slate-700 hidden sm:inline"
                >Super Admin</span
              >
              <ChevronDown class="w-3 h-3 text-slate-400" />
            </button>

            <!-- Profile Dropdown -->
            <div
              v-if="showProfileDropdown"
              class="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
            >
              <a
                href="#"
                class="block px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                >Profil Akun</a
              >
              <a
                href="#"
                class="block px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium"
                >Pengaturan Sistem</a
              >
              <div class="border-t border-slate-100 my-1"></div>
              <a
                href="#"
                class="block px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >Keluar</a
              >
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Top 4 KPI Metrics Summary Cards (2 cols on mobile, 4 on desktop) -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <!-- Card 1: Total Pelanggan -->
      <div
        class="kpi-card bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-1 cursor-pointer"
        @click="router.push('/semua-pelanggan')"
      >
        <div
          class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0"
        >
          <Users class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1">
          <span
            class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400"
            >Total Pelanggan</span
          >
          <h3
            class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5"
          >
            {{ displayMetrics.totalPelanggan.toLocaleString("id-ID") }}
          </h3>
          <div
            class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5"
            :class="
              (summary?.pertumbuhanTotalPelanggan ?? 0) >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            "
          >
            <ArrowUp
              v-if="(summary?.pertumbuhanTotalPelanggan ?? 0) >= 0"
              class="w-3 h-3 stroke-[2.5]"
            />
            <ArrowDown v-else class="w-3 h-3 stroke-[2.5]" />
            <span>
              {{ (summary?.pertumbuhanTotalPelanggan ?? 0) > 0 ? "+" : ""
              }}{{ summary?.pertumbuhanTotalPelanggan ?? 0 }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Card 2: Pelanggan Aktif -->
      <div
        class="kpi-card bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-2 cursor-pointer"
        @click="router.push('/langganan')"
      >
        <div
          class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0"
        >
          <UserCheck class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1">
          <span
            class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400"
            >Pelanggan Aktif</span
          >
          <h3
            class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5"
          >
            {{ displayMetrics.pelangganAktif.toLocaleString("id-ID") }}
          </h3>
          <div
            class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold mt-0.5"
            :class="
              (summary?.pertumbuhanPelangganAktif ?? 0) >= 0
                ? 'text-emerald-600'
                : 'text-rose-600'
            "
          >
            <ArrowUp
              v-if="(summary?.pertumbuhanPelangganAktif ?? 0) >= 0"
              class="w-3 h-3 stroke-[2.5]"
            />
            <ArrowDown v-else class="w-3 h-3 stroke-[2.5]" />
            <span>
              {{ (summary?.pertumbuhanPelangganAktif ?? 0) > 0 ? "+" : ""
              }}{{ summary?.pertumbuhanPelangganAktif ?? 0 }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Card 3: Akan Expired -->
      <div
        class="kpi-card bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-3 cursor-pointer"
        @click="router.push('/expired')"
      >
        <div
          class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0"
        >
          <Clock class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1 w-full">
          <span
            class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400"
            >Akan Expired</span
          >
          <h3
            class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5"
          >
            {{ displayMetrics.akanExpired.toLocaleString("id-ID") }}
          </h3>
          <div class="w-full bg-amber-100 rounded-full h-1.5 mt-2">
            <div
              class="bg-amber-500 h-1.5 rounded-full animate-progress"
              :style="{
                width:
                  (displayMetrics.totalPelanggan > 0
                    ? Math.min(
                        (displayMetrics.akanExpired /
                          displayMetrics.totalPelanggan) *
                          100 *
                          5,
                        100,
                      )
                    : 0) + '%',
              }"
            ></div>
          </div>
          <div
            class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-amber-600 mt-1"
          >
            <Clock class="w-3 h-3" />
            <span>&lt; 14 Hari</span>
          </div>
        </div>
      </div>

      <!-- Card 4: Pelanggan Expired -->
      <div
        class="kpi-card bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 card-hover animate-fade-in-up animate-delay-4 cursor-pointer"
        @click="router.push('/expired')"
      >
        <div
          class="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0"
        >
          <XCircle class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div class="flex-1 w-full">
          <span
            class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400"
            >Expired</span
          >
          <h3
            class="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-0.5"
          >
            {{ displayMetrics.pelangganExpired.toLocaleString("id-ID") }}
          </h3>
          <div class="w-full bg-rose-100 rounded-full h-1.5 mt-2">
            <div
              class="bg-rose-500 h-1.5 rounded-full animate-progress"
              :style="{
                width:
                  (displayMetrics.totalPelanggan > 0
                    ? Math.min(
                        (displayMetrics.pelangganExpired /
                          displayMetrics.totalPelanggan) *
                          100 *
                          5,
                        100,
                      )
                    : 0) + '%',
              }"
            ></div>
          </div>
          <div
            class="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-rose-600 mt-1"
          >
            <ArrowDown class="w-3 h-3 stroke-[2.5]" />
            <span>Perlu Follow Up</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Action Shortcut Cards -->
    <section class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        @click="router.push('/calon-client')"
        class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group cursor-pointer"
      >
        <div
          class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors"
        >
          <UserPlus class="w-4 h-4" />
        </div>
        <span
          class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400"
          >Calon Client</span
        >
      </button>
      <button
        @click="router.push('/follow-up')"
        class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all group cursor-pointer"
      >
        <div
          class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors"
        >
          <Send class="w-4 h-4" />
        </div>
        <span
          class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
          >Follow Up</span
        >
      </button>
      <button
        @click="router.push('/arus-kas')"
        class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 transition-all group cursor-pointer"
      >
        <div
          class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors"
        >
          <BarChart3 class="w-4 h-4" />
        </div>
        <span
          class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400"
          >Arus Kas</span
        >
      </button>
      <button
        @click="router.push('/laporan-harian')"
        class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-slate-700 hover:border-amber-200 dark:hover:border-amber-500/50 transition-all group cursor-pointer"
      >
        <div
          class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors"
        >
          <Zap class="w-4 h-4" />
        </div>
        <span
          class="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400"
          >Laporan</span
        >
      </button>
    </section>

    <!-- Middle Section: Cash Flow Chart & Recent Activities (2 Columns) -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      <!-- Left: Grafik Arus Kas (~62% width) -->
      <div
        class="lg:col-span-7 xl:col-span-7 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700"
      >
        <CashFlowChart
          class="h-full"
          :data="cashFlowChart"
          :loading="loading"
          v-model:startDate="startDate"
          v-model:endDate="endDate"
        />
      </div>

      <!-- Right: Aktivitas Terbaru (~38% width) -->
      <div class="lg:col-span-5 xl:col-span-5 flex flex-col">
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700 flex-1 flex flex-col justify-between"
        >
          <div>
            <h2
              class="text-base font-bold text-slate-800 dark:text-white tracking-tight mb-4"
            >
              Aktivitas Terbaru
            </h2>

            <!-- Error State -->
            <div
              v-if="error"
              class="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2"
            >
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <div class="space-y-2">
                <p>{{ error }}</p>
                <button
                  @click="fetchDashboard()"
                  class="font-semibold underline hover:no-underline cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div
              v-else-if="loading && activities.length === 0"
              class="space-y-4 py-2"
            >
              <div
                v-for="idx in 5"
                :key="`skeleton-${idx}`"
                class="flex items-start gap-3"
              >
                <div
                  class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse shrink-0"
                ></div>
                <div class="flex-1 space-y-1.5">
                  <div
                    class="h-3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse w-3/4"
                  ></div>
                  <div
                    class="h-2.5 rounded bg-slate-100 dark:bg-slate-700 animate-pulse w-1/3"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="activities.length === 0"
              class="py-10 text-center text-xs text-slate-400"
            >
              Belum ada aktivitas terbaru.
            </div>

            <!-- List Aktivitas -->
            <div v-else class="space-y-4">
              <div
                v-for="activity in activities"
                :key="activity.id"
                class="flex items-start justify-between gap-3 text-xs"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    :class="activityIconClass(activity.type)"
                  >
                    <component :is="activityIcon(activity.type)" class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-slate-800 dark:text-slate-200 leading-snug">
                      <template v-if="activity.type === 'payment'">
                        {{ activity.title }}
                        <span class="font-bold dark:text-white">{{
                          activity.highlightText
                        }}</span>
                      </template>
                      <template v-else-if="activity.type === 'convert'">
                        <span class="font-bold dark:text-white">{{
                          activity.title
                        }}</span>
                        {{ activity.description }}
                      </template>
                      <template v-else>
                        <span class="font-bold dark:text-white">{{
                          activity.title
                        }}</span>
                        {{ activity.description }}
                      </template>
                    </p>
                    <p
                      class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5"
                    >
                      {{ activity.relativeTime }}
                    </p>
                  </div>
                </div>
                <span
                  class="text-slate-400 dark:text-slate-500 font-medium text-[11px] shrink-0"
                  >{{ activity.time }}</span
                >
              </div>
            </div>
          </div>

          <!-- Footer Button: Lihat Semua Aktivitas -->
          <div
            class="pt-4 mt-3 border-t border-slate-100 dark:border-slate-700/50"
          >
            <button
              @click="router.push('/laporan-harian')"
              class="w-full flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1 transition-colors cursor-pointer"
            >
              <span>Lihat Semua Aktivitas</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Section: Dual Tables (Pelanggan Akan Expired & Pelanggan Expired) -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Table 1: Pelanggan Akan Expired -->
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2
              class="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight"
            >
              Pelanggan Akan Expired
            </h2>
            <p
              v-if="activeRangeLabel"
              class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5"
            >
              {{ activeRangeLabel }}
            </p>
          </div>
          <button
            @click="router.push('/expired')"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr
                class="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-2"
              >
                <th class="py-2.5 font-semibold w-10">No</th>
                <th class="py-2.5 font-semibold">Nama Pelanggan</th>
                <th class="py-2.5 font-semibold">Paket</th>
                <th class="py-2.5 font-semibold">Expired Date</th>
                <th class="py-2.5 font-semibold">Sisa Hari</th>
                <th class="py-2.5 font-semibold text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
              <tr
                v-for="cust in akanExpiredList"
                :key="cust.id"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <td class="py-3 text-slate-500 dark:text-slate-400 font-medium">
                  {{ cust.no }}
                </td>
                <td
                  class="py-3 font-semibold text-slate-800 dark:text-slate-200"
                >
                  {{ cust.name }}
                </td>
                <td class="py-3">
                  <span
                    class="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    :class="
                      cust.packageType === 'Custom / IT One'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                    "
                  >
                    {{ cust.packageType }}
                  </span>
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300">
                  {{ cust.expiredDate }}
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300 font-medium">
                  {{ cust.daysLeft }} Hari
                </td>
                <td class="py-3 text-center">
                  <button
                    @click="openCustomerDetail(cust)"
                    title="Lihat Detail & Perpanjang"
                    class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table 2: Pelanggan Expired -->
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2
              class="text-sm sm:text-base font-bold text-slate-800 dark:text-white tracking-tight"
            >
              Pelanggan Expired
            </h2>
            <p
              v-if="activeRangeLabel"
              class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5"
            >
              {{ activeRangeLabel }}
            </p>
          </div>
          <button
            @click="router.push('/expired')"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[480px]">
            <thead>
              <tr
                class="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 pb-2"
              >
                <th class="py-2.5 font-semibold w-10">No</th>
                <th class="py-2.5 font-semibold">Nama Pelanggan</th>
                <th class="py-2.5 font-semibold">Paket</th>
                <th class="py-2.5 font-semibold">Expired Date</th>
                <th class="py-2.5 font-semibold">Lama Expired</th>
                <th class="py-2.5 font-semibold text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-700/50">
              <tr
                v-for="cust in expiredList"
                :key="cust.id"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <td class="py-3 text-slate-500 dark:text-slate-400 font-medium">
                  {{ cust.no }}
                </td>
                <td
                  class="py-3 font-semibold text-slate-800 dark:text-slate-200"
                >
                  {{ cust.name }}
                </td>
                <td class="py-3">
                  <span
                    class="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    :class="
                      cust.packageType === 'Custom / IT One'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                    "
                  >
                    {{ cust.packageType }}
                  </span>
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300">
                  {{ cust.expiredDate }}
                </td>
                <td class="py-3 text-slate-600 dark:text-slate-300 font-medium">
                  {{ cust.daysExpired }} Hari
                </td>
                <td class="py-3 text-center">
                  <button
                    @click="openCustomerDetail(cust)"
                    title="Lihat Detail & Perpanjang"
                    class="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Footer matching screenshot: '© 2026 IKI KASIR. Semua hak dilindungi.' -->
    <footer class="pt-6 pb-2 text-center text-xs text-slate-400">
      © 2026 IKI KASIR. Semua hak dilindungi.
    </footer>

    <!-- Customer Detail & Quick Renewal Modal -->
    <CustomerDetailModal
      :is-open="isDetailModalOpen"
      :customer="selectedCustomer"
      @close="isDetailModalOpen = false"
      @renew="handleCustomerRenewed"
    />

    <!-- Interactive Toast Notification Alert -->
    <div
      v-if="toastMessage"
      class="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-slate-700 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div
        class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"
      >
        <CheckCircle2 class="w-4 h-4" />
      </div>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

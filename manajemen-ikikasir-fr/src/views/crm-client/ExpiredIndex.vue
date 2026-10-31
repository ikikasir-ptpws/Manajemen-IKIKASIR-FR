<script setup lang="ts">
import {
  AlertCircle,
  Clock,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-vue-next";
import { computed, ref, watch, onMounted } from "vue";
import {
  getCustomerWaUrl,
  useAppData,
  getPackageDurationMonths,
} from "../../composables/useAppData";
import { usePagination } from "../../composables/usePagination";
import GlobalPagination from "../../components/common/GlobalPagination.vue";
import DateRangePicker from "../../components/common/DateRangePicker.vue";
import type { PackageType } from "../../types/dashboard";

const { expiredCustomers, renewCustomerSubscription, syncWithBackend, packages } =
  useAppData();

onMounted(() => {
  syncWithBackend(true);
});

const searchQuery = ref("");
const startDate = ref("");
const endDate = ref("");
const showRenewModal = ref(false);
const selectedCustomer = ref<any>(null);
const selectedPackageId = ref<string>("");
const paymentMethod = ref("QRIS");
const toastMessage = ref<string | null>(null);

const availablePackages = computed(() => {
  const active = packages.value.filter((p) => p.isActive !== false);
  if (active.length > 0) return active;
  if (packages.value.length > 0) return packages.value;
  return [
    { id: "basic", name: "Basic", price: 250000, period: "/bulan" },
    { id: "custom", name: "Custom / IT One", isConsultation: true, price: 0, period: "" },
  ];
});

const currentSelectedPackage = computed(() => {
  return (
    availablePackages.value.find((p) => p.id === selectedPackageId.value) ||
    availablePackages.value[0] ||
    null
  );
});

const packageDurationMonths = computed(() => {
  return getPackageDurationMonths(currentSelectedPackage.value);
});

const formatPackageLabel = (pkg: any) => {
  if (pkg.isConsultation || pkg.price === 0) return "Konsultasi";
  const priceStr = `Rp ${Number(pkg.price || 0).toLocaleString("id-ID")}`;
  const periodStr = pkg.period
    ? pkg.period.startsWith("/")
      ? pkg.period
      : `/${pkg.period}`
    : pkg.periodType === "tahunan"
      ? "/tahun"
      : "/bulan";
  return `${priceStr}${periodStr}`;
};

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
};

const filteredCustomers = computed(() => {
  let list = expiredCustomers.value.map((c) => ({
    id: c.id,
    name: c.name,
    business: c.businessName || "Toko",
    type: c.packageType,
    phone: c.phone || "",
    expiredDate: c.expiredDate,
    daysExpired: c.daysExpired || 1,
    rawCustomer: c,
  }));

  if (startDate.value) {
    list = list.filter((c) => c.expiredDate >= startDate.value);
  }
  if (endDate.value) {
    list = list.filter((c) => c.expiredDate <= endDate.value);
  }

  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.business.toLowerCase().includes(q) ||
      c.phone.includes(q),
  );
});

// Pagination
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  paginatedItems: paginatedCustomers,
  resetPage
} = usePagination(filteredCustomers, 10);

watch([searchQuery, startDate, endDate], () => {
  resetPage();
});

// Rule 12 & 15: WhatsApp Follow Up opens CUSTOMER'S WhatsApp number
const sendWhatsAppFollowUp = (cust: any) => {
  const message = `Halo ${cust.name}, kami dari IKI KASIR. Masa aktif langganan Anda telah berakhir pada ${cust.expiredDate}. Apakah Anda ingin melakukan perpanjangan langganan?`;
  const waUrl = getCustomerWaUrl(cust.phone, message);
  window.open(waUrl, "_blank");
};

const openRenew = (cust: any) => {
  selectedCustomer.value = cust;
  const raw = cust.rawCustomer || cust;
  const matched = availablePackages.value.find(
    (p) =>
      (raw.packageId && p.id === raw.packageId) ||
      p.id === cust.type ||
      p.name.toLowerCase() === (cust.type || "").toLowerCase(),
  );
  selectedPackageId.value = matched
    ? matched.id
    : availablePackages.value[0]?.id || "";
  paymentMethod.value = raw.paymentMethod || "QRIS";
  showRenewModal.value = true;
};

// Rule 13 & 19: Renew subscription without creating duplicate customer
const confirmRenew = () => {
  if (selectedCustomer.value && currentSelectedPackage.value) {
    const pkg = currentSelectedPackage.value;
    const duration = packageDurationMonths.value;
    const invoice = renewCustomerSubscription({
      customerId: selectedCustomer.value.id,
      packageType: pkg.name,
      packageId: pkg.id,
      billingCycleMonths: duration,
      paymentMethod: paymentMethod.value,
      markPaidImmediately: true,
    });

    if (invoice) {
      showToast(
        `✅ Masa aktif "${selectedCustomer.value.name}" berhasil diperpanjang ${duration} Bulan (${pkg.name})! Invoice baru: ${invoice.id}`,
      );
    }
    showRenewModal.value = false;
  }
};
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    <!-- Toast -->
    <Transition name="slide-fade">
      <div
        v-if="toastMessage"
        class="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold"
      >
        ✅ {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <header
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1
          class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2"
        >
          <Clock class="w-6 h-6 text-rose-600" />
          Pelanggan Expired
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          Daftar pelanggan yang masa aktif langganannya telah habis.
        </p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        <DateRangePicker
          v-model:startDate="startDate"
          v-model:endDate="endDate"
          placeholder="Filter Rentang Tanggal"
        />
        <div class="relative flex-1 sm:w-56">
          <Search
            class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari pelanggan expired..."
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
    </header>

    <!-- Summary Card -->
    <div
      class="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-center gap-3"
    >
      <div
        class="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0"
      >
        <AlertCircle class="w-5 h-5" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-rose-800">
          {{ filteredCustomers.length }} Pelanggan Expired
        </h3>
        <p class="text-xs text-rose-600">
          Segera follow up untuk perpanjangan langganan mereka.
        </p>
      </div>
    </div>

    <!-- Table Container (Desktop) -->
    <div
      class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px]">
          <thead class="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th class="px-6 py-4 w-16">No</th>
              <th class="px-6 py-4">Pelanggan</th>
              <th class="px-6 py-4">
                Paket Terakhir
              </th>
              <th class="px-6 py-4">
                Tanggal Expired
              </th>
              <th class="px-6 py-4">
                Lama Expired
              </th>
              <th class="px-6 py-4 text-right">
                Aksi Follow Up
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(cust, index) in paginatedCustomers"
              :key="cust.id"
              class="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              @click="openRenew(cust)"
            >
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ startIndex + index + 1 }}
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ cust.name }}</div>
                <div
                  class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"
                >
                  <ShieldCheck class="w-3 h-3 text-slate-400" />
                  {{ cust.business }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {{ cust.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium font-mono text-xs">
                {{ cust.expiredDate }}
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100"
                >
                  <AlertCircle class="w-3.5 h-3.5" />
                  {{ cust.daysExpired }} Hari
                </div>
              </td>
              <td class="px-6 py-4" @click.stop>
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="sendWhatsAppFollowUp(cust)"
                    title="Follow Up Ke WhatsApp Pelanggan"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle class="w-3.5 h-3.5" />
                    <span>WhatsApp Klien</span>
                  </button>
                  <button
                    @click="openRenew(cust)"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw class="w-3.5 h-3.5" />
                    <span>Perpanjang</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td
                colspan="6"
                class="px-6 py-8 text-center text-slate-400 text-sm"
              >
                Tidak ada pelanggan expired yang cocok dengan pencarian.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredCustomers.length > 0"
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <!-- MOBILE CARDS VIEW -->
    <div class="block md:hidden space-y-3">
      <div 
        v-for="cust in paginatedCustomers" 
        :key="cust.id"
        class="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 cursor-pointer"
        @click="openRenew(cust)"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="font-extrabold text-sm text-slate-900">{{ cust.name }}</h4>
            <p class="text-xs text-slate-500">{{ cust.business }} &bull; {{ cust.phone }}</p>
          </div>
          <div
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100"
          >
            <AlertCircle class="w-3 h-3" />
            <span>{{ cust.daysExpired }} Hari</span>
          </div>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Paket:</span>
            <span class="font-bold text-slate-700">{{ cust.type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Tanggal Expired:</span>
            <span class="font-bold text-rose-600 font-mono">{{ cust.expiredDate }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1" @click.stop>
          <button
            @click="sendWhatsAppFollowUp(cust)"
            class="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle class="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            @click="openRenew(cust)"
            class="flex-1 py-2 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-200"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            <span>Perpanjang</span>
          </button>
        </div>
      </div>

      <div v-if="filteredCustomers.length === 0" class="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border border-slate-100">
        Tidak ada pelanggan expired yang cocok dengan pencarian.
      </div>

      <!-- Mobile Pagination Control -->
      <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-xs">
        <button 
          @click="currentPage--"
          :disabled="currentPage <= 1"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40 cursor-pointer"
        >
          Sebelumnya
        </button>
        <span class="font-bold text-slate-700">Hal {{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40 cursor-pointer"
        >
          Selanjutnya
        </button>
      </div>
    </div>

    <!-- Renew Modal -->
    <div
      v-if="showRenewModal && selectedCustomer"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="showRenewModal = false"
    >
      <div
        class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800">Perpanjang Langganan</h3>
          <button
            @click="showRenewModal = false"
            class="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X class="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <p class="text-xs text-slate-600 mb-4">
          Perpanjang masa aktif untuk
          <strong>{{ selectedCustomer.name }}</strong> ({{
            selectedCustomer.business
          }}).
        </p>

        <div class="space-y-3 mb-5 text-xs">
          <div>
            <label class="font-bold text-slate-700 mb-1 block"
              >Paket Langganan</label
            >
            <select
              v-model="selectedPackageId"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option
                v-for="pkg in availablePackages"
                :key="pkg.id"
                :value="pkg.id"
              >
                {{ pkg.name }} ({{ formatPackageLabel(pkg) }})
              </option>
            </select>
            <p
              v-if="currentSelectedPackage"
              class="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5"
            >
              <span>Durasi langganan:</span>
              <span
                class="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md"
                >{{ packageDurationMonths }} Bulan</span
              >
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="showRenewModal = false"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="confirmRenew"
            class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer"
          >
            Perpanjang
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>

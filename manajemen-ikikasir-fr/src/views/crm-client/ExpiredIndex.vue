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
import { computed, ref } from "vue";
import { getCustomerWaUrl, useAppData } from "../../composables/useAppData";
import type { PackageType } from "../../types/dashboard";

const { expiredCustomers, renewCustomerSubscription } = useAppData();

const searchQuery = ref("");
const showRenewModal = ref(false);
const selectedCustomer = ref<any>(null);
const selectedMonths = ref(1); // 1, 3, 6, 12 months
const selectedPackage = ref<PackageType>("Basic");
const paymentMethod = ref("QRIS");
const toastMessage = ref<string | null>(null);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
};

const filteredCustomers = computed(() => {
  const list = expiredCustomers.value.map((c) => ({
    id: c.id,
    name: c.name,
    business: c.businessName || "Toko",
    type: c.packageType,
    phone: c.phone || "",
    expiredDate: c.expiredDate,
    daysExpired: c.daysExpired || 1,
    rawCustomer: c,
  }));

  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.business.toLowerCase().includes(q) ||
      c.phone.includes(q),
  );
});

// Rule 12 & 15: WhatsApp Follow Up opens CUSTOMER'S WhatsApp number
const sendWhatsAppFollowUp = (cust: any) => {
  const message = `Halo ${cust.name}, kami dari IKI KASIR. Masa aktif langganan Anda telah berakhir pada ${cust.expiredDate}. Apakah Anda ingin melakukan perpanjangan langganan?`;
  const waUrl = getCustomerWaUrl(cust.phone, message);
  window.open(waUrl, "_blank");
};

const openRenew = (cust: any) => {
  selectedCustomer.value = cust;
  selectedPackage.value = cust.type || "Basic";
  selectedMonths.value = 1;
  paymentMethod.value = "QRIS";
  showRenewModal.value = true;
};

// Rule 13 & 19: Renew subscription without creating duplicate customer
const confirmRenew = () => {
  if (selectedCustomer.value) {
    const invoice = renewCustomerSubscription({
      customerId: selectedCustomer.value.id,
      packageType: selectedPackage.value,
      billingCycleMonths: selectedMonths.value,
      paymentMethod: paymentMethod.value,
      markPaidImmediately: true,
    });

    if (invoice) {
      showToast(
        `✅ Masa aktif "${selectedCustomer.value.name}" berhasil diperpanjang ${selectedMonths.value} Bulan! Invoice baru: ${invoice.id}`,
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

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
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

    <!-- Table Container -->
    <div
      class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 font-semibold text-slate-600 w-16">No</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Pelanggan</th>
              <th class="px-6 py-4 font-semibold text-slate-600">
                Paket Terakhir
              </th>
              <th class="px-6 py-4 font-semibold text-slate-600">
                Tanggal Expired
              </th>
              <th class="px-6 py-4 font-semibold text-slate-600">
                Lama Expired
              </th>
              <th class="px-6 py-4 font-semibold text-slate-600 text-right">
                Aksi Follow Up
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="(cust, index) in filteredCustomers"
              :key="cust.id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="px-6 py-4 text-slate-500 font-medium">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800">{{ cust.name }}</div>
                <div
                  class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"
                >
                  <ShieldCheck class="w-3 h-3 text-slate-400" />
                  {{ cust.business }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {{ cust.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium">
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
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="sendWhatsAppFollowUp(cust)"
                    title="Follow Up Ke WhatsApp Pelanggan"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle class="w-3.5 h-3.5" />
                    WhatsApp Klien
                  </button>
                  <button
                    @click="openRenew(cust)"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw class="w-3.5 h-3.5" />
                    Perpanjang
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td
                colspan="6"
                class="px-6 py-8 text-center text-slate-400 text-sm"
              >
                Tidak ada pelanggan expired.
              </td>
            </tr>
          </tbody>
        </table>
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
              v-model="selectedPackage"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800"
            >
              <option value="Basic">Basic (Rp 250.000/bln)</option>
              <option value="Custom / IT One">
                Custom / IT One (Konsultasi)
              </option>
            </select>
          </div>

          <div>
            <label class="font-bold text-slate-700 mb-1 block"
              >Durasi Perpanjangan</label
            >
            <select
              v-model="selectedMonths"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800"
            >
              <option :value="1">1 Bulan</option>
              <option :value="3">3 Bulan</option>
              <option :value="6">6 Bulan</option>
              <option :value="12">12 Bulan (1 Tahun)</option>
            </select>
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

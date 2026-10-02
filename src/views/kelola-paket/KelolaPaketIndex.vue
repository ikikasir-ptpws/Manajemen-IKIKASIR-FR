<script setup lang="ts">
import {
  CheckCircle2,
  Edit3,
  Package,
  Plus,
  Trash2,
  XCircle,
} from "lucide-vue-next";
import { ref } from "vue";
import type { PricingPackage } from "../../composables/useAppData";
import { useAppData } from "../../composables/useAppData";

const {
  packages,
  addPackage,
  updatePackage,
  deletePackage,
  togglePackageActive,
} = useAppData();

const isModalOpen = ref(false);
const isEditing = ref(false);
const currentPackage = ref<PricingPackage | null>(null);

// Form states
const form = ref<{
  id: string;
  name: string;
  cardClass: string;
  badge: string;
  cardSub: string;
  icon: string;
  isConsultation: boolean;
  price: number;
  priceTitle: string;
  priceSubtext: string;
  period: string;
  featuresText: string;
  btnText: string;
  btnClass: string;
  waText: string;
  isActive: boolean;
}>({
  id: "",
  name: "",
  cardClass: "price-card basic",
  badge: "",
  cardSub: "",
  icon: "Box",
  isConsultation: false,
  price: 0,
  priceTitle: "",
  priceSubtext: "",
  period: "/bulan",
  featuresText: "",
  btnText: "Mulai Langganan",
  btnClass: "btn-outline-blue",
  waText: "",
  isActive: true,
});

const openAddModal = () => {
  isEditing.value = false;
  form.value = {
    id: "",
    name: "",
    cardClass: "price-card basic",
    badge: "",
    cardSub: "",
    icon: "Box",
    isConsultation: false,
    price: 0,
    priceTitle: "",
    priceSubtext: "",
    period: "/bulan",
    featuresText: "",
    btnText: "Mulai Langganan",
    btnClass: "btn-outline-blue",
    waText: "",
    isActive: true,
  };
  isModalOpen.value = true;
};

const openEditModal = (pkg: PricingPackage) => {
  isEditing.value = true;
  form.value = {
    ...pkg,
    priceTitle: pkg.priceTitle ?? "",
    priceSubtext: pkg.priceSubtext ?? "",
    featuresText: pkg.features.join("\n"),
  };
  isModalOpen.value = true;
};

const savePackage = () => {
  const features = form.value.featuresText
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f);

  const packageData = {
    name: form.value.name,
    cardClass: form.value.cardClass,
    badge: form.value.badge,
    cardSub: form.value.cardSub,
    icon: form.value.icon,
    isConsultation: form.value.isConsultation,
    price: form.value.price,
    priceTitle: form.value.priceTitle,
    priceSubtext: form.value.priceSubtext,
    period: form.value.period,
    features: features,
    btnText: form.value.btnText,
    btnClass: form.value.btnClass,
    waText: form.value.waText,
    isActive: form.value.isActive,
  };

  if (isEditing.value && form.value.id) {
    updatePackage({ ...packageData, id: form.value.id });
  } else {
    addPackage(packageData);
  }
  isModalOpen.value = false;
};

const confirmDelete = (id: string) => {
  if (confirm("Yakin ingin menghapus paket ini?")) {
    deletePackage(id);
  }
};
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
    >
      <div>
        <h1
          class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"
        >
          <Package class="w-6 h-6 text-indigo-600" />
          Kelola Paket
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Atur daftar paket berlangganan yang tampil di Landing Page
        </p>
      </div>
      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        Tambah Paket
      </button>
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden flex-1"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead
            class="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400"
          >
            <tr>
              <th class="px-6 py-4 font-semibold">Nama Paket</th>
              <th class="px-6 py-4 font-semibold">Harga</th>
              <th class="px-6 py-4 font-semibold">Badge</th>
              <th class="px-6 py-4 font-semibold">Fitur</th>
              <th class="px-6 py-4 font-semibold text-center">Status</th>
              <th class="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr v-if="packages.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                Belum ada paket.
              </td>
            </tr>
            <tr
              v-for="pkg in packages"
              :key="pkg.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
            >
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900 dark:text-white">
                  {{ pkg.name }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {{ pkg.cardSub }}
                </p>
              </td>
              <td class="px-6 py-4">
                <template v-if="!pkg.isConsultation">
                  <span class="font-bold text-slate-900 dark:text-white"
                    >Rp {{ pkg.price.toLocaleString("id-ID") }}</span
                  >
                  <span class="text-slate-500 text-xs">{{ pkg.period }}</span>
                </template>
                <template v-else>
                  <span
                    class="font-semibold text-indigo-600 dark:text-indigo-400"
                    >Custom/Konsultasi</span
                  >
                </template>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="pkg.badge"
                  class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold"
                  >{{ pkg.badge }}</span
                >
                <span v-else class="text-slate-400 text-xs">-</span>
              </td>
              <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                {{ pkg.features.length }} fitur
              </td>
              <td class="px-6 py-4 text-center">
                <button
                  @click="togglePackageActive(pkg.id)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                  :class="
                    pkg.isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  <CheckCircle2 v-if="pkg.isActive" class="w-3.5 h-3.5" />
                  <XCircle v-else class="w-3.5 h-3.5" />
                  {{ pkg.isActive ? "Aktif" : "Nonaktif" }}
                </button>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(pkg)"
                    class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDelete(pkg.id)"
                    class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="isModalOpen = false"
      ></div>

      <div
        class="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <!-- Modal Header -->
        <div
          class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80"
        >
          <h3 class="text-lg font-bold text-slate-800 dark:text-white">
            {{ isEditing ? "Edit Paket" : "Tambah Paket Baru" }}
          </h3>
          <button
            @click="isModalOpen = false"
            class="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <XCircle class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Nama Paket</label
              >
              <input
                v-model="form.name"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Basic"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Badge (Opsional)</label
              >
              <input
                v-model="form.badge"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Terpopuler"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Subjudul / Deskripsi Singkat</label
              >
              <input
                v-model="form.cardSub"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Cocok untuk usaha kecil..."
              />
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4 mb-4">
            <div class="flex items-center mb-3">
              <input
                v-model="form.isConsultation"
                type="checkbox"
                id="isConsultation"
                class="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer"
              />
              <label
                for="isConsultation"
                class="ml-2 text-sm font-semibold text-slate-700 cursor-pointer"
                >Mode Konsultasi (Harga disembunyikan)</label
              >
            </div>

            <div v-if="!form.isConsultation" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1"
                  >Harga (Rp)</label
                >
                <input
                  v-model.number="form.price"
                  type="number"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1"
                  >Satuan Harga</label
                >
                <input
                  v-model="form.period"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                  placeholder="/bulan"
                />
              </div>
            </div>

            <div v-else class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1"
                  >Teks Harga Custom</label
                >
                <input
                  v-model="form.priceTitle"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                  placeholder="Konsultasi Terlebih Dahulu"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1"
                  >Sub Teks Custom</label
                >
                <input
                  v-model="form.priceSubtext"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                  placeholder="Tanya-tanya & penyesuaian..."
                />
              </div>
            </div>
          </div>

          <div
            class="border-t border-slate-100 pt-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Ikon (Lucide)</label
              >
              <input
                v-model="form.icon"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                placeholder="Box, Crown, dll"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Teks Tombol CTA</label
              >
              <input
                v-model="form.btnText"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                placeholder="Mulai Langganan"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Teks Template WhatsApp</label
              >
              <input
                v-model="form.waText"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
                placeholder="Halo tim IKI KASIR..."
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Warna Kartu (Class CSS)</label
              >
              <select
                v-model="form.cardClass"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
              >
                <option value="price-card basic">Terang (Basic)</option>
                <option value="price-card pro">Biru Gelap (Pro/Custom)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1"
                >Warna Tombol (Class CSS)</label
              >
              <select
                v-model="form.btnClass"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
              >
                <option value="btn-outline-blue">Garis Biru (Outline)</option>
                <option value="btn-solid-white">Putih Solid</option>
                <option value="btn-primary-lg">Biru Solid</option>
              </select>
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <label class="block text-xs font-semibold text-slate-600 mb-1"
              >Daftar Fitur (1 baris 1 fitur)</label
            >
            <textarea
              v-model="form.featuresText"
              rows="4"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500"
              placeholder="- Fitur 1&#10;- Fitur 2"
            ></textarea>
          </div>

          <div class="mt-4 flex items-center">
            <input
              v-model="form.isActive"
              type="checkbox"
              id="isActive"
              class="w-4 h-4 text-indigo-600 border-slate-300 rounded cursor-pointer"
            />
            <label
              for="isActive"
              class="ml-2 text-sm font-semibold text-slate-700 cursor-pointer"
              >Tampilkan paket ini di website</label
            >
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3"
        >
          <button
            @click="isModalOpen = false"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="savePackage"
            class="px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
          >
            Simpan Paket
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>

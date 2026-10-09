<script setup lang="ts">
import {
  AlertCircle,
  Box,
  Building2,
  CheckCircle2,
  Crown,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-vue-next";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useAppData } from "../composables/useAppData";

const props = defineProps<{
  isOpen: boolean;
  defaultPackage?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submitted", leadId: string): void;
}>();

const { addRegistration, packages: systemPackages } = useAppData();

const businessTypeOptions = [
  "Kafe / Restoran / Warung makan",
  "Toko kelontong / Minimarket",
  "Fashion / Pakaian",
  "Laundry",
  "Barbershop / Salon",
  "Bengkel",
  "Lainnya",
];
const outletOptions = ["1", "2-3", "4 atau lebih"];
const employeeOptions = ["1", "2", "3", "4", "5 atau lebih"];
const recordingOptions = [
  "Buku / manual",
  "Excel / spreadsheet",
  "Aplikasi kasir lain",
  "Belum mencatat",
];
const featureOptions = [
  "Transaksi penjualan",
  "Manajemen stok",
  "Laporan penjualan",
  "Pembayaran / QRIS",
  "Antrian",
  "Cetak struk",
  "Diskon / promo",
  "Lainnya",
];
const activePackages = computed(() => systemPackages.value.filter((pkg) => pkg.isActive));
const willingToTryOptions = ["Ya, saya tertarik", "Mungkin", "Tidak"];
const willingToTestOptions = ["Ya", "Tidak"];
const knownFromOptions = ["Instagram", "TikTok", "Teman / rekomendasi", "Sales", "Lainnya"];

const resolvePackageName = (preferredName?: string) => {
  const matchingPackage = activePackages.value.find(
    (pkg) => pkg.name.trim().toLowerCase() === preferredName?.trim().toLowerCase(),
  );
  return matchingPackage?.name || activePackages.value[0]?.name || "";
};

const formData = ref({
  name: "",
  phone: "",
  email: "",
  businessName: "",
  businessType: "",
  city: "",
  address: "",
  packageInterest: "",
  outletCount: "",
  employeeAppCount: "",
  currentRecordingMethod: "",
  neededFeatures: [] as string[],
  otherNeededFeature: "",
  specialNeed: "",
  willingToTry: "",
  willingToTest: "",
  knownFrom: "",
  otherKnownFrom: "",
  consentAgreed: false,
});

// Validation Errors
const errors = ref<Record<string, string>>({});
const submitError = ref<string | null>(null);
const isSubmitting = ref(false);
const isSuccess = ref(false);
const submittedData = ref<any>(null);
const scrollAreaRef = ref<HTMLElement | null>(null);

watch(
  () => props.defaultPackage,
  (newPkg) => {
    formData.value.packageInterest = resolvePackageName(newPkg);
  },
  { immediate: true },
);

watch(activePackages, (availablePackages) => {
  if (!availablePackages.some((pkg) => pkg.name === formData.value.packageInterest)) {
    formData.value.packageInterest = resolvePackageName(props.defaultPackage);
  }
});

// Lock / unlock body scroll
const lockBodyScroll = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  // Kunci scroll di <html> (root scroll container) DAN <body>
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  // Kompensasi lebar scrollbar agar layout tidak bergeser
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.documentElement.style.paddingRight = scrollbarWidth + 'px';
  }
};
const unlockBodyScroll = () => {
  document.documentElement.style.overflow = '';
  document.documentElement.style.paddingRight = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

// Reset form when modal opens / closes
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      lockBodyScroll();
      isSuccess.value = false;
      errors.value = {};
      submitError.value = null;
      formData.value = {
        name: "",
        phone: "",
        email: "",
        businessName: "",
        businessType: "",
        city: "",
        address: "",
        packageInterest: resolvePackageName(props.defaultPackage),
        outletCount: "",
        employeeAppCount: "",
        currentRecordingMethod: "",
        neededFeatures: [],
        otherNeededFeature: "",
        specialNeed: "",
        willingToTry: "",
        willingToTest: "",
        knownFrom: "",
        otherKnownFrom: "",
        consentAgreed: false,
      };
    } else {
      unlockBodyScroll();
    }
  },
);

// Pastikan scroll dipulihkan jika komponen di-unmount saat modal masih terbuka
onUnmounted(() => {
  unlockBodyScroll();
});

const clearError = (field: string) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

const validateForm = () => {
  const errs: Record<string, string> = {};

  if (!formData.value.name.trim()) {
    errs.name = "Nama lengkap wajib diisi.";
  }

  const normalizedPhone = formData.value.phone.replace(/[\s()-]/g, "");
  if (!formData.value.phone.trim()) {
    errs.phone = "Nomor WhatsApp aktif wajib diisi.";
  } else if (!/^(?:08|628|\+628)\d{8,11}$/.test(normalizedPhone)) {
    errs.phone = "Format nomor WhatsApp tidak valid. Gunakan 08xx, 628xx, atau +628xx.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.value.email.trim()) {
    errs.email = "Email wajib diisi.";
  } else if (!emailRegex.test(formData.value.email.trim())) {
    errs.email = "Format email tidak valid (contoh: nama@domain.com).";
  }

  if (!formData.value.businessName.trim()) {
    errs.businessName = "Nama toko / usaha wajib diisi.";
  }
  if (!formData.value.businessType) {
    errs.businessType = "Jenis usaha wajib dipilih.";
  }
  if (!formData.value.city.trim()) {
    errs.city = "Kota / kabupaten wajib diisi.";
  }

  if (formData.value.neededFeatures.includes("Lainnya") && !formData.value.otherNeededFeature.trim()) {
    errs.otherNeededFeature = "Tuliskan fitur lain yang dibutuhkan.";
  }
  if (formData.value.knownFrom === "Lainnya" && !formData.value.otherKnownFrom.trim()) {
    errs.otherKnownFrom = "Tuliskan sumber informasi lainnya.";
  }

  if (!formData.value.willingToTry) {
    errs.willingToTry = "Pilihan minat mencoba wajib dipilih.";
  }
  if (!formData.value.willingToTest) {
    errs.willingToTest = "Pilihan kesediaan menjadi tester wajib dipilih.";
  }
  if (!formData.value.consentAgreed) {
    errs.consentAgreed = "Persetujuan penggunaan data wajib dicentang.";
  }

  errors.value = errs;
  return Object.keys(errs).length === 0;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  submitError.value = null;

  if (!validateForm()) {
    const errCount = Object.keys(errors.value).length;
    submitError.value = `⚠️ Harap lengkapi ${errCount} kolom wajib sebelum mengirim.`;
    await nextTick();
    scrollAreaRef.value?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  isSubmitting.value = true;
  try {
    const newLead = addRegistration({
      name: formData.value.name.trim(),
      phone: formData.value.phone.trim(),
      email: formData.value.email.trim(),
      businessName: formData.value.businessName.trim(),
      businessType: formData.value.businessType,
      city: formData.value.city.trim(),
      address: formData.value.address.trim(),
      packageInterest: formData.value.packageInterest,
      outletCount: formData.value.outletCount,
      employeeAppCount: formData.value.employeeAppCount,
      employeeCount: formData.value.employeeAppCount,
      currentRecordingMethod: formData.value.currentRecordingMethod,
      neededFeatures: [...formData.value.neededFeatures],
      otherNeededFeature: formData.value.otherNeededFeature.trim(),
      specialNeed: formData.value.specialNeed.trim(),
      willingToTry: formData.value.willingToTry,
      willingToTest: formData.value.willingToTest,
      knownFrom: formData.value.knownFrom,
      otherKnownFrom: formData.value.otherKnownFrom.trim(),
      consentAgreed: formData.value.consentAgreed,
      source: "Website",
    });

    if (!newLead || !newLead.id) {
      throw new Error("Gagal menyimpan data pendaftaran ke database.");
    }

    submittedData.value = newLead;
    isSuccess.value = true;
    emit("submitted", newLead.id);
  } catch (err: any) {
    console.error(err);
    submitError.value = `❌ ${err?.message || "Pendaftaran gagal dikirim. Silakan coba lagi."}`;
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <!-- Modal Box -->
      <div
        class="relative w-full max-w-xl max-h-[90dvh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
        @click.stop
      >
        <!-- Modal Header -->
        <div
          class="px-5 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0 shadow-sm"
        >
          <div>
            <div
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold mb-0.5"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-300" />
              <span>Form Pendaftaran Official</span>
            </div>
            <h3 class="text-base sm:text-lg font-extrabold tracking-tight">
              Pendaftaran Langganan IKI KASIR
            </h3>
          </div>

          <button
            @click="closeModal"
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div
          v-if="isSuccess"
          class="p-6 text-center space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
          data-lenis-prevent
        >
          <div
            class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"
          >
            <CheckCircle2 class="w-10 h-10" />
          </div>

          <div class="space-y-1">
            <h4 class="text-xl font-bold text-slate-800">
              ✅ Pendaftaran Berhasil Disimpan
            </h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Jawaban pendaftaran tersimpan di browser ini dan tampil di menu Calon Client pada perangkat yang sama.
            </p>
          </div>

          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div class="flex justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700">
              <span>ID Pendaftaran:</span>
              <span class="text-indigo-600 font-mono font-bold">{{ submittedData?.id }}</span>
            </div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Nama:</span><span class="font-medium text-slate-800">{{ submittedData?.name }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">WhatsApp:</span><span class="font-medium text-slate-800 font-mono">{{ submittedData?.phone }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Email:</span><span class="font-medium text-slate-800">{{ submittedData?.email }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Usaha:</span><span class="font-medium text-slate-800">{{ submittedData?.businessName }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Jenis usaha:</span><span class="font-medium text-slate-800">{{ submittedData?.businessType }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Kota / Kabupaten:</span><span class="font-medium text-slate-800">{{ submittedData?.city }}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Paket:</span><span class="font-bold text-indigo-700">{{ submittedData?.packageInterest }}</span></div>
          </div>

          <button
            @click="closeModal"
            class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

        <!-- FORM STATE -->
        <form
          v-else
          @submit.prevent="handleSubmit"
          class="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div
            ref="scrollAreaRef"
            class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-xs"
            data-lenis-prevent
          >
            <!-- Form Note Banner -->
            <div
              class="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 flex items-start gap-2 text-[11px]"
            >
              <Sparkles class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                Lengkapi data pendaftaran di bawah ini. Data akan tersimpan di browser ini dan tampil pada menu Calon Client di perangkat yang sama.
              </p>
            </div>

            <!-- Error Banner -->
            <div
              v-if="submitError"
              class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-bold"
            >
              <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
              <span>{{ submitError }}</span>
            </div>

            <!-- Data Diri -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-indigo-500" />
                Nama Lengkap <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.name"
                @input="clearError('name')"
                type="text"
                placeholder="Isi nama lengkap Anda"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.name ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.name" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone class="w-3.5 h-3.5 text-indigo-500" />
                Nomor WhatsApp Aktif <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.phone"
                @input="clearError('phone')"
                type="tel"
                placeholder="Contoh: 081234567890 atau +6281234567890"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.phone ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.phone" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.phone }}
              </p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail class="w-3.5 h-3.5 text-indigo-500" />
                Email <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.email"
                @input="clearError('email')"
                type="email"
                placeholder="Contoh: nama@domain.com"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.email ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.email" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.email }}
              </p>
            </div>

            <!-- Data Usaha -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Store class="w-3.5 h-3.5 text-indigo-500" />
                Nama Toko / Usaha <span class="text-rose-500">*</span>
              </label>
              <input v-model="formData.businessName" @input="clearError('businessName')" type="text" placeholder="Nama toko atau usaha Anda" class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium" :class="errors.businessName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'" />
              <p v-if="errors.businessName" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.businessName }}</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1"><Building2 class="w-3.5 h-3.5 text-indigo-500" />Jenis Usaha <span class="text-rose-500">*</span></label>
              <select v-model="formData.businessType" @change="clearError('businessType')" class="w-full px-3 py-2 rounded-xl border bg-white text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium" :class="errors.businessType ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'">
                <option value="" disabled>Pilih jenis usaha</option>
                <option v-for="option in businessTypeOptions" :key="option" :value="option">{{ option }}</option>
              </select>
              <p v-if="errors.businessType" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.businessType }}</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin class="w-3.5 h-3.5 text-indigo-500" />Kota / Kabupaten <span class="text-rose-500">*</span></label>
              <input v-model="formData.city" @input="clearError('city')" type="text" placeholder="Contoh: Bandung" class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium" :class="errors.city ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'" />
              <p v-if="errors.city" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.city }}</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1"><MapPin class="w-3.5 h-3.5 text-indigo-500" />Alamat Lengkap <span class="text-slate-400 font-normal">(opsional)</span></label>
              <textarea v-model="formData.address" rows="2" placeholder="Alamat lengkap usaha / toko" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Jumlah Outlet</label>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="option in outletOptions" :key="option" type="button" @click="formData.outletCount = option" class="py-2 px-2 rounded-xl font-bold border text-center transition-all cursor-pointer text-xs" :class="formData.outletCount === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Jumlah Karyawan yang Akan Memakai Aplikasi</label>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <button v-for="option in employeeOptions" :key="option" type="button" @click="formData.employeeAppCount = option" class="py-2 px-2 rounded-xl font-bold border text-center transition-all cursor-pointer text-xs" :class="formData.employeeAppCount === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
            </div>

            <!-- Kebutuhan -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Saat ini mencatat penjualan pakai apa?</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button v-for="option in recordingOptions" :key="option" type="button" @click="formData.currentRecordingMethod = option" class="p-2.5 rounded-xl font-semibold border text-left transition-all cursor-pointer text-xs" :class="formData.currentRecordingMethod === option ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Fitur yang Dibutuhkan</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label v-for="feature in featureOptions" :key="feature" class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer">
                  <input v-model="formData.neededFeatures" type="checkbox" :value="feature" @change="clearError('otherNeededFeature')" class="accent-indigo-600" />
                  <span>{{ feature }}</span>
                </label>
              </div>
              <div v-if="formData.neededFeatures.includes('Lainnya')" class="mt-2">
                <input v-model="formData.otherNeededFeature" @input="clearError('otherNeededFeature')" type="text" placeholder="Tuliskan fitur lainnya" class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium" :class="errors.otherNeededFeature ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'" />
                <p v-if="errors.otherNeededFeature" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.otherNeededFeature }}</p>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5"><Package class="inline w-3.5 h-3.5 text-indigo-500" /> Paket yang Diminati</label>
              <div v-if="activePackages.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="pkg in activePackages"
                  :key="pkg.id"
                  type="button"
                  :aria-pressed="formData.packageInterest === pkg.name"
                  @click="formData.packageInterest = pkg.name"
                  class="min-w-0 p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col"
                  :class="pkg.isConsultation ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200' : formData.packageInterest === pkg.name ? 'border-indigo-600 bg-indigo-50 shadow-xs' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'"
                >
                  <div class="flex items-start gap-2.5 min-w-0">
                    <span class="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" :class="pkg.isConsultation ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600'">
                      <Crown v-if="pkg.icon === 'Crown'" class="w-5 h-5" />
                      <Box v-else class="w-5 h-5" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block font-extrabold text-sm break-words" :class="pkg.isConsultation ? 'text-white' : 'text-slate-900'">{{ pkg.name }}</span>
                      <span class="block mt-0.5 text-[11px] leading-snug" :class="pkg.isConsultation ? 'text-blue-100' : 'text-slate-500'">{{ pkg.cardSub }}</span>
                    </span>
                    <span v-if="pkg.badge" class="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold" :class="pkg.isConsultation ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'">{{ pkg.badge }}</span>
                  </div>

                  <div v-if="!pkg.isConsultation" class="mt-3 flex items-baseline gap-1">
                    <span class="text-[10px] font-semibold" :class="formData.packageInterest === pkg.name ? 'text-indigo-700' : 'text-slate-600'">Rp</span>
                    <span class="text-xl font-black" :class="formData.packageInterest === pkg.name ? 'text-indigo-950' : 'text-slate-900'">{{ pkg.price.toLocaleString('id-ID') }}</span>
                    <span class="text-[10px]" :class="formData.packageInterest === pkg.name ? 'text-indigo-700' : 'text-slate-500'">{{ pkg.period }}</span>
                  </div>
                  <div v-else class="mt-3 min-h-[42px]">
                    <span class="block text-sm font-extrabold text-white">{{ pkg.priceTitle || 'Konsultasi Terlebih Dahulu' }}</span>
                    <span class="block mt-0.5 text-[10px] text-blue-100">{{ pkg.priceSubtext }}</span>
                  </div>

                  <ul class="mt-3 space-y-1.5 text-[10px] leading-snug flex-1" :class="pkg.isConsultation ? 'text-white' : 'text-slate-600'">
                    <li v-for="(feature, index) in pkg.features" :key="`${pkg.id}-${index}`" class="flex items-start gap-1.5">
                      <CheckCircle2 class="w-3 h-3 shrink-0 mt-0.5" :class="pkg.isConsultation ? 'text-blue-100' : 'text-blue-600'" />
                      <span>{{ feature }}</span>
                    </li>
                  </ul>

                  <span class="mt-3 w-full py-2 px-2 rounded-xl text-center text-[11px] font-bold" :class="pkg.isConsultation ? 'bg-white text-blue-600' : formData.packageInterest === pkg.name ? 'bg-indigo-600 text-white' : 'border border-blue-300 text-blue-600'">{{ pkg.btnText }}</span>
                </button>
              </div>
              <p v-else class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Belum ada paket aktif untuk dipilih.</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Kendala Terbesar atau Kebutuhan Khusus <span class="text-slate-400 font-normal">(opsional)</span></label>
              <textarea v-model="formData.specialNeed" rows="2" placeholder="Ceritakan kendala atau kebutuhan khusus" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"></textarea>
            </div>

            <!-- Kesediaan dan Persetujuan -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 flex items-center gap-1"><HelpCircle class="w-3.5 h-3.5 text-indigo-500" />Tertarik mencoba IKI KASIR saat resmi diluncurkan? <span class="text-rose-500">*</span></label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button v-for="option in willingToTryOptions" :key="option" type="button" @click="formData.willingToTry = option; clearError('willingToTry')" class="p-2.5 rounded-xl font-semibold border text-left transition-all cursor-pointer text-xs" :class="formData.willingToTry === option ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
              <p v-if="errors.willingToTry" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.willingToTry }}</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5 flex items-center gap-1"><HelpCircle class="w-3.5 h-3.5 text-indigo-500" />Bersedia menjadi pengguna awal (tester)? <span class="text-rose-500">*</span></label>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="option in willingToTestOptions" :key="option" type="button" @click="formData.willingToTest = option; clearError('willingToTest')" class="p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer text-xs" :class="formData.willingToTest === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
              <p v-if="errors.willingToTest" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.willingToTest }}</p>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Dari mana mengetahui IKI KASIR? <span class="text-slate-400 font-normal">(opsional)</span></label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button v-for="option in knownFromOptions" :key="option" type="button" @click="formData.knownFrom = option; clearError('otherKnownFrom')" class="p-2.5 rounded-xl font-semibold border text-left transition-all cursor-pointer text-xs" :class="formData.knownFrom === option ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'">{{ option }}</button>
              </div>
              <div v-if="formData.knownFrom === 'Lainnya'" class="mt-2">
                <input v-model="formData.otherKnownFrom" @input="clearError('otherKnownFrom')" type="text" placeholder="Tuliskan sumber lainnya" class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium" :class="errors.otherKnownFrom ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'" />
                <p v-if="errors.otherKnownFrom" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.otherKnownFrom }}</p>
              </div>
            </div>

            <div>
              <label class="flex items-start gap-2.5 p-3 rounded-xl border" :class="errors.consentAgreed ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'">
                <input v-model="formData.consentAgreed" @change="clearError('consentAgreed')" type="checkbox" class="mt-0.5 accent-indigo-600" />
                <span class="font-medium text-slate-700">Saya setuju data saya digunakan oleh IKI KASIR untuk menghubungi saya terkait uji coba dan peluncuran. <span class="text-rose-500">*</span></span>
              </label>
              <p v-if="errors.consentAgreed" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle class="w-3 h-3" /> {{ errors.consentAgreed }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0"
          >
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-colors cursor-pointer text-xs"
            >
              Batal
            </button>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? "Menyimpan..." : "Kirim Pendaftaran" }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

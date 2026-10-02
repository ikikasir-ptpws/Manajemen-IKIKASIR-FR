<script setup lang="ts">
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Store,
  User,
  Users,
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

const { addRegistration } = useAppData();

// Options arrays as requested by Google Form alignment
const employeeOptions = ["1", "2", "3", "4", "5", "Yang lain"];
const willingToTryOptions = [
  "Ya Saya tertarik",
  "Mungkin",
  "Masih Mencoba",
  "Tidak",
];
const willingToTestOptions = ["Ya", "Tidak"];

// Form Data following exact 9 questions in sequence
const formData = ref<{
  name: string; // 1. Nama Lengkap (Text)
  businessName: string; // 2. Nama Toko / Usaha (Text)
  address: string; // 3. Alamat Lengkap (Text)
  packageInterest: string; // 4. Paket Berlangganan (Basic / Pro)
  email: string; // 5. Alamat Email (Email)
  phone: string; // 6. No WhatsApp aktif (Phone)
  employeeCountChoice: string; // 7. Jumlah Karyawan (1, 2, 3, 4, 5, Yang lain)
  employeeCountCustom: string; // Input tambahan jika 'Yang lain'
  willingToTry: string; // 8. Bersedia mencoba (Ya Saya tertarik, Mungkin, Masih Mencoba, Tidak)
  willingToTest: string; // 9. Bersedia tester (Ya, Tidak)
}>({
  name: "",
  businessName: "",
  address: "",
  packageInterest: "Basic",
  email: "",
  phone: "",
  employeeCountChoice: "",
  employeeCountCustom: "",
  willingToTry: "",
  willingToTest: "",
});

// Validation Errors
const errors = ref<Record<string, string>>({});
const submitError = ref<string | null>(null);
const isSubmitting = ref(false);
const isSuccess = ref(false);
const submittedData = ref<any>(null);
const scrollAreaRef = ref<HTMLElement | null>(null);

// Map defaultPackage prop if passed
watch(
  () => props.defaultPackage,
  (newPkg) => {
    if (newPkg) {
      if (newPkg.toLowerCase().includes("pro")) {
        formData.value.packageInterest = "Pro";
      } else {
        formData.value.packageInterest = "Basic";
      }
    }
  },
  { immediate: true },
);

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
      let initialPkg = "Basic";
      if (props.defaultPackage && props.defaultPackage.toLowerCase().includes("pro")) {
        initialPkg = "Pro";
      }
      formData.value = {
        name: "",
        businessName: "",
        address: "",
        packageInterest: initialPkg,
        email: "",
        phone: "",
        employeeCountChoice: "",
        employeeCountCustom: "",
        willingToTry: "",
        willingToTest: "",
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

  // 1. Nama Lengkap (Wajib)
  if (!formData.value.name.trim()) {
    errs.name = "Nama lengkap wajib diisi.";
  }

  // 2. Nama Toko / Usaha (Wajib)
  if (!formData.value.businessName.trim()) {
    errs.businessName = "Nama toko / usaha wajib diisi.";
  }

  // 3. Alamat Lengkap (Wajib)
  if (!formData.value.address.trim()) {
    errs.address = "Alamat lengkap wajib diisi.";
  }

  // 4. Paket Berlangganan (Wajib)
  if (!formData.value.packageInterest) {
    errs.packageInterest = "Paket berlangganan wajib dipilih.";
  }

  // 5. Alamat Email (Validate format if filled)
  if (formData.value.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.email.trim())) {
      errs.email = "Format email tidak valid (contoh: nama@domain.com).";
    }
  }

  // 6. No WhatsApp aktif (Wajib)
  const cleanPhone = formData.value.phone.replace(/[^0-9]/g, "");
  if (!formData.value.phone.trim()) {
    errs.phone = "Nomor WhatsApp aktif wajib diisi.";
  } else if (cleanPhone.length < 9) {
    errs.phone = "Nomor WhatsApp tidak valid (minimal 9 digit angka).";
  }

  // 7. Jumlah Karyawan (Wajib)
  if (!formData.value.employeeCountChoice) {
    errs.employeeCountChoice = "Jumlah karyawan wajib dipilih.";
  } else if (
    formData.value.employeeCountChoice === "Yang lain" &&
    !formData.value.employeeCountCustom.trim()
  ) {
    errs.employeeCountCustom = "Silakan sebutkan jumlah karyawan.";
  }

  // 8. Bersedia mencoba (Wajib)
  if (!formData.value.willingToTry) {
    errs.willingToTry = "Pilihan kesediaan mencoba wajib dipilih.";
  }

  // 9. Bersedia tester (Wajib)
  if (!formData.value.willingToTest) {
    errs.willingToTest = "Pilihan kesediaan menjadi tester wajib dipilih.";
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
    const selectedPkg = formData.value.packageInterest === "Pro" ? "Pro" : "Basic";
    const employeeDisplay =
      formData.value.employeeCountChoice === "Yang lain"
        ? `Yang lain (${formData.value.employeeCountCustom.trim()})`
        : formData.value.employeeCountChoice;

    const newLead = addRegistration({
      name: formData.value.name.trim(),
      businessName: formData.value.businessName.trim(),
      address: formData.value.address.trim(),
      packageInterest: selectedPkg,
      email: formData.value.email.trim(),
      phone: formData.value.phone.trim(),
      employeeCountChoice: formData.value.employeeCountChoice,
      employeeCountCustom: formData.value.employeeCountCustom.trim(),
      employeeCount: employeeDisplay,
      willingToTry: formData.value.willingToTry,
      willingToTest: formData.value.willingToTest,
      source: "Website",
      notes: `Pendaftaran via Form Website. Karyawan: ${employeeDisplay}. Minat: ${formData.value.willingToTry}. Tester: ${formData.value.willingToTest}.`,
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
              Pendaftaran Website IKI KASIR
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
              Seluruh jawaban pendaftaran Anda telah tersimpan ke database dan diteruskan ke Super Admin di menu Calon Client.
            </p>
          </div>

          <!-- Submitted Summary -->
          <div
            class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2"
          >
            <div
              class="flex justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700"
            >
              <span>ID Pendaftaran:</span>
              <span class="text-indigo-600 font-mono font-bold">{{ submittedData?.id }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">1. Nama Lengkap:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.name }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">2. Nama Toko / Usaha:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.businessName }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">3. Alamat Lengkap:</span>
              <span class="font-medium text-slate-800 max-w-[200px] truncate text-right">{{ submittedData?.address }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">4. Paket Berlangganan:</span>
              <span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{{ submittedData?.packageInterest }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">5. Email:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.email || '-' }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">6. No WhatsApp:</span>
              <span class="font-medium text-slate-800 font-mono">{{ submittedData?.phone }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">7. Jumlah Karyawan:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.employeeCount }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">8. Minat Mencoba:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.willingToTry }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span class="text-slate-400">9. Kesediaan Tester:</span>
              <span class="font-medium text-slate-800">{{ submittedData?.willingToTest }}</span>
            </div>
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
                Lengkapi seluruh pertanyaan pendaftaran di bawah ini. Seluruh data tersimpan secara terpusat di Super Admin (Menu Calon Client).
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

            <!-- 1. Nama Lengkap -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User class="w-3.5 h-3.5 text-indigo-500" />
                1. Nama Lengkap <span class="text-rose-500">*</span>
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

            <!-- 2. Nama Toko / Usaha -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Store class="w-3.5 h-3.5 text-indigo-500" />
                2. Nama Toko / Usaha <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.businessName"
                @input="clearError('businessName')"
                type="text"
                placeholder="Isi nama bisnis / nama toko Anda"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.businessName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.businessName" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.businessName }}
              </p>
            </div>

            <!-- 3. Alamat Lengkap -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5 text-indigo-500" />
                3. Alamat Lengkap <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="formData.address"
                @input="clearError('address')"
                rows="2"
                placeholder="Isi alamat lengkap usaha / toko Anda"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.address ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              ></textarea>
              <p v-if="errors.address" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.address }}
              </p>
            </div>

            <!-- 4. Paket Berlangganan (Basic / Pro) -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Package class="w-3.5 h-3.5 text-indigo-500" />
                4. Paket Berlangganan <span class="text-rose-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-2.5 pt-0.5">
                <!-- Basic Card -->
                <label
                  class="p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between"
                  :class="formData.packageInterest === 'Basic' ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-800 text-sm">Basic</span>
                    <input
                      type="radio"
                      v-model="formData.packageInterest"
                      @change="clearError('packageInterest')"
                      value="Basic"
                      class="text-indigo-600"
                    />
                  </div>
                  <div class="mt-1">
                    <span class="text-xs font-bold text-indigo-600">Rp 250.000</span>
                    <span class="text-[10px] text-slate-500 block">/bulan</span>
                  </div>
                </label>

                <!-- Pro Card -->
                <label
                  class="p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between"
                  :class="formData.packageInterest === 'Pro' ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-800 text-sm">Pro</span>
                    <input
                      type="radio"
                      v-model="formData.packageInterest"
                      @change="clearError('packageInterest')"
                      value="Pro"
                      class="text-indigo-600"
                    />
                  </div>
                  <div class="mt-1">
                    <span class="text-xs font-bold text-purple-600">Rp 500.000</span>
                    <span class="text-[10px] text-slate-500 block">/bulan</span>
                  </div>
                </label>
              </div>
              <p v-if="errors.packageInterest" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.packageInterest }}
              </p>
            </div>

            <!-- 5. Alamat Email -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail class="w-3.5 h-3.5 text-indigo-500" />
                5. Alamat Email
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

            <!-- 6. No WhatsApp aktif -->
            <div>
              <label class="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone class="w-3.5 h-3.5 text-indigo-500" />
                6. No WhatsApp aktif <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.phone"
                @input="clearError('phone')"
                type="tel"
                placeholder="Contoh: 081234567890"
                class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="errors.phone ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
              />
              <p v-if="errors.phone" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.phone }}
              </p>
            </div>

            <!-- 7. Jumlah Karyawan yang Menggunakan Aplikasi IKI KASIR -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Users class="w-3.5 h-3.5 text-indigo-500" />
                7. Jumlah Karyawan yang Menggunakan Aplikasi IKI KASIR <span class="text-rose-500">*</span>
              </label>

              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button
                  v-for="opt in employeeOptions"
                  :key="opt"
                  type="button"
                  @click="
                    formData.employeeCountChoice = opt;
                    clearError('employeeCountChoice');
                    if (opt !== 'Yang lain') clearError('employeeCountCustom');
                  "
                  class="py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer text-xs"
                  :class="formData.employeeCountChoice === opt ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'"
                >
                  {{ opt }}
                </button>
              </div>

              <!-- Extra input if 'Yang lain' is selected -->
              <div v-if="formData.employeeCountChoice === 'Yang lain'" class="mt-2.5">
                <input
                  v-model="formData.employeeCountCustom"
                  @input="clearError('employeeCountCustom')"
                  type="text"
                  placeholder="Sebutkan jumlah karyawan (misal: 10 orang)"
                  class="w-full px-3 py-2 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition-all font-medium"
                  :class="errors.employeeCountCustom ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'"
                />
                <p v-if="errors.employeeCountCustom" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle class="w-3 h-3" /> {{ errors.employeeCountCustom }}
                </p>
              </div>

              <p v-if="errors.employeeCountChoice" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.employeeCountChoice }}
              </p>
            </div>

            <!-- 8. Apakah Anda bersedia mencoba IKI KASIR saat resmi diluncurkan? -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <HelpCircle class="w-3.5 h-3.5 text-indigo-500" />
                8. Apakah Anda bersedia mencoba IKI KASIR saat resmi diluncurkan? <span class="text-rose-500">*</span>
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="opt in willingToTryOptions"
                  :key="opt"
                  type="button"
                  @click="
                    formData.willingToTry = opt;
                    clearError('willingToTry');
                  "
                  class="p-2.5 rounded-xl font-semibold border text-left transition-all cursor-pointer text-xs flex items-center justify-between"
                  :class="formData.willingToTry === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'"
                >
                  <span>{{ opt }}</span>
                  <input type="radio" :checked="formData.willingToTry === opt" class="text-indigo-600" readonly />
                </button>
              </div>
              <p v-if="errors.willingToTry" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.willingToTry }}
              </p>
            </div>

            <!-- 9. Apakah Anda bersedia menjadi pengguna awal atau tester IKI KASIR? -->
            <div>
              <label class="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <HelpCircle class="w-3.5 h-3.5 text-indigo-500" />
                9. Apakah Anda bersedia menjadi pengguna awal atau tester IKI KASIR? <span class="text-rose-500">*</span>
              </label>

              <div class="grid grid-cols-2 gap-2.5">
                <button
                  v-for="opt in willingToTestOptions"
                  :key="opt"
                  type="button"
                  @click="
                    formData.willingToTest = opt;
                    clearError('willingToTest');
                  "
                  class="p-2.5 rounded-xl font-extrabold border text-center transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                  :class="formData.willingToTest === opt ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'"
                >
                  <span>{{ opt }}</span>
                </button>
              </div>
              <p v-if="errors.willingToTest" class="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle class="w-3 h-3" /> {{ errors.willingToTest }}
              </p>
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

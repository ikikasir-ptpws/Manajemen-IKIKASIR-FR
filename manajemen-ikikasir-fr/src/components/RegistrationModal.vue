<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  Sparkles,
  Store,
  Upload,
  User,
  UserPlus,
  X
} from "lucide-vue-next";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import {
  BUSINESS_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  usePendaftaranLangganan,
  type PaymentMethodOption,
  type RegistrationFormState
} from "../composables/usePendaftaranLangganan";
import { useAppData } from "../composables/useAppData";

const props = defineProps<{
  isOpen: boolean;
  defaultPackage?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submitted", leadId: string): void;
}>();

const { packages: systemPackages } = useAppData();
const {
  errors,
  submitError,
  isSubmitting,
  isReadingProof,
  isSuccess,
  submittedLead,
  proofFileName,
  proofPreviewUrl,
  clearError,
  clearProof,
  resetState,
  handleProofFile,
  submitRegistration
} = usePendaftaranLangganan();

const activePackages = computed(() => systemPackages.value.filter((pkg) => pkg.isActive));

const resolvePackage = (name?: string) => {
  const list = activePackages.value;
  return list.find((pkg) => pkg.name === name) || list[0] || null;
};

const createInitialForm = (): RegistrationFormState => {
  const pkg = resolvePackage(props.defaultPackage);
  return {
    name: "",
    phone: "",
    email: "",
    businessName: "",
    businessType: "",
    city: "",
    address: "",
    packageInterest: pkg?.name || "",
    packageId: pkg?.id || "",
    paymentAmount: pkg && !pkg.isConsultation ? String(pkg.price ?? "") : "",
    paymentMethod: "QRIS",
    outletCount: "",
    employeeAppCount: "",
    currentRecordingMethod: "",
    neededFeatures: [],
    otherNeededFeature: "",
    specialNeed: "",
    knownFrom: "",
    otherKnownFrom: "",
    consentAgreed: false,
    referralCode: ""
  };
};

const formData = ref<RegistrationFormState>(createInitialForm());
const scrollAreaRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const selectedPackage = computed(() =>
  activePackages.value.find((pkg) => pkg.name === formData.value.packageInterest)
);

// Nominal pembayaran mengikuti harga paket terpilih, tetap bisa disesuaikan manual.
watch(
  () => formData.value.packageInterest,
  (pkgName) => {
    const pkg = activePackages.value.find((item) => item.name === pkgName);
    formData.value.packageId = pkg?.id || "";
    if (pkg && !pkg.isConsultation) {
      formData.value.paymentAmount = String(pkg.price ?? "");
    }
  },
  { immediate: true }
);

const formatRupiah = (value: number) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

// Lock / unlock body scroll
const lockBodyScroll = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = scrollbarWidth + "px";
    document.documentElement.style.paddingRight = scrollbarWidth + "px";
  }
};
const unlockBodyScroll = () => {
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      lockBodyScroll();
      resetState();
      formData.value = createInitialForm();
    } else {
      unlockBodyScroll();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  unlockBodyScroll();
});

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  await handleProofFile(file);
};

const removeProof = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
  clearProof();
};

const handleSubmit = async () => {
  const created = await submitRegistration(
    formData.value,
    proofPreviewUrl.value,
    selectedPackage.value?.price
  );
  if (created?.id) {
    emit("submitted", created.id);
  } else {
    await nextTick();
    scrollAreaRef.value?.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const closeModal = () => {
  emit("close");
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <UserPlus class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Form Pendaftaran Langganan</h3>
            <p class="text-xs text-slate-500">Lengkapi data usaha dan bukti pembayaran</p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- SUKSES -->
      <div
        v-if="isSuccess"
        class="p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 min-h-0"
        data-lenis-prevent
      >
        <div
          class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"
        >
          <CheckCircle2 class="w-10 h-10" />
        </div>

        <div class="space-y-1 text-center">
          <h4 class="text-xl font-bold text-slate-800">Pendaftaran Berhasil Dikirim</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto">
            Data Anda sudah masuk ke daftar Calon Client. Tim Finance akan memverifikasi bukti pembayaran Anda.
          </p>
        </div>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
          <div class="flex justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700">
            <span>ID Pendaftaran:</span>
            <span class="text-indigo-600 font-mono font-bold">{{ submittedLead?.id }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">Nama:</span>
            <span class="font-medium text-slate-800">{{ submittedLead?.name }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">WhatsApp:</span>
            <span class="font-medium text-slate-800 font-mono">{{ submittedLead?.phone }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">Usaha:</span>
            <span class="font-medium text-slate-800">{{ submittedLead?.businessName }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">Paket:</span>
            <span class="font-bold text-indigo-700">{{ submittedLead?.packageInterest }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">Nominal Bayar:</span>
            <span class="font-bold text-slate-800">
              {{ formatRupiah(submittedLead?.paymentAmount || 0) }}
            </span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="text-slate-400">Status Bayar:</span>
            <span class="font-bold text-amber-700">Menunggu Verifikasi Finance</span>
          </div>
        </div>

        <button
          @click="closeModal"
          class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all cursor-pointer"
        >
          Selesai & Tutup
        </button>
      </div>

      <!-- FORM -->
      <form
        v-else
        @submit.prevent="handleSubmit"
        class="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div
          ref="scrollAreaRef"
          class="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4"
          data-lenis-prevent
        >
          <!-- Info -->
          <div
            class="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 flex items-start gap-2 text-[11px]"
          >
            <Sparkles class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Data pendaftaran langsung masuk ke daftar Calon Client, dan bukti pembayaran dapat dilihat pada halaman
              detail calon client.
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

          <!-- Nama Lengkap -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.name"
                @input="clearError('name')"
                type="text"
                placeholder="Contoh: Budi Santoso"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.name ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.name" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.name }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Email <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.email"
                @input="clearError('email')"
                type="email"
                placeholder="nama@domain.com"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.email ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.email" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.email }}
            </p>
          </div>

          <!-- Nomor WhatsApp -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Phone class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.phone"
                @input="clearError('phone')"
                type="tel"
                placeholder="Contoh: 081234567890 atau +6281234567890"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.phone ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.phone" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.phone }}
            </p>
          </div>

          <!-- Nama Toko / Usaha -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Toko / Usaha <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Store class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.businessName"
                @input="clearError('businessName')"
                type="text"
                placeholder="Nama toko atau usaha Anda"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.businessName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.businessName" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.businessName }}
            </p>
          </div>

          <!-- Jenis Usaha -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Usaha <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Store class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                v-model="formData.businessType"
                @change="clearError('businessType')"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all appearance-none cursor-pointer"
                :class="errors.businessType ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              >
                <option value="" disabled>Pilih jenis usaha</option>
                <option v-for="option in BUSINESS_TYPE_OPTIONS" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            <p v-if="errors.businessType" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.businessType }}
            </p>
          </div>

          <!-- Kota / Kabupaten -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kota / Kabupaten <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <MapPin class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.city"
                @input="clearError('city')"
                type="text"
                placeholder="Contoh: Bandung"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.city ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.city" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.city }}
            </p>
          </div>

          <!-- Alamat Lengkap -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Lengkap <span class="text-slate-400 font-normal">(opsional)</span>
            </label>
            <div class="relative">
              <MapPin class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                v-model="formData.address"
                rows="2"
                placeholder="Alamat lengkap usaha / toko"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
              ></textarea>
            </div>
          </div>

          <!-- Paket Langganan -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Paket Langganan
            </label>
            <div class="relative">
              <Package class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                v-model="formData.packageInterest"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium appearance-none cursor-pointer"
              >
                <option v-for="pkg in activePackages" :key="pkg.id" :value="pkg.name">
                  {{ pkg.name }} — {{ formatRupiah(pkg.price) }} {{ pkg.period }}
                </option>
              </select>
            </div>
          </div>

          <!-- Nominal Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Pembayaran <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Receipt class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="formData.paymentAmount"
                @input="clearError('paymentAmount')"
                type="text"
                inputmode="numeric"
                placeholder="Contoh: 250000"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all"
                :class="errors.paymentAmount ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              />
            </div>
            <p v-if="errors.paymentAmount" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.paymentAmount }}
            </p>
          </div>

          <!-- Metode Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Metode Pembayaran <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <CreditCard class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                v-model="formData.paymentMethod"
                @change="clearError('paymentMethod')"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium transition-all appearance-none cursor-pointer"
                :class="errors.paymentMethod ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'"
              >
                <option v-for="method in PAYMENT_METHOD_OPTIONS" :key="method" :value="method">
                  {{ method }}
                </option>
              </select>
            </div>
            <p v-if="errors.paymentMethod" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.paymentMethod }}
            </p>
          </div>

          <!-- Bukti Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bukti Pembayaran <span class="text-rose-500">*</span>
            </label>

            <div
              v-if="!proofPreviewUrl"
              class="p-4 rounded-2xl border-2 border-dashed text-center transition-colors"
              :class="errors.paymentProof ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                class="hidden"
                @change="onFileChange"
              />
              <Upload class="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Unggah foto atau screenshot bukti transfer (JPG, PNG, WEBP, maks 5MB).
              </p>
              <button
                type="button"
                @click="fileInputRef?.click()"
                class="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Pilih Berkas Bukti</span>
              </button>
            </div>

            <div v-else class="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <img
                :src="proofPreviewUrl"
                alt="Pratinjau bukti pembayaran"
                class="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="font-bold text-slate-800 truncate">{{ proofFileName }}</p>
                <p class="text-[11px] text-slate-500">Berkas siap dikirim ke tim Finance.</p>
              </div>
              <button
                type="button"
                @click="removeProof"
                class="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Hapus bukti pembayaran"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <p v-if="isReadingProof" class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Loader2 class="w-3 h-3 animate-spin" /> Membaca berkas bukti pembayaran...
            </p>
            <p v-if="errors.paymentProof" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.paymentProof }}
            </p>
          </div>

          <!-- Kode Referal -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kode Referal Teman / Pengundang <span class="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              v-model="formData.referralCode"
              type="text"
              placeholder="Contoh: IKIKASIR-8F3KD"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold uppercase tracking-wider placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              @input="formData.referralCode = (formData.referralCode || '').toUpperCase()"
            />
          </div>

          <!-- Persetujuan -->
          <div>
            <label
              class="flex items-start gap-2.5 p-3 rounded-xl border"
              :class="errors.consentAgreed ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50'"
            >
              <input
                v-model="formData.consentAgreed"
                @change="clearError('consentAgreed')"
                type="checkbox"
                class="mt-0.5 accent-indigo-600"
              />
              <span class="font-medium text-slate-700">
                Saya setuju data saya digunakan oleh IKI KASIR untuk menghubungi saya terkait pendaftaran langganan
                dan verifikasi pembayaran. <span class="text-rose-500">*</span>
              </span>
            </label>
            <p v-if="errors.consentAgreed" class="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle class="w-3.5 h-3.5" /> {{ errors.consentAgreed }}
            </p>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="isSubmitting || isReadingProof"
            class="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            <span>{{ isSubmitting ? "Mengirim..." : "Kirim Pendaftaran" }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

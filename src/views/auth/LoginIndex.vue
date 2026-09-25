<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import IkiKasirLogo from '../../components/IkiKasirLogo.vue'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  KeyRound,
  RefreshCw,
  Send,
  ArrowRight
} from 'lucide-vue-next'

const router = useRouter()

// Form States
const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Forgot Password Modal States
const showForgotPasswordModal = ref(false)
const resetEmail = ref('')
const isResetLoading = ref(false)
const resetStep = ref<'input' | 'sent'>('input')
const otpCode = ref(['', '', '', '', '', ''])
const otpTimer = ref(60)
let timerInterval: ReturnType<typeof setInterval> | null = null

// Gmail auto detector helper
const isGmailAccount = computed(() => {
  return email.value.trim().toLowerCase().endsWith('@gmail.com')
})

// Validation helper
const validateEmail = (val: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

// Handle Form Submit
const handleLogin = () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Alamat Gmail / Email wajib diisi.'
    return
  }

  if (!validateEmail(email.value)) {
    errorMessage.value = 'Format Gmail / Email tidak valid (contoh: user@gmail.com).'
    return
  }

  if (!password.value) {
    errorMessage.value = 'Kata sandi / Password wajib diisi.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Kata sandi minimal 6 karakter.'
    return
  }

  isLoading.value = true

  // Simulate authentication call
  setTimeout(() => {
    isLoading.value = false
    successMessage.value = `Login berhasil! Mengalihkan (${email.value})...`
    
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }, 1000)
}

// Open Forgot Password Modal
const openForgotPassword = () => {
  resetEmail.value = email.value || ''
  resetStep.value = 'input'
  errorMessage.value = ''
  showForgotPasswordModal.value = true
}

// Start OTP Countdown
const startOtpTimer = () => {
  otpTimer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (otpTimer.value > 0) {
      otpTimer.value--
    } else {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, 1000)
}

// Handle Reset Password Request
const handleSendResetEmail = () => {
  if (!resetEmail.value || !validateEmail(resetEmail.value)) {
    alert('Masukkan alamat Gmail / Email yang valid.')
    return
  }

  isResetLoading.value = true
  setTimeout(() => {
    isResetLoading.value = false
    resetStep.value = 'sent'
    startOtpTimer()
  }, 1200)
}

// Handle Verification Code Submit
const handleVerifyOtp = () => {
  const code = otpCode.value.join('')
  if (code.length < 6) {
    alert('Kode OTP 6-digit harus diisi lengkap.')
    return
  }
  isResetLoading.value = true
  setTimeout(() => {
    isResetLoading.value = false
    alert('Kata sandi baru telah dikirimkan ke Gmail Anda! Silakan masuk kembali.')
    showForgotPasswordModal.value = false
  }, 1000)
}

const handleOtpInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value
  if (val && index < 5) {
    const nextInput = document.getElementById(`otp-input-${index + 1}`)
    if (nextInput) (nextInput as HTMLInputElement).focus()
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none">
    
    <!-- Background Ambient Light Circles -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Back to Landing Page Button -->
    <router-link 
      to="/landing" 
      class="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-sm font-medium backdrop-blur-md shadow-lg group"
    >
      <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span>Kembali ke Beranda</span>
    </router-link>

    <!-- Card Container -->
    <div class="w-full max-w-4xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 my-auto">
      
      <!-- LEFT SIDEBAR: Branding (Visible on Desktop) -->
      <div class="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-indigo-950/90 border-r border-slate-700/50 relative overflow-hidden">
        <div class="relative z-10">
          <IkiKasirLogo size="lg" isDarkBg showTagline />
          
          <div class="mt-12 space-y-4">
            <h2 class="text-2xl font-extrabold text-white leading-tight">
              Akses Sistem Kasir & Keuangan Toko
            </h2>
            <p class="text-slate-300 text-xs leading-relaxed">
              Masuk dengan akun Gmail terdaftar Anda untuk mengelola kasir, produk, serta laporan penjualan secara realtime.
            </p>
          </div>
        </div>

        <div class="relative z-10 space-y-3 my-6">
          <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
            <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-semibold text-white">Login Aman & Terenkripsi</p>
              <p class="text-[11px] text-slate-400">Proteksi data transaksi toko</p>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-semibold text-white">Laporan Realtime</p>
              <p class="text-[11px] text-slate-400">Pantau omzet kapan saja</p>
            </div>
          </div>
        </div>

        <div class="relative z-10 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <span>IKI KASIR v2.4</span>
          <span class="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Server Aktif
          </span>
        </div>
      </div>

      <!-- RIGHT SIDE: GMAIL & KATA SANDI LOGIN FORM -->
      <div class="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-slate-800/50">
        
        <!-- Mobile Logo -->
        <div class="lg:hidden mb-6 flex justify-center">
          <IkiKasirLogo size="md" isDarkBg />
        </div>

        <div class="mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Masuk Akun
          </h1>
          <p class="text-slate-400 text-sm mt-1.5">
            Masukkan Alamat Gmail dan Kata Sandi Anda.
          </p>
        </div>

        <!-- Alert Notifications -->
        <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-rose-200">Gagal Masuk</p>
            <p class="text-xs text-rose-300/90 mt-0.5">{{ errorMessage }}</p>
          </div>
        </div>

        <div v-if="successMessage" class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-emerald-200">Berhasil</p>
            <p class="text-xs text-emerald-300/90 mt-0.5">{{ successMessage }}</p>
          </div>
        </div>

        <!-- FORM GMAIL & KATA SANDI -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          
          <!-- ALAMAT GMAIL -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-300">Alamat Gmail / Email</label>
              <span v-if="isGmailAccount" class="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 class="w-3 h-3" /> Akun Gmail Terverifikasi
              </span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail class="w-4.5 h-4.5" />
              </div>
              <input 
                v-model="email" 
                type="email" 
                placeholder="nama.toko@gmail.com" 
                class="w-full pl-10 pr-4 py-3.5 bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <!-- KATA SANDI -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-300">Kata Sandi / Password</label>
              <button 
                type="button" 
                @click="openForgotPassword" 
                class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock class="w-4.5 h-4.5" />
              </div>
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Masukkan kata sandi..." 
                class="w-full pl-10 pr-11 py-3.5 bg-slate-900/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-slate-100 text-sm placeholder-slate-500 transition-all outline-none"
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword" 
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Tampilkan / Sembunyikan Kata Sandi"
              >
                <EyeOff v-if="showPassword" class="w-4.5 h-4.5" />
                <Eye v-else class="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <!-- INGAT SAYA -->
          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input 
                v-model="rememberMe" 
                type="checkbox" 
                class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/30"
              />
              <span class="text-xs text-slate-300">Ingat Saya</span>
            </label>
          </div>

          <!-- TOMBOL SUBMIT -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full mt-3 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group"
          >
            <RefreshCw v-if="isLoading" class="w-5 h-5 animate-spin" />
            <template v-else>
              <span>Masuk ke Sistem</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </template>
          </button>
        </form>

        <div class="mt-8 pt-4 border-t border-slate-700/50 text-center">
          <p class="text-xs text-slate-400">
            Belum punya akun? 
            <router-link to="/landing#paket" class="text-indigo-400 font-semibold hover:underline">
              Daftar / Berlangganan
            </router-link>
          </p>
        </div>

      </div>
    </div>

    <!-- FORGOT PASSWORD / GMAIL RESET MODAL -->
    <div v-if="showForgotPasswordModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        
        <button 
          @click="showForgotPasswordModal = false" 
          class="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
        >
          ✕
        </button>

        <!-- Step 1: Input Gmail -->
        <div v-if="resetStep === 'input'">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <KeyRound class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-white">Reset Kata Sandi via Gmail</h3>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Masukkan alamat Gmail Anda. Kami akan mengirimkan kode verifikasi 6-digit untuk membuat kata sandi baru.
          </p>

          <div class="mt-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Gmail / Email</label>
              <input 
                v-model="resetEmail" 
                type="email" 
                placeholder="user@gmail.com" 
                class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <button 
              @click="handleSendResetEmail" 
              :disabled="isResetLoading"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw v-if="isResetLoading" class="w-4 h-4 animate-spin" />
              <template v-else>
                <Send class="w-4 h-4" />
                <span>Kirim Kode ke Gmail</span>
              </template>
            </button>
          </div>
        </div>

        <!-- Step 2: Verification OTP -->
        <div v-else-if="resetStep === 'sent'">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <Mail class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-white">Cek Gmail Anda</h3>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Kode verifikasi 6-digit telah dikirim ke <strong class="text-white">{{ resetEmail }}</strong>.
          </p>

          <div class="flex justify-between gap-2 my-6">
            <input 
              v-for="i in 6" 
              :key="i" 
              :id="`otp-input-${i-1}`"
              v-model="otpCode[i-1]"
              @input="handleOtpInput(i-1, $event)"
              maxlength="1" 
              type="text" 
              class="w-11 h-12 text-center text-lg font-bold bg-slate-900 border border-slate-700 rounded-xl text-indigo-400 focus:border-indigo-500 outline-none"
            />
          </div>

          <div class="space-y-3">
            <button 
              @click="handleVerifyOtp" 
              :disabled="isResetLoading"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw v-if="isResetLoading" class="w-4 h-4 animate-spin" />
              <span>Verifikasi & Reset Kata Sandi</span>
            </button>

            <div class="text-center">
              <button 
                v-if="otpTimer === 0" 
                @click="startOtpTimer" 
                class="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Kirim Ulang Kode Gmail
              </button>
              <span v-else class="text-xs text-slate-500">
                Kirim ulang kode dalam <strong class="text-slate-300">{{ otpTimer }}s</strong>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  X, 
  Store, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  MessageSquare,
  RefreshCw,
  Sparkles
} from 'lucide-vue-next'
import type { Customer } from '../types/dashboard'

const props = defineProps<{
  customer: Customer | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'renew', customerId: string, additionalDays: number): void
}>()

const isRenewing = ref(false)

const handleQuickRenew = () => {
  if (!props.customer) return
  isRenewing.value = true
  setTimeout(() => {
    isRenewing.value = false
    emit('renew', props.customer!.id, 30)
    emit('close')
  }, 400)
}

const sendWhatsApp = () => {
  if (!props.customer) return
  const phoneNum = props.customer.phone ? props.customer.phone.replace(/[^0-9]/g, '') : '628123456789'
  const text = encodeURIComponent(`Halo Kak ${props.customer.name}, ini dari tim IKI KASIR. Mengingatkan bahwa masa aktif sistem kasir Anda berakhir pada ${props.customer.expiredDate}. Segera perpanjang agar operasional toko tetap lancar! Terima kasih.`)
  window.open(`https://wa.me/${phoneNum.startsWith('0') ? '62' + phoneNum.slice(1) : phoneNum}?text=${text}`, '_blank')
}
</script>

<template>
  <div v-if="isOpen && customer" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
      @click="emit('close')"
    ></div>

    <!-- Modal Box -->
    <div class="relative bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <User class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900">{{ customer.name }}</h3>
            <p class="text-[11px] sm:text-xs text-slate-500">{{ customer.businessName || 'Pelanggan IKI KASIR' }}</p>
          </div>
        </div>
        <button 
          @click="emit('close')"
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <!-- Status Card -->
        <div 
          class="p-4 rounded-2xl flex items-center justify-between"
          :class="customer.status === 'expired' ? 'bg-rose-50 border border-rose-100 text-rose-800' : (customer.status === 'expiring' ? 'bg-amber-50 border border-amber-100 text-amber-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800')"
        >
          <div class="flex items-center gap-2.5">
            <AlertCircle v-if="customer.status === 'expired' || customer.status === 'expiring'" class="w-5 h-5" />
            <CheckCircle2 v-else class="w-5 h-5 text-emerald-600" />
            <div>
              <p class="text-xs font-bold uppercase tracking-wider">Status Masa Aktif</p>
              <p class="text-xs font-medium">
                <span v-if="customer.status === 'expired'">Telah Berakhir ({{ customer.daysExpired || 4 }} Hari Lalu)</span>
                <span v-else-if="customer.status === 'expiring'">Masa Aktif Sisa {{ customer.daysLeft || 5 }} Hari</span>
                <span v-else>Aktif Normal ({{ customer.daysLeft }} Hari Tersisa)</span>
              </p>
            </div>
          </div>
          <span 
            class="px-2.5 py-1 rounded-full text-xs font-bold"
            :class="customer.packageType === 'Premium' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'"
          >
            {{ customer.packageType }}
          </span>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span class="text-slate-400 block mb-1">Tanggal Berakhir:</span>
            <div class="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar class="w-3.5 h-3.5 text-indigo-500" />
              <span>{{ customer.expiredDate }}</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span class="text-slate-400 block mb-1">No. Kontak WhatsApp:</span>
            <div class="flex items-center gap-1.5 font-bold text-slate-700">
              <Phone class="w-3.5 h-3.5 text-emerald-500" />
              <span>{{ customer.phone || '0812-8921-3921' }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2 pt-2">
          <button 
            @click="handleQuickRenew"
            :disabled="isRenewing"
            class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRenewing }" />
            <span>{{ isRenewing ? 'Memperpanjang...' : 'Perpanjang Masa Aktif (+30 Hari)' }}</span>
          </button>

          <button 
            @click="sendWhatsApp"
            class="w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Kirim Pengingat WhatsApp ke Pelanggan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

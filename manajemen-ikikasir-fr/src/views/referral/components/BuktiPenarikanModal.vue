<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Printer,
  MessageCircle,
  Copy,
  Check,
  X,
  BadgeCheck,
  Building
} from 'lucide-vue-next'
import {
  buildWhatsappMessage,
  normalizeWaNumber
} from '../../../composables/useReferralWithdrawal'
import type { ReferralWithdrawalListItem } from '../../../types/referral'

const props = defineProps<{
  item: ReferralWithdrawalListItem
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'mark-wa-sent'): void
}>()

const copied = ref(false)

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (value?: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const whatsappMessage = computed(() =>
  buildWhatsappMessage({
    customerName: props.item.customerName,
    amount: props.item.amount,
    invoiceNo: props.item.invoiceNo,
    bankOrWallet: props.item.bankOrWallet,
    accountNumber: props.item.accountNumber,
    accountHolder: props.item.accountHolder,
    completedDate: props.item.completedDate
  })
)

const waNumber = computed(() => normalizeWaNumber(props.item.customerPhone))

const sendWhatsapp = () => {
  if (!waNumber.value) return
  window.open(`https://wa.me/${waNumber.value}?text=${encodeURIComponent(whatsappMessage.value)}`, '_blank')
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(whatsappMessage.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // ignore: pengguna menyalin manual dari pratinjau pesan
  }
}

const printProof = () => {
  window.print()
}
</script>

<template>
  <div class="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8">
    <!-- Area cetak -->
    <div class="print-invoice p-8 bg-white">
      <div class="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-900">IKIKASIR</h2>
          <p class="text-xs text-slate-500 mt-0.5">Bukti Pencairan Saldo Referral</p>
        </div>
        <div class="text-right">
          <p class="font-mono text-sm font-bold text-slate-900">{{ item.invoiceNo || '-' }}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">{{ formatDate(item.completedDate) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 py-6 text-xs">
        <div class="space-y-3">
          <div>
            <span class="text-slate-400 font-medium block">Nama Penerima</span>
            <p class="font-bold text-slate-900 text-sm">{{ item.accountHolder || '-' }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Pelanggan</span>
            <p class="font-bold text-slate-900">{{ item.customerName || '-' }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Toko</span>
            <p class="font-bold text-slate-900">{{ item.customerBusinessName || '-' }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Kode Referral</span>
            <p class="font-mono font-bold text-slate-900">{{ item.customerReferralCode || '-' }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <span class="text-slate-400 font-medium block">Nominal Pencairan</span>
            <p class="font-black text-emerald-700 text-base">{{ formatCurrency(item.amount) }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Transfer ke</span>
            <p class="font-bold text-slate-900">{{ item.bankOrWallet || '-' }}</p>
            <p class="font-mono text-slate-700">{{ item.accountNumber || '-' }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Referensi Transfer</span>
            <p class="font-mono font-bold text-slate-900">{{ item.transferReference || '-' }}</p>
          </div>
          <div>
            <span class="text-slate-400 font-medium block">Diproses Oleh</span>
            <p class="font-bold text-slate-900">{{ item.processedBy || '-' }}</p>
          </div>
        </div>
      </div>

      <div v-if="item.notes" class="py-3 border-t border-dashed border-slate-300 text-xs">
        <span class="text-slate-400 font-medium block mb-1">Catatan</span>
        <p class="text-slate-700 leading-relaxed">{{ item.notes }}</p>
      </div>

      <div class="pt-6 flex items-center justify-between border-t border-slate-200">
        <div>
          <p class="text-[11px] text-slate-400 font-medium">Status</p>
          <p class="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
            <BadgeCheck class="w-4 h-4" />
            LUNAS
          </p>
        </div>
        <div class="text-right">
          <p class="text-[11px] text-slate-400 font-medium">Tanda tangan</p>
          <div class="w-40 border-b border-slate-400 mt-6"></div>
          <p class="text-[11px] text-slate-500 mt-1">Tim Finance IKIKASIR</p>
        </div>
      </div>
    </div>

    <!-- Area aksi (tidak ikut dicetak) -->
    <div class="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
      <div>
        <p class="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-1">
          <MessageCircle class="w-3.5 h-3.5 text-emerald-600" />
          Pratinjau pesan WhatsApp
        </p>
        <pre class="p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">{{ whatsappMessage }}</pre>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <button
          @click="copyMessage"
          class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5 text-slate-500" />
          {{ copied ? 'Tersalin' : 'Salin Pesan' }}
        </button>

        <button
          @click="printProof"
          class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Printer class="w-3.5 h-3.5 text-slate-500" />
          Cetak Bukti
        </button>

        <button
          @click="sendWhatsapp"
          :disabled="!waNumber"
          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          title="Kirim bukti penarikan ke WhatsApp pelanggan"
        >
          <MessageCircle class="w-3.5 h-3.5" />
          Kirim ke WhatsApp
        </button>

        <button
          v-if="!item.waSentAt"
          @click="emit('mark-wa-sent')"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Building class="w-3.5 h-3.5" />
          Tandai Sudah Kirim WA
        </button>
        <span v-else class="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
          <BadgeCheck class="w-4 h-4" />
          Sudah dikirim via WA
        </span>

        <button
          @click="emit('close')"
          class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          title="Tutup"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden !important;
  }

  .print-invoice,
  .print-invoice * {
    visibility: visible !important;
  }

  .print-invoice {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 24px;
  }
}
</style>

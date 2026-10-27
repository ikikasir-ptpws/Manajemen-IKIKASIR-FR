<script setup lang="ts">
import { computed } from 'vue'
import { 
  X, 
  Printer, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  Check, 
  Mail,
  MapPin
} from 'lucide-vue-next'
import IkiKasirLogo from './IkiKasirLogo.vue'
import { useAppData } from '../composables/useAppData'

export interface InvoiceModalData {
  id: string
  customerId?: string
  customerName?: string
  customer?: string
  businessName?: string
  business?: string
  phone?: string
  email?: string
  address?: string
  package?: string
  packageType?: string
  amount?: number
  billingCycleMonths?: number
  date?: string
  dueDate?: string
  paymentMethod?: string
  method?: string
  status?: 'Paid' | 'Pending' | 'Failed' | string
  paymentProofUrl?: string
  rawInvoice?: any
}

const props = defineProps<{
  isOpen: boolean
  invoice: InvoiceModalData | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'markPaid', invoiceId: string): void
}>()

const { customers, leads } = useAppData()

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val || 0)
}

function numberToIndonesianWords(n: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  if (n < 0) return 'Minus ' + numberToIndonesianWords(Math.abs(n))
  if (n === 0) return 'Nol'
  if (n < 12) return bilangan[n]
  if (n < 20) return numberToIndonesianWords(n - 10) + ' Belas'
  if (n < 100) return numberToIndonesianWords(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + numberToIndonesianWords(n % 10) : '')
  if (n < 200) return 'Seratus' + (n - 100 !== 0 ? ' ' + numberToIndonesianWords(n - 100) : '')
  if (n < 1000) return numberToIndonesianWords(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + numberToIndonesianWords(n % 100) : '')
  if (n < 2000) return 'Seribu' + (n - 1000 !== 0 ? ' ' + numberToIndonesianWords(n - 1000) : '')
  if (n < 1000000) return numberToIndonesianWords(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + numberToIndonesianWords(n % 1000) : '')
  if (n < 1000000000) return numberToIndonesianWords(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + numberToIndonesianWords(n % 1000000) : '')
  if (n < 1000000000000) return numberToIndonesianWords(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + numberToIndonesianWords(n % 1000000000) : '')
  return String(n)
}

const normalized = computed(() => {
  if (!props.invoice) return null
  const i = props.invoice
  const id = i.id || ('INV-' + new Date().getFullYear() + '-' + String(Math.floor(100000 + Math.random() * 900000)))
  const customerName = i.customerName || i.customer || 'Pelanggan IKI KASIR'
  const businessName = i.businessName || i.business || 'Usaha / Toko'

  // Cari fallback data customer/lead jika nomor telepon, email, atau alamat belum terisi
  const matchedCust = customers.value.find(c => 
    (i.customerId && c.id === i.customerId) ||
    (c.name && customerName && c.name.toLowerCase() === customerName.toLowerCase()) ||
    (c.business && businessName && c.business.toLowerCase() === businessName.toLowerCase()) ||
    (i.phone && c.phone && c.phone.replace(/\D/g, '') === i.phone.replace(/\D/g, ''))
  )

  const matchedLead = leads.value?.find(l => 
    (l.name && customerName && l.name.toLowerCase() === customerName.toLowerCase()) ||
    (l.businessName && businessName && l.businessName.toLowerCase() === businessName.toLowerCase()) ||
    (i.phone && l.phone && l.phone.replace(/\D/g, '') === i.phone.replace(/\D/g, ''))
  )

  const phone = i.phone || i.rawInvoice?.phone || matchedCust?.phone || matchedLead?.phone || matchedLead?.whatsapp || ''
  const email = i.email || i.rawInvoice?.email || matchedCust?.email || matchedLead?.email || ''
  const address = i.address || i.rawInvoice?.address || matchedCust?.address || matchedLead?.address || 'Pasuruan, Jawa Timur'
  const packageName = i.package || i.packageType || 'Basic'
  const amount = Number(i.amount) || 250000
  const billingCycle = i.billingCycleMonths || 1
  const date = i.date || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const dueDate = i.dueDate || date
  const paymentMethod = i.paymentMethod || i.method || 'QRIS IKI KASIR'
  const rawStatus = (i.status || 'Paid').toLowerCase()
  const status = rawStatus === 'paid' ? 'Paid' : (rawStatus === 'pending' ? 'Pending' : 'Failed')

  return {
    id,
    customerName,
    businessName,
    phone,
    email,
    address,
    packageName,
    amount,
    billingCycle,
    date,
    dueDate,
    paymentMethod,
    status,
    terbilang: numberToIndonesianWords(amount) + ' Rupiah'
  }
})

const printInvoice = () => {
  window.print()
}

const sendToWhatsApp = () => {
  if (!normalized.value) return
  const inv = normalized.value
  let cleanPhone = (inv.phone || '').replace(/[^0-9]/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  } else if (!cleanPhone.startsWith('62') && cleanPhone.length > 0) {
    cleanPhone = '62' + cleanPhone
  }

  const formattedAmount = formatCurrency(inv.amount)
  const statusBadge = inv.status === 'Paid' ? '✅ LUNAS / TERBAYAR' : (inv.status === 'Pending' ? '⏳ MENUNGGU PEMBAYARAN' : '❌ GAGAL / EXPIRED')

  const message = `*FAKTUR TAGIHAN RESMI (INVOICE)*
*PT PUTRA WISANGGENI SATU - IKI KASIR*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Halo Kak *${inv.customerName}* (*${inv.businessName}*),
Terima kasih telah berlangganan sistem aplikasi kasir digital *IKI KASIR*.

Berikut adalah rincian invoice resmi Anda:
🧾 *No. Faktur:* ${inv.id}
📅 *Tanggal:* ${inv.date}
🏢 *Toko / Usaha:* ${inv.businessName}
📦 *Paket Layanan:* Paket ${inv.packageName} (Lisensi Cloud POS)
💳 *Metode Bayar:* ${inv.paymentMethod}
💰 *Total Tagihan:* *${formattedAmount}*
📌 *Status Pembayaran:* *${statusBadge}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Fasilitas Layanan yang Diterima:*
• Hak akses sistem kasir digital & multi-user (Kasir & Owner)
• Penyimpanan basis data cloud realtime terenkripsi
• Rekap laporan penjualan harian & bulanan
• Pendampingan & bantuan teknis 24/7

Dokumen invoice ini sah dan terdaftar pada sistem keuangan pusat PT PUTRA WISANGGENI SATU. Untuk mengunduh / mencetak salinan PDF, silakan gunakan fitur cetak invoice.

Salam sukses untuk bisnis Anda,
*Tim Finance & Billing IKI KASIR*
🌐 https://ikikasir.com`

  if (cleanPhone) {
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }
}

const handleMarkPaid = () => {
  if (normalized.value) {
    emit('markPaid', normalized.value.id)
  }
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen && normalized" 
      class="invoice-modal-overlay fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      @click.self="$emit('close')"
    >
      <div class="invoice-modal-card relative bg-slate-100 dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] flex flex-col overflow-hidden">
        
        <!-- Top Action Bar (Screen Only - Hidden in Print) -->
        <div class="print:hidden px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileText class="w-5 h-5" />
          </div>
          <div class="truncate">
            <h3 class="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>Faktur Tagihan / Invoice Resmi</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                #{{ normalized.id }}
              </span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Klien: <strong class="text-slate-700 dark:text-slate-300">{{ normalized.customerName }}</strong> ({{ normalized.businessName }})
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Kirim WhatsApp Button -->
          <button 
            @click="sendToWhatsApp"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Kirim Ringkasan Invoice ke WhatsApp Klien"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Kirim ke WA</span>
          </button>

          <!-- Cetak / Unduh PDF Button -->
          <button 
            @click="printInvoice"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Cetak Faktur atau Simpan sebagai PDF"
          >
            <Printer class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Cetak / PDF</span>
          </button>

          <!-- Close Modal -->
          <button 
            @click="$emit('close')"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Printable Invoice Sheet Area -->
      <div class="invoice-sheet-container flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        
        <!-- Document Container (A4 Proportional Paper Appearance) -->
        <div 
          id="printable-invoice" 
          class="bg-white text-slate-800 p-6 sm:p-10 md:p-12 shadow-sm rounded-2xl border border-slate-200/90 max-w-3xl mx-auto space-y-6 relative select-text"
        >
          
          <!-- KOP SURAT PERUSAHAAN (HEADER) -->
          <div class="border-b-2 border-slate-900 pb-5">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <!-- Left: Company Identity -->
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <IkiKasirLogo variant="horizontal" size="md" />
                </div>
                <div>
                  <h2 class="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                    PT PUTRA WISANGGENI SATU
                  </h2>
                  <p class="text-[11px] font-semibold text-slate-600">
                    Divisi Billing & Penyelenggara Sistem Kasir Digital IKI KASIR
                  </p>
                  <p class="text-[10px] text-slate-500 leading-relaxed max-w-md pt-0.5">
                    Jl. Wonosari, Kec. Gondang Wetan, Kab. Pasuruan, Jawa Timur 67174<br/>
                    WhatsApp: <strong class="text-slate-700">0812-8872-9102</strong> • Email: <strong class="text-slate-700">billing@ikikasir.com</strong> • Web: www.ikikasir.com
                  </p>
                </div>
              </div>

              <!-- Right: Invoice Title, Badge & Meta Info (Tanpa Tabrakan Stempel) -->
              <div class="sm:text-right flex flex-col sm:items-end space-y-2">
                <div class="flex items-center sm:justify-end gap-2 flex-wrap">
                  <!-- Stempel LUNAS / PENDING yang Rapi dan Tidak Menutupi Teks -->
                  <div 
                    v-if="normalized.status === 'Paid'"
                    class="border-2 border-emerald-600 text-emerald-700 rounded-xl px-2.5 py-1 text-center bg-emerald-50 shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 stroke-[3] text-emerald-600 shrink-0" />
                    <span class="font-black text-[11px] tracking-wider uppercase">LUNAS</span>
                  </div>
                  <div 
                    v-else-if="normalized.status === 'Pending'"
                    class="border-2 border-amber-500 text-amber-700 rounded-xl px-2.5 py-1 text-center bg-amber-50 shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <span class="font-black text-[10px] tracking-wider uppercase">MENUNGGU PEMBAYARAN</span>
                  </div>

                  <div class="inline-block px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-xs sm:text-sm tracking-wider uppercase">
                    FAKTUR INVOICE RESMI
                  </div>
                </div>

                <div class="space-y-1 text-xs pt-1">
                  <div class="flex items-center sm:justify-end gap-2">
                    <span class="text-slate-500 text-[11px]">No. Invoice:</span>
                    <span class="font-mono font-black text-slate-900 text-xs sm:text-sm">#{{ normalized.id }}</span>
                  </div>
                  <div class="flex items-center sm:justify-end gap-2">
                    <span class="text-slate-500 text-[11px]">Tanggal Terbit:</span>
                    <span class="font-bold text-slate-800 text-[11px]">{{ normalized.date }}</span>
                  </div>
                  <div class="flex items-center sm:justify-end gap-2">
                    <span class="text-slate-500 text-[11px]">Metode:</span>
                    <span class="font-bold text-slate-800 text-[11px]">{{ normalized.paymentMethod }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TWO-COLUMN BILLING INFORMATION (DITERBITKAN OLEH & DITAGIHKAN KEPADA) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <!-- Left: Diterbitkan Oleh (Tanpa NPWP & Tanpa Status PKP, Lengkap dengan WhatsApp & Email) -->
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Diterbitkan Oleh (Billed From)
              </span>
              <div class="font-extrabold text-slate-900 text-xs sm:text-sm">
                PT PUTRA WISANGGENI SATU
              </div>
              <p class="text-[11px] text-slate-600">
                Divisi Billing & Operasional Keuangan Cloud IKI KASIR
              </p>
              <div class="pt-1.5 text-[11px] text-slate-700 space-y-1">
                <div class="flex items-center gap-1.5">
                  <MessageSquare class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span class="text-slate-500">WhatsApp:</span>
                  <span class="font-bold text-slate-900">0812-8872-9102</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Mail class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span class="text-slate-500">Email:</span>
                  <span class="font-bold text-slate-900">billing@ikikasir.com</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                  <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Pasuruan, Jawa Timur, Indonesia</span>
                </div>
              </div>
            </div>

            <!-- Right: Ditagihkan Kepada (WhatsApp & Email Klien Selalu Tampil Jelas) -->
            <div class="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-1.5">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 block">
                Ditagihkan Kepada (Billed To)
              </span>
              <div class="font-extrabold text-slate-900 text-xs sm:text-sm">
                {{ normalized.customerName }}
              </div>
              <div class="font-bold text-indigo-700 text-xs flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{{ normalized.businessName }}</span>
              </div>
              <div class="pt-1.5 text-[11px] text-slate-700 space-y-1">
                <div class="flex items-center gap-1.5">
                  <MessageSquare class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span class="text-slate-500">WhatsApp:</span>
                  <span class="font-bold text-slate-900">{{ normalized.phone || '-' }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Mail class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span class="text-slate-500">Email:</span>
                  <span class="font-bold text-slate-900">{{ normalized.email || '-' }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                  <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span class="text-slate-700">{{ normalized.address || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ITEMIZED SERVICES TABLE (Hanya Baris 1, Baris 2 Dihapus) -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-2.5 px-3 w-10 text-center">No</th>
                  <th class="py-2.5 px-4">Deskripsi Layanan & Fasilitas</th>
                  <th class="py-2.5 px-3 text-center">Durasi</th>
                  <th class="py-2.5 px-3 text-center">Qty</th>
                  <th class="py-2.5 px-4 text-right">Harga Satuan</th>
                  <th class="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <!-- Baris Layanan Paket Langganan POS -->
                <tr class="align-top">
                  <td class="py-3 px-3 text-center font-bold text-slate-500">1</td>
                  <td class="py-3 px-4">
                    <div class="font-extrabold text-slate-900 text-xs">
                      Langganan Aplikasi Kasir IKI KASIR — Paket {{ normalized.packageName }}
                    </div>
                    <ul class="text-[11px] text-slate-500 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Lisensi penggunaan sistem kasir multi-user (Kasir & Owner)</li>
                      <li>Penyimpanan cloud database terenkripsi & sinkronisasi realtime</li>
                      <li>Manajemen inventori produk & laporan penjualan komprehensif</li>
                      <li>Akses aplikasi mobile Android & portal web kasir</li>
                    </ul>
                  </td>
                  <td class="py-3 px-3 text-center font-medium text-slate-700 text-[11px]">
                    {{ normalized.billingCycle }} Bulan
                  </td>
                  <td class="py-3 px-3 text-center font-bold text-slate-800">1</td>
                  <td class="py-3 px-4 text-right font-medium text-slate-700 font-mono text-[11px]">
                    {{ formatCurrency(normalized.amount) }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    {{ formatCurrency(normalized.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- TABLE TOTALS CALCULATION (Bersih & Sederhana) -->
            <div class="border-t border-slate-200 bg-slate-50/80 p-4">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                <!-- Left: Terbilang Box -->
                <div class="sm:col-span-7 space-y-1">
                  <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Jumlah Terbilang:
                  </div>
                  <div class="text-xs font-bold italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                    "{{ normalized.terbilang }}"
                  </div>
                </div>

                <!-- Right: Calculation Breakdown -->
                <div class="sm:col-span-5 space-y-1.5 text-xs text-right">
                  <div class="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span class="font-mono font-semibold">{{ formatCurrency(normalized.amount) }}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>PPN (11% Termasuk):</span>
                    <span class="font-mono font-semibold">Rp 0</span>
                  </div>
                  <div class="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                    <span class="font-black text-slate-900 uppercase text-xs">Total Tagihan:</span>
                    <span class="font-black text-indigo-700 text-base sm:text-lg font-mono">
                      {{ formatCurrency(normalized.amount) }}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- RINCIAN PEMBAYARAN (Tanpa Bukti Transfer, Tanpa Validasi Keaslian QR) -->
          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                <CreditCard class="w-4 h-4 text-indigo-600" />
                <span>Rincian Pembayaran</span>
              </div>
              <span 
                class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                :class="normalized.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'"
              >
                {{ normalized.status === 'Paid' ? '✅ LUNAS (Terverifikasi)' : '⏳ MENUNGGU PEMBAYARAN' }}
              </span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
              <div class="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span class="text-[10px] text-slate-500 block">Metode Pembayaran</span>
                <span class="font-bold text-slate-900 text-xs">{{ normalized.paymentMethod }}</span>
              </div>
              
              <div class="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span class="text-[10px] text-slate-500 block">Status Pembayaran</span>
                <span class="font-bold text-xs" :class="normalized.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'">
                  {{ normalized.status === 'Paid' ? 'Lunas / Terverifikasi Sistem' : 'Menunggu Konfirmasi' }}
                </span>
              </div>

              <div class="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span class="text-[10px] text-slate-500 block">Tanggal Transaksi</span>
                <span class="font-bold text-slate-900 text-xs">{{ normalized.date }}</span>
              </div>
            </div>
          </div>

          <!-- TERMS & NOTES -->
          <div class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 space-y-1">
            <span class="font-extrabold uppercase text-slate-700 tracking-wider block">Catatan & Ketentuan Faktur:</span>
            <p>1. Faktur ini merupakan bukti pembayaran sah yang dihasilkan otomatis oleh komputer dan diakui secara digital berdasarkan UU ITE.</p>
            <p>2. Pembayaran langganan menjamin hak penggunaan sistem kasir digital dan pemeliharaan server cloud selama masa aktif berjalan.</p>
            <p>3. Layanan pelanggan dan bantuan teknis darurat dapat diakses 24/7 melalui nomor resmi IKI KASIR di 0812-8872-9102.</p>
          </div>

          <!-- SIGNATURES & OFFICIAL SEAL SECTION -->
          <div class="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs text-center">
            <!-- Client / Buyer -->
            <div class="space-y-10 flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Penerima Layanan / Klien</span>
                <p class="font-bold text-slate-900 mt-0.5">{{ normalized.businessName }}</p>
              </div>

              <div>
                <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                  <ShieldCheck class="w-3.5 h-3.5 text-slate-500" />
                  <span>TERDAFTAR RESMI</span>
                </div>
                <p class="font-bold text-slate-800 mt-1">{{ normalized.customerName }}</p>
                <p class="text-[10px] text-slate-400">Penanggung Jawab Usaha</p>
              </div>
            </div>

            <!-- Provider / Company -->
            <div class="space-y-10 flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Penyedia Sistem (Penerbit)</span>
                <p class="font-bold text-slate-900 mt-0.5">PT PUTRA WISANGGENI SATU</p>
              </div>

              <div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shadow-2xs">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                  <span>PENGESAHAN ELEKTRONIK</span>
                </div>
                <p class="font-bold text-slate-900 mt-1">Finance & Billing Department</p>
                <p class="text-[10px] text-slate-400">PT PUTRA WISANGGENI SATU</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Footer Buttons (Screen Only - Hidden in Print) -->
      <div class="print:hidden px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-800 shrink-0">
        <p class="text-[11px] text-slate-400 hidden sm:block">
          Tekan tombol <strong class="text-slate-600 dark:text-slate-300">Cetak / PDF</strong> untuk mencetak langsung ke printer atau menyimpan sebagai file PDF A4.
        </p>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <!-- Mark Paid if pending -->
          <button 
            v-if="normalized.status === 'Pending'"
            @click="handleMarkPaid"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Tandai Lunas</span>
          </button>

          <button 
            @click="sendToWhatsApp"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 sm:hidden"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </button>

          <button 
            @click="printInvoice"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 sm:hidden"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>

          <button 
            @click="$emit('close')"
            class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

    </div>
  </div>
</Teleport>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  /* Sembunyikan seluruh UI luar (SPA root #app dan elemen luar lainnya) */
  #app,
  .print\:hidden {
    display: none !important;
  }

  body > *:not(.invoice-modal-overlay) {
    display: none !important;
  }

  /* Reset html & body agar render halaman A4 bebas clipping */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
    background: #ffffff !important;
    color: #0f172a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hilangkan efek modal overlay (latar belakang gelap, fixed, blur) */
  .invoice-modal-overlay {
    position: static !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    backdrop-filter: none !important;
    overflow: visible !important;
    inset: auto !important;
    z-index: auto !important;
  }

  /* Hilangkan batasan max-height dan overflow-hidden pada kartu modal */
  .invoice-modal-card {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }

  .invoice-sheet-container {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
  }

  /* Tampilkan lembar invoice secara bersih untuk A4 */
  #printable-invoice {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 4mm 8mm !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    color: #0f172a !important;
  }
}
</style>

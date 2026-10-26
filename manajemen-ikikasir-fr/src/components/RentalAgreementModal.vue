<script setup lang="ts">
import { ref } from 'vue'
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Building2 } from 'lucide-vue-next'
import IkiKasirLogo from './IkiKasirLogo.vue'

const props = defineProps<{
  isOpen: boolean
  clientName: string
  businessName: string
  packageName: string
  phone: string
  email: string
  address?: string
  agreementNumber: string
  startDate?: string
  expiredDate?: string
  monthlyFee?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const printAgreement = () => {
  window.print()
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
    <div class="relative bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden">
      
      <!-- Top Action Bar (Screen Only) -->
      <div class="print:hidden px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-800 dark:text-white">Surat Perjanjian Kerja Sama Sewa Aplikasi</h3>
            <p class="text-[11px] text-slate-500 font-mono">No: {{ agreementNumber }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="printAgreement"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
          >
            <Printer class="w-4 h-4" />
            <span>Cetak / PDF Dokumen</span>
          </button>

          <button 
            @click="$emit('close')"
            class="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Printable Document Content -->
      <div id="printable-contract" class="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed space-y-6 bg-white dark:bg-slate-800 select-text">
        
        <!-- Document Kop Surat -->
        <div class="border-b-2 border-slate-800 dark:border-slate-300 pb-5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <IkiKasirLogo size="md" />
            <div>
              <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">PT PUTRA WISANGGENI SATU</h2>
              <p class="text-[11px] text-slate-500">Divisi Penyedia Sistem Kasir Digital & Cloud IKI KASIR</p>
              <p class="text-[10px] text-slate-400">Jl. Wonosari Kec,Gondang Wetan Kab, Pasuruan, Jawa Timur • Telp: (021) 8872-9102</p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] uppercase tracking-wider">Salinan Resmi</span>
            <p class="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">Ref: {{ agreementNumber }}</p>
          </div>
        </div>

        <!-- Judul Perjanjian -->
        <div class="text-center py-2">
          <h1 class="text-base sm:text-lg font-black tracking-tight underline uppercase text-slate-900 dark:text-white">SURAT PERJANJIAN KERJA SAMA SEWA SISTEM APLIKASI KASIR</h1>
          <p class="text-xs text-slate-500 font-mono mt-0.5">NOMOR: {{ agreementNumber }}</p>
        </div>

        <p>Pada hari ini, telah dibuat dan disepakati perjanjian kerja sama sewa lisensi penggunaan aplikasi kasir (Point of Sale) antara pihak-pihak di bawah ini:</p>

        <!-- Pihak Pertama -->
        <div class="space-y-1.5 pl-3 border-l-2 border-indigo-500">
          <div class="font-bold text-slate-900 dark:text-white">I. PIHAK PERTAMA (Penyedia Layanan):</div>
          <div class="grid grid-cols-4 gap-2 text-xs">
            <span class="text-slate-500">Nama Perusahaan</span>
            <span class="col-span-3 font-semibold">: PT PUNDI MAS BERKAH (IKI KASIR)</span>
            <span class="text-slate-500">Jabatan</span>
            <span class="col-span-3">: Manajemen Operasional & Penyelenggara Sistem</span>
            <span class="text-slate-500">Alamat Layanan</span>
            <span class="col-span-3">: Portal Cloud IKI KASIR (ikikasir.com)</span>
          </div>
        </div>

        <!-- Pihak Kedua -->
        <div class="space-y-1.5 pl-3 border-l-2 border-emerald-500">
          <div class="font-bold text-slate-900 dark:text-white">II. PIHAK KEDUA (Penyewa / Pengguna Layanan):</div>
          <div class="grid grid-cols-4 gap-2 text-xs">
            <span class="text-slate-500">Nama Klien / Pemilik</span>
            <span class="col-span-3 font-semibold">: {{ clientName }}</span>
            <span class="text-slate-500">Nama Usaha / Toko</span>
            <span class="col-span-3 font-semibold">: {{ businessName }}</span>
            <span class="text-slate-500">No. WhatsApp / HP</span>
            <span class="col-span-3">: {{ phone }}</span>
            <span class="text-slate-500">Alamat Email</span>
            <span class="col-span-3">: {{ email }}</span>
            <span class="text-slate-500">Alamat Toko</span>
            <span class="col-span-3">: {{ address || 'Sesuai data terdaftar' }}</span>
          </div>
        </div>

        <!-- Pasal-Pasal -->
        <div class="space-y-4 pt-2">
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white">PASAL 1: OBJEK PERJANJIAN SEWA</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              PIHAK PERTAMA menyewakan hak penggunaan lisensi Sistem Aplikasi Kasir IKI KASIR (Paket: <strong>{{ packageName }}</strong>) kepada PIHAK KEDUA, meliputi hak akses aplikasi, basis data transaksi, modul laporan penjualan, dan pemeliharaan server cloud.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white">PASAL 2: JANGKA WAKTU SEWA & AKTIVASI</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              1. Layanan aplikasi diaktifkan secara resmi terhitung sejak tanggal diterbitkannya surat ini.<br/>
              2. Masa sewa aktif berlaku sampai dengan: <strong>{{ expiredDate || 'Sesuai masa langganan aktif' }}</strong>.<br/>
              3. PIHAK KEDUA berhak melakukan perpanjangan masa sewa pada setiap periode berakhir melalui sistem resmi IKI KASIR.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white">PASAL 3: BIAYA SEWA & PEMBAYARAN</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Biaya sewa sistem kasir telah disepakati dan diverifikasi oleh Bagian Keuangan (Finance) PIHAK PERTAMA sesuai ketentuan paket yang dipilih, dan pembayaran dinyatakan sah serta tercatat dalam invoice sistem.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white">PASAL 4: HAK & KEWAJIBAN PIHAK PERTAMA</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              1. Menyiapkan kredensial akses (username, password), aplikasi, dan buku panduan resmi kepada PIHAK KEDUA.<br/>
              2. Memberikan bantuan teknis, perbaikan gangguan server, dan pembaruan sistem secara berkala.<br/>
              3. Menjaga kerahasiaan dan keamanan data transaksi usaha PIHAK KEDUA dengan enkripsi standar industri.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white">PASAL 5: HAK & KEWAJIBAN PIHAK KEDUA</h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
              1. Menggunakan aplikasi sesuai peruntukan usaha yang sah dan tidak melanggar ketentuan perundang-undangan.<br/>
              2. Menjaga kerahasiaan kata sandi (password) akun kasir dan data operasional internal toko.<br/>
              3. Berhak mendapatkan pendampingan dari tim teknisi IKI KASIR jika terjadi kendala operasional.
            </p>
          </div>
        </div>

        <!-- Tanda Tangan -->
        <div class="pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-8 text-center text-xs">
          <div class="space-y-14">
            <p class="text-slate-500">PIHAK PERTAMA<br/><span class="font-bold text-slate-900 dark:text-white">PT PUNDI MAS BERKAH (IKI KASIR)</span></p>
            <div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                <CheckCircle2 class="w-3.5 h-3.5 text-indigo-600" />
                <span>TERVERIFIKASI SISTEM DIGITAL</span>
              </div>
              <p class="font-bold text-slate-800 dark:text-white mt-1">Tim Manajemen & Teknisi IKI KASIR</p>
            </div>
          </div>

          <div class="space-y-14">
            <p class="text-slate-500">PIHAK KEDUA (Penyewa)<br/><span class="font-bold text-slate-900 dark:text-white">{{ businessName }}</span></p>
            <div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
                <span>KONFIRMASI PENYEWAAN</span>
              </div>
              <p class="font-bold text-slate-800 dark:text-white mt-1">{{ clientName }}</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="print:hidden px-6 py-3.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <p class="text-[11px] text-slate-400">Dokumen perjanjian ini sah dan tercatat dalam sistem terpusat IKI KASIR.</p>
        <button 
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
        >
          Tutup Pratinjau
        </button>
      </div>

    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #printable-contract, #printable-contract * {
    visibility: visible;
  }
  #printable-contract {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20mm;
    background: white !important;
    color: black !important;
  }
}
</style>

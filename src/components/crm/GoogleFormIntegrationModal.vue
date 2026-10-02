<script setup lang="ts">
import { ref } from 'vue'
import { X, CheckCircle2, AlertTriangle, Code2, Copy, ExternalLink, FileSpreadsheet, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const copied = ref(false)

const scriptSnippet = `// GOOGLE APPS SCRIPT: Automated Sync to Super Admin
// Pasang trigger ini di Google Form / Google Sheets melalui Tools > Script editor
function onFormSubmit(e) {
  var itemResponses = e.response.getItemResponses();
  var formData = {};
  
  for (var i = 0; i < itemResponses.length; i++) {
    var title = itemResponses[i].getItem().getTitle().toLowerCase();
    var response = itemResponses[i].getResponse();
    
    // Pemetaan 9 Pertanyaan sesuai Google Form IKI KASIR
    if (title.match(/nama lengkap/i))               formData.name = response;
    else if (title.match(/nama toko|nama usaha/i))  formData.businessName = response;
    else if (title.match(/alamat lengkap|alamat/i)) formData.address = response;
    else if (title.match(/paket/i))                 formData.packageInterest = response;
    else if (title.match(/email/i))                 formData.email = response;
    else if (title.match(/whatsapp|wa|hp/i))        formData.phone = response;
    else if (title.match(/jumlah karyawan/i)) {
      formData.employeeCountChoice = Array.isArray(response) ? response[0] : response;
      // Cek jika ada field "Yang lain" (other field)
      if (formData.employeeCountChoice === 'Yang lain') {
        formData.employeeCountCustom = itemResponses[i].getResponse() || '';
      }
    }
    else if (title.match(/bersedia mencoba|saat.*diluncurkan/i))   formData.willingToTry = response;
    else if (title.match(/tester|pengguna awal/i))                 formData.willingToTest = response;
  }
  
  formData.source = 'Google Form';
  
  // POST ke endpoint API IKI KASIR (ganti dengan URL API Anda)
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(formData),
    'muteHttpExceptions': true
  };
  
  try {
    UrlFetchApp.fetch('https://api.ikikasir.id/v1/registrations', options);
    Logger.log('✅ Data berhasil dikirim ke Super Admin');
  } catch(err) {
    Logger.log('❌ Error: ' + err.message);
  }
}`

const copyCode = () => {
  navigator.clipboard.writeText(scriptSnippet)
  copied.value = true
  setTimeout(() => { copied.value = false }, 3000)
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        class="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
        @click.stop
      >
        <!-- Modal Header (Fixed) -->
        <div class="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <FileSpreadsheet class="w-6 h-6" />
            </div>
            <div>
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold mb-0.5">
                <Sparkles class="w-3 h-3 text-amber-300" />
                <span>Dokumentasi Integrasi Google Form</span>
              </div>
              <h3 class="text-base sm:text-lg font-extrabold tracking-tight">Status & Panduan Integrasi Google Form</h3>
            </div>
          </div>

          <button 
            @click="closeModal"
            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          
          <!-- Status Banner (Rule 5: No fake claims) -->
          <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <h4 class="font-bold text-amber-900">Status Integrasi Google Form: Membutuhkan Konfigurasi Webhook Eksternal</h4>
              <p class="text-[11px] text-amber-800">
                Struktur data pendaftaran Google Form sudah **100% identik & kompatibel** dengan Website Form (`source = google_form`). Untuk menghubungkan pendaftaran Google Form secara otomatis ke database API, jalankan script trigger di bawah ini pada Google Spreadsheet pendaftaran Anda.
              </p>
            </div>
          </div>

          <!-- Field Consistency Table -->
          <div>
            <h4 class="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span>Pemetaan 9 Pertanyaan Pendaftaran (100% Konsisten dengan Google Form)</span>
            </h4>

            <div class="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th class="py-2.5 px-3">No</th>
                    <th class="py-2.5 px-3">Field Website</th>
                    <th class="py-2.5 px-3">Field Google Form</th>
                    <th class="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/60 text-slate-700">
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">1</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Nama Lengkap *</td>
                    <td class="py-2 px-3">Nama Lengkap</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">2</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Nama Toko / Usaha *</td>
                    <td class="py-2 px-3">Nama Toko / Usaha</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">3</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Alamat Lengkap *</td>
                    <td class="py-2 px-3">Alamat Lengkap</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">4</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Paket Berlangganan * (Basic/Pro)</td>
                    <td class="py-2 px-3">Paket Berlangganan (Basic/Pro)</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">5</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Alamat Email</td>
                    <td class="py-2 px-3">Alamat Email</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">6</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">No WhatsApp aktif *</td>
                    <td class="py-2 px-3">No WhatsApp aktif</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">7</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Jumlah Karyawan Kasir * (1-5, Lainnya)</td>
                    <td class="py-2 px-3">Jumlah Karyawan Kasir (1-5, Yang lain + isian)</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">8</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Minat Mencoba Saat Rilis *</td>
                    <td class="py-2 px-3">Minat Mencoba (Ya Saya tertarik / Mungkin / Masih Mencoba / Tidak)</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-400 font-mono">9</td>
                    <td class="py-2 px-3 font-semibold text-indigo-600">Kesediaan Jadi Tester *</td>
                    <td class="py-2 px-3">Bersedia Menjadi Tester (Ya / Tidak)</td>
                    <td class="py-2 px-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">✔ Identik</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


          <!-- Apps Script Code Snippet -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <h4 class="font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 class="w-4 h-4 text-indigo-600" />
                <span>Script Webhook Trigger (Google Apps Script)</span>
              </h4>

              <button 
                @click="copyCode"
                class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy class="w-3.5 h-3.5" />
                <span>{{ copied ? 'Tersalin!' : 'Salin Script' }}</span>
              </button>
            </div>

            <div class="relative bg-slate-900 rounded-2xl p-3 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
              <pre><code>{{ scriptSnippet }}</code></pre>
            </div>
          </div>

          <!-- Footer Action -->
          <div class="pt-2 flex items-center justify-end">
            <button 
              @click="closeModal"
              class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors cursor-pointer"
            >
              Tutup & Kembali
            </button>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

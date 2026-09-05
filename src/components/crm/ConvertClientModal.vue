<script setup lang="ts">
import { ref } from 'vue'
import { X, UserCheck, CheckCircle2 } from 'lucide-vue-next'
import type { ClientLead } from '../../types/crm'

const props = defineProps<{
  client: ClientLead | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmed', client: ClientLead): void
}>()

const isSuccess = ref(false)
const isConverting = ref(false)

const handleConfirm = () => {
  if (!props.client) return
  isConverting.value = true
  setTimeout(() => {
    isConverting.value = false
    isSuccess.value = true
    emit('confirmed', props.client)
  }, 400)
}

const handleClose = () => {
  isSuccess.value = false
  emit('close')
}
</script>

<template>
  <div v-if="isOpen && client" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      @click="handleClose"
    ></div>

    <!-- Modal Box matching screenshot -->
    <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-7 text-center z-10 animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Close Button -->
      <button 
        @click="handleClose"
        class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- State 1: Confirmation Prompt -->
      <div v-if="!isSuccess" class="space-y-4">
        <!-- Center Icon matching illustration -->
        <div class="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>

        <h3 class="text-lg font-bold text-slate-900">Konversi ke Pelanggan</h3>

        <div class="text-xs text-slate-500 space-y-1">
          <p>Client sudah menyetujui penggunaan layanan?</p>
          <p class="font-semibold text-slate-700">Data client "{{ client.name }}" ({{ client.businessName }}) akan dikonversi menjadi Data Pelanggan.</p>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <button 
            @click="handleClose"
            type="button"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button 
            @click="handleConfirm"
            :disabled="isConverting"
            type="button"
            class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{{ isConverting ? 'Mengonversi...' : 'Konversi ke Pelanggan' }}</span>
          </button>
        </div>
      </div>

      <!-- State 2: Success Confirmation matching screenshot -->
      <div v-else class="space-y-4 py-2">
        <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-10 h-10" />
        </div>

        <h3 class="text-lg font-bold text-slate-900">Berhasil!</h3>
        <p class="text-xs text-slate-500">Client <span class="font-bold text-slate-700">{{ client.name }}</span> berhasil dikonversi menjadi pelanggan aktif.</p>

        <div class="pt-2">
          <button 
            @click="handleClose"
            class="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

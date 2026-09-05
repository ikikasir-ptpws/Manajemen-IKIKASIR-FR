<script setup lang="ts">
import { ref } from 'vue'
import { 
  X, 
  MessageSquare, 
  Edit3, 
  UserCheck, 
  User, 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight,
  Send,
  CheckCircle2
} from 'lucide-vue-next'
import type { ClientLead, LeadStatus } from '../../types/crm'

const props = defineProps<{
  client: ClientLead | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', client: ClientLead): void
  (e: 'convert', client: ClientLead): void
  (e: 'addFollowUp', clientId: string, note: string, channel: 'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem'): void
}>()

const showAddFollowUp = ref(false)
const newNote = ref('')
const newChannel = ref<'WhatsApp' | 'Telepon' | 'Meeting' | 'Sistem'>('WhatsApp')

const statusBadges: Record<LeadStatus, { bg: string, text: string }> = {
  New: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
  Contacted: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600' },
  'Follow Up': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600' },
  Interested: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-600' },
  Converted: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  Lost: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-600' },
}

const sendWhatsApp = () => {
  if (!props.client) return
  const phone = props.client.phone.replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const message = encodeURIComponent(`Halo Kak ${props.client.name} (${props.client.businessName}), salam dari tim IKI KASIR. Kami ingin menanyakan apakah ada hal yang bisa kami bantu seputar demo dan fitur aplikasi kasir kami? Terima kasih!`)
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}

const handleSaveFollowUp = () => {
  if (!newNote.value.trim() || !props.client) return
  emit('addFollowUp', props.client.id, newNote.value.trim(), newChannel.value)
  newNote.value = ''
  showAddFollowUp.value = false
}
</script>

<template>
  <div v-if="isOpen && client" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      @click="emit('close')"
    ></div>

    <!-- Modal Box -->
    <div class="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Top Header with Breadcrumbs & Actions -->
      <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <span class="hover:text-slate-600 cursor-pointer" @click="emit('close')">Calon Client</span>
            <ChevronRight class="w-3.5 h-3.5" />
            <span class="text-slate-700 font-semibold">Detail Client</span>
          </div>
          <h2 class="text-lg font-bold text-slate-900">Detail Client</h2>
          <p class="text-xs text-slate-500">Kelola informasi lengkap calon client.</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Follow Up WhatsApp button (Green) -->
          <button 
            @click="sendWhatsApp"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>Follow Up WhatsApp</span>
          </button>

          <!-- Edit Client button (Purple/Indigo) -->
          <button 
            @click="emit('edit', client)"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit3 class="w-3.5 h-3.5" />
            <span>Edit Client</span>
          </button>

          <!-- Konversi ke Pelanggan (if not already converted) -->
          <button 
            v-if="client.status !== 'Converted'"
            @click="emit('convert', client)"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <UserCheck class="w-3.5 h-3.5 text-emerald-400" />
            <span>Konversi</span>
          </button>

          <button 
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-slate-200/70 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Main Modal Content (2 Columns: Left Profile Card, Right Info & History Cards) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column (4 cols): Profile Card -->
          <div class="md:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-extrabold shadow-md mb-3">
              {{ client.name.charAt(0) }}
            </div>

            <h3 class="text-base font-bold text-slate-800">{{ client.name }}</h3>
            
            <div class="mt-1.5 mb-4">
              <span 
                class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                :class="statusBadges[client.status]?.bg + ' ' + statusBadges[client.status]?.text"
              >
                {{ client.status }}
              </span>
            </div>

            <div class="w-full border-t border-slate-100 pt-4 space-y-3 text-left text-xs">
              <div>
                <span class="text-slate-400 block text-[11px]">No. WhatsApp:</span>
                <p class="font-bold text-slate-700">{{ client.phone }}</p>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Email:</span>
                <p class="font-bold text-slate-700">{{ client.email }}</p>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Sumber:</span>
                <p class="font-bold text-slate-700">{{ client.source }}</p>
              </div>

              <div>
                <span class="text-slate-400 block text-[11px]">Status:</span>
                <p class="font-bold text-slate-700">{{ client.status }}</p>
              </div>
            </div>
          </div>

          <!-- Right Column (8 cols): Informasi Client & Riwayat Follow Up -->
          <div class="md:col-span-8 space-y-5">
            
            <!-- Card 1: Informasi Client -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h4 class="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Informasi Client</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span class="text-slate-400 block text-[11px]">Nama Bisnis:</span>
                  <p class="font-bold text-slate-700">{{ client.businessName }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block text-[11px]">Jenis Bisnis:</span>
                  <p class="font-bold text-slate-700">{{ client.businessCategory || 'Retail' }}</p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-slate-400 block text-[11px]">Alamat:</span>
                  <p class="font-medium text-slate-700">{{ client.address || 'Jl. Merdeka No. 10, Jakarta Pusat' }}</p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-slate-400 block text-[11px]">Catatan:</span>
                  <p class="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                    {{ client.notes || 'Client tertarik dengan paket premium. Akan follow up minggu depan.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Card 2: Riwayat Follow Up Timeline -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h4 class="text-sm font-bold text-slate-800">Riwayat Follow Up</h4>
                <button 
                  @click="showAddFollowUp = !showAddFollowUp"
                  class="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Tambah Follow Up</span>
                </button>
              </div>

              <!-- Quick Add Follow Up Input -->
              <div v-if="showAddFollowUp" class="mb-4 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs">
                <div class="flex items-center gap-2">
                  <select v-model="newChannel" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white">
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Sistem">Sistem</option>
                  </select>
                  <input 
                    v-model="newNote"
                    type="text" 
                    placeholder="Tulis catatan hasil follow up..."
                    class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
                    @keyup.enter="handleSaveFollowUp"
                  />
                  <button 
                    @click="handleSaveFollowUp"
                    class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    Kirim
                  </button>
                </div>
              </div>

              <!-- Timeline Items matching screenshot -->
              <div class="space-y-4 text-xs">
                <div 
                  v-for="(fu, idx) in client.followUpHistory" 
                  :key="fu.id"
                  class="relative pl-6 pb-3 border-l-2 border-indigo-200 last:border-transparent last:pb-0"
                >
                  <!-- Timeline circle dot -->
                  <div class="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50"></div>

                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-slate-800">{{ fu.date }} {{ fu.time }}</span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {{ fu.channel }}
                    </span>
                  </div>
                  <p class="text-slate-600 leading-relaxed">{{ fu.notes }}</p>
                </div>
              </div>

              <!-- Button at bottom: + Tambah Follow Up -->
              <div class="mt-4 pt-3 border-t border-slate-100">
                <button 
                  @click="showAddFollowUp = true"
                  class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Tambah Follow Up</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

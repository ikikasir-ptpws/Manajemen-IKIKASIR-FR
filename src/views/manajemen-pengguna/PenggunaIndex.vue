<script setup lang="ts">
import { ref } from 'vue'
import { Users, Search, Plus, MoreVertical, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-vue-next'

const searchQuery = ref('')
const users = ref([
  { id: 1, name: 'Budi Santoso', email: 'budi@ikikasir.com', role: 'Super Admin', status: 'Active', lastLogin: '2 jam yang lalu' },
  { id: 2, name: 'Siti Aisyah', email: 'siti@ikikasir.com', role: 'Admin', status: 'Active', lastLogin: '1 hari yang lalu' },
  { id: 3, name: 'Andi Wijaya', email: 'andi@ikikasir.com', role: 'Staff', status: 'Inactive', lastLogin: '1 minggu yang lalu' }
])
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Users class="w-6 h-6 text-indigo-600" />
          Manajemen Pengguna
        </h1>
        <p class="text-xs text-slate-500 mt-1">Kelola data pengguna, hak akses, dan status akun.</p>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari pengguna..." 
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button class="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0">
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Tambah Pengguna</span>
        </button>
      </div>
    </header>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[700px]">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 font-semibold text-slate-600 w-16">No</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Pengguna</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Role</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Status</th>
              <th class="px-6 py-4 font-semibold text-slate-600">Login Terakhir</th>
              <th class="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="(user, index) in users" :key="user.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4 text-slate-500 font-medium">{{ index + 1 }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800">{{ user.name }}</div>
                    <div class="text-xs text-slate-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  :class="user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                >
                  <CheckCircle2 v-if="user.status === 'Active'" class="w-3 h-3" />
                  <XCircle v-else class="w-3 h-3" />
                  {{ user.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 text-xs">{{ user.lastLogin }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-400 text-sm">
                Belum ada data pengguna.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

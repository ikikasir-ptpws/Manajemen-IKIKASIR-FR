<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r shadow-sm flex flex-col">
      <div class="p-6 border-b">
        <h2 class="text-xl font-bold text-gray-800">IkiKasir Admin</h2>
      </div>
      <nav class="flex-1 p-4 space-y-2">
        <RouterLink 
          to="/" 
          class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          active-class="bg-blue-50 text-blue-600 font-medium"
        >
          Dashboard
        </RouterLink>
        <RouterLink 
          to="/manajemen-pengguna" 
          class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          active-class="bg-blue-50 text-blue-600 font-medium"
        >
          Manajemen Pengguna
        </RouterLink>
        <RouterLink 
          to="/manajemen-promo" 
          class="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          active-class="bg-blue-50 text-blue-600 font-medium"
        >
          Manajemen Promo
        </RouterLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

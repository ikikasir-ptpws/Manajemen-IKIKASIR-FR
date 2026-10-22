<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalItems: number
    pageSize: number
    pageSizeOptions?: number[]
  }>(),
  {
    pageSizeOptions: () => [5, 10, 25, 50]
  }
)

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
}>()

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize) || 1
})

const startIndex = computed(() => {
  return (props.currentPage - 1) * props.pageSize
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + props.pageSize, props.totalItems)
})

const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const goToPage = (p: number | string) => {
  if (typeof p === 'number' && p >= 1 && p <= totalPages.value && p !== props.currentPage) {
    emit('update:currentPage', p)
  }
}

const prevPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

const nextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

const handlePageSizeChange = (e: Event) => {
  const newSize = Number((e.target as HTMLSelectElement).value)
  emit('update:pageSize', newSize)
  emit('update:currentPage', 1)
}
</script>

<template>
  <div class="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
    <!-- Info & Page Size Selector -->
    <div class="flex items-center gap-3 text-slate-500 font-medium">
      <span>
        Menampilkan 
        <strong class="text-slate-800 font-bold">{{ totalItems === 0 ? 0 : startIndex + 1 }}</strong> 
        - 
        <strong class="text-slate-800 font-bold">{{ endIndex }}</strong> 
        dari 
        <strong class="text-slate-800 font-bold">{{ totalItems }}</strong> data
      </span>

      <div class="flex items-center gap-1.5 pl-3 border-l border-slate-200">
        <span class="text-slate-400">Tampilkan:</span>
        <select 
          :value="pageSize" 
          @change="handlePageSizeChange"
          class="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
    </div>

    <!-- Pagination Buttons -->
    <div class="flex items-center gap-1.5">
      <button 
        @click="prevPage"
        :disabled="currentPage <= 1"
        class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Sebelumnya</span>
      </button>

      <div class="flex items-center gap-1">
        <button 
          v-for="(page, idx) in displayedPages" 
          :key="idx"
          @click="goToPage(page)"
          :disabled="typeof page !== 'number'"
          class="w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
          :class="currentPage === page ? 'bg-indigo-600 text-white shadow-xs' : (typeof page === 'number' ? 'text-slate-600 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-default')"
        >
          {{ page }}
        </button>
      </div>

      <button 
        @click="nextPage"
        :disabled="currentPage >= totalPages"
        class="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <span class="hidden sm:inline">Selanjutnya</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

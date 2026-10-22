import { ref, computed, watch, type Ref } from 'vue'

export function usePagination<T>(items: Ref<T[]>, defaultPageSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(defaultPageSize)

  const totalItems = computed(() => items.value.length)

  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value, totalItems.value)
  })

  const paginatedItems = computed(() => {
    return items.value.slice(startIndex.value, startIndex.value + pageSize.value)
  })

  const resetPage = () => {
    currentPage.value = 1
  }

  // Auto reset page if totalPages shrinks below currentPage
  watch(totalPages, (newTotal) => {
    if (currentPage.value > newTotal) {
      currentPage.value = Math.max(1, newTotal)
    }
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    resetPage
  }
}

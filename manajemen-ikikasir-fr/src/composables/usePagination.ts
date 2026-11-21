import { ref, computed, nextTick, watch, type Ref } from 'vue'

export const preserveScrollPosition = (
  source: HTMLElement | null,
  update: () => void,
) => {
  const scrollPositions: { element: HTMLElement; top: number }[] = []
  let ancestor = source

  while (ancestor) {
    const overflowY = window.getComputedStyle(ancestor).overflowY
    if (
      ['auto', 'scroll', 'overlay'].includes(overflowY) &&
      ancestor.scrollHeight > ancestor.clientHeight
    ) {
      scrollPositions.push({ element: ancestor, top: ancestor.scrollTop })
    }
    ancestor = ancestor.parentElement
  }

  const documentScroller = document.scrollingElement
  if (
    documentScroller instanceof HTMLElement &&
    documentScroller.scrollHeight > documentScroller.clientHeight &&
    !scrollPositions.some(({ element }) => element === documentScroller)
  ) {
    scrollPositions.push({ element: documentScroller, top: documentScroller.scrollTop })
  }

  update()

  if (scrollPositions.length > 0) {
    void nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollPositions.forEach(({ element, top }) => {
            element.scrollTop = top
          })
        })
      })
    })
  }
}

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

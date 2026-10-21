<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  placeholder?: string
}>(), {
  startDate: '',
  endDate: '',
  placeholder: 'Pilih Rentang Tanggal'
})

const emit = defineEmits<{
  (e: 'update:startDate', val: string): void
  (e: 'update:endDate', val: string): void
  (e: 'change', val: { startDate: string, endDate: string }): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Internal temp state while picking
const tempStart = ref<string>(props.startDate || '')
const tempEnd = ref<string>(props.endDate || '')
const hoverDate = ref<string>('')

// Calendar view month & year (default: starts on selected date, or September 2026 for demo data)
const currentMonth = ref<number>(8) // 0-indexed (8 = September)
const currentYear = ref<number>(2026)

// Initialize month to start date if provided
watch(() => props.startDate, (newVal) => {
  tempStart.value = newVal || ''
  if (newVal) {
    const d = new Date(newVal)
    if (!isNaN(d.getTime())) {
      currentMonth.value = d.getMonth()
      currentYear.value = d.getFullYear()
    }
  }
}, { immediate: true })

watch(() => props.endDate, (newVal) => {
  tempEnd.value = newVal || ''
}, { immediate: true })

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Format YYYY-MM-DD to Indonesian display e.g. "18 Sep 2026"
const formatDisplay = (isoStr?: string) => {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length !== 3) return isoStr
  const day = parseInt(parts[2], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  const year = parts[0]
  return `${day} ${monthShortNames[monthIdx] || ''} ${year}`
}

const displayLabel = computed(() => {
  if (props.startDate && props.endDate) {
    if (props.startDate === props.endDate) {
      return formatDisplay(props.startDate)
    }
    return `${formatDisplay(props.startDate)} - ${formatDisplay(props.endDate)}`
  }
  if (props.startDate) {
    return `Dari ${formatDisplay(props.startDate)}`
  }
  if (props.endDate) {
    return `Sampai ${formatDisplay(props.endDate)}`
  }
  return props.placeholder
})

const hasValue = computed(() => !!(props.startDate || props.endDate))

// Calendar Days calculation
interface DayInfo {
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

const calendarDays = computed(() => {
  const days: DayInfo[] = []
  const year = currentYear.value
  const month = currentMonth.value

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const todayIso = new Date().toISOString().split('T')[0]

  // Previous month overflow days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const mStr = String(prevMonth + 1).padStart(2, '0')
    const dStr = String(day).padStart(2, '0')
    const dateStr = `${prevYear}-${mStr}-${dStr}`
    days.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayIso
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, '0')
    const dStr = String(i).padStart(2, '0')
    const dateStr = `${year}-${mStr}-${dStr}`
    days.push({
      dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === todayIso
    })
  }

  // Next month overflow days (fill up to 35 or 42 grid items)
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const mStr = String(nextMonth + 1).padStart(2, '0')
    const dStr = String(i).padStart(2, '0')
    const dateStr = `${nextYear}-${mStr}-${dStr}`
    days.push({
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayIso
    })
  }

  return days
})

// Navigation
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Click Day Logic
const onDayClick = (day: DayInfo) => {
  const d = day.dateStr
  if (!tempStart.value || (tempStart.value && tempEnd.value)) {
    // Start a new selection
    tempStart.value = d
    tempEnd.value = ''
  } else if (tempStart.value && !tempEnd.value) {
    // Second click: determine start & end
    if (d < tempStart.value) {
      tempEnd.value = tempStart.value
      tempStart.value = d
    } else {
      tempEnd.value = d
    }
  }
}

const onDayHover = (day: DayInfo) => {
  if (tempStart.value && !tempEnd.value) {
    hoverDate.value = day.dateStr
  }
}

// Helpers for day styling
const isStart = (dateStr: string) => dateStr === tempStart.value
const isEnd = (dateStr: string) => dateStr === tempEnd.value
const isInRange = (dateStr: string) => {
  if (tempStart.value && tempEnd.value) {
    return dateStr > tempStart.value && dateStr < tempEnd.value
  }
  if (tempStart.value && !tempEnd.value && hoverDate.value) {
    const min = tempStart.value < hoverDate.value ? tempStart.value : hoverDate.value
    const max = tempStart.value > hoverDate.value ? tempStart.value : hoverDate.value
    return dateStr > min && dateStr < max
  }
  return false
}

// Presets
const setPreset = (type: string) => {
  const now = new Date()
  const toIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (type === 'all') {
    tempStart.value = ''
    tempEnd.value = ''
  } else if (type === 'today') {
    tempStart.value = toIso(now)
    tempEnd.value = toIso(now)
  } else if (type === '7days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 6)
    tempStart.value = toIso(past)
    tempEnd.value = toIso(now)
  } else if (type === '30days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 29)
    tempStart.value = toIso(past)
    tempEnd.value = toIso(now)
  } else if (type === 'sep2026') {
    // Preset demo data (September 2026)
    tempStart.value = '2026-09-01'
    tempEnd.value = '2026-09-30'
    currentMonth.value = 8
    currentYear.value = 2026
  } else if (type === 'thisMonth') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    tempStart.value = toIso(first)
    tempEnd.value = toIso(last)
  }
}

// Apply & Clear
const applySelection = () => {
  emit('update:startDate', tempStart.value)
  emit('update:endDate', tempEnd.value)
  emit('change', { startDate: tempStart.value, endDate: tempEnd.value })
  isOpen.value = false
}

const clearSelection = (e?: Event) => {
  e?.stopPropagation()
  tempStart.value = ''
  tempEnd.value = ''
  emit('update:startDate', '')
  emit('update:endDate', '')
  emit('change', { startDate: '', endDate: '' })
  isOpen.value = false
}

// Close on click outside
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative inline-block text-left select-none" :class="isOpen ? 'z-50' : 'z-20'">
    
    <!-- TRIGGER BUTTON -->
    <button 
      type="button"
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-2xs text-xs font-semibold"
      :class="hasValue 
        ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400' 
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
    >
      <Calendar class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <span class="truncate max-w-[200px] sm:max-w-none">{{ displayLabel }}</span>
      
      <!-- Clear button (x) inside trigger if active -->
      <button 
        v-if="hasValue" 
        @click.stop="clearSelection" 
        type="button"
        class="w-4 h-4 rounded-full hover:bg-indigo-200/60 text-indigo-500 hover:text-indigo-800 flex items-center justify-center transition-colors ml-0.5"
        title="Hapus filter tanggal"
      >
        <X class="w-3 h-3" />
      </button>

      <ChevronRight 
        class="w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0" 
        :class="isOpen ? 'rotate-90' : ''"
      />
    </button>

    <!-- FLOATING DROPDOWN POPOVER (Elevated z-index to stay above table) -->
    <div 
      v-if="isOpen"
      class="absolute left-0 mt-2 z-[9999] bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-5 w-[320px] sm:w-[490px] max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        
        <!-- PRESETS SIDEBAR -->
        <div class="w-full sm:w-36 space-y-1 pb-3 sm:pb-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-slate-100 text-xs font-semibold">
          <span class="text-[10px] uppercase tracking-wider text-slate-400 block px-2.5 pb-1 font-bold">Pilihan Cepat</span>
          
          <button 
            type="button" 
            @click="setPreset('all')"
            class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600"
            :class="!tempStart && !tempEnd ? 'bg-indigo-50 text-indigo-600 font-bold' : ''"
          >
            Semua Tanggal
          </button>
          
          <button 
            type="button" 
            @click="setPreset('sep2026')"
            class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600 flex items-center justify-between"
            :class="tempStart === '2026-09-01' && tempEnd === '2026-09-30' ? 'bg-indigo-50 text-indigo-600 font-bold' : ''"
          >
            <span>Sep 2026 (Demo)</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          <button 
            type="button" 
            @click="setPreset('7days')"
            class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600"
          >
            7 Hari Terakhir
          </button>

          <button 
            type="button" 
            @click="setPreset('30days')"
            class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600"
          >
            30 Hari Terakhir
          </button>

          <button 
            type="button" 
            @click="setPreset('thisMonth')"
            class="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-600"
          >
            Bulan Ini
          </button>
        </div>

        <!-- CALENDAR MAIN AREA -->
        <div class="flex-1 space-y-3">
          
          <!-- Month & Year Header -->
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-800">
              {{ monthNames[currentMonth] }} {{ currentYear }}
            </h4>
            <div class="flex items-center gap-1">
              <button 
                type="button"
                @click="prevMonth"
                class="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                title="Bulan sebelumnya"
              >
                <ChevronLeft class="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                @click="nextMonth"
                class="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                title="Bulan berikutnya"
              >
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Day of Week Headers -->
          <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
            <div v-for="d in dayNames" :key="d" class="py-1">{{ d }}</div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-y-1 text-center text-xs">
            <div 
              v-for="day in calendarDays" 
              :key="day.dateStr"
              class="relative py-0.5"
            >
              <!-- Range Background connector -->
              <div 
                v-if="isInRange(day.dateStr)" 
                class="absolute inset-y-0.5 inset-x-0 bg-indigo-50"
              ></div>
              <div 
                v-if="isStart(day.dateStr) && tempEnd" 
                class="absolute inset-y-0.5 right-0 left-1/2 bg-indigo-50"
              ></div>
              <div 
                v-if="isEnd(day.dateStr) && tempStart" 
                class="absolute inset-y-0.5 left-0 right-1/2 bg-indigo-50"
              ></div>

              <!-- Day Button -->
              <button 
                type="button"
                @click="onDayClick(day)"
                @mouseenter="onDayHover(day)"
                class="relative z-10 w-8 h-8 mx-auto flex items-center justify-center rounded-xl font-semibold transition-all cursor-pointer text-xs"
                :class="[
                  isStart(day.dateStr) || isEnd(day.dateStr) 
                    ? 'bg-indigo-600 text-white font-bold shadow-xs scale-105' 
                    : isInRange(day.dateStr)
                      ? 'text-indigo-800 font-bold hover:bg-indigo-100'
                      : day.isCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50',
                  day.isToday && !isStart(day.dateStr) && !isEnd(day.dateStr) ? 'border border-indigo-400' : ''
                ]"
              >
                {{ day.dayNumber }}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- FOOTER ACTIONS -->
      <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="text-slate-500 font-medium">
          <span v-if="tempStart && tempEnd" class="text-slate-700">
            Terpilih: <strong class="text-indigo-600">{{ formatDisplay(tempStart) }}</strong> - <strong class="text-indigo-600">{{ formatDisplay(tempEnd) }}</strong>
          </span>
          <span v-else-if="tempStart" class="text-amber-600 font-medium">
            Pilih tanggal akhir rentang...
          </span>
          <span v-else class="text-slate-400">
            Klik tanggal mulai dan tanggal akhir
          </span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            type="button" 
            @click="clearSelection"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer transition-colors"
          >
            Reset
          </button>
          <button 
            type="button" 
            @click="applySelection"
            class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>

    </div>

  </div>
</template>

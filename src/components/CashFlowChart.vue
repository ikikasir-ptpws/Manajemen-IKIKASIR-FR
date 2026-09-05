<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const selectedPeriod = ref('30 Hari')
const showPeriodDropdown = ref(false)
const hoveredIndex = ref<number | null>(null)

const periods = ['7 Hari', '30 Hari', '90 Hari', 'Tahun 2026']

// Chart data points matching the screenshot visual progression
const dataPoints = ref([
  { label: '7 Agu', fullDate: '07 Agustus 2026', income: 42, expense: 18, balance: 68 },
  { label: '10 Agu', fullDate: '10 Agustus 2026', income: 45, expense: 20, balance: 72 },
  { label: '12 Agu', fullDate: '12 Agustus 2026', income: 55, expense: 22, balance: 90 },
  { label: '14 Agu', fullDate: '14 Agustus 2026', income: 78, expense: 33, balance: 118 },
  { label: '17 Agu', fullDate: '17 Agustus 2026', income: 75, expense: 32, balance: 110 },
  { label: '19 Agu', fullDate: '19 Agustus 2026', income: 60, expense: 25, balance: 98 },
  { label: '21 Agu', fullDate: '21 Agustus 2026', income: 64, expense: 28, balance: 104 },
  { label: '24 Agu', fullDate: '24 Agustus 2026', income: 72, expense: 35, balance: 119 },
  { label: '26 Agu', fullDate: '26 Agustus 2026', income: 66, expense: 30, balance: 112 },
  { label: '28 Agu', fullDate: '28 Agustus 2026', income: 80, expense: 38, balance: 125 },
  { label: '31 Agu', fullDate: '31 Agustus 2026', income: 88, expense: 42, balance: 120 },
  { label: '2 Sep', fullDate: '02 September 2026', income: 84, expense: 48, balance: 138 },
  { label: '4 Sep', fullDate: '04 September 2026', income: 98, expense: 52, balance: 144 },
])

// SVG chart dimensions & calculations
const width = 640
const height = 230
const padding = { top: 25, right: 25, bottom: 35, left: 55 }

const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

// Scale: 0 to 160 (covering 0 to 150 jt comfortably)
const maxVal = 160

const getX = (index: number) => {
  return padding.left + (index / (dataPoints.value.length - 1)) * chartWidth
}

const getY = (val: number) => {
  return padding.top + chartHeight - (val / maxVal) * chartHeight
}

// Catmull-Rom or Cardinal Spline for super smooth curves matching the screenshot
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

const balanceCoords = computed(() => dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.balance) })))
const incomeCoords = computed(() => dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.income) })))
const expenseCoords = computed(() => dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.expense) })))

const balancePath = computed(() => getSmoothPath(balanceCoords.value))
const incomePath = computed(() => getSmoothPath(incomeCoords.value))
const expensePath = computed(() => getSmoothPath(expenseCoords.value))

const balanceArea = computed(() => {
  const pts = balanceCoords.value
  if (!pts.length) return ''
  return `${balancePath.value} L ${pts[pts.length - 1].x},${padding.top + chartHeight} L ${pts[0].x},${padding.top + chartHeight} Z`
})

const incomeArea = computed(() => {
  const pts = incomeCoords.value
  if (!pts.length) return ''
  return `${incomePath.value} L ${pts[pts.length - 1].x},${padding.top + chartHeight} L ${pts[0].x},${padding.top + chartHeight} Z`
})

const yAxisLabels = [
  { val: 150, text: '150 jt' },
  { val: 100, text: '100 jt' },
  { val: 50, text: '50 jt' },
  { val: 0, text: '0' },
]

const xAxisIndices = [0, 3, 6, 9, 12] // 7 Agu, 14 Agu, 21 Agu, 28 Agu, 4 Sep

const formatRupiah = (valInMillions: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(valInMillions * 1000000)
}
</script>

<template>
  <div class="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 relative">
    <!-- Header of Chart Section -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-base font-bold text-slate-800 tracking-tight">Grafik Arus Kas</h2>
      </div>

      <!-- Period Filter Dropdown -->
      <div class="relative">
        <button 
          @click="showPeriodDropdown = !showPeriodDropdown"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <span>{{ selectedPeriod }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <div 
          v-if="showPeriodDropdown"
          class="absolute right-0 mt-1.5 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          <button 
            v-for="p in periods" 
            :key="p"
            @click="selectedPeriod = p; showPeriodDropdown = false"
            class="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium flex items-center justify-between"
            :class="selectedPeriod === p ? 'text-indigo-600 font-semibold bg-indigo-50/50' : ''"
          >
            <span>{{ p }}</span>
            <span v-if="selectedPeriod === p" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Chart Legends -->
    <div class="flex items-center justify-center gap-6 mb-3 text-xs">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-xs"></span>
        <span class="font-medium text-slate-600">Pemasukan</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-xs"></span>
        <span class="font-medium text-slate-600">Pengeluaran</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-[#4F46E5] inline-block shadow-xs"></span>
        <span class="font-medium text-slate-600">Saldo</span>
      </div>
    </div>

    <!-- SVG Area Chart -->
    <div class="relative w-full overflow-hidden select-none">
      <svg 
        :viewBox="`0 0 ${width} ${height}`" 
        class="w-full h-auto overflow-visible cursor-crosshair"
      >
        <defs>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366F1" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#6366F1" stop-opacity="0.00" />
          </linearGradient>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.00" />
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines & Y-Axis Labels -->
        <g class="grid-lines">
          <g v-for="yLabel in yAxisLabels" :key="yLabel.val">
            <line 
              :x1="padding.left" 
              :y1="getY(yLabel.val)" 
              :x2="width - padding.right" 
              :y2="getY(yLabel.val)" 
              stroke="#F1F5F9" 
              stroke-width="1.2" 
            />
            <text 
              :x="padding.left - 12" 
              :y="getY(yLabel.val) + 4" 
              text-anchor="end" 
              font-size="11" 
              fill="#94A3B8" 
              font-weight="500"
            >
              {{ yLabel.text }}
            </text>
          </g>
        </g>

        <!-- Shaded Areas -->
        <path :d="balanceArea" fill="url(#balanceGrad)" />
        <path :d="incomeArea" fill="url(#incomeGrad)" />

        <!-- Spline Line Paths -->
        <!-- Saldo (Indigo / Blue) -->
        <path 
          :d="balancePath" 
          fill="none" 
          stroke="#4F46E5" 
          stroke-width="2.6" 
          stroke-linecap="round"
          class="transition-all duration-300"
        />
        <!-- Pemasukan (Emerald Green) -->
        <path 
          :d="incomePath" 
          fill="none" 
          stroke="#10B981" 
          stroke-width="2.6" 
          stroke-linecap="round"
          class="transition-all duration-300"
        />
        <!-- Pengeluaran (Rose Red) -->
        <path 
          :d="expensePath" 
          fill="none" 
          stroke="#EF4444" 
          stroke-width="2.6" 
          stroke-linecap="round"
          class="transition-all duration-300"
        />

        <!-- Circles on Data Points -->
        <!-- Saldo points -->
        <g v-for="(pt, idx) in balanceCoords" :key="`b-${idx}`">
          <circle 
            :cx="pt.x" 
            :cy="pt.y" 
            r="3.5" 
            fill="#FFFFFF" 
            stroke="#4F46E5" 
            stroke-width="2.2"
            class="transition-transform duration-150 hover:scale-150"
          />
        </g>

        <!-- Income points -->
        <g v-for="(pt, idx) in incomeCoords" :key="`i-${idx}`">
          <circle 
            :cx="pt.x" 
            :cy="pt.y" 
            r="3.5" 
            fill="#FFFFFF" 
            stroke="#10B981" 
            stroke-width="2.2"
            class="transition-transform duration-150 hover:scale-150"
          />
        </g>

        <!-- Expense points -->
        <g v-for="(pt, idx) in expenseCoords" :key="`e-${idx}`">
          <circle 
            :cx="pt.x" 
            :cy="pt.y" 
            r="3.5" 
            fill="#FFFFFF" 
            stroke="#EF4444" 
            stroke-width="2.2"
            class="transition-transform duration-150 hover:scale-150"
          />
        </g>

        <!-- X-Axis Labels -->
        <g class="x-axis">
          <text 
            v-for="idx in xAxisIndices" 
            :key="idx"
            :x="getX(idx)" 
            :y="height - 8" 
            text-anchor="middle" 
            font-size="11" 
            fill="#94A3B8" 
            font-weight="500"
          >
            {{ dataPoints[idx].label }}
          </text>
        </g>

        <!-- Hover Indicator vertical line & interactive trigger rectangles -->
        <g v-if="hoveredIndex !== null">
          <line 
            :x1="getX(hoveredIndex)" 
            :y1="padding.top" 
            :x2="getX(hoveredIndex)" 
            :y2="padding.top + chartHeight" 
            stroke="#94A3B8" 
            stroke-width="1.2" 
            stroke-dasharray="3 3"
          />
          <circle 
            :cx="getX(hoveredIndex)" 
            :cy="getY(dataPoints[hoveredIndex].balance)" 
            r="5" 
            fill="#4F46E5" 
            stroke="#FFFFFF" 
            stroke-width="2" 
          />
          <circle 
            :cx="getX(hoveredIndex)" 
            :cy="getY(dataPoints[hoveredIndex].income)" 
            r="5" 
            fill="#10B981" 
            stroke="#FFFFFF" 
            stroke-width="2" 
          />
          <circle 
            :cx="getX(hoveredIndex)" 
            :cy="getY(dataPoints[hoveredIndex].expense)" 
            r="5" 
            fill="#EF4444" 
            stroke="#FFFFFF" 
            stroke-width="2" 
          />
        </g>

        <!-- Invisible Hit Areas for Smooth Hovering -->
        <rect 
          v-for="(dp, idx) in dataPoints" 
          :key="`hit-${idx}`"
          :x="getX(idx) - (chartWidth / dataPoints.length) / 2"
          :y="padding.top"
          :width="chartWidth / dataPoints.length"
          :height="chartHeight"
          fill="transparent"
          @mouseenter="hoveredIndex = idx"
          @mouseleave="hoveredIndex = null"
        />
      </svg>

      <!-- Hover Tooltip -->
      <div 
        v-if="hoveredIndex !== null"
        class="absolute pointer-events-none z-30 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full border border-slate-700/50 min-w-44 transition-all duration-100"
        :style="{
          left: `${(getX(hoveredIndex) / width) * 100}%`,
          top: `${Math.min(getY(dataPoints[hoveredIndex].balance) - 10, 110)}px`
        }"
      >
        <div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
          <span>{{ dataPoints[hoveredIndex].fullDate }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-emerald-400 font-semibold">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Pemasukan:
          </span>
          <span>{{ formatRupiah(dataPoints[hoveredIndex].income) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-rose-400 font-semibold">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Pengeluaran:
          </span>
          <span>{{ formatRupiah(dataPoints[hoveredIndex].expense) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 text-indigo-300 font-bold pt-1 border-t border-slate-800">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            Saldo Kas:
          </span>
          <span>{{ formatRupiah(dataPoints[hoveredIndex].balance) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

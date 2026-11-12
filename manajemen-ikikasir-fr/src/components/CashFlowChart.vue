<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DashboardCashFlowPoint } from "../types/dashboard";
import DateRangePicker from "./common/DateRangePicker.vue";

const props = withDefaults(
  defineProps<{
    data?: DashboardCashFlowPoint[];
    loading?: boolean;
    startDate?: string;
    endDate?: string;
  }>(),
  {
    data: () => [],
    loading: false,
    startDate: "",
    endDate: "",
  },
);

const emit = defineEmits<{
  (e: "update:startDate", val: string): void;
  (e: "update:endDate", val: string): void;
}>();

const hoveredIndex = ref<number | null>(null);

const dataPoints = computed<DashboardCashFlowPoint[]>(() => props.data ?? []);

watch(
  () => props.data,
  () => {
    hoveredIndex.value = null;
  },
);

// SVG chart dimensions & calculations
const width = 640;
const height = 230;
const padding = { top: 25, right: 25, bottom: 35, left: 55 };

const chartWidth = width - padding.left - padding.right;
const chartHeight = height - padding.top - padding.bottom;

// Skala dinamis mengikuti nilai tertinggi dari data yang dimuat
const maxVal = computed(() => {
  const peak = dataPoints.value.reduce((max, point) => {
    return Math.max(max, point.income, point.expense, point.balance);
  }, 0);
  if (peak <= 0) return 1;
  // Bulatkan ke atas ke angka yang enak dibaca
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
});

const getX = (index: number) => {
  const total = dataPoints.value.length;
  if (total <= 1) return padding.left;
  return padding.left + (index / (total - 1)) * chartWidth;
};

const getY = (val: number) => {
  return padding.top + chartHeight - (val / maxVal.value) * chartHeight;
};

// Catmull-Rom atau Cardinal Spline untuk garis yang mulus
function getSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0 || !points[0]) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = (i > 0 ? points[i - 1] : points[0]) ?? points[0];
    const p1 = points[i] ?? points[0];
    const p2 = points[i + 1] ?? points[0];
    const p3 = (i < points.length - 2 ? points[i + 2] : p2) ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

const balanceCoords = computed(() =>
  dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.balance) })),
);
const incomeCoords = computed(() =>
  dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.income) })),
);
const expenseCoords = computed(() =>
  dataPoints.value.map((p, i) => ({ x: getX(i), y: getY(p.expense) })),
);

const balancePath = computed(() => getSmoothPath(balanceCoords.value));
const incomePath = computed(() => getSmoothPath(incomeCoords.value));
const expensePath = computed(() => getSmoothPath(expenseCoords.value));

const balanceArea = computed(() => {
  const pts = balanceCoords.value;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!pts.length || !first || !last) return "";
  return `${balancePath.value} L ${last.x},${padding.top + chartHeight} L ${first.x},${padding.top + chartHeight} Z`;
});

const incomeArea = computed(() => {
  const pts = incomeCoords.value;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!pts.length || !first || !last) return "";
  return `${incomePath.value} L ${last.x},${padding.top + chartHeight} L ${first.x},${padding.top + chartHeight} Z`;
});

const hoveredDataPoint = computed(() => {
  if (hoveredIndex.value === null) return null;
  return dataPoints.value[hoveredIndex.value] || null;
});

// Label sumbu Y disederhanakan menjadi satuan jt / rb
const formatAxis = (value: number) => {
  if (value >= 1_000_000_000) return `${Math.round(value / 1_000_000_000)} M`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return String(Math.round(value));
};

const yAxisLabels = computed(() => {
  const peak = maxVal.value;
  return [
    { val: peak, text: formatAxis(peak) },
    { val: peak * 0.66, text: formatAxis(peak * 0.66) },
    { val: peak * 0.33, text: formatAxis(peak * 0.33) },
    { val: 0, text: "0" },
  ];
});

const xAxisIndices = computed(() => {
  const total = dataPoints.value.length;
  if (total === 0) return [];
  if (total <= 6) return Array.from({ length: total }, (_, i) => i);

  // Tampilkan maksimal 6 label, tersebar merata sesuai jumlah titik data
  const maxLabels = 6;
  const step = (total - 1) / (maxLabels - 1);
  return Array.from({ length: maxLabels }, (_, i) => Math.round(i * step));
});

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-100 dark:border-slate-700 relative h-full"
  >
    <!-- Header of Chart Section -->
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div>
        <h2
          class="text-base font-bold text-slate-800 dark:text-white tracking-tight"
        >
          Grafik Arus Kas
        </h2>
      </div>

      <!-- Filter Rentang Tanggal -->
      <DateRangePicker
        :startDate="props.startDate"
        :endDate="props.endDate"
        placeholder="Filter Rentang Tanggal"
        @update:startDate="(val) => emit('update:startDate', val)"
        @update:endDate="(val) => emit('update:endDate', val)"
      />
    </div>

    <!-- Chart Legends (Responsive wrap on mobile) -->
    <div
      class="flex items-center justify-center gap-4 sm:gap-6 flex-wrap mb-3 text-xs"
    >
      <div class="flex items-center gap-2">
        <span
          class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"
        ></span>
        <span class="font-medium text-slate-600 dark:text-slate-400"
          >Pemasukan</span
        >
      </div>
      <div class="flex items-center gap-2">
        <span
          class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs"
        ></span>
        <span class="font-medium text-slate-600 dark:text-slate-400"
          >Pengeluaran</span
        >
      </div>
      <div class="flex items-center gap-2">
        <span
          class="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block shadow-xs"
        ></span>
        <span class="font-medium text-slate-600 dark:text-slate-400">Saldo</span>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="h-[200px] flex items-center justify-center text-xs text-slate-400"
    >
      <span
        class="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin mr-2"
      ></span>
      Memuat grafik arus kas...
    </div>

    <!-- Empty State -->
    <div
      v-else-if="dataPoints.length === 0"
      class="h-[200px] flex flex-col items-center justify-center text-xs text-slate-400 gap-1"
    >
      <span>Belum ada data arus kas pada periode ini.</span>
      <span class="text-[11px] text-slate-300 dark:text-slate-600">
        Catat transaksi kas pada menu Arus Kas untuk menampilkan grafik.
      </span>
    </div>

    <!-- SVG Area Chart -->
    <div v-else class="relative w-full overflow-hidden select-none">
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
              stroke="#cbd5e1"
              stroke-width="1.2"
              class="dark:opacity-20"
            />
            <text
              :x="padding.left - 12"
              :y="getY(yLabel.val) + 4"
              text-anchor="end"
              font-size="11"
              fill="currentColor"
              class="text-slate-400 dark:text-slate-500"
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
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Pemasukan (Emerald Green) -->
        <path
          :d="incomePath"
          fill="none"
          stroke="#10B981"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Pengeluaran (Rose Red) -->
        <path
          :d="expensePath"
          fill="none"
          stroke="#EF4444"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Circles on Data Points -->
        <g class="data-circles">
          <!-- Saldo Points -->
          <circle
            v-for="(pt, idx) in balanceCoords"
            :key="`bal-${idx}`"
            :cx="pt.x"
            :cy="pt.y"
            r="3.5"
            fill="#FFFFFF"
            stroke="#4F46E5"
            stroke-width="2.2"
            class="transition-transform duration-150 hover:scale-150"
          />

          <!-- Pemasukan Points -->
          <circle
            v-for="(pt, idx) in incomeCoords"
            :key="`inc-${idx}`"
            :cx="pt.x"
            :cy="pt.y"
            r="3.5"
            fill="#FFFFFF"
            stroke="#10B981"
            stroke-width="2.2"
            class="transition-transform duration-150 hover:scale-150"
          />

          <!-- Pengeluaran Points -->
          <circle
            v-for="(pt, idx) in expenseCoords"
            :key="`exp-${idx}`"
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
            fill="currentColor"
            class="text-slate-400 dark:text-slate-500"
            font-weight="500"
          >
            {{ dataPoints[idx]?.label }}
          </text>
        </g>

        <!-- Hover Indicator vertical line & interactive trigger rectangles -->
        <g v-if="hoveredIndex !== null && hoveredDataPoint">
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
            :cy="getY(hoveredDataPoint.balance)"
            r="5"
            fill="#4F46E5"
            stroke="#FFFFFF"
            stroke-width="2"
          />
          <circle
            :cx="getX(hoveredIndex)"
            :cy="getY(hoveredDataPoint.income)"
            r="5"
            fill="#10B981"
            stroke="#FFFFFF"
            stroke-width="2"
          />
          <circle
            :cx="getX(hoveredIndex)"
            :cy="getY(hoveredDataPoint.expense)"
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
          :x="getX(idx) - chartWidth / dataPoints.length / 2"
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
        v-if="hoveredIndex !== null && hoveredDataPoint"
        class="absolute pointer-events-none z-30 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full border border-slate-700/50 min-w-44 transition-all duration-100"
        :style="{
          left: `${(getX(hoveredIndex) / width) * 100}%`,
          top: `${Math.min(getY(hoveredDataPoint.balance) - 10, 110)}px`,
        }"
      >
        <div
          class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between"
        >
          <span>{{ hoveredDataPoint.fullDate }}</span>
        </div>
        <div
          class="flex items-center justify-between gap-3 text-emerald-400 font-semibold"
        >
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Pemasukan:
          </span>
          <span>{{ formatRupiah(hoveredDataPoint.income) }}</span>
        </div>
        <div
          class="flex items-center justify-between gap-3 text-rose-400 font-semibold"
        >
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Pengeluaran:
          </span>
          <span>{{ formatRupiah(hoveredDataPoint.expense) }}</span>
        </div>
        <div
          class="flex items-center justify-between gap-3 text-indigo-300 font-bold pt-1 border-t border-slate-800"
        >
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            Saldo Kas:
          </span>
          <span>{{ formatRupiah(hoveredDataPoint.balance) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

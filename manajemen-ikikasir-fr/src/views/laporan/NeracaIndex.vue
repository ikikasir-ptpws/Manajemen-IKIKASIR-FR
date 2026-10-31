<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Calculator, Download, Scale, Building, Landmark,
  RefreshCw, AlertCircle, Plus, Trash2, Pencil, Check, X,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-vue-next'
import { useReportData } from '../../composables/useReportData'
import { useNeraca } from '../../composables/useNeraca'
import DateRangePicker from '../../components/common/DateRangePicker.vue'
import { neracaItemApi, type NeracaItemData, type NeracaGroup } from '../../api/neraca-items.api'

const { startDate, endDate, periodeLabel, formatCurrency, setPreset, exportCsv } = useReportData()
const { report, isLoading, error, fetchNeraca } = useNeraca()

// ─── Computed dari laporan neraca ───────────────────────────────────────────
const asetLancar         = computed(() => report.value?.asetLancar ?? [])
const asetTetap          = computed(() => report.value?.asetTetap ?? [])
const kewajibanLancar    = computed(() => report.value?.kewajibanLancar ?? [])
const kewajibanJP        = computed(() => report.value?.kewajibanJangkaPanjang ?? [])
const ekuitasItems       = computed(() => report.value?.ekuitas ?? [])
const totalAsetLancar    = computed(() => report.value?.summary.totalAsetLancar ?? 0)
const totalAsetTetap     = computed(() => report.value?.summary.totalAsetTetap ?? 0)
const totalAset          = computed(() => report.value?.summary.totalAset ?? 0)
const totalKewajibanLancar = computed(() => report.value?.summary.totalKewajibanLancar ?? 0)
const totalKewajibanJP   = computed(() => report.value?.summary.totalKewajibanJangkaPanjang ?? 0)
const totalKewajiban     = computed(() => report.value?.summary.totalKewajiban ?? 0)
const totalEkuitas       = computed(() => report.value?.summary.totalEkuitas ?? 0)
const labaPeriodeBerjalan = computed(() => report.value?.summary.labaPeriodeBerjalan ?? 0)
const isBalanced         = computed(() => report.value?.summary.isBalanced ?? true)

// ─── Load laporan neraca ────────────────────────────────────────────────────
const muatNeraca = async () => {
  await fetchNeraca({ startDate: startDate.value || undefined, endDate: endDate.value || undefined })
}
watch([startDate, endDate], muatNeraca)
onMounted(() => { muatNeraca(); loadNeracaItems() })

// ─── State manajemen pos neraca ─────────────────────────────────────────────
const neracaItems        = ref<NeracaItemData[]>([])
const isItemsLoading     = ref(false)
const itemError          = ref<string | null>(null)

// Panel buka/tutup per grup
const openPanel = ref<Record<string, boolean>>({
  aset_tetap: false,
  kewajiban_lancar: false,
  kewajiban_jangka_panjang: false,
})

// Form tambah pos baru
const addForm = ref<Record<string, { name: string; amount: string }>>({
  aset_tetap: { name: '', amount: '' },
  kewajiban_lancar: { name: '', amount: '' },
  kewajiban_jangka_panjang: { name: '', amount: '' },
})

// State edit inline
const editingId  = ref<string | null>(null)
const editForm   = ref({ name: '', amount: '' })
const isSaving   = ref(false)
const isDeleting = ref<string | null>(null)

// Toast
const toast = ref<{ msg: string; type: 'ok' | 'err' } | null>(null)
let toastTimer: any = null
const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { msg, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

// Label tiap grup
const GROUP_LABEL: Record<string, string> = {
  aset_tetap: 'Aset Tetap',
  kewajiban_lancar: 'Kewajiban Lancar',
  kewajiban_jangka_panjang: 'Kewajiban Jangka Panjang',
}

const itemsByGroup = (group: string) =>
  neracaItems.value.filter((i) => i.group === group)

// ─── Load pos neraca dari API ───────────────────────────────────────────────
const loadNeracaItems = async () => {
  isItemsLoading.value = true
  itemError.value = null
  try {
    const res = await neracaItemApi.getAll()
    neracaItems.value = (res.data as any) ?? []
  } catch (err: any) {
    itemError.value = err?.message || 'Gagal memuat pos neraca.'
  } finally {
    isItemsLoading.value = false
  }
}

// ─── Tambah pos ─────────────────────────────────────────────────────────────
const handleAdd = async (group: NeracaGroup) => {
  const f = addForm.value[group]
  if (!f.name.trim()) { showToast('Nama pos wajib diisi.', 'err'); return }
  const amt = Number(f.amount)
  if (isNaN(amt)) { showToast('Nominal tidak valid.', 'err'); return }

  isSaving.value = true
  try {
    const res = await neracaItemApi.create({ group, name: f.name.trim(), amount: amt })
    neracaItems.value.push(res.data as any)
    addForm.value[group] = { name: '', amount: '' }
    showToast(`Pos "${(res.data as any).name}" berhasil ditambahkan.`)
    await muatNeraca()
  } catch (err: any) {
    showToast(err?.message || 'Gagal menambahkan pos.', 'err')
  } finally {
    isSaving.value = false
  }
}

// ─── Edit inline ─────────────────────────────────────────────────────────────
const startEdit = (item: NeracaItemData) => {
  editingId.value = item.id
  editForm.value  = { name: item.name, amount: String(item.amount) }
}
const cancelEdit = () => { editingId.value = null }
const saveEdit = async (item: NeracaItemData) => {
  if (!editForm.value.name.trim()) { showToast('Nama pos wajib diisi.', 'err'); return }
  isSaving.value = true
  try {
    const res = await neracaItemApi.update(item.id, {
      name: editForm.value.name.trim(),
      amount: Number(editForm.value.amount),
    })
    const idx = neracaItems.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) neracaItems.value[idx] = res.data as any
    editingId.value = null
    showToast('Pos berhasil diperbarui.')
    await muatNeraca()
  } catch (err: any) {
    showToast(err?.message || 'Gagal memperbarui pos.', 'err')
  } finally {
    isSaving.value = false
  }
}

// ─── Hapus pos ───────────────────────────────────────────────────────────────
const handleDelete = async (item: NeracaItemData) => {
  if (!confirm(`Hapus pos "${item.name}"?`)) return
  isDeleting.value = item.id
  try {
    await neracaItemApi.delete(item.id)
    neracaItems.value = neracaItems.value.filter((i) => i.id !== item.id)
    showToast(`Pos "${item.name}" dihapus.`)
    await muatNeraca()
  } catch (err: any) {
    showToast(err?.message || 'Gagal menghapus pos.', 'err')
  } finally {
    isDeleting.value = null
  }
}

// ─── Export CSV ──────────────────────────────────────────────────────────────
const handleExport = () => {
  const rows: (string | number)[][] = [
    ['LAPORAN NERACA'],
    ['Periode', periodeLabel.value],
    [],
    ['ASET LANCAR', 'Nominal'],
    ...asetLancar.value.map((i) => [i.name, i.amount]),
    ['Total Aset Lancar', totalAsetLancar.value],
    [],
    ['ASET TETAP', 'Nominal'],
    ...asetTetap.value.map((i) => [i.name, i.amount]),
    ['Total Aset Tetap', totalAsetTetap.value],
    [],
    ['TOTAL ASET', totalAset.value],
    [],
    ['KEWAJIBAN LANCAR', 'Nominal'],
    ...kewajibanLancar.value.map((i) => [i.name, i.amount]),
    ['Total Kewajiban Lancar', totalKewajibanLancar.value],
    [],
    ['KEWAJIBAN JANGKA PANJANG', 'Nominal'],
    ...kewajibanJP.value.map((i) => [i.name, i.amount]),
    ['Total Kewajiban Jangka Panjang', totalKewajibanJP.value],
    [],
    ['EKUITAS', 'Nominal'],
    ...ekuitasItems.value.map((i) => [i.name, i.amount]),
    ['Total Ekuitas', totalEkuitas.value],
    [],
    ['TOTAL KEWAJIBAN + EKUITAS', totalKewajiban.value + totalEkuitas.value],
  ]
  if (!exportCsv(`neraca-${new Date().toISOString().slice(0, 10)}`, rows)) {
    window.alert('Tidak ada data untuk diekspor.')
  }
}

// Format angka ke Rupiah lokal (untuk input preview)
const fmtNum = (v: string | number) => {
  const n = Number(v)
  return isNaN(n) ? '' : new Intl.NumberFormat('id-ID').format(n)
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto select-none">

    <!-- ─── Toast ─────────────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white animate-in slide-in-from-bottom-4 duration-300"
        :class="toast.type === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'"
      >
        <Check v-if="toast.type === 'ok'" class="w-4 h-4" />
        <AlertCircle v-else class="w-4 h-4" />
        {{ toast.msg }}
      </div>
    </Transition>

    <!-- ─── Header ────────────────────────────────────────────────────────── -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Calculator class="w-6 h-6 text-amber-600" />
          Neraca (Balance Sheet)
        </h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">
          Ringkasan posisi keuangan: Aset, Kewajiban, dan Ekuitas.
          <span class="text-slate-400">Periode: {{ periodeLabel }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <DateRangePicker v-model:startDate="startDate" v-model:endDate="endDate" placeholder="Filter Rentang Tanggal" />

        <button @click="muatNeraca" :disabled="isLoading"
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Muat Ulang</span>
        </button>

        <button @click="handleExport"
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs">
          <Download class="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>
    </header>

    <!-- ─── Preset Periode ───────────────────────────────────────────────── -->
    <section class="bg-white rounded-2xl shadow-xs border border-slate-100 px-4 py-3 flex items-center gap-2 flex-wrap">
      <span class="text-[11px] font-medium text-slate-400 shrink-0">Preset Periode:</span>
      <button @click="setPreset('semua')"    class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Semua</button>
      <button @click="setPreset('hari-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Hari Ini</button>
      <button @click="setPreset('7-hari')"  class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">7 Hari Terakhir</button>
      <button @click="setPreset('bulan-ini')" class="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer">Bulan Ini</button>
    </section>

    <!-- ─── Error ────────────────────────────────────────────────────────── -->
    <div v-if="error" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- ─── Balance Equation ─────────────────────────────────────────────── -->
    <section class="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Aset</div>
          <div class="text-lg sm:text-xl font-extrabold text-blue-700">{{ formatCurrency(totalAset) }}</div>
        </div>
        <div class="hidden sm:block text-slate-300 text-xl font-bold">=</div>
        <div class="sm:hidden text-xs text-slate-300 font-bold">=</div>
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Kewajiban</div>
          <div class="text-lg sm:text-xl font-extrabold text-rose-700">{{ formatCurrency(totalKewajiban) }}</div>
        </div>
        <div class="hidden sm:block text-slate-300 text-xl font-bold">+</div>
        <div class="sm:hidden text-xs text-slate-300 font-bold">+</div>
        <div class="flex-1 w-full sm:w-auto">
          <div class="text-[11px] font-semibold text-slate-500 mb-1">Total Ekuitas</div>
          <div class="text-lg sm:text-xl font-extrabold text-emerald-700">{{ formatCurrency(totalEkuitas) }}</div>
        </div>
      </div>
      <div class="mt-4 pt-3 text-center">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
          :class="isBalanced ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
          <Scale class="w-3.5 h-3.5" />
          {{ isBalanced ? 'Neraca Seimbang (Balance)' : 'Neraca Tidak Seimbang' }}
        </span>
      </div>
    </section>

    <!-- ─── Detail Tables ────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- KIRI: ASET ───────────────────────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Aset Lancar (read-only, dari cashflow) -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              Aset Lancar
              <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Otomatis</span>
            </h2>
            <span class="text-xs font-bold text-blue-600">{{ formatCurrency(totalAsetLancar) }}</span>
          </div>
          <div>
            <div v-if="isLoading" class="px-5 py-6 text-center text-xs text-slate-400">Memuat...</div>
            <div v-else-if="asetLancar.length === 0" class="px-5 py-5 text-center text-xs text-slate-400 italic">
              Belum ada transaksi arus kas yang tercatat.
            </div>
            <div v-for="item in asetLancar" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Aset Tetap (bisa diinput) -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
              Aset Tetap
            </h2>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-indigo-600">{{ formatCurrency(totalAsetTetap) }}</span>
              <button @click="openPanel.aset_tetap = !openPanel.aset_tetap"
                class="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors">
                <Plus class="w-3.5 h-3.5" />
                Kelola
                <ChevronDown v-if="!openPanel.aset_tetap" class="w-3 h-3" />
                <ChevronUp   v-else class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Daftar item -->
          <div>
            <div v-if="isLoading || isItemsLoading" class="px-5 py-6 text-center text-xs text-slate-400">Memuat...</div>
            <div v-else-if="itemsByGroup('aset_tetap').length === 0 && !openPanel.aset_tetap"
              class="px-5 py-5 text-center text-xs text-slate-400 italic">
              Belum ada aset tetap. Klik <span class="text-indigo-600 font-semibold">Kelola</span> untuk menambahkan.
            </div>
            <template v-for="item in itemsByGroup('aset_tetap')" :key="item.id">
              <!-- Mode edit -->
              <div v-if="editingId === item.id" class="px-5 py-3 flex items-center gap-2 bg-indigo-50/40 border-b border-indigo-100">
                <input v-model="editForm.name" placeholder="Nama pos"
                  class="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <input v-model="editForm.amount" type="number" placeholder="Nominal"
                  class="w-32 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                <button @click="saveEdit(item)" :disabled="isSaving"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50">
                  <Check class="w-3.5 h-3.5" />
                </button>
                <button @click="cancelEdit"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <!-- Mode tampil -->
              <div v-else class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold" :class="item.amount < 0 ? 'text-rose-600' : 'text-slate-800'">
                    {{ item.amount < 0 ? '(' + formatCurrency(Math.abs(item.amount)) + ')' : formatCurrency(item.amount) }}
                  </span>
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="startEdit(item)" class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer">
                      <Pencil class="w-3 h-3" />
                    </button>
                    <button @click="handleDelete(item)" :disabled="isDeleting === item.id"
                      class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">
                      <Loader2 v-if="isDeleting === item.id" class="w-3 h-3 animate-spin" />
                      <Trash2 v-else class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Form tambah -->
          <div v-if="openPanel.aset_tetap" class="px-5 py-4 bg-indigo-50/30 border-t border-indigo-100 space-y-2">
            <p class="text-[11px] font-semibold text-indigo-700 mb-2">Tambah Pos Aset Tetap</p>
            <div class="flex items-center gap-2">
              <input v-model="addForm.aset_tetap.name" placeholder="Contoh: Peralatan Komputer"
                class="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" />
              <input v-model="addForm.aset_tetap.amount" type="number" placeholder="Nominal (Rp)"
                class="w-36 px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" />
              <button @click="handleAdd('aset_tetap')" :disabled="isSaving"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-sm">
                <Plus class="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
            <p v-if="addForm.aset_tetap.amount" class="text-[10px] text-indigo-600 font-medium">
              Preview: Rp {{ fmtNum(addForm.aset_tetap.amount) }}
            </p>
          </div>
        </div>

        <!-- Total Aset -->
        <div class="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 flex items-center justify-between">
          <span class="text-sm font-bold text-blue-800 flex items-center gap-2">
            <Building class="w-4 h-4" />
            TOTAL ASET
          </span>
          <span class="text-lg font-extrabold text-blue-700">{{ formatCurrency(totalAset) }}</span>
        </div>
      </div>

      <!-- KANAN: KEWAJIBAN + EKUITAS ────────────────────────────────────── -->
      <div class="space-y-4">

        <!-- Kewajiban Lancar -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-rose-500"></div>
              Kewajiban Lancar
            </h2>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-rose-600">{{ formatCurrency(totalKewajibanLancar) }}</span>
              <button @click="openPanel.kewajiban_lancar = !openPanel.kewajiban_lancar"
                class="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer transition-colors">
                <Plus class="w-3.5 h-3.5" />
                Kelola
                <ChevronDown v-if="!openPanel.kewajiban_lancar" class="w-3 h-3" />
                <ChevronUp   v-else class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div>
            <div v-if="isItemsLoading" class="px-5 py-6 text-center text-xs text-slate-400">Memuat...</div>
            <div v-else-if="itemsByGroup('kewajiban_lancar').length === 0 && !openPanel.kewajiban_lancar"
              class="px-5 py-5 text-center text-xs text-slate-400 italic">
              Belum ada kewajiban lancar. Klik <span class="text-rose-600 font-semibold">Kelola</span> untuk menambahkan.
            </div>
            <template v-for="item in itemsByGroup('kewajiban_lancar')" :key="item.id">
              <div v-if="editingId === item.id" class="px-5 py-3 flex items-center gap-2 bg-rose-50/40 border-b border-rose-100">
                <input v-model="editForm.name" placeholder="Nama pos"
                  class="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100" />
                <input v-model="editForm.amount" type="number" placeholder="Nominal"
                  class="w-32 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100" />
                <button @click="saveEdit(item)" :disabled="isSaving"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50">
                  <Check class="w-3.5 h-3.5" />
                </button>
                <button @click="cancelEdit"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-else class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="startEdit(item)" class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                      <Pencil class="w-3 h-3" />
                    </button>
                    <button @click="handleDelete(item)" :disabled="isDeleting === item.id"
                      class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">
                      <Loader2 v-if="isDeleting === item.id" class="w-3 h-3 animate-spin" />
                      <Trash2 v-else class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-if="openPanel.kewajiban_lancar" class="px-5 py-4 bg-rose-50/30 border-t border-rose-100 space-y-2">
            <p class="text-[11px] font-semibold text-rose-700 mb-2">Tambah Pos Kewajiban Lancar</p>
            <div class="flex items-center gap-2">
              <input v-model="addForm.kewajiban_lancar.name" placeholder="Contoh: Utang Usaha"
                class="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 placeholder:text-slate-300" />
              <input v-model="addForm.kewajiban_lancar.amount" type="number" placeholder="Nominal (Rp)"
                class="w-36 px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 placeholder:text-slate-300" />
              <button @click="handleAdd('kewajiban_lancar')" :disabled="isSaving"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 active:scale-95 transition cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-sm">
                <Plus class="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          </div>
        </div>

        <!-- Kewajiban Jangka Panjang -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              Kewajiban Jangka Panjang
            </h2>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-orange-600">{{ formatCurrency(totalKewajibanJP) }}</span>
              <button @click="openPanel.kewajiban_jangka_panjang = !openPanel.kewajiban_jangka_panjang"
                class="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-800 cursor-pointer transition-colors">
                <Plus class="w-3.5 h-3.5" />
                Kelola
                <ChevronDown v-if="!openPanel.kewajiban_jangka_panjang" class="w-3 h-3" />
                <ChevronUp   v-else class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div>
            <div v-if="isItemsLoading" class="px-5 py-6 text-center text-xs text-slate-400">Memuat...</div>
            <div v-else-if="itemsByGroup('kewajiban_jangka_panjang').length === 0 && !openPanel.kewajiban_jangka_panjang"
              class="px-5 py-5 text-center text-xs text-slate-400 italic">
              Belum ada kewajiban jangka panjang. Klik <span class="text-orange-600 font-semibold">Kelola</span> untuk menambahkan.
            </div>
            <template v-for="item in itemsByGroup('kewajiban_jangka_panjang')" :key="item.id">
              <div v-if="editingId === item.id" class="px-5 py-3 flex items-center gap-2 bg-orange-50/40 border-b border-orange-100">
                <input v-model="editForm.name" placeholder="Nama pos"
                  class="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                <input v-model="editForm.amount" type="number" placeholder="Nominal"
                  class="w-32 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
                <button @click="saveEdit(item)" :disabled="isSaving"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition cursor-pointer disabled:opacity-50">
                  <Check class="w-3.5 h-3.5" />
                </button>
                <button @click="cancelEdit"
                  class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <div v-else class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-800">{{ formatCurrency(item.amount) }}</span>
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="startEdit(item)" class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer">
                      <Pencil class="w-3 h-3" />
                    </button>
                    <button @click="handleDelete(item)" :disabled="isDeleting === item.id"
                      class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">
                      <Loader2 v-if="isDeleting === item.id" class="w-3 h-3 animate-spin" />
                      <Trash2 v-else class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-if="openPanel.kewajiban_jangka_panjang" class="px-5 py-4 bg-orange-50/30 border-t border-orange-100 space-y-2">
            <p class="text-[11px] font-semibold text-orange-700 mb-2">Tambah Pos Kewajiban Jangka Panjang</p>
            <div class="flex items-center gap-2">
              <input v-model="addForm.kewajiban_jangka_panjang.name" placeholder="Contoh: Utang Bank"
                class="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-orange-200 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 placeholder:text-slate-300" />
              <input v-model="addForm.kewajiban_jangka_panjang.amount" type="number" placeholder="Nominal (Rp)"
                class="w-36 px-3 py-2 text-xs font-semibold rounded-xl border border-orange-200 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 placeholder:text-slate-300" />
              <button @click="handleAdd('kewajiban_jangka_panjang')" :disabled="isSaving"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 active:scale-95 transition cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-sm">
                <Plus class="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          </div>
        </div>

        <!-- Ekuitas -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
          <div class="px-5 py-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              Ekuitas Pemilik
              <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Otomatis</span>
            </h2>
            <span class="text-xs font-bold text-emerald-600">{{ formatCurrency(totalEkuitas) }}</span>
          </div>
          <div>
            <div v-for="item in ekuitasItems" :key="item.name" class="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <span class="text-sm text-slate-700 font-medium">{{ item.name }}</span>
              <span class="text-sm font-bold" :class="item.amount < 0 ? 'text-rose-600' : 'text-emerald-700'">
                {{ formatCurrency(item.amount) }}
              </span>
            </div>
            <div class="px-5 py-3 flex items-center justify-between bg-emerald-50/40 border-t border-emerald-100">
              <span class="text-[11px] text-slate-500 font-medium">Laba Periode Berjalan</span>
              <span class="text-xs font-bold" :class="labaPeriodeBerjalan >= 0 ? 'text-emerald-700' : 'text-rose-600'">
                {{ formatCurrency(labaPeriodeBerjalan) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Total Kewajiban + Ekuitas -->
        <div class="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200 flex items-center justify-between">
          <span class="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <Landmark class="w-4 h-4" />
            TOTAL KEWAJIBAN + EKUITAS
          </span>
          <span class="text-lg font-extrabold text-emerald-700">{{ formatCurrency(totalKewajiban + totalEkuitas) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

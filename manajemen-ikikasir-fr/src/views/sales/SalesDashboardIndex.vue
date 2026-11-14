<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, RefreshCw, TrendingUp, UserRound, Users, Wallet } from 'lucide-vue-next'
import { resolveReceiptUrl } from '../../api'
import { salesApi } from '../../api/sales.api'
import { useAppData } from '../../composables/useAppData'
import { useSalesDashboard } from '../../composables/useSalesDashboard'
import type { SalesClientItem } from '../../types/sales'

const { currentUser } = useAppData()
const {
  dashboard,
  withdrawals,
  loading,
  error,
  withdrawalLoading,
  withdrawalError,
  fetchDashboard,
  fetchWithdrawals,
  generateCode,
  submitWithdrawal,
} = useSalesDashboard()

const clients = ref<SalesClientItem[]>([])
const clientsLoading = ref(false)
const pageError = ref<string | null>(null)
const copied = ref(false)
const isWithdrawalFormOpen = ref(false)
const withdrawalForm = ref({
  amount: '',
  bankOrWallet: '',
  accountNumber: '',
  accountHolder: '',
  notes: '',
})

const userId = computed(() => {
  if (currentUser.value?.id) return currentUser.value.id
  try {
    const storedUser = localStorage.getItem('ikikasir_user')
    return storedUser ? JSON.parse(storedUser)?.id || '' : ''
  } catch {
    return ''
  }
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const statusClass = (status: string) => {
  if (status === 'SELESAI') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'DITOLAK') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const statusLabel = (status: string) => {
  if (status === 'MENUNGGU_VERIFIKASI') return 'Menunggu verifikasi'
  if (status === 'SELESAI') return 'Selesai'
  if (status === 'DITOLAK') return 'Ditolak'
  return status
}

const refreshDashboard = async () => {
  if (!userId.value) {
    pageError.value = 'Sesi sales tidak ditemukan. Silakan login kembali.'
    return
  }

  pageError.value = null
  clientsLoading.value = true
  try {
    const [clientResponse] = await Promise.all([
      salesApi.getSalesClients(userId.value, { page: 1, limit: 20 }),
      fetchDashboard(userId.value),
      fetchWithdrawals(userId.value),
    ])
    clients.value = clientResponse.data ?? []

    if (dashboard.value && !dashboard.value.salesReferralCode) {
      const code = await generateCode(userId.value)
      if (code && dashboard.value) dashboard.value.salesReferralCode = code
    }
  } catch (err: any) {
    pageError.value = err?.message || 'Gagal memuat data dashboard sales.'
    clients.value = []
  } finally {
    clientsLoading.value = false
  }
}

const copyReferralCode = async () => {
  const code = dashboard.value?.salesReferralCode
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    pageError.value = 'Kode referral tidak dapat disalin. Silakan salin secara manual.'
  }
}

const handleWithdrawal = async () => {
  const amount = Number(withdrawalForm.value.amount)
  if (!userId.value || !Number.isFinite(amount) || amount <= 0) {
    pageError.value = 'Masukkan nominal penarikan yang valid.'
    return
  }
  if (amount > (dashboard.value?.availableBalance ?? 0)) {
    pageError.value = 'Nominal penarikan melebihi saldo yang tersedia.'
    return
  }
  if (!withdrawalForm.value.bankOrWallet || !withdrawalForm.value.accountNumber.trim() || !withdrawalForm.value.accountHolder.trim()) {
    pageError.value = 'Lengkapi bank/e-wallet, nomor rekening, dan nama pemilik rekening.'
    return
  }

  pageError.value = null
  const success = await submitWithdrawal({
    userId: userId.value,
    amount,
    bankOrWallet: withdrawalForm.value.bankOrWallet,
    accountNumber: withdrawalForm.value.accountNumber.trim(),
    accountHolder: withdrawalForm.value.accountHolder.trim(),
    notes: withdrawalForm.value.notes.trim() || undefined,
  })

  if (success) {
    withdrawalForm.value = { amount: '', bankOrWallet: '', accountNumber: '', accountHolder: '', notes: '' }
    isWithdrawalFormOpen.value = false
    await refreshDashboard()
  }
}

onMounted(refreshDashboard)
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 md:p-8">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-800">Dashboard Sales</h1>
        <p class="mt-1 text-sm text-slate-500">Pantau referral, pelanggan, komisi, dan penarikan saldo Anda.</p>
      </div>
      <button
        type="button"
        @click="refreshDashboard"
        :disabled="loading || clientsLoading || withdrawalLoading"
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw class="h-4 w-4" :class="loading || clientsLoading || withdrawalLoading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </header>

    <div v-if="pageError || error || withdrawalError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ pageError || error || withdrawalError }}
    </div>

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          Saldo Tersedia <Wallet class="h-4 w-4 text-emerald-600" />
        </div>
        <p class="text-2xl font-extrabold text-slate-800">{{ formatCurrency(dashboard?.availableBalance ?? dashboard?.salesBalance ?? 0) }}</p>
        <p class="mt-1 text-xs text-slate-500">Saldo komisi setelah penarikan yang menunggu verifikasi</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          Total Client Didapat <UserRound class="h-4 w-4 text-indigo-600" />
        </div>
        <p class="text-2xl font-extrabold text-slate-800">{{ dashboard?.totalLeads ?? 0 }}</p>
        <p class="mt-1 text-xs text-slate-500">Pendaftar yang memakai kode referral Anda</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          Total Pelanggan <Users class="h-4 w-4 text-cyan-600" />
        </div>
        <p class="text-2xl font-extrabold text-slate-800">{{ dashboard?.totalClients ?? 0 }}</p>
        <p class="mt-1 text-xs text-slate-500">Client yang sudah dikonversi menjadi pelanggan</p>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          Total Komisi <TrendingUp class="h-4 w-4 text-violet-600" />
        </div>
        <p class="text-2xl font-extrabold text-slate-800">{{ formatCurrency(dashboard?.salesTotalEarned ?? 0) }}</p>
        <p class="mt-1 text-xs text-slate-500">Akumulasi komisi referral pelanggan</p>
      </article>
    </section>

    <section class="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="font-bold text-slate-800">Kode Referral Sales</h2>
        <p class="mt-1 text-sm text-slate-500">Bagikan kode ini. Pendaftar yang menggunakannya akan tercatat di dashboard Anda.</p>
      </div>
      <div class="flex items-center gap-2">
        <code class="rounded-xl border border-indigo-100 bg-white px-4 py-2.5 font-mono font-bold text-indigo-700">
          {{ dashboard?.salesReferralCode || (loading ? 'Memuat...' : 'Belum tersedia') }}
        </code>
        <button
          type="button"
          @click="copyReferralCode"
          :disabled="!dashboard?.salesReferralCode"
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Copy class="h-4 w-4" /> {{ copied ? 'Tersalin' : 'Salin' }}
        </button>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="font-bold text-slate-800">Client dari Referral</h2>
          <p class="mt-1 text-xs text-slate-500">Prospek dan pelanggan yang mendaftar menggunakan kode Anda.</p>
        </div>
        <button
          type="button"
          @click="isWithdrawalFormOpen = !isWithdrawalFormOpen"
          :disabled="(dashboard?.availableBalance ?? 0) <= 0"
          class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ajukan Penarikan
        </button>
      </div>

      <form v-if="isWithdrawalFormOpen" class="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2" @submit.prevent="handleWithdrawal">
        <label class="text-xs font-semibold text-slate-600">
          Nominal penarikan
          <input v-model="withdrawalForm.amount" type="number" min="1" :max="dashboard?.availableBalance ?? 0" required class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Bank / E-Wallet
          <input v-model="withdrawalForm.bankOrWallet" type="text" required placeholder="Contoh: BCA / GoPay" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Nomor rekening / akun
          <input v-model="withdrawalForm.accountNumber" type="text" required class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label class="text-xs font-semibold text-slate-600">
          Nama pemilik rekening
          <input v-model="withdrawalForm.accountHolder" type="text" required class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <label class="text-xs font-semibold text-slate-600 sm:col-span-2">
          Catatan (opsional)
          <input v-model="withdrawalForm.notes" type="text" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
        </label>
        <div class="flex gap-2 sm:col-span-2">
          <button type="submit" :disabled="withdrawalLoading" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {{ withdrawalLoading ? 'Mengirim...' : 'Kirim Permintaan' }}
          </button>
          <button type="button" @click="isWithdrawalFormOpen = false" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            Batal
          </button>
        </div>
      </form>

      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="px-4 py-3 font-semibold">Nama Client / Usaha</th>
              <th class="px-4 py-3 font-semibold">Kontak</th>
              <th class="px-4 py-3 font-semibold">Jenis</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold">Tanggal Daftar</th>
              <th class="px-4 py-3 font-semibold">Komisi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clientsLoading" class="text-slate-500"><td colspan="6" class="px-4 py-8 text-center">Memuat client...</td></tr>
            <tr v-else-if="!clients.length" class="text-slate-500"><td colspan="6" class="px-4 py-8 text-center">Belum ada client yang memakai kode referral Anda.</td></tr>
            <tr v-for="client in clients" :key="`${client.source}-${client.id}`" class="border-t border-slate-100">
              <td class="px-4 py-3">
                <div class="font-semibold text-slate-800">{{ client.businessName || client.name }}</div>
                <div class="text-xs text-slate-500">{{ client.name }}</div>
              </td>
              <td class="px-4 py-3 text-slate-600">
                <div>{{ client.email }}</div>
                <div class="text-xs text-slate-500">{{ client.phone }}</div>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ client.source === 'Customer' ? 'Pelanggan' : 'Prospek' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ client.status }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDate(client.createdAt || client.registeredAt) }}</td>
              <td class="px-4 py-3 font-semibold text-slate-800">{{ formatCurrency(client.commission ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div class="border-b border-slate-200 px-5 py-4">
        <h2 class="font-bold text-slate-800">Riwayat Penarikan</h2>
      </div>
      <div v-if="withdrawalLoading && !withdrawals.length" class="px-5 py-8 text-center text-sm text-slate-500">Memuat riwayat penarikan...</div>
      <div v-else-if="!withdrawals.length" class="px-5 py-8 text-center text-sm text-slate-500">Belum ada permintaan penarikan.</div>
      <div v-else class="divide-y divide-slate-100">
        <div v-for="item in withdrawals" :key="item.id" class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-semibold text-slate-800">{{ formatCurrency(item.amount) }} · {{ item.bankOrWallet }}</p>
            <p class="text-xs text-slate-500">No. Rekening / Akun: <span class="font-medium text-slate-700">{{ item.accountNumber || '-' }}</span></p>
            <p class="text-xs text-slate-500">Atas Nama: <span class="font-medium text-slate-700">{{ item.accountHolder || '-' }}</span> · {{ formatDate(item.requestDate) }}</p>
            <a
              v-if="item.paymentProofUrl"
              :href="resolveReceiptUrl(item.paymentProofUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Bukti Pembayaran
            </a>
          </div>
          <span class="w-fit rounded-full border px-3 py-1 text-xs font-semibold" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

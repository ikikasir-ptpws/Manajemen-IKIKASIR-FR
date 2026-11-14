<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Upload,
  Users,
  UserRound,
  Wallet,
  X,
  XCircle,
} from 'lucide-vue-next'
import { resolveReceiptUrl, salesApi, uploadApi } from '../../api'
import { normalizeWaNumber } from '../../composables/useReferralWithdrawal'
import type { SalesClientItem, SalesDashboard, SalesListItem, SalesWithdrawal } from '../../types/sales'

const route = useRoute()
const router = useRouter()

const salesList = ref<SalesListItem[]>([])
const detail = ref<SalesDashboard | null>(null)
const clients = ref<SalesClientItem[]>([])
const withdrawals = ref<SalesWithdrawal[]>([])
const loading = ref(false)
const detailLoading = ref(false)
const error = ref<string | null>(null)
const withdrawalToApprove = ref<SalesWithdrawal | null>(null)
const approvedWithdrawal = ref<SalesWithdrawal | null>(null)
const isApprovalModalOpen = ref(false)
const isUploadingProof = ref(false)
const isApprovingWithdrawal = ref(false)
const isSharingProof = ref(false)
const approvalError = ref<string | null>(null)
const whatsappShareNotice = ref<string | null>(null)
const whatsappShareError = ref<string | null>(null)
const approvalForm = ref({
  transferReference: '',
  notes: 'Penarikan komisi telah dibayarkan oleh Super Admin.',
  paymentProofUrl: '',
  paymentProofFileName: '',
})

const currentRole = computed(() => {
  try {
    const rawUser = localStorage.getItem('ikikasir_user')
    if (rawUser) {
      const parsed = JSON.parse(rawUser)
      if (parsed?.role) return parsed.role
    }
  } catch {
    // fallback
  }

  return localStorage.getItem('ikikasir_current_role_v1') || 'Sales'
})

const canProcessWithdrawals = computed(() =>
  (currentRole.value || '').trim().toLowerCase().includes('super')
)

const isDetailView = computed(() => Boolean(route.params.userId))
const hasValidSalesPhone = computed(() => {
  const digits = (detail.value?.phone || '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
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
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const statusBadgeClass = (status: string) => {
  if (status === 'SELESAI') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'DITOLAK') return 'bg-rose-50 text-rose-700 border border-rose-200'
  return 'bg-amber-50 text-amber-700 border border-amber-200'
}

const statusLabel = (status: string) => {
  if (status === 'MENUNGGU_VERIFIKASI') return 'Menunggu Verifikasi'
  if (status === 'SELESAI') return 'Selesai'
  if (status === 'DITOLAK') return 'Ditolak'
  return status
}

const whatsappUrl = computed(() => {
  const withdrawal = approvedWithdrawal.value
  const phone = normalizeWaNumber(detail.value?.phone || '')
  if (!withdrawal || !hasValidSalesPhone.value || !phone || !withdrawal.paymentProofUrl) return ''

  const proofUrl = resolveReceiptUrl(withdrawal.paymentProofUrl)
  const message = [
    `Halo ${detail.value?.name || 'Sales'},`,
    '',
    'Penarikan komisi Anda telah disetujui dan dibayarkan.',
    `Nominal: ${formatCurrency(withdrawal.amount)}`,
    `Bank/E-Wallet: ${withdrawal.bankOrWallet || '-'}`,
    `Nomor rekening/akun: ${withdrawal.accountNumber || '-'}`,
    `Atas nama: ${withdrawal.accountHolder || '-'}`,
    `Nomor referensi: ${withdrawal.transferReference || '-'}`,
    `Nomor invoice: ${withdrawal.invoiceNo || '-'}`,
    `Bukti pembayaran: ${proofUrl}`,
    '',
    'Terima kasih.',
    'Tim IKIKASIR',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
})

const whatsappAttachmentMessage = computed(() => {
  const withdrawal = approvedWithdrawal.value
  if (!withdrawal) return ''

  return [
    `Halo ${detail.value?.name || 'Sales'},`,
    '',
    'Penarikan komisi Anda telah disetujui dan dibayarkan.',
    `Nominal: ${formatCurrency(withdrawal.amount)}`,
    `Bank/E-Wallet: ${withdrawal.bankOrWallet || '-'}`,
    `Nomor rekening/akun: ${withdrawal.accountNumber || '-'}`,
    `Atas nama: ${withdrawal.accountHolder || '-'}`,
    `Nomor referensi: ${withdrawal.transferReference || '-'}`,
    `Nomor invoice: ${withdrawal.invoiceNo || '-'}`,
    'Bukti pembayaran terlampir sebagai gambar.',
    '',
    'Terima kasih.',
    'Tim IKIKASIR',
  ].join('\n')
})

const fetchProofFile = async (): Promise<File> => {
  const proofUrl = resolveReceiptUrl(approvedWithdrawal.value?.paymentProofUrl)
  if (!proofUrl) throw new Error('Bukti pembayaran tidak ditemukan.')

  const response = await fetch(proofUrl)
  if (!response.ok) throw new Error('Gagal mengambil file bukti pembayaran dari server.')

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('File bukti pembayaran bukan gambar yang dapat dibagikan.')
  }

  const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const invoice = approvedWithdrawal.value?.invoiceNo || approvedWithdrawal.value?.id || 'sales'
  return new File([blob], `bukti-penarikan-${invoice}.${extension}`, { type: blob.type })
}

const downloadProofFile = (file: File) => {
  const fileUrl = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
}

const shareProofToWhatsapp = async () => {
  if (!approvedWithdrawal.value) return

  isSharingProof.value = true
  whatsappShareNotice.value = null
  whatsappShareError.value = null
  try {
    const file = await fetchProofFile()
    const shareData: ShareData = {
      files: [file],
      text: whatsappAttachmentMessage.value,
      title: 'Bukti pembayaran komisi Sales',
    }

    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [file] })) {
      downloadProofFile(file)
      whatsappShareNotice.value = 'Browser ini belum mendukung lampiran langsung. Bukti sudah diunduh; buka WhatsApp lalu lampirkan file tersebut.'
      return
    }

    await navigator.share(shareData)
    whatsappShareNotice.value = 'Pilih WhatsApp pada menu berbagi, pilih chat Sales, lalu tekan Kirim untuk mengirim gambar bukti.'
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      whatsappShareNotice.value = 'Berbagi bukti dibatalkan.'
    } else {
      whatsappShareError.value = err?.message || 'Gagal menyiapkan bukti pembayaran untuk dibagikan.'
    }
  } finally {
    isSharingProof.value = false
  }
}

const fetchSalesList = async () => {
  loading.value = true
  error.value = null

  try {
    const res = await salesApi.getSalesList()
    salesList.value = res.data ?? []
  } catch (err: any) {
    error.value = err?.message || 'Gagal memuat list sales.'
    salesList.value = []
  } finally {
    loading.value = false
  }
}

const fetchDetail = async (userId: string) => {
  detailLoading.value = true
  error.value = null

  try {
    const [dashboardRes, clientsRes, withdrawalsRes] = await Promise.all([
      salesApi.getSalesDashboard(userId),
      salesApi.getSalesClients(userId, { page: 1, limit: 20 }),
      salesApi.getSalesWithdrawals(userId),
    ])

    detail.value = dashboardRes.data
    clients.value = Array.isArray(clientsRes.data) ? clientsRes.data : []
    withdrawals.value = Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []
  } catch (err: any) {
    error.value = err?.message || 'Gagal memuat detail sales.'
    detail.value = null
    clients.value = []
    withdrawals.value = []
  } finally {
    detailLoading.value = false
  }
}

const refreshData = async () => {
  if (route.params.userId) {
    await fetchDetail(String(route.params.userId))
    return
  }

  await fetchSalesList()
}

const openApprovalModal = (item: SalesWithdrawal) => {
  withdrawalToApprove.value = item
  approvedWithdrawal.value = null
  approvalError.value = null
  whatsappShareNotice.value = null
  whatsappShareError.value = null
  approvalForm.value = {
    transferReference: '',
    notes: 'Penarikan komisi telah dibayarkan oleh Super Admin.',
    paymentProofUrl: '',
    paymentProofFileName: '',
  }
  isApprovalModalOpen.value = true
}

const closeApprovalModal = () => {
  if (isUploadingProof.value || isApprovingWithdrawal.value || isSharingProof.value) return
  isApprovalModalOpen.value = false
  withdrawalToApprove.value = null
  approvedWithdrawal.value = null
  approvalError.value = null
  whatsappShareNotice.value = null
  whatsappShareError.value = null
}

const handlePaymentProofUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    approvalError.value = 'Format bukti tidak didukung. Gunakan gambar JPG, PNG, atau WEBP.'
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    approvalError.value = 'Ukuran bukti pembayaran maksimal 10MB.'
    input.value = ''
    return
  }

  approvalError.value = null
  isUploadingProof.value = true
  try {
    const response = await uploadApi.uploadFile(file)
    if (!response.data?.url) {
      throw new Error('Server tidak mengembalikan tautan bukti pembayaran.')
    }
    approvalForm.value.paymentProofUrl = response.data.url
    approvalForm.value.paymentProofFileName = file.name
  } catch (err: any) {
    approvalForm.value.paymentProofUrl = ''
    approvalForm.value.paymentProofFileName = ''
    approvalError.value = err?.message || 'Gagal mengunggah bukti pembayaran.'
  } finally {
    isUploadingProof.value = false
  }
}

const handleApproveWithdrawal = async () => {
  const item = withdrawalToApprove.value
  if (!item) return

  if (!hasValidSalesPhone.value) {
    approvalError.value = 'Nomor WhatsApp Sales belum valid. Lengkapi nomor telepon melalui Manajemen Pengguna sebelum menyetujui penarikan.'
    return
  }
  if (!approvalForm.value.paymentProofUrl) {
    approvalError.value = 'Unggah bukti pembayaran sebelum menyetujui penarikan.'
    return
  }

  approvalError.value = null
  isApprovingWithdrawal.value = true
  try {
    const response = await salesApi.confirmWithdrawal(item.id, {
      status: 'SELESAI',
      transferReference: approvalForm.value.transferReference.trim(),
      paymentProofUrl: approvalForm.value.paymentProofUrl,
      notes: approvalForm.value.notes.trim(),
    })
    if (!response.data?.id) {
      throw new Error('Server tidak mengembalikan data penarikan yang berhasil diproses.')
    }
    approvedWithdrawal.value = response.data
    if (route.params.userId) {
      await fetchDetail(String(route.params.userId))
    }
  } catch (err: any) {
    approvalError.value = err?.message || 'Gagal memproses penarikan.'
  } finally {
    isApprovingWithdrawal.value = false
  }
}

const handleRejectWithdrawal = async (item: SalesWithdrawal) => {
  const reason = window.prompt('Masukkan alasan penolakan:', 'Data rekening tidak valid')
  if (!reason || !reason.trim()) return

  try {
    await salesApi.confirmWithdrawal(item.id, {
      status: 'DITOLAK',
      rejectionReason: reason.trim(),
      notes: reason.trim(),
    })
    if (route.params.userId) {
      await fetchDetail(String(route.params.userId))
    }
  } catch (err: any) {
    error.value = err?.message || 'Gagal menolak penarikan.'
  }
}

watch(
  () => route.params.userId,
  (userId) => {
    if (userId) {
      fetchDetail(String(userId))
      return
    }

    fetchSalesList()
  },
  { immediate: true },
)

</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto select-none">
    <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-medium">
      {{ error }}
    </div>

    <header class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          v-if="isDetailView"
          @click="router.push('/list-seles')"
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>

        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            {{ isDetailView ? 'Detail Seles' : 'List Seles' }}
          </h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">
            {{ isDetailView ? 'Ringkasan kinerja, client yang diundang, dan penarikan saldo sales.' : 'Daftar sales yang terdaftar.' }}
          </p>
        </div>
      </div>

      <button
        @click="refreshData"
        :disabled="loading || detailLoading"
        class="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
      >
        <RefreshCw class="w-4 h-4" :class="loading || detailLoading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </header>

    <section v-if="!isDetailView" class="grid grid-cols-1 gap-4">
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500">Total Sales</span>
          <Users class="w-4 h-4 text-indigo-600" />
        </div>
        <h3 class="text-2xl font-extrabold text-slate-800">{{ loading ? 'Memuat...' : salesList.length }}</h3>
      </div>
    </section>

    <section v-if="!isDetailView" class="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600">
            <tr>
              <th class="px-4 py-3 font-semibold">Nama Sales</th>
              <th class="px-4 py-3 font-semibold">Email</th>
              <th class="px-4 py-3 font-semibold">Kode Referral</th>
              <th class="px-4 py-3 font-semibold">Client</th>
              <th class="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="text-slate-500">
              <td colspan="5" class="px-4 py-8 text-center">Memuat data sales...</td>
            </tr>
            <tr v-else-if="!salesList.length" class="text-slate-500">
              <td colspan="5" class="px-4 py-8 text-center">Belum ada data sales.</td>
            </tr>
            <tr v-for="item in salesList" :key="item.id" class="border-t border-slate-200 hover:bg-slate-50/70">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {{ item.name?.charAt(0)?.toUpperCase() || 'S' }}
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800">{{ item.name }}</div>
                    <div class="text-[11px] text-slate-500">{{ item.phone || 'Belum ada telepon' }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ item.email }}</td>
              <td class="px-4 py-3 text-slate-600">{{ item.salesReferralCode || '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ item.totalClients }}</td>
              <td class="px-4 py-3">
                <button
                  @click="router.push(`/list-seles/${item.id}`)"
                  class="inline-flex items-center px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="detail" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500">Saldo Tersedia</span>
            <Wallet class="w-4 h-4 text-emerald-600" />
          </div>
          <h3 class="text-xl font-extrabold text-slate-800">{{ formatCurrency(detail.availableBalance || detail.salesBalance || 0) }}</h3>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500">Total Komisi</span>
            <TrendingUp class="w-4 h-4 text-indigo-600" />
          </div>
          <h3 class="text-xl font-extrabold text-slate-800">{{ formatCurrency(detail.salesTotalEarned || 0) }}</h3>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500">Total Client</span>
            <Users class="w-4 h-4 text-cyan-600" />
          </div>
          <h3 class="text-xl font-extrabold text-slate-800">{{ detail.totalClients || 0 }}</h3>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500">Saldo Ditarik</span>
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          </div>
          <h3 class="text-xl font-extrabold text-slate-800">{{ formatCurrency(detail.salesTotalWithdrawn || 0) }}</h3>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-bold text-slate-800">{{ detail.name }}</h2>
            <p class="text-xs text-slate-500 mt-1">{{ detail.email }} · {{ detail.phone || 'Belum ada nomor' }}</p>
          </div>
          <div class="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
            {{ detail.salesReferralCode || 'Belum ada kode' }}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Status</div>
            <div class="mt-2 font-semibold text-slate-800">{{ detail.isActive ? 'Aktif' : 'Nonaktif' }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Menunggu Verifikasi</div>
            <div class="mt-2 font-semibold text-slate-800">{{ formatCurrency(detail.pendingWithdrawalAmount || 0) }}</div>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Dibuat</div>
            <div class="mt-2 font-semibold text-slate-800">{{ formatDate(detail.createdAt) }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-800 font-bold">
            <UserRound class="w-4 h-4 text-indigo-600" />
            Client yang Diundang
          </div>
          <span class="text-xs font-semibold text-slate-500">{{ clients.length }} data</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-3 font-semibold">Nama Usaha</th>
                <th class="px-4 py-3 font-semibold">Kontak</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Tanggal Daftar</th>
                <th class="px-4 py-3 font-semibold">Komisi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="detailLoading" class="text-slate-500">
                <td colspan="5" class="px-4 py-8 text-center">Memuat client...</td>
              </tr>
              <tr v-else-if="!clients.length" class="text-slate-500">
                <td colspan="5" class="px-4 py-8 text-center">Belum ada client yang dibawa oleh sales ini.</td>
              </tr>
              <tr v-for="client in clients" :key="client.id" class="border-t border-slate-200 hover:bg-slate-50/60">
                <td class="px-4 py-3">
                  <div class="font-semibold text-slate-800">{{ client.businessName || client.name }}</div>
                  <div class="text-[11px] text-slate-500">{{ client.name }}</div>
                </td>
                <td class="px-4 py-3 text-slate-600">
                  <div>{{ client.email }}</div>
                  <div class="text-[11px] text-slate-500">{{ client.phone }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ client.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ formatDate(client.createdAt || client.registeredAt) }}</td>
                <td class="px-4 py-3 font-semibold text-slate-800">{{ formatCurrency(client.commission ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-800 font-bold">
            <Wallet class="w-4 h-4 text-emerald-600" />
            Riwayat Penarikan
          </div>
          <span class="text-xs font-semibold text-slate-500">{{ withdrawals.length }} request</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1250px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-3 font-semibold">Nominal</th>
                <th class="px-4 py-3 font-semibold">Bank / E-Wallet</th>
                <th class="px-4 py-3 font-semibold">No. Rekening / Akun</th>
                <th class="px-4 py-3 font-semibold">Atas Nama</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Bukti Pembayaran</th>
                <th class="px-4 py-3 font-semibold">Tanggal</th>
                <th class="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="detailLoading" class="text-slate-500">
                <td colspan="8" class="px-4 py-8 text-center">Memuat riwayat penarikan...</td>
              </tr>
              <tr v-else-if="!withdrawals.length" class="text-slate-500">
                <td colspan="8" class="px-4 py-8 text-center">Belum ada penarikan saldo.</td>
              </tr>
              <tr v-for="item in withdrawals" :key="item.id" class="border-t border-slate-200 hover:bg-slate-50/60">
                <td class="px-4 py-3 font-semibold text-slate-800">{{ formatCurrency(item.amount || 0) }}</td>
                <td class="px-4 py-3 text-slate-600">{{ item.bankOrWallet || '-' }}</td>
                <td class="px-4 py-3 font-mono text-slate-600">{{ item.accountNumber || '-' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ item.accountHolder || '-' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" :class="statusBadgeClass(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <a
                    v-if="item.paymentProofUrl"
                    :href="resolveReceiptUrl(item.paymentProofUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink class="h-3.5 w-3.5" />
                    Lihat Bukti
                  </a>
                  <span v-else class="text-xs text-slate-400">Belum tersedia</span>
                </td>
                <td class="px-4 py-3 text-slate-600">{{ formatDate(item.requestDate) }}</td>
                <td class="px-4 py-3">
                  <div v-if="canProcessWithdrawals && item.status === 'MENUNGGU_VERIFIKASI'" class="flex items-center gap-2">
                    <button
                      @click="openApprovalModal(item)"
                      class="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Setujui
                    </button>
                    <button
                      @click="handleRejectWithdrawal(item)"
                      class="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                  <span v-else class="text-slate-400 text-xs">{{ item.status === 'MENUNGGU_VERIFIKASI' ? 'Menunggu Super Admin' : 'Sudah diproses' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <div v-else class="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 text-sm">
      Memuat detail sales...
    </div>

    <div
      v-if="isApprovalModalOpen && withdrawalToApprove"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      @click.self="closeApprovalModal"
    >
      <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 class="text-base font-bold text-slate-900">
              {{ approvedWithdrawal ? 'Penarikan Berhasil Disetujui' : 'Konfirmasi Pembayaran Sales' }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ withdrawalToApprove.salesName }} · {{ formatCurrency(withdrawalToApprove.amount) }}
            </p>
          </div>
          <button
            type="button"
            @click="closeApprovalModal"
            :disabled="isUploadingProof || isApprovingWithdrawal"
            class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
            aria-label="Tutup"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div v-if="approvedWithdrawal" class="space-y-5 p-6">
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="font-semibold text-emerald-800">Pembayaran berhasil dicatat dan saldo Sales telah diperbarui.</p>
            <p class="mt-1 text-sm text-emerald-700">Bukti pembayaran kini dapat dilihat oleh Sales di dashboard-nya.</p>
          </div>

          <a
            v-if="approvedWithdrawal.paymentProofUrl"
            :href="resolveReceiptUrl(approvedWithdrawal.paymentProofUrl)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink class="h-4 w-4" />
            Lihat Bukti Pembayaran
          </a>

          <div v-if="whatsappUrl" class="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p class="text-sm font-semibold text-slate-800">Kirim konfirmasi kepada Sales</p>
            <p class="mt-1 text-xs leading-relaxed text-slate-600">
              Bagikan gambar bukti bersama pesan. Jika browser tidak mendukung lampiran langsung, file akan diunduh agar dapat dilampirkan manual.
            </p>
            <button
              type="button"
              @click="shareProofToWhatsapp"
              :disabled="isSharingProof"
              class="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            >
              <MessageCircle class="h-4 w-4" />
              {{ isSharingProof ? 'Menyiapkan bukti...' : 'Bagikan Bukti + Konfirmasi' }}
            </button>
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-2 mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Buka Chat WhatsApp
            </a>
            <p v-if="whatsappShareNotice" class="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs leading-relaxed text-emerald-800">
              {{ whatsappShareNotice }}
            </p>
            <p v-if="whatsappShareError" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
              {{ whatsappShareError }}
            </p>
          </div>
          <p v-else class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Nomor WhatsApp Sales belum tersedia. Tambahkan nomor telepon melalui Manajemen Pengguna agar konfirmasi dapat dikirim.
          </p>

          <div class="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              @click="closeApprovalModal"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Selesai
            </button>
          </div>
        </div>

        <form v-else @submit.prevent="handleApproveWithdrawal" class="space-y-4 p-6">
          <div class="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div>
              <p class="text-xs text-slate-500">Tujuan Transfer</p>
              <p class="mt-1 font-semibold text-slate-800">{{ withdrawalToApprove.bankOrWallet }} · {{ withdrawalToApprove.accountNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Atas Nama</p>
              <p class="mt-1 font-semibold text-slate-800">{{ withdrawalToApprove.accountHolder }}</p>
            </div>
          </div>

          <div v-if="!hasValidSalesPhone" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Nomor WhatsApp Sales belum valid. Lengkapi melalui Manajemen Pengguna sebelum menyetujui penarikan.
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nomor Referensi Transfer <span class="font-normal normal-case text-slate-400">(opsional)</span>
            </label>
            <input
              v-model="approvalForm.transferReference"
              type="text"
              placeholder="Contoh: TRX-123456"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Bukti Pembayaran <span class="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="isUploadingProof || isApprovingWithdrawal"
              @change="handlePaymentProofUpload"
              class="block w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-600 file:mr-3 file:border-0 file:bg-indigo-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            />
            <p class="mt-1 text-[11px] text-slate-500">JPG, PNG, atau WEBP; maksimal 10MB.</p>
            <p v-if="isUploadingProof" class="mt-2 text-xs font-medium text-indigo-600">Mengunggah bukti pembayaran...</p>
            <div v-else-if="approvalForm.paymentProofUrl" class="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <img :src="resolveReceiptUrl(approvalForm.paymentProofUrl)" alt="Pratinjau bukti pembayaran" class="h-14 w-14 rounded-lg border border-emerald-100 object-cover" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-800">{{ approvalForm.paymentProofFileName }}</p>
                <p class="text-xs text-emerald-700">Bukti berhasil diunggah</p>
              </div>
              <a :href="resolveReceiptUrl(approvalForm.paymentProofUrl)" target="_blank" rel="noopener noreferrer" aria-label="Lihat bukti">
                <ExternalLink class="h-4 w-4 text-indigo-600" />
              </a>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Catatan</label>
            <textarea
              v-model="approvalForm.notes"
              rows="2"
              class="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <p v-if="approvalError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {{ approvalError }}
          </p>

          <div class="flex gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              @click="closeApprovalModal"
              :disabled="isUploadingProof || isApprovingWithdrawal"
              class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isUploadingProof || isApprovingWithdrawal || !approvalForm.paymentProofUrl || !hasValidSalesPhone"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload class="h-4 w-4" />
              {{ isApprovingWithdrawal ? 'Memproses...' : 'Setujui & Simpan Bukti' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

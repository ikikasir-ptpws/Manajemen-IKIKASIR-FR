<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  MapPin, 
  Filter, 
  X, 
  ChevronDown, 
  Wrench, 
  Key, 
  Download, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Phone, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  CheckCheck, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  RotateCcw, 
  Store, 
  CreditCard, 
  Calendar, 
  Check, 
  EyeOff, 
  ZoomIn, 
  Receipt, 
  User, 
  AlertCircle, 
  Building2, 
  ChevronRight, 
  Share2,
  Wallet,
  Upload,
  MessageCircle,
  Banknote
} from 'lucide-vue-next'
import RentalAgreementModal from '../../components/RentalAgreementModal.vue'
import InvoiceDetailModal from '../../components/InvoiceDetailModal.vue'
import GlobalPagination from '../../components/common/GlobalPagination.vue'
import CustomerFormModal from '../../components/crm/CustomerFormModal.vue'
import { 
  useAppData, 
  getPackageDurationMonths,
  SAMPLE_RECEIPT_BCA,
  SAMPLE_RECEIPT_QRIS,
  getCustomerWaUrl, 
  getOrCreateCustomerReferralCode 
} from '../../composables/useAppData'
import { customersApi, leadsApi, referralApi, uploadApi } from '../../api'
import { normalizeWaNumber } from '../../composables/useReferralWithdrawal'
import { preserveScrollPosition } from '../../composables/usePagination'
import type { ReferralOverview, ReferralWithdrawalItem } from '../../types/referral'
import { resolveReceiptUrl } from '../../utils/storage'

const { 
  customers, 
  leads, 
  invoices, 
  packages,
  currentUser,
  currentRole,
  technicianQueue, 
  getComputedCustomerStatus, 
  startTechnicianSetup, 
  reportEmailIssue, 
  resolveEmailIssue, 
  completeTechnicianSetup,
  syncWithBackend,
  markInvoicePaid,
  isSyncing
} = useAppData()

const availablePackages = computed(() => {
  const active = packages.value.filter(p => p.isActive !== false)
  if (active.length > 0) return active
  if (packages.value.length > 0) return packages.value
  return [
    { id: 'basic', name: 'Basic' },
    { id: 'pro', name: 'Pro' },
    { id: 'custom', name: 'Custom / IT One' }
  ]
})

onMounted(() => {
  syncWithBackend(true)
})

// Toast state
const toastMessage = ref<string | null>(null)
const showToast = (msg: string) => {
  toastMessage.value = msg
  setTimeout(() => { toastMessage.value = null }, 3500)
}

const copyReferralCode = (code: string) => {
  if (!code) return
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(code)
    showToast(`Kode referral "${code}" berhasil disalin ke clipboard!`)
  } else {
    showToast(`Kode Referral: ${code}`)
  }
}

const getInvitedLeadsForCustomer = (cust: any) => {
  if (!cust) return []
  const code = (cust.referralCode || '').toUpperCase().trim()
  const custId = cust.id
  return leads.value.filter(l => 
    (l.referredByCustomerId && l.referredByCustomerId === custId) ||
    (code && l.referralCode && l.referralCode.toUpperCase().trim() === code)
  )
}

// Search & Filter state
const searchQuery = ref('')
const showFilterDropdown = ref(false)
const filterType = ref('Semua')
const filterTeknisiStatus = ref('Semua')

// Modals
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const showAddEditModal = ref(false)
const editMode = ref(false)
const selectedCustomer = ref<any>(null)

const getCustomerPackage = (customer: any) => {
  if (!customer) return undefined
  const packageName = customer.packageName || customer.packageType || customer.type
  return packages.value.find(pkg => customer.packageId && pkg.id === customer.packageId)
    || packages.value.find(pkg => packageName && pkg.name.toLowerCase() === String(packageName).toLowerCase())
}

const getCustomerPackageName = (customer: any) => {
  return getCustomerPackage(customer)?.name
    || customer?.packageName
    || customer?.packageType
    || customer?.type
    || 'Paket belum ditentukan'
}

const getCustomerPackagePrice = (customer: any) => {
  return getCustomerPackage(customer)?.price ?? customer?.packagePrice ?? customer?.amount ?? 0
}

const selectedCustomerPackage = computed(() => getCustomerPackage(selectedCustomer.value))
const selectedCustomerPackageName = computed(() => getCustomerPackageName(selectedCustomer.value))
const selectedCustomerPackagePrice = computed(() => getCustomerPackagePrice(selectedCustomer.value))

const getCustomerPaymentMethod = (customer: any) => {
  const method = typeof customer?.paymentMethod === 'string' ? customer.paymentMethod.trim() : ''
  return method
    .replace(/\s*\(PT PUNDI MAS BERKAH\)/i, '')
    .replace(/\s*[•-]\s*PT PUNDI MAS BERKAH/i, '')
    .trim() || 'Belum ada data'
}

const getPaymentStatusLabel = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'Lunas'
    case 'PENDING':
      return 'Menunggu pembayaran'
    case 'FAILED':
      return 'Gagal'
    default:
      return 'Belum ada data'
  }
}

const canDeleteCustomer = computed(() => {
  const activeRole = (currentRole.value || '').trim()
  if (activeRole.toLowerCase().includes('super')) return true

  if (typeof localStorage !== 'undefined') {
    const storedRoles = localStorage.getItem('ikikasir_roles_v2')
    if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles)
        const role = Array.isArray(roles)
          ? roles.find((item: any) => (item.name || '').trim().toLowerCase() === activeRole.toLowerCase())
          : undefined
        const permission = role?.permissions?.semuaPelanggan?.delete
        if (typeof permission === 'boolean') return permission
      } catch (error) {
        console.warn('Gagal membaca konfigurasi izin role:', error)
      }
    }
  }

  if ((currentUser.value?.role || '').trim().toLowerCase() === activeRole.toLowerCase()) {
    const permission = currentUser.value?.roleDetail?.permissions?.semuaPelanggan?.delete
    if (typeof permission === 'boolean') return permission
  }

  return false
})

const canSetupCustomer = computed(() => {
  const activeRole = (currentRole.value || currentUser.value?.role || '').trim()
  if (activeRole.toLowerCase().includes('super')) return true

  // Cek konfigurasi role terbaru sebelum permission yang tersimpan di sesi login.
  if (typeof localStorage !== 'undefined') {
    const storedRoles = localStorage.getItem('ikikasir_roles_v2')
    if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles)
        const role = Array.isArray(roles)
          ? roles.find((item: any) => 
              (item.name || '').trim().toLowerCase() === activeRole.toLowerCase() ||
              (currentUser.value?.role && (item.name || '').trim().toLowerCase() === currentUser.value.role.trim().toLowerCase())
            )
          : undefined
        const permission = role?.permissions?.semuaPelanggan?.setup
        if (typeof permission === 'boolean') return permission
      } catch (error) {
        console.warn('Gagal membaca konfigurasi izin role:', error)
      }
    }
  }

  const userPerm = (currentUser.value?.roleDetail?.permissions as any)?.semuaPelanggan?.setup
  if (typeof userPerm === 'boolean') return userPerm

  // 3. Fallback default jika belum ada konfigurasi: hanya role teknisi default yang aktif
  const lower = activeRole.toLowerCase()
  return lower.includes('teknisi')
})

const canUpdateCustomer = computed(() => {
  const activeRole = (currentRole.value || currentUser.value?.role || '').trim()
  if (activeRole.toLowerCase().includes('super')) return true

  if (typeof localStorage !== 'undefined') {
    const storedRoles = localStorage.getItem('ikikasir_roles_v2')
    if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles)
        const role = Array.isArray(roles)
          ? roles.find((item: any) =>
              (item.name || '').trim().toLowerCase() === activeRole.toLowerCase() ||
              (currentUser.value?.role && (item.name || '').trim().toLowerCase() === currentUser.value.role.trim().toLowerCase())
            )
          : undefined
        const permission = role?.permissions?.semuaPelanggan?.update
        if (typeof permission === 'boolean') return permission
      } catch (error) {
        console.warn('Gagal membaca konfigurasi izin role:', error)
      }
    }
  }

  const userPerm = (currentUser.value?.roleDetail?.permissions as any)?.semuaPelanggan?.update
  if (typeof userPerm === 'boolean') return userPerm

  return false
})

const form = ref({ name: '', business: '', type: 'Basic' as 'Basic' | 'Pro' | 'Custom / IT One', phone: '', address: '' })

// Teknisi Metrics
const pendingTeknisiCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus && u.technicianStatus !== 'completed' && u.technicianStatus !== 'issue').length
})

const readyForSetupCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus !== 'issue' && u.technicianStatus === 'pending_setup' && !u.emailIssueReported).length
})

const inProgressCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus !== 'issue' && u.technicianStatus === 'in_progress' && !u.emailIssueReported).length
})

const issueCount = computed(() => {
  return customers.value.filter(u => u.emailIssueReported || u.technicianStatus === 'issue').length
})

const completedCount = computed(() => {
  return customers.value.filter(u => u.technicianStatus !== 'issue' && u.technicianStatus === 'completed' && !u.emailIssueReported).length
})

const activeCompletedCount = computed(() => {
  return customers.value.filter(u =>
    u.technicianStatus !== 'issue' &&
    u.technicianStatus === 'completed' &&
    !u.emailIssueReported &&
    getComputedCustomerStatus(u).computedStatus !== 'expired'
  ).length
})

const expiredCustomerCount = computed(() => {
  return customers.value.filter(u => getComputedCustomerStatus(u).computedStatus === 'expired').length
})

// Unified Filtered Customers List
const filteredCustomers = computed(() => {
  let list = customers.value.map(c => {
    const { computedStatus, daysLeft, daysExpired } = getComputedCustomerStatus(c)
    return {
      ...c,
      business: c.businessName || c.business || 'Toko',
      type: c.packageType,
      joinDate: c.expiredDate ? c.expiredDate : '2026-09-01',
      computedStatus,
      daysLeft,
      daysExpired
    }
  })

  // Filter Paket
  if (filterType.value !== 'Semua') {
    list = list.filter(c => c.type === filterType.value)
  }

  // Filter Status Teknisi & Langganan
  if (filterTeknisiStatus.value === 'Siap Dikerjakan') {
    list = list.filter(c => c.technicianStatus !== 'issue' && c.technicianStatus === 'pending_setup' && !c.emailIssueReported)
  } else if (filterTeknisiStatus.value === 'Sedang Dikerjakan') {
    list = list.filter(c => c.technicianStatus !== 'issue' && c.technicianStatus === 'in_progress' && !c.emailIssueReported)
  } else if (filterTeknisiStatus.value === 'Ada Kendala') {
    list = list.filter(c => c.emailIssueReported || c.technicianStatus === 'issue')
  } else if (filterTeknisiStatus.value === 'Selesai') {
    list = list.filter(c => c.technicianStatus !== 'issue' && c.technicianStatus === 'completed' && !c.emailIssueReported && c.computedStatus !== 'expired')
  } else if (filterTeknisiStatus.value === 'Expired') {
    list = list.filter(c => c.computedStatus === 'expired')
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.business.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  }

  // Urutan: Pelanggan yang butuh setup teknisi diprioritaskan di atas
  return list.sort((a, b) => {
    const aPending = a.technicianStatus && a.technicianStatus !== 'completed' ? 0 : 1
    const bPending = b.technicianStatus && b.technicianStatus !== 'completed' ? 0 : 1
    return aPending - bPending
  })
})

// ==========================================
// PAGINATION STATE
// ==========================================
const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() => {
  return Math.ceil(filteredCustomers.value.length / pageSize.value) || 1
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + pageSize.value, filteredCustomers.value.length)
})

const paginatedCustomers = computed(() => {
  return filteredCustomers.value.slice(startIndex.value, startIndex.value + pageSize.value)
})

const changePage = (page: number, event: Event) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  const source = event.currentTarget
  preserveScrollPosition(
    source instanceof HTMLElement ? source : null,
    () => {
      currentPage.value = page
    },
  )
}

const resetFilter = () => {
  searchQuery.value = ''
  filterType.value = 'Semua'
  filterTeknisiStatus.value = 'Semua'
  currentPage.value = 1
}

watch([searchQuery, filterType, filterTeknisiStatus, pageSize], () => {
  currentPage.value = 1
})

// Detail Modal State & Helpers
const activeDetailTab = ref<'profil' | 'langganan' | 'teknisi'>('profil')
const isPasswordVisible = ref(false)
const isEditingCredentials = ref(false)
const isSavingCredentials = ref(false)
const credentialError = ref('')
const credentialForm = ref({ email: '', password: '' })
const copiedField = ref<string | null>(null)
const isReceiptZoomOpen = ref(false)
const zoomedReceiptUrl = ref<string | null>(null)

const openReceiptZoom = (url: string) => {
  if (!url) return
  zoomedReceiptUrl.value = resolveReceiptUrl(url)
  isReceiptZoomOpen.value = true
}

const handleImageLoadError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) target.style.display = 'none'
}

const copyToClipboard = (text: string, fieldName: string) => {
  if (!text) return
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text)
  }
  copiedField.value = fieldName
  showToast(`📋 ${fieldName} berhasil disalin!`)
  setTimeout(() => {
    if (copiedField.value === fieldName) copiedField.value = null
  }, 2000)
}

const getAssociatedLead = (cust: any) => {
  if (!cust || !leads.value) return null
  return leads.value.find((l: any) => 
    (cust.leadId && l.id === cust.leadId) || 
    (l.phone && cust.phone && l.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '')) ||
    (l.email && cust.email && l.email.toLowerCase() === cust.email.toLowerCase()) ||
    (l.name && cust.name && l.name.toLowerCase() === cust.name.toLowerCase())
  ) || null
}

const getAssociatedInvoices = (cust: any) => {
  if (!cust || !invoices.value) return []
  return invoices.value.filter((inv: any) => 
    inv.customerId === cust.id || 
    (cust.phone && inv.phone && inv.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '')) ||
    (cust.name && inv.customerName && inv.customerName.toLowerCase() === cust.name.toLowerCase())
  )
}

const formatStorageUrl = (url?: string): string => {
  return resolveReceiptUrl(url)
}

const getCustomerPaymentProof = (cust: any) => {
  if (!cust) return ''
  const lead = getAssociatedLead(cust)
  const invs = getAssociatedInvoices(cust)
  const sampleProofs = [SAMPLE_RECEIPT_BCA, SAMPLE_RECEIPT_QRIS]
  const proof = [
    cust.paymentProofUrl,
    lead?.paymentProofUrl,
    ...invs.map((invoice: any) => invoice.paymentProofUrl)
  ].find((url: string | undefined) => url && !sampleProofs.includes(url))
  return proof ? formatStorageUrl(proof) : ''
}

const getCustomerCredentials = (cust: any) => {
  if (!cust) return { username: '', password: '', apkUrl: '', guideUrl: '', spkNumber: '' }
  const username = cust.appUsername || cust.email || ''
  const password = cust.appPassword || ''
  const apkUrl = cust.appDownloadUrl || 'https://ikikasir.com/download/ikikasir-pos-v2.apk'
  const guideUrl = cust.guideBookUrl || 'https://ikikasir.com/docs/buku-panduan-ikikasir.pdf'
  const spkNumber = cust.rentalAgreementNumber || ('SPK/IKIKASIR/' + new Date().getFullYear() + '/' + (cust.id ? cust.id.replace(/\D/g, '').slice(-3) || '101' : '101'))
  return { username, password, apkUrl, guideUrl, spkNumber }
}

const openDetail = (cust: any) => {
  const statusInfo = getComputedCustomerStatus(cust)
  selectedCustomer.value = {
    ...cust,
    computedStatus: statusInfo.computedStatus,
    daysLeft: statusInfo.daysLeft,
    daysExpired: statusInfo.daysExpired
  }
  activeDetailTab.value = 'profil'
  isPasswordVisible.value = false
  isEditingCredentials.value = false
  credentialError.value = ''
  showDetailModal.value = true

  if (cust?.id) {
    loadCustomerReferralData(cust.id)
  }
}

const beginEditCredentials = () => {
  if (!canUpdateCustomer.value || !selectedCustomer.value) return
  credentialForm.value = {
    email: selectedCustomer.value.appUsername || selectedCustomer.value.email || '',
    password: ''
  }
  credentialError.value = ''
  isEditingCredentials.value = true
}

const cancelEditCredentials = () => {
  isEditingCredentials.value = false
  credentialError.value = ''
  credentialForm.value.password = ''
}

const saveCustomerCredentials = async () => {
  const target = selectedCustomer.value
  if (!canUpdateCustomer.value || !target) return

  const email = credentialForm.value.email.trim().toLowerCase()
  const password = credentialForm.value.password.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    credentialError.value = 'Format email akun tidak valid.'
    return
  }
  if (password && password.length < 6) {
    credentialError.value = 'Password minimal 6 karakter.'
    return
  }

  isSavingCredentials.value = true
  credentialError.value = ''
  try {
    await customersApi.update(target.id, {
      email,
      appUsername: email,
      ...(password ? { appPassword: password } : {})
    })

    const updatedCredentials = {
      email,
      appUsername: email,
      ...(password ? { appPassword: password } : {})
    }
    Object.assign(target, updatedCredentials)
    const storedCustomer = customers.value.find(customer => customer.id === target.id)
    if (storedCustomer) Object.assign(storedCustomer, updatedCredentials)
    localStorage.setItem('ikikasir_customers_v4', JSON.stringify(customers.value))

    isEditingCredentials.value = false
    isPasswordVisible.value = false
    credentialForm.value.password = ''
    showToast('Detail akun pelanggan berhasil diperbarui di Webbase.')
  } catch (error: any) {
    credentialError.value = error?.message || 'Gagal memperbarui detail akun pelanggan.'
  } finally {
    isSavingCredentials.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL & ACC PENARIKAN SALDO KOMISI PENGGUNA (DARI APLIKASI ANDROID)
// ─────────────────────────────────────────────────────────────────────────────
const customerReferralOverview = ref<ReferralOverview | null>(null)
const customerReferralLoading = ref(false)
const customerWithdrawals = ref<ReferralWithdrawalItem[]>([])

const withdrawalToApprove = ref<ReferralWithdrawalItem | null>(null)
const approvedWithdrawal = ref<ReferralWithdrawalItem | null>(null)
const isApprovalModalOpen = ref(false)
const returnToCustomerDetailAfterWithdrawalDialog = ref(false)
const isUploadingProof = ref(false)
const isApprovingWithdrawal = ref(false)
const isSharingProof = ref(false)
const approvalError = ref<string | null>(null)
const whatsappShareNotice = ref<string | null>(null)
const whatsappShareError = ref<string | null>(null)

const approvalForm = ref({
  transferReference: '',
  notes: 'Penarikan komisi referral telah dibayarkan oleh Super Admin.',
  paymentProofUrl: '',
  paymentProofFileName: '',
})

// Modal Tolak Penarikan
const withdrawalToReject = ref<ReferralWithdrawalItem | null>(null)
const isRejectModalOpen = ref(false)
const rejectReason = ref('')
const isRejectingWithdrawal = ref(false)

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0)

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const withdrawalStatusBadgeClass = (status: string) => {
  if (status === 'SELESAI') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'DITOLAK') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const withdrawalStatusLabel = (status: string) => {
  if (status === 'MENUNGGU_VERIFIKASI') return 'Menunggu Verifikasi'
  if (status === 'SELESAI') return 'Selesai'
  if (status === 'DITOLAK') return 'Ditolak'
  return status
}

const hasValidCustomerPhone = computed(() => {
  const digits = (selectedCustomer.value?.phone || '').replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
})

const customerWaUrl = computed(() => {
  const withdrawal = approvedWithdrawal.value
  const phone = normalizeWaNumber(selectedCustomer.value?.phone || '')
  if (!withdrawal || !hasValidCustomerPhone.value || !phone) return ''

  const message = [
    `Halo ${selectedCustomer.value?.name || 'Pelanggan'},`,
    '',
    'Penarikan komisi referral Anda telah disetujui dan dibayarkan.',
    `Nominal: ${formatCurrency(withdrawal.amount)}`,
    `Bank/E-Wallet: ${withdrawal.bankOrWallet || '-'}`,
    `Nomor rekening/akun: ${withdrawal.accountNumber || '-'}`,
    `Atas nama: ${withdrawal.accountHolder || '-'}`,
    `Nomor referensi: ${withdrawal.transferReference || '-'}`,
    `Nomor invoice: ${withdrawal.invoiceNo || '-'}`,
    '',
    'Terima kasih telah menggunakan IKIKASIR.',
    'Tim IKIKASIR',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
})

const whatsappAttachmentMessage = computed(() => {
  const withdrawal = approvedWithdrawal.value
  if (!withdrawal) return ''

  return [
    `Halo ${selectedCustomer.value?.name || 'Pelanggan'},`,
    '',
    'Penarikan komisi referral Anda telah disetujui dan dibayarkan.',
    `Nominal: ${formatCurrency(withdrawal.amount)}`,
    `Bank/E-Wallet: ${withdrawal.bankOrWallet || '-'}`,
    `Nomor rekening/akun: ${withdrawal.accountNumber || '-'}`,
    `Atas nama: ${withdrawal.accountHolder || '-'}`,
    `Nomor referensi: ${withdrawal.transferReference || '-'}`,
    `Nomor invoice: ${withdrawal.invoiceNo || '-'}`,
    'Bukti pembayaran terlampir sebagai gambar.',
    '',
    'Terima kasih telah menggunakan IKIKASIR.',
    'Tim IKIKASIR',
  ].join('\n')
})

const loadCustomerReferralData = async (customerId: string) => {
  if (!customerId) return
  customerReferralLoading.value = true
  try {
    const res = await referralApi.getOverview(customerId)
    if (res.data) {
      customerReferralOverview.value = res.data
      customerWithdrawals.value = res.data.withdrawals || []
    }
  } catch (err) {
    console.warn('Gagal memuat overview referral pelanggan:', err)
    customerReferralOverview.value = null
    customerWithdrawals.value = []
  } finally {
    customerReferralLoading.value = false
  }
}

const openApprovalModal = (item: ReferralWithdrawalItem) => {
  returnToCustomerDetailAfterWithdrawalDialog.value = showDetailModal.value
  showDetailModal.value = false
  withdrawalToApprove.value = item
  approvedWithdrawal.value = null
  approvalError.value = null
  whatsappShareNotice.value = null
  whatsappShareError.value = null
  approvalForm.value = {
    transferReference: item.transferReference || '',
    notes: 'Penarikan komisi referral telah dibayarkan oleh Super Admin.',
    paymentProofUrl: item.paymentProofUrl || '',
    paymentProofFileName: item.paymentProofUrl ? 'bukti-tersimpan.jpg' : '',
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
  if (returnToCustomerDetailAfterWithdrawalDialog.value) {
    showDetailModal.value = true
  }
  returnToCustomerDetailAfterWithdrawalDialog.value = false
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

  if (!hasValidCustomerPhone.value) {
    approvalError.value = 'Nomor WhatsApp pelanggan belum valid. Perbarui nomor telepon pelanggan sebelum menyetujui penarikan.'
    return
  }
  if (!approvalForm.value.paymentProofUrl) {
    approvalError.value = 'Unggah bukti pembayaran sebelum menyetujui penarikan.'
    return
  }

  approvalError.value = null
  isApprovingWithdrawal.value = true
  try {
    const response = await referralApi.confirmWithdrawal(item.id, {
      status: 'SELESAI',
      transferReference: approvalForm.value.transferReference.trim() || undefined,
      paymentProofUrl: approvalForm.value.paymentProofUrl,
      notes: approvalForm.value.notes.trim() || undefined,
    })
    if (!response.data?.id) {
      throw new Error('Server tidak mengembalikan data penarikan yang berhasil diproses.')
    }
    approvedWithdrawal.value = response.data as any
    showToast(`Penarikan ${formatCurrency(item.amount)} berhasil disetujui!`)
    if (selectedCustomer.value?.id) {
      await loadCustomerReferralData(selectedCustomer.value.id)
    }
  } catch (err: any) {
    approvalError.value = err?.message || 'Gagal memproses penarikan.'
  } finally {
    isApprovingWithdrawal.value = false
  }
}

const openRejectWithdrawalModal = (item: ReferralWithdrawalItem) => {
  returnToCustomerDetailAfterWithdrawalDialog.value = showDetailModal.value
  showDetailModal.value = false
  withdrawalToReject.value = item
  rejectReason.value = ''
  isRejectModalOpen.value = true
}

const closeRejectWithdrawalModal = () => {
  if (isRejectingWithdrawal.value) return
  isRejectModalOpen.value = false
  withdrawalToReject.value = null
  rejectReason.value = ''
  if (returnToCustomerDetailAfterWithdrawalDialog.value) {
    showDetailModal.value = true
  }
  returnToCustomerDetailAfterWithdrawalDialog.value = false
}

const handleConfirmRejectWithdrawal = async () => {
  const item = withdrawalToReject.value
  if (!item) return

  if (!rejectReason.value.trim()) {
    showToast('Alasan penolakan wajib diisi.')
    return
  }

  isRejectingWithdrawal.value = true
  try {
    await referralApi.confirmWithdrawal(item.id, {
      status: 'DITOLAK',
      rejectionReason: rejectReason.value.trim(),
      notes: rejectReason.value.trim(),
    })
    isRejectModalOpen.value = false
    withdrawalToReject.value = null
    rejectReason.value = ''
    showToast('Pengajuan penarikan berhasil ditolak.')
    if (selectedCustomer.value?.id) {
      await loadCustomerReferralData(selectedCustomer.value.id)
    }
    if (returnToCustomerDetailAfterWithdrawalDialog.value) {
      showDetailModal.value = true
    }
    returnToCustomerDetailAfterWithdrawalDialog.value = false
  } catch (err: any) {
    showToast(err?.message || 'Gagal menolak penarikan.')
  } finally {
    isRejectingWithdrawal.value = false
  }
}

const fetchProofFile = async (): Promise<File> => {
  const proofUrl = resolveReceiptUrl(approvedWithdrawal.value?.paymentProofUrl || '')
  if (!proofUrl) throw new Error('Bukti pembayaran tidak ditemukan.')

  const response = await fetch(proofUrl)
  if (!response.ok) throw new Error('Gagal mengambil file bukti pembayaran dari server.')

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('File bukti pembayaran bukan gambar yang dapat dibagikan.')
  }

  const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const invoice = approvedWithdrawal.value?.invoiceNo || approvedWithdrawal.value?.id || 'pengguna'
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
      title: 'Bukti Pembayaran Komisi Referral Pengguna',
    }

    if (
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function' ||
      !navigator.canShare({ files: [file] })
    ) {
      downloadProofFile(file)
      whatsappShareNotice.value = 'Browser ini belum mendukung lampiran langsung. Bukti sudah diunduh; buka WhatsApp lalu lampirkan file tersebut.'
      return
    }

    await navigator.share(shareData)
    whatsappShareNotice.value = 'Pilih WhatsApp pada menu berbagi, pilih chat Pelanggan, lalu tekan Kirim untuk mengirim gambar bukti.'
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

const openEditFromDetail = () => {
  const cust = selectedCustomer.value
  showDetailModal.value = false
  openEdit(cust)
}

const openSetupFromDetail = () => {
  const cust = selectedCustomer.value
  openSetupModal(cust)
}

const openAgreementFromDetail = () => {
  openInvoiceFromDetail(selectedCustomer.value)
}

const openInvoiceFromDetail = (user?: any) => {
  const target = user || selectedCustomer.value || selectedSetupUser.value
  if (!target) return
  
  // Cari apakah ada invoice yang sudah tersimpan di sistem
  const matchedInvoices = getAssociatedInvoices(target)
  const existingInv = matchedInvoices.length > 0 ? matchedInvoices[0] : null
  
  const invoiceNum = existingInv?.id || target.invoiceNumber || ('INV-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + (target.id ? String(target.id).replace(/\D/g, '').slice(-4) || '1001' : '1001'))
  
  const pkg = getCustomerPackageName(target)
  const matchedPkg = packages.value.find(p => (target.packageId && p.id === target.packageId) || (p.name && p.name.toLowerCase() === String(pkg).toLowerCase()))
  const defaultMonths = getPackageDurationMonths(matchedPkg)
  const amt = existingInv?.amount ?? target.amount ?? target.paymentAmount ?? matchedPkg?.price ?? 0
  const stat = existingInv?.status || ((target.status === 'active' || target.status === 'Aktif') ? 'Paid' : 'Pending')

  const lead = getAssociatedLead(target)
  const phoneVal = target.phone || target.whatsapp || lead?.phone || lead?.whatsapp || existingInv?.phone || ''
  const emailVal = target.email || lead?.email || existingInv?.email || ''
  const addressVal = target.address || lead?.address || existingInv?.address || 'Pasuruan, Jawa Timur'

  selectedInvoiceData.value = {
    id: invoiceNum,
    customerId: target.id,
    customerName: target.name || existingInv?.customerName,
    businessName: target.business || target.businessName || existingInv?.businessName || 'Toko',
    phone: phoneVal,
    email: emailVal,
    address: addressVal,
    package: pkg,
    amount: amt,
    billingCycleMonths: existingInv?.billingCycleMonths || defaultMonths || 1,
    date: existingInv?.date || target.registrationDate || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    paymentMethod: existingInv?.paymentMethod || getCustomerPaymentMethod(target),
    status: stat,
    paymentProofUrl: getCustomerPaymentProof(target) || existingInv?.paymentProofUrl
  }
  isInvoiceOpen.value = true
}

const handleInvoiceMarkPaid = (invId: string) => {
  markInvoicePaid(invId)
  if (selectedInvoiceData.value) {
    selectedInvoiceData.value.status = 'Paid'
  }
  if (selectedCustomer.value) {
    selectedCustomer.value.status = 'active'
  }
  showToast(`✅ Invoice #${invId} berhasil ditandai LUNAS!`)
}

const openEdit = (cust: any) => {
  editMode.value = true
  selectedCustomer.value = cust
  showAddEditModal.value = true
}

const openAdd = () => {
  editMode.value = false
  selectedCustomer.value = null
  showAddEditModal.value = true
}

const handleCustomerSaved = (savedCust: any) => {
  showToast(`Data pelanggan "${savedCust.name}" berhasil disimpan!`)
  showAddEditModal.value = false
}

const confirmDelete = (cust: any) => {
  if (!canDeleteCustomer.value) {
    showToast('Role Anda tidak memiliki izin untuk menghapus pelanggan.')
    return
  }
  selectedCustomer.value = cust
  showDeleteConfirm.value = true
}

const deleteCustomer = () => {
  if (!canDeleteCustomer.value) {
    showDeleteConfirm.value = false
    showToast('Role Anda tidak memiliki izin untuk menghapus pelanggan.')
    return
  }
  if (!selectedCustomer.value) return
  const cust = selectedCustomer.value
  customers.value = customers.value.filter(c => c.id !== cust.id)
  customersApi.delete(cust.id).catch(err => console.warn('Backend customersApi.delete warning:', err))
  showToast(`Pelanggan "${cust.name}" berhasil dihapus!`)
  showDeleteConfirm.value = false
  selectedCustomer.value = null
}

// ==========================================
// TEKNISI SETUP & STATUS WORKFLOW
// ==========================================
const isSetupModalOpen = ref(false)
const selectedSetupUser = ref<any>(null)
const selectedTechStatus = ref<'pending_setup' | 'in_progress' | 'issue' | 'completed'>('pending_setup')
const techIssueNotes = ref('')

// Invoice Detail Modal State
const isInvoiceOpen = ref(false)
const selectedInvoiceData = ref<any>(null)

// Rental Agreement Preview Modal State
const isRentalAgreementOpen = ref(false)
const rentalAgreementData = ref<any>(null)

const openSetupModal = (user: any) => {
  selectedSetupUser.value = user
  if (user.emailIssueReported || user.technicianStatus === 'issue') {
    selectedTechStatus.value = 'issue'
    techIssueNotes.value = user.emailIssueNotes || 'Kendala konfirmasi data / kontak pelanggan'
  } else if (user.technicianStatus === 'completed') {
    selectedTechStatus.value = 'completed'
    techIssueNotes.value = ''
  } else if (user.technicianStatus === 'in_progress') {
    selectedTechStatus.value = 'in_progress'
    techIssueNotes.value = ''
  } else {
    selectedTechStatus.value = 'pending_setup'
    techIssueNotes.value = ''
  }
  isSetupModalOpen.value = true
}

const saveSetupStatus = async () => {
  if (!selectedSetupUser.value) return
  const id = selectedSetupUser.value.id
  const target = customers.value.find(c => c.id === id)
  if (!target) return

  const isIssue = selectedTechStatus.value === 'issue'
  const isCompleted = selectedTechStatus.value === 'completed'
  const isPending = selectedTechStatus.value === 'pending_setup'

  const finalTechStatus = isIssue ? 'issue' : (isCompleted ? 'completed' : (isPending ? 'pending_setup' : 'in_progress'))

  target.technicianStatus = finalTechStatus
  target.emailIssueReported = isIssue
  target.emailIssueNotes = isIssue ? (techIssueNotes.value || 'Ada kendala teknis / verifikasi data.') : undefined

  if (isCompleted) {
    target.status = 'active'
    target.setupCompletedAt = new Date().toLocaleDateString('id-ID')
  }

  // Update lead matching
  const lead = leads.value?.find(l => l.id === id || l.phone === target.phone || (target.notes && target.notes.includes(l.id)))
  if (lead) {
    lead.technicianStatus = finalTechStatus
    lead.emailIssueReported = isIssue
    lead.emailIssueNotes = target.emailIssueNotes
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('ikikasir_customers_v4', JSON.stringify(customers.value))
    if (leads.value) localStorage.setItem('ikikasir_leads_v4', JSON.stringify(leads.value))
  }

  // Simpan permanen ke Backend Database PostgreSQL
  if (!target.id.startsWith('cust-')) {
    try {
      await customersApi.update(target.id, {
        technicianStatus: finalTechStatus,
        ...(isCompleted ? { status: 'ACTIVE' } : {})
      })
    } catch (err: any) {
      console.warn('Backend customersApi.update warning:', err)
    }
  }

  if (lead && !lead.id.startsWith('c-')) {
    try {
      await leadsApi.update(lead.id, {
        technicianStatus: finalTechStatus,
        emailIssueReported: isIssue,
        emailIssueNotes: target.emailIssueNotes
      })
    } catch (err: any) {
      console.warn('Backend leadsApi.update warning:', err)
    }
  }

  const statusLabel = isIssue 
    ? 'Ada Kendala' 
    : (isCompleted ? 'Selesai (Aplikasi Diberikan)' : (selectedTechStatus.value === 'in_progress' ? 'Sedang Pengerjaan' : 'Siap Dikerjakan'))
  showToast(`✅ Status pengerjaan "${target.name}" berhasil diubah menjadi: ${statusLabel}`)
  isSetupModalOpen.value = false
}

// Redirect ke WA Pelanggan (Kendala / Selesai / Expired / Kontak Umum)
const redirectToWa = (user: any, mode: 'issue' | 'completed' | 'expired' | 'custom' = 'custom') => {
  if (!user) return
  const phone = (user.phone || '').replace(/[^0-9]/g, '')
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : (phone.startsWith('62') ? phone : '62' + phone)
  const name = user.name || 'Pelanggan'
  const business = user.businessName || user.business || 'Toko'

  let text = ''
  if (mode === 'issue') {
    const reason = techIssueNotes.value || user.emailIssueNotes || 'Kendala verifikasi data akun / email kasir'
    text = `Halo Kak ${name} (${business}), salam dari tim Teknisi IKI KASIR 🙏\n\nSaat ini kami sedang menyiapkan sistem & akun aplikasi kasir Anda. Namun, kami mendapati kendala:\n"${reason}"\n\nMohon konfirmasinya ya Kak agar kami dapat segera melanjutkan dan menyelesaikan penyiapan aplikasi. Terima kasih!`
  } else if (mode === 'expired') {
    const expiredStr = user.expiredDate || 'baru-baru ini'
    const daysExp = user.daysExpired ? ` (${user.daysExpired} hari yang lalu)` : ''
    text = `Halo Kak ${name} (${business}), kami dari tim IKI KASIR menginformasikan bahwa masa aktif paket kasir Anda telah berakhir pada ${expiredStr}${daysExp}.\n\nAgar operasional transaksi kasir tetap lancar dan tidak terhenti, yuk segera lakukan perpanjangan langganan Kak 🙏\n\nJika ingin memperpanjang paket atau ada kendala yang ingin ditanyakan, silakan balas pesan ini ya Kak. Terima kasih! ✨`
  } else if (mode === 'completed') {
    text = `Halo Kak ${name} (${business}), kabar gembira! 🚀\n\nPenyiapan sistem dan akun aplikasi IKI KASIR untuk usaha Anda telah SELESAI dan siap digunakan.\n\nJika Kakak membutuhkan panduan atau bantuan awal pengoperasian kasir, tim kami siap mendampingi. Selamat bertransaksi & sukses selalu untuk usahanya! 🙏✨\n\nTim Teknisi IKI KASIR`
  } else {
    text = `Halo Kak ${name} (${business}), salam dari IKI KASIR. Ada yang bisa kami bantu terkait sistem kasir Anda?`
  }

  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
}

const openAgreementPreview = (user?: any) => {
  const target = user || selectedSetupUser.value || selectedCustomer.value
  if (!target) return
  rentalAgreementData.value = {
    clientName: target.name,
    businessName: target.businessName || target.business || 'Toko',
    packageName: target.packageInterest || target.packageType || 'Basic',
    phone: target.phone,
    email: target.email,
    address: target.address || 'Indonesia',
    agreementNumber: target.rentalAgreementNumber || ('SPK/IKIKASIR/' + new Date().getFullYear() + '/' + String(Math.floor(100 + Math.random() * 900))),
    startDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    expiredDate: target.expiredDate || '2026-10-31',
    monthlyFee: getCustomerPackagePrice(target)
  }
  isRentalAgreementOpen.value = true
}
</script>

<template>
  <div class="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto select-none">
    
    <!-- Toast Notification -->
    <Transition name="slide-fade">
      <div v-if="toastMessage" class="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top duration-200">
        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Top Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Semua Pelanggan</h1>
        <p class="text-xs text-slate-500 mt-0.5">Kelola data pelanggan aktif serta proses penyiapan teknis aplikasi kasir (APK, kredensial, & surat sewa) oleh Teknisi.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button 
          @click="openAdd"
          class="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 shrink-0 cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>
    </header>

    <!-- Quick Metrics Cards (6 Status Pillars - Clickable Filters) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <!-- Total -->
      <div 
        @click="resetFilter"
        class="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        :class="filterTeknisiStatus === 'Semua' && filterType === 'Semua' && !searchQuery ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Users class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Pelanggan</span>
          <span class="text-lg font-black text-slate-800">{{ customers.length }}</span>
        </div>
      </div>

      <!-- Siap Dikerjakan -->
      <div 
        @click="filterTeknisiStatus = 'Siap Dikerjakan'"
        class="bg-white rounded-2xl p-3.5 border border-cyan-100 shadow-xs flex items-center gap-3 bg-cyan-50/20 cursor-pointer hover:border-cyan-300 transition-all"
        :class="filterTeknisiStatus === 'Siap Dikerjakan' ? 'ring-2 ring-cyan-500 bg-cyan-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
          <Clock class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-cyan-700 font-bold uppercase tracking-wider block">Siap Dikerjakan</span>
          <span class="text-lg font-black text-cyan-600">{{ readyForSetupCount }}</span>
        </div>
      </div>

      <!-- Sedang Proses -->
      <div 
        @click="filterTeknisiStatus = 'Sedang Dikerjakan'"
        class="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center gap-3 cursor-pointer hover:border-indigo-300 transition-all"
        :class="filterTeknisiStatus === 'Sedang Dikerjakan' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Wrench class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sedang Proses</span>
          <span class="text-lg font-black text-indigo-600">{{ inProgressCount }}</span>
        </div>
      </div>

      <!-- Ada Kendala -->
      <div 
        @click="filterTeknisiStatus = 'Ada Kendala'"
        class="bg-white rounded-2xl p-3.5 border border-rose-100 shadow-xs flex items-center gap-3 bg-rose-50/20 cursor-pointer hover:border-rose-300 transition-all"
        :class="filterTeknisiStatus === 'Ada Kendala' ? 'ring-2 ring-rose-500 bg-rose-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Ada Kendala</span>
          <span class="text-lg font-black text-rose-600">{{ issueCount }}</span>
        </div>
      </div>

      <!-- Aplikasi Diberikan / Selesai Aktif -->
      <div 
        @click="filterTeknisiStatus = 'Selesai'"
        class="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center gap-3 bg-emerald-50/20 cursor-pointer hover:border-emerald-300 transition-all"
        :class="filterTeknisiStatus === 'Selesai' ? 'ring-2 ring-emerald-500 bg-emerald-100/30' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Selesai (Aktif)</span>
          <span class="text-lg font-black text-emerald-600">{{ activeCompletedCount }}</span>
        </div>
      </div>

      <!-- Langganan Expired -->
      <div 
        @click="filterTeknisiStatus = 'Expired'"
        class="bg-white rounded-2xl p-3.5 border border-rose-200 shadow-xs flex items-center gap-3 bg-rose-50/30 cursor-pointer hover:border-rose-400 transition-all"
        :class="filterTeknisiStatus === 'Expired' ? 'ring-2 ring-rose-500 bg-rose-100/40' : ''"
      >
        <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertCircle class="w-5 h-5" />
        </div>
        <div>
          <span class="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Expired</span>
          <span class="text-lg font-black text-rose-600">{{ expiredCustomerCount }}</span>
        </div>
      </div>
    </div>

    <!-- Toolbar Filters -->
    <div class="bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari pelanggan berdasarkan nama / toko / no telp / email..." 
          class="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      <div class="flex items-center flex-wrap gap-2 text-xs">
        <!-- Filter Status Teknisi / Langganan -->
        <select 
          v-model="filterTeknisiStatus" 
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 cursor-pointer shadow-2xs"
        >
          <option value="Semua">Status: Semua</option>
          <option value="Siap Dikerjakan">Siap Dikerjakan ({{ readyForSetupCount }})</option>
          <option value="Sedang Dikerjakan">Sedang Dikerjakan ({{ inProgressCount }})</option>
          <option value="Ada Kendala">Ada Kendala ({{ issueCount }})</option>
          <option value="Selesai">Aplikasi Diberikan / Aktif ({{ activeCompletedCount }})</option>
          <option value="Expired">Langganan Expired ({{ expiredCustomerCount }})</option>
        </select>

        <!-- Filter Paket -->
        <select 
          v-model="filterType" 
          class="px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="Semua">Paket: Semua</option>
          <option v-for="pkg in availablePackages" :key="pkg.id" :value="pkg.name">
            {{ pkg.name }}
          </option>
        </select>

        <!-- Reset Button -->
        <button 
          @click="resetFilter"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Reset Filter"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Reset</span>
        </button>

        <!-- Sinkronkan Data Backend Button -->
        <button 
          @click="syncWithBackend(true)"
          :disabled="isSyncing"
          class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/60 font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          title="Sinkronkan dengan Database Backend"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="isSyncing ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">{{ isSyncing ? 'Menyinkronkan...' : 'Sinkronkan' }}</span>
        </button>
      </div>
    </div>

    <!-- Table Container (Desktop) -->
    <div class="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[1000px]">
          <thead>
            <tr class="text-slate-400 border-b border-slate-100 bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider">
              <th class="py-3 px-3.5 w-16 whitespace-nowrap">No</th>
              <th class="py-3 px-3.5 min-w-[200px]">Pelanggan & Toko</th>
              <th class="py-3 px-3.5 whitespace-nowrap">WhatsApp & Email</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Paket Kasir</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Status Penyiapan</th>
              <th class="py-3 px-3.5 whitespace-nowrap">Masa Aktif Expired</th>
              <th class="py-3 px-3.5 text-center whitespace-nowrap w-48">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(cust, index) in paginatedCustomers" 
              :key="cust.id" 
              class="hover:bg-slate-50/80 transition-all group cursor-pointer"
              :class="[
                cust.computedStatus === 'expired' 
                  ? 'bg-rose-50/35 hover:bg-rose-50/60' 
                  : (cust.technicianStatus === 'pending_setup' 
                    ? 'bg-cyan-50/20' 
                    : (cust.emailIssueReported || cust.technicianStatus === 'issue' ? 'bg-rose-50/20' : ''))
              ]"
              @click="openDetail(cust)"
            >
              <!-- No -->
              <td class="py-3.5 px-3.5 text-slate-400 font-mono font-bold text-[11px] whitespace-nowrap">
                {{ startIndex + index + 1 }}
              </td>
              
              <!-- Pelanggan & Bisnis -->
              <td class="py-3.5 px-3.5">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                    :class="cust.computedStatus === 'expired' ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-indigo-50 text-indigo-600'"
                  >
                    {{ cust.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors leading-snug">{{ cust.name }}</span>
                      <span 
                        v-if="cust.computedStatus === 'expired'"
                        class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs inline-flex items-center gap-0.5"
                      >
                        <AlertCircle class="w-2.5 h-2.5 shrink-0" />
                        Expired
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium leading-tight">
                      <ShieldCheck class="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{{ cust.business }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- No WhatsApp & Email -->
              <td class="py-3.5 px-3.5 font-medium whitespace-nowrap">
                <div class="text-slate-700 font-mono text-[11px] flex items-center gap-1.5">
                  <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ cust.phone }}</span>
                </div>
                
                <!-- Email Issue flag -->
                <div v-if="cust.emailIssueReported || cust.technicianStatus === 'issue'" class="mt-1" @click.stop>
                  <button 
                    @click="redirectToWa(cust, 'issue')"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 transition-colors animate-pulse cursor-pointer"
                    title="Hubungi Pelanggan via WhatsApp"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Ada Kendala (Chat WA)</span>
                  </button>
                </div>
                <div v-else class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail class="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{{ cust.email || '-' }}</span>
                </div>
              </td>

              <!-- Tipe Paket -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-md text-[11px] font-bold inline-block border"
                  :class="{
                    'bg-purple-50 text-purple-700 border-purple-200': cust.type === 'Custom / IT One',
                    'bg-indigo-50 text-indigo-700 border-indigo-200': cust.type === 'Pro',
                    'bg-slate-100 text-slate-700 border-slate-200': cust.type === 'Basic'
                  }"
                >
                  {{ cust.type }}
                </span>
              </td>
              
              <!-- Status Teknisi / Penyiapan -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <div v-if="cust.computedStatus === 'expired'" class="inline-flex flex-col gap-1 items-start">
                  <span class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                    <AlertCircle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Masa Aktif Habis</span>
                  </span>
                  <span v-if="cust.technicianStatus === 'completed'" class="text-[10px] text-slate-400 font-semibold pl-1">
                    ✓ Aplikasi Diberikan
                  </span>
                </div>
                <span 
                  v-else-if="cust.emailIssueReported || cust.technicianStatus === 'issue'"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                >
                  <AlertTriangle class="w-3.5 h-3.5 text-rose-600" />
                  <span>Ada Kendala</span>
                </span>
                <span 
                  v-else-if="cust.technicianStatus === 'completed'"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                >
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aplikasi Diberikan</span>
                </span>
                <span 
                  v-else-if="cust.technicianStatus === 'in_progress'"
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                >
                  <Wrench class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sedang Pengerjaan</span>
                </span>
                <span 
                  v-else
                  class="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                >
                  <Clock class="w-3.5 h-3.5 text-cyan-600" />
                  <span>Siap Dikerjakan</span>
                </span>
              </td>

              <!-- Masa Aktif Expired -->
              <td class="py-3.5 px-3.5 whitespace-nowrap">
                <!-- Jika Expired -->
                <div v-if="cust.computedStatus === 'expired'" class="space-y-1">
                  <div class="font-mono text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle class="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{{ cust.expiredDate || '-' }}</span>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                    <span>Expired ({{ cust.daysExpired }} Hari Lalu)</span>
                  </span>
                </div>

                <!-- Jika Segera Expired (H-7) -->
                <div v-else-if="cust.computedStatus === 'expiring'" class="space-y-1">
                  <div class="font-mono text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{{ cust.expiredDate || '-' }}</span>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span>Sisa {{ cust.daysLeft }} Hari</span>
                  </span>
                </div>

                <!-- Jika Masih Aktif Normal -->
                <div v-else class="space-y-1">
                  <div class="font-mono text-xs font-semibold text-slate-700">
                    {{ cust.expiredDate || '-' }}
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 class="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Aktif</span>
                  </span>
                </div>
              </td>

              <!-- Aksi -->
              <td class="py-3.5 px-3.5 text-center whitespace-nowrap" @click.stop>
                <div class="inline-flex items-center justify-center gap-1.5">
                  <!-- Tombol Ubah Status Setup -->
                  <button 
                    v-if="canSetupCustomer"
                    @click="openSetupModal(cust)"
                    class="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-cyan-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Ubah Status Pengerjaan Teknisi"
                  >
                    <Wrench class="w-3.5 h-3.5 shrink-0" />
                    <span>Setup</span>
                  </button>

                  <!-- Tombol Redirect ke WA jika Langganan Expired -->
                  <button 
                    v-if="cust.computedStatus === 'expired'"
                    @click="redirectToWa(cust, 'expired')"
                    class="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Follow Up Perpanjangan Langganan via WhatsApp"
                  >
                    <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                    <span>WA Expired</span>
                  </button>

                  <!-- Tombol Redirect ke WA jika Ada Kendala -->
                  <button 
                    v-else-if="cust.emailIssueReported || cust.technicianStatus === 'issue'"
                    @click="redirectToWa(cust, 'issue')"
                    class="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Hubungi Pelanggan via WhatsApp (Ada Kendala)"
                  >
                    <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                    <span>WA Kendala</span>
                  </button>

                  <!-- Tombol Redirect ke WA jika Sudah Selesai & Masih Aktif -->
                  <button 
                    v-else-if="cust.technicianStatus === 'completed'"
                    @click="redirectToWa(cust, 'completed')"
                    class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
                    title="Kirim Konfirmasi Selesai via WhatsApp"
                  >
                    <MessageSquare class="w-3.5 h-3.5 shrink-0" />
                    <span>WA Selesai</span>
                  </button>

                  <!-- Segmented Action Toolbar: Detail, Edit, Hapus -->
                  <div class="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs divide-x divide-slate-100 overflow-hidden">
                    <button 
                      @click="openDetail(cust)" 
                      class="px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                      title="Lihat Detail Pelanggan"
                    >
                      <Eye class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Detail</span>
                    </button>
                    <button 
                      @click="openEdit(cust)" 
                      class="px-2.5 py-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50/70 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold" 
                      title="Edit Data Pelanggan"
                    >
                      <Edit2 class="w-3.5 h-3.5 text-slate-500" />
                      <span class="text-[11px] font-bold">Edit</span>
                    </button>
                    <button 
                      v-if="canDeleteCustomer"
                      @click="confirmDelete(cust)" 
                      class="px-2 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 transition-all cursor-pointer" 
                      title="Hapus Data Pelanggan"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="py-12 px-4 text-center">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <Users class="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Pelanggan Ditemukan</h4>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                      Belum ada data pelanggan yang cocok dengan kriteria filter atau pencarian Anda.
                    </p>
                  </div>
                  <div class="pt-2">
                    <button 
                      @click="resetFilter"
                      class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all cursor-pointer"
                    >
                      <RotateCcw class="w-3.5 h-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION FOOTER -->
      <GlobalPagination
        v-if="filteredCustomers.length > 0"
        :current-page="currentPage"
        :total-items="filteredCustomers.length"
        :page-size="pageSize"
        @update:current-page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <!-- Mobile Cards View -->
    <div class="block md:hidden space-y-3">
      <div 
        v-for="cust in paginatedCustomers" 
        :key="cust.id"
        class="bg-white rounded-2xl p-4 border shadow-xs space-y-3 cursor-pointer transition-all"
        :class="cust.computedStatus === 'expired' ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100'"
        @click="openDetail(cust)"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <h4 class="font-extrabold text-sm text-slate-900">{{ cust.name }}</h4>
              <span 
                v-if="cust.computedStatus === 'expired'"
                class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-300"
              >
                Expired
              </span>
            </div>
            <p class="text-xs text-slate-500">{{ cust.business }} &bull; {{ cust.phone }}</p>
          </div>
          <span 
            v-if="cust.computedStatus === 'expired'"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"
          >
            <AlertCircle class="w-3 h-3 text-rose-600" />
            Expired ({{ cust.daysExpired }} hr)
          </span>
          <span 
            v-else
            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
            :class="cust.technicianStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'"
          >
            {{ cust.technicianStatus === 'completed' ? 'Selesai' : 'Siap Setup' }}
          </span>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Paket:</span>
            <span class="font-bold text-slate-800">{{ cust.type }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Masa Aktif:</span>
            <span 
              class="font-mono font-bold"
              :class="cust.computedStatus === 'expired' ? 'text-rose-700' : (cust.computedStatus === 'expiring' ? 'text-amber-700' : 'text-slate-700')"
            >
              {{ cust.expiredDate || '-' }}
              <span v-if="cust.computedStatus === 'expired'" class="text-[10px] text-rose-600 font-extrabold ml-1">(Lewat {{ cust.daysExpired }} hr)</span>
              <span v-else-if="cust.computedStatus === 'expiring'" class="text-[10px] text-amber-600 font-bold ml-1">(Sisa {{ cust.daysLeft }} hr)</span>
            </span>
          </div>
          <div v-if="cust.emailIssueReported || cust.technicianStatus === 'issue'" class="pt-1 border-t border-slate-200 flex justify-between items-center text-rose-600 font-bold">
            <span>Ada Kendala!</span>
            <button @click.stop="redirectToWa(cust, 'issue')" class="text-rose-600 flex items-center gap-1 font-bold">
              <MessageSquare class="w-3 h-3" /> Hubungi WA
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1 flex-wrap" @click.stop>
          <button 
            v-if="canSetupCustomer"
            @click="openSetupModal(cust)"
            class="flex-1 py-2 px-3 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-cyan-200 cursor-pointer"
          >
            <Wrench class="w-3.5 h-3.5" /> Setup Status
          </button>
          <button 
            v-if="cust.computedStatus === 'expired'"
            @click="redirectToWa(cust, 'expired')"
            class="py-2 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-200 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA Expired
          </button>
          <button 
            v-else-if="cust.emailIssueReported || cust.technicianStatus === 'issue'"
            @click="redirectToWa(cust, 'issue')"
            class="py-2 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-200 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA Kendala
          </button>
          <button 
            v-else-if="cust.technicianStatus === 'completed'"
            @click="redirectToWa(cust, 'completed')"
            class="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-200 cursor-pointer"
          >
            <MessageSquare class="w-3.5 h-3.5" /> WA Selesai
          </button>
          <button 
            @click="openDetail(cust)" 
            class="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="openEdit(cust)" 
            class="py-2 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs hover:bg-amber-100 cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button 
            v-if="canDeleteCustomer"
            @click="confirmDelete(cust)" 
            class="py-2 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Mobile Empty State -->
      <div v-if="filteredCustomers.length === 0" class="bg-white rounded-2xl p-6 border border-slate-100 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Users class="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h4 class="text-sm font-extrabold text-slate-800">Tidak Ada Pelanggan</h4>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Belum ada data pelanggan yang cocok dengan pencarian atau filter Anda.
          </p>
        </div>
        <div class="pt-2">
          <button 
            @click="resetFilter"
            class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-indigo-200"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      <!-- Mobile Pagination Control -->
      <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-xs text-xs">
        <button 
          type="button"
          @click="changePage(currentPage - 1, $event)"
          :disabled="currentPage <= 1"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <span class="font-bold text-slate-700">Hal {{ currentPage }} / {{ totalPages }}</span>
        <button 
          type="button"
          @click="changePage(currentPage + 1, $event)"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-40"
        >
          Selanjutnya
        </button>
      </div>
    </div>

    <!-- MODAL SETUP STATUS PENGERJAAN TEKNISI & REDIRECT WA -->
    <div 
      v-if="isSetupModalOpen && selectedSetupUser"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      @click.self="isSetupModalOpen = false"
    >
      <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Wrench class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Status Pengerjaan Teknisi</h3>
              <p class="text-xs text-slate-500 font-medium">
                {{ selectedSetupUser.name }} &bull; {{ selectedSetupUser.businessName || selectedSetupUser.business }} ({{ selectedSetupUser.phone }})
              </p>
            </div>
          </div>
          <button @click="isSetupModalOpen = false" class="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer">
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Pilihan Status Pengerjaan (Cards Selector) -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-700 block">Pilih Status Pengerjaan Saat Ini:</label>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- 1. Siap Dikerjakan -->
            <button 
              type="button"
              @click="selectedTechStatus = 'pending_setup'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'pending_setup' 
                ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 ring-2 ring-cyan-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold">Siap Dikerjakan</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Antrean baru, belum mulai diproses.</div>
              </div>
            </button>

            <!-- 2. Sedang Pengerjaan -->
            <button 
              type="button"
              @click="selectedTechStatus = 'in_progress'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'in_progress' 
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Wrench class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold">Sedang Pengerjaan</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Akun & aplikasi kasir sedang diproses.</div>
              </div>
            </button>

            <!-- 3. Ada Kendala -->
            <button 
              type="button"
              @click="selectedTechStatus = 'issue'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'issue' 
                ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold text-rose-700">Ada Kendala</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Email bounce, nomor salah, dll.</div>
              </div>
            </button>

            <!-- 4. Selesai (Aplikasi Diberikan) -->
            <button 
              type="button"
              @click="selectedTechStatus = 'completed'"
              class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5"
              :class="selectedTechStatus === 'completed' 
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-200' 
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'"
            >
              <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-extrabold text-emerald-700">Selesai</div>
                <div class="text-[10px] text-slate-500 leading-tight mt-0.5">Aplikasi selesai & aktif.</div>
              </div>
            </button>
          </div>
        </div>

        <!-- JIKA ADA KENDALA: Input Catatan & Tombol Redirect ke WA -->
        <div v-if="selectedTechStatus === 'issue'" class="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
            <span class="text-xs font-bold text-rose-800">Catatan Kendala & Redirect ke WhatsApp</span>
          </div>
          
          <div>
            <label class="text-[11px] font-bold text-slate-600 block mb-1">Catatan Kendala:</label>
            <textarea 
              v-model="techIssueNotes"
              rows="2"
              placeholder="Contoh: Email bounce / nomor telepon tidak aktif / butuh konfirmasi alamat toko..."
              class="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <!-- Tombol Redirect ke WA Pelanggan -->
          <button 
            type="button"
            @click="redirectToWa(selectedSetupUser, 'issue')"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Hubungi Pelanggan via WhatsApp (Info Kendala)</span>
          </button>
        </div>

        <!-- JIKA SELESAI: Tombol Redirect ke WA -->
        <div v-if="selectedTechStatus === 'completed'" class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span class="text-xs font-bold text-emerald-800">Penyiapan Selesai & Kirim Konfirmasi ke Pelanggan</span>
          </div>
          <p class="text-xs text-slate-600">
            Penyiapan sistem telah selesai. Anda dapat langsung mengirimkan ucapan selesai dan konfirmasi aplikasi kepada pelanggan melalui WhatsApp:
          </p>

          <!-- Tombol Redirect ke WA Pelanggan -->
          <button 
            type="button"
            @click="redirectToWa(selectedSetupUser, 'completed')"
            class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Kirim Konfirmasi Selesai via WhatsApp</span>
          </button>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button 
            type="button"
            @click="isSetupModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="button"
            @click="saveSetupStatus"
            class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 class="w-4 h-4" />
            <span>Simpan Perubahan Status</span>
          </button>
        </div>

      </div>
    </div>

    <!-- OFFICIAL CORPORATE INVOICE MODAL -->
    <InvoiceDetailModal 
      :is-open="isInvoiceOpen"
      :invoice="selectedInvoiceData"
      @close="isInvoiceOpen = false"
      @mark-paid="handleInvoiceMarkPaid"
    />

    <!-- RENTAL AGREEMENT MODAL (Bilingual Printable Agreement with Kop Surat & Signatures) -->
    <RentalAgreementModal 
      v-if="rentalAgreementData"
      :is-open="isRentalAgreementOpen"
      :client-name="rentalAgreementData.clientName"
      :business-name="rentalAgreementData.businessName"
      :package-name="rentalAgreementData.packageName"
      :phone="rentalAgreementData.phone"
      :email="rentalAgreementData.email"
      :address="rentalAgreementData.address"
      :agreement-number="rentalAgreementData.agreementNumber"
      :start-date="rentalAgreementData.startDate"
      :expired-date="rentalAgreementData.expiredDate"
      :monthly-fee="rentalAgreementData.monthlyFee"
      @close="isRentalAgreementOpen = false"
    />

    <!-- COMPREHENSIVE DETAIL MODAL (3 TABS: PROFIL, LANGGANAN, TEKNISI) -->
    <Teleport to="body">
      <div 
        v-if="showDetailModal && selectedCustomer" 
        class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-5"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200" 
          @click="showDetailModal = false"
        ></div>

        <!-- Modal Box -->
        <div class="relative bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Top Header with Breadcrumbs & Actions -->
          <div class="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/80">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                  <span class="hover:text-slate-600 cursor-pointer" @click="showDetailModal = false">Semua Pelanggan</span>
                  <ChevronRight class="w-3.5 h-3.5" />
                  <span class="text-slate-700 font-semibold">Detail Akun</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/80 text-slate-600 ml-1">#{{ selectedCustomer.id }}</span>
                </div>
                <h2 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Detail Lengkap Pelanggan & Akun Kasir</h2>
              </div>

              <button 
                @click="showDetailModal = false"
                class="w-8 h-8 rounded-full bg-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Action Buttons Row (Responsive) -->
            <div class="flex items-center flex-wrap gap-2 pt-0.5">
              <!-- Hubungi WhatsApp -->
              <button 
                @click="redirectToWa(selectedCustomer, selectedCustomer.computedStatus === 'expired' ? 'expired' : ((selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue') ? 'issue' : (selectedCustomer.technicianStatus === 'completed' ? 'completed' : 'custom')))"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                :class="selectedCustomer.computedStatus === 'expired' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'"
              >
                <MessageSquare class="w-3.5 h-3.5" />
                <span>{{ selectedCustomer.computedStatus === 'expired' ? 'WA Follow-Up Expired' : 'Hubungi WhatsApp' }}</span>
              </button>

              <!-- Setup Status Teknisi -->
              <button 
                v-if="canSetupCustomer"
                @click="openSetupFromDetail"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Wrench class="w-3.5 h-3.5" />
                <span>Ubah Status Setup</span>
              </button>

              <!-- Invoice Tagihan Klien -->
              <button 
                @click="openInvoiceFromDetail(selectedCustomer)"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Receipt class="w-3.5 h-3.5 text-white" />
                <span>Invoice Tagihan</span>
              </button>

              <!-- Edit Data Pelanggan -->
              <button 
                @click="openEditFromDetail"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Edit2 class="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
            </div>
          </div>

          <!-- Main Modal Content (2 Columns: Left Profile Sidebar, Right Multi-Tab Content) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              <!-- Left Column (4 cols): Profile Card -->
              <div class="md:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
                <!-- Avatar -->
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl sm:text-2xl font-extrabold shadow-md mb-2 sm:mb-3">
                  {{ selectedCustomer.name.charAt(0) }}
                </div>

                <h3 class="text-base font-extrabold text-slate-800">{{ selectedCustomer.name }}</h3>
                <p class="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{{ selectedCustomer.business }}</span>
                </p>
                
                <!-- Status Badges Stack -->
                <div class="mt-2.5 mb-3 sm:mb-4 flex flex-wrap items-center justify-center gap-1.5">
                  <!-- Paket Badge -->
                  <span 
                    class="px-2.5 py-0.5 rounded-md text-[10px] font-bold border"
                    :class="{
                      'bg-purple-50 text-purple-700 border-purple-200': selectedCustomerPackageName === 'Custom / IT One',
                      'bg-indigo-50 text-indigo-700 border-indigo-200': selectedCustomerPackageName === 'Pro',
                      'bg-slate-100 text-slate-700 border-slate-200': selectedCustomerPackageName === 'Basic'
                    }"
                  >
                    Paket {{ selectedCustomerPackageName }}
                  </span>

                  <!-- Status Masa Aktif -->
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                    :class="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': selectedCustomer.computedStatus === 'active',
                      'bg-amber-50 text-amber-700 border-amber-200': selectedCustomer.computedStatus === 'expiring',
                      'bg-rose-50 text-rose-700 border-rose-200': selectedCustomer.computedStatus === 'expired'
                    }"
                  >
                    {{ selectedCustomer.computedStatus === 'active' ? 'Aktif' : (selectedCustomer.computedStatus === 'expiring' ? 'Segera Expired' : 'Expired') }}
                  </span>

                  <!-- Status Teknisi Badge -->
                  <span 
                    v-if="selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                  >
                    <AlertTriangle class="w-3 h-3 text-rose-600" />
                    <span>Ada Kendala</span>
                  </span>
                  <span 
                    v-else-if="selectedCustomer.technicianStatus === 'completed'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                  >
                    <CheckCircle2 class="w-3 h-3 text-emerald-600" />
                    <span>Aplikasi Selesai</span>
                  </span>
                  <span 
                    v-else-if="selectedCustomer.technicianStatus === 'in_progress'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                  >
                    <Wrench class="w-3 h-3 text-indigo-600" />
                    <span>Sedang Setup</span>
                  </span>
                  <span 
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                  >
                    <Clock class="w-3 h-3 text-cyan-600" />
                    <span>Siap Dikerjakan</span>
                  </span>
                </div>

                <!-- Contact & Store Info Box -->
                <div class="w-full border-t border-slate-100 pt-3 sm:pt-4 space-y-2.5 sm:space-y-3 text-left text-xs">
                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">No. WhatsApp / Telepon:</span>
                    <div class="flex items-center justify-between mt-0.5">
                      <p class="font-bold text-slate-800 font-mono">{{ selectedCustomer.phone }}</p>
                      <button 
                        @click="copyToClipboard(selectedCustomer.phone, 'Nomor Telepon')"
                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Salin Nomor Telepon"
                      >
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Email:</span>
                    <div class="flex items-center justify-between mt-0.5">
                      <p class="font-medium text-slate-700 truncate text-[11px]">{{ selectedCustomer.email || '-' }}</p>
                      <button 
                        v-if="selectedCustomer.email"
                        @click="copyToClipboard(selectedCustomer.email, 'Email')"
                        class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Salin Email"
                      >
                        <Copy class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Kategori Usaha:</span>
                    <p class="font-bold text-slate-700 mt-0.5">{{ selectedCustomer.category || 'Retail & Usaha Mikro' }}</p>
                  </div>

                  <div>
                    <span class="text-slate-400 block text-[11px] font-semibold">Alamat Toko:</span>
                    <p class="font-medium text-slate-700 mt-0.5 leading-relaxed">{{ selectedCustomer.address || 'Indonesia' }}</p>
                  </div>

                  <div class="pt-1">
                    <span class="text-slate-400 block text-[11px] font-semibold">Tanggal Terdaftar:</span>
                    <p class="font-mono text-slate-700 mt-0.5">{{ selectedCustomer.joinDate || '2026-09-01' }}</p>
                  </div>
                </div>

                <!-- Direct WA button in card -->
                <button 
                  @click="redirectToWa(selectedCustomer, 'custom')"
                  class="w-full mt-4 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare class="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kirim Pesan WhatsApp</span>
                </button>
              </div>

              <!-- Right Column (8 cols): Tabbed Sections -->
              <div class="md:col-span-8 space-y-4">
                
                <!-- Tab Navigation Buttons -->
                <div class="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 text-xs font-bold">
                  <!-- Tab 1: Ringkasan & Profil -->
                  <button 
                    @click="activeDetailTab = 'profil'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="activeDetailTab === 'profil' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <User class="w-3.5 h-3.5" />
                    <span>Ringkasan & Profil</span>
                  </button>

                  <!-- Tab 2: Paket & Langganan -->
                  <button 
                    @click="activeDetailTab = 'langganan'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="activeDetailTab === 'langganan' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <CreditCard class="w-3.5 h-3.5" />
                    <span>Paket & Langganan</span>
                  </button>

                  <!-- Tab 3: Detail Akun & Penyiapan Teknisi -->
                  <button 
                    @click="activeDetailTab = 'teknisi'"
                    class="flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative"
                    :class="activeDetailTab === 'teknisi' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'"
                  >
                    <Wrench class="w-3.5 h-3.5" />
                    <span>Detail Akun</span>
                    <!-- Dot indicator if issue -->
                    <span 
                      v-if="selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue'" 
                      class="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse"
                    ></span>
                  </button>
                </div>

                <!-- ========================================== -->
                <!-- TAB 1: RINGKASAN & PROFIL BISNIS -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'profil'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Alert jika Langganan Expired -->
                  <div 
                    v-if="selectedCustomer.computedStatus === 'expired'"
                    class="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs"
                  >
                    <AlertCircle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between flex-wrap gap-2">
                        <span class="text-xs font-bold text-rose-800">Perhatian: Masa Aktif Pelanggan Telah Berakhir (Expired)!</span>
                        <span class="text-[10px] font-black uppercase bg-rose-200/80 text-rose-800 px-2 py-0.5 rounded">Masa Aktif Habis</span>
                      </div>
                      <p class="text-xs text-rose-700 mt-1 leading-relaxed">
                        Langganan paket kasir untuk toko ini telah berakhir pada <strong>{{ selectedCustomer.expiredDate }}</strong> (lewat {{ selectedCustomer.daysExpired }} hari yang lalu). Segera hubungi pelanggan untuk konfirmasi perpanjangan paket agar layanan kasir tidak terkendala.
                      </p>
                      <div class="mt-2.5 flex items-center gap-2">
                        <button 
                          @click="redirectToWa(selectedCustomer, 'expired')"
                          class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageSquare class="w-3.5 h-3.5" />
                          <span>Chat WA Perpanjangan Langganan</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Alert Status Penyiapan Kasir -->
                  <div 
                    v-if="selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue'"
                    class="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-rose-800">Perhatian: Ada Kendala Penyiapan Akun!</span>
                        <span class="text-[10px] font-bold uppercase bg-rose-200/80 text-rose-800 px-1.5 py-0.5 rounded">Action Needed</span>
                      </div>
                      <p class="text-xs text-rose-700 mt-1 leading-relaxed">
                        Catatan Teknisi: "{{ selectedCustomer.emailIssueNotes || 'Kendala verifikasi nomor telepon / email kasir.' }}"
                      </p>
                      <div class="mt-2.5 flex items-center gap-2">
                        <button 
                          @click="redirectToWa(selectedCustomer, 'issue')"
                          class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageSquare class="w-3.5 h-3.5" />
                          <span>Hubungi Pelanggan via WhatsApp</span>
                        </button>
                        <button 
                          @click="openSetupFromDetail"
                          class="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-50 cursor-pointer"
                        >
                          Ubah Status Setup
                        </button>
                      </div>
                    </div>
                  </div>

                  <div 
                    v-else-if="selectedCustomer.technicianStatus === 'completed'"
                    class="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 class="w-5 h-5" />
                      </div>
                      <div>
                        <span class="text-xs font-extrabold text-emerald-900 block">Penyiapan Aplikasi Telah Selesai</span>
                        <p class="text-[11px] text-emerald-700 mt-0.5">Sistem kasir sudah aktif, kredensial akun dan tautan aplikasi telah diserahkan ke pelanggan.</p>
                      </div>
                    </div>
                    <button 
                      @click="redirectToWa(selectedCustomer, 'completed')"
                      class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                      <span>Kirim WA Sukses</span>
                    </button>
                  </div>

                  <div 
                    v-else
                    class="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                        <Wrench class="w-5 h-5" />
                      </div>
                      <div>
                        <span class="text-xs font-extrabold text-cyan-900 block">
                          {{ selectedCustomer.technicianStatus === 'in_progress' ? 'Sedang Dikerjakan oleh Teknisi' : 'Menunggu Penyiapan Akun Kasir' }}
                        </span>
                        <p class="text-[11px] text-cyan-700 mt-0.5">
                          Teknisi ditugaskan untuk mengonfigurasi aplikasi kasir, APK, serta surat sewa pelanggan.
                        </p>
                      </div>
                    </div>
                    <button 
                      @click="openSetupFromDetail"
                      class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Update Status
                    </button>
                  </div>

                  <!-- Card Profil Bisnis & Pemilik -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Store class="w-4 h-4 text-indigo-600" />
                        <span>Informasi Profil Bisnis & Toko</span>
                      </h4>
                      <button 
                        @click="openEditFromDetail"
                        class="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 class="w-3 h-3" />
                        <span>Edit Profil</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Nama Pemilik / PIC:</span>
                        <p class="font-bold text-slate-800 text-sm mt-0.5">{{ selectedCustomer.name }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Nama Usaha / Toko:</span>
                        <p class="font-bold text-slate-800 text-sm mt-0.5">{{ selectedCustomer.business }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Kategori Bisnis:</span>
                        <p class="font-bold text-slate-800 mt-0.5">{{ selectedCustomer.category || 'Retail & Toko' }}</p>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">No. Handphone:</span>
                        <p class="font-mono font-bold text-slate-800 mt-0.5">{{ selectedCustomer.phone }}</p>
                      </div>

                      <div class="sm:col-span-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Alamat Lengkap Operasional:</span>
                        <p class="font-medium text-slate-800 mt-0.5 leading-relaxed">{{ selectedCustomer.address || 'Alamat belum diisi lengkap.' }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Card Referensi Pendaftaran & Lead -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Sparkles class="w-4 h-4 text-indigo-600" />
                      <span>Data Referensi & Pendaftaran</span>
                    </h4>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span class="text-slate-400 block text-[11px]">ID Pelanggan:</span>
                        <span class="font-mono font-bold text-slate-800">#{{ selectedCustomer.id }}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[11px]">Tanggal Bergabung:</span>
                        <span class="font-mono font-semibold text-slate-800">{{ selectedCustomer.joinDate || '2026-09-01' }}</span>
                      </div>
                      <div>
                        <span class="text-slate-400 block text-[11px]">Sumber Pendaftaran:</span>
                        <span class="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">Website / Online</span>
                      </div>
                    </div>

                    <div v-if="getAssociatedLead(selectedCustomer)?.notes" class="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span class="text-slate-400 block text-[11px] font-semibold">Catatan Pendaftaran Awal:</span>
                      <p class="text-slate-600 mt-0.5 italic">"{{ getAssociatedLead(selectedCustomer)?.notes }}"</p>
                    </div>
                  </div>

                  <!-- Card Program Referral & Calon Klien yang Di-Invite -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/90 shadow-xs space-y-4">
                    <div class="flex items-center justify-between border-b border-purple-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <Share2 class="w-4 h-4 text-purple-600" />
                        <span>Program Referral Pelanggan</span>
                      </h4>
                      <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Total Di-invite: {{ getInvitedLeadsForCustomer(selectedCustomer).length }} Klien
                      </span>
                    </div>

                    <!-- Kode Referal Pelanggan Ini -->
                    <div class="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span class="text-[11px] font-bold text-purple-950 block">Kode Referral Unik Pelanggan:</span>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-base font-black font-mono tracking-wider text-purple-950 bg-white px-2.5 py-1 rounded-lg border border-purple-300 shadow-xs">
                            {{ selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer) }}
                          </span>
                          <button 
                            @click="copyReferralCode(selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer))"
                            type="button"
                            class="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 text-xs font-bold px-2.5"
                            title="Salin Kode Referral"
                          >
                            <Copy class="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </button>
                        </div>
                        <p class="text-[10px] text-purple-700 mt-1">Bagikan kode ini ke calon pelanggan baru saat pendaftaran IKI KASIR.</p>
                      </div>

                      <!-- Jika pelanggan ini diundang oleh orang lain -->
                      <div v-if="selectedCustomer.referredByCustomerName" class="text-xs bg-white/80 p-2.5 rounded-xl border border-purple-200 sm:max-w-xs">
                        <span class="text-slate-400 block text-[10px]">Di-invite oleh Pelanggan:</span>
                        <p class="font-bold text-slate-800 text-[11px]">{{ selectedCustomer.referredByCustomerName }}</p>
                      </div>
                    </div>

                    <!-- Daftar Calon Klien yang Menggunakan Kode Ini -->
                    <div class="space-y-2">
                      <h5 class="text-xs font-bold text-slate-700">
                        Daftar Calon Klien Terhubung (Di-invite):
                      </h5>

                      <div v-if="getInvitedLeadsForCustomer(selectedCustomer).length > 0" class="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                        <div 
                          v-for="lead in getInvitedLeadsForCustomer(selectedCustomer)" 
                          :key="lead.id"
                          class="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                        >
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <span class="font-bold text-xs text-slate-900 truncate">{{ lead.name }}</span>
                              <span class="text-[11px] text-slate-500 font-medium">({{ lead.businessName }})</span>
                            </div>
                            <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Paket: <strong class="text-slate-600">{{ lead.packageInterest || 'Basic' }}</strong></span>
                              <span>•</span>
                              <span>Daftar: {{ lead.registrationDate || '-' }}</span>
                            </div>
                          </div>

                          <div class="shrink-0 flex items-center gap-2">
                            <span 
                              class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                              :class="lead.status === 'Converted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lead.status === 'Lost' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'"
                            >
                              {{ lead.status === 'Converted' ? 'Pelanggan Aktif' : lead.status === 'Lost' ? 'Ditolak' : 'Prospek Lead' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div v-else class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        <Share2 class="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <p class="font-medium text-slate-700">Belum ada calon klien yang di-invite</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                          Saat calon klien mendaftar dengan memilih sumber <strong>Referral</strong> dan kode <strong>{{ selectedCustomer.referralCode || getOrCreateCustomerReferralCode(selectedCustomer) }}</strong>, mereka akan otomatis terhubung di sini.
                        </p>
                      </div>
                    </div>

                    <!-- Banner Komisi Tetap Rp 15.000 -->
                    <div class="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Banknote class="w-4 h-4" />
                        </div>
                        <div>
                          <span class="text-xs font-bold text-purple-950 block">Komisi Referral Pengguna (Aplikasi Android)</span>
                          <p class="text-[11px] text-purple-700 mt-0.5">Komisi tetap sebesar <strong>Rp 15.000</strong> per pelanggan aktif yang mendaftar via kode referral pengguna ini.</p>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 text-white shadow-2xs shrink-0 whitespace-nowrap">
                        Rp 15.000 Tetap / Aktif
                      </span>
                    </div>

                    <!-- 4 KPI Metrik Saldo Referral Pengguna -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Saldo Tersedia</span>
                        <p class="text-base font-extrabold text-emerald-900 mt-0.5">
                          {{ formatCurrency(customerReferralOverview?.availableBalance || 0) }}
                        </p>
                        <span class="text-[9px] text-emerald-700">Dapat ditarik di aplikasi</span>
                      </div>
                      <div class="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Total Didapat</span>
                        <p class="text-base font-extrabold text-indigo-900 mt-0.5">
                          {{ formatCurrency(customerReferralOverview?.totalEarnings || 0) }}
                        </p>
                        <span class="text-[9px] text-indigo-700">Akumulasi komisi</span>
                      </div>
                      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Ditarik</span>
                        <p class="text-base font-extrabold text-slate-800 mt-0.5">
                          {{ formatCurrency(customerReferralOverview?.totalWithdrawn || 0) }}
                        </p>
                        <span class="text-[9px] text-slate-500">Sudah dibayarkan</span>
                      </div>
                      <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending ACC</span>
                        <p class="text-base font-extrabold text-amber-900 mt-0.5">
                          {{ formatCurrency(customerReferralOverview?.totalPending || 0) }}
                        </p>
                        <span class="text-[9px] text-amber-700">Menunggu verifikasi</span>
                      </div>
                    </div>

                    <!-- Riwayat Penarikan Saldo Komisi Pengguna (Aplikasi Android) -->
                    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                      <div class="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div class="flex items-center gap-2 text-slate-800 font-bold text-xs">
                          <Wallet class="w-4 h-4 text-emerald-600" />
                          <span>Riwayat Penarikan Komisi Pengguna (Aplikasi Android)</span>
                        </div>
                        <span class="text-[11px] font-semibold text-slate-500">
                          {{ customerWithdrawals.length }} pengajuan
                        </span>
                      </div>

                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs min-w-[700px]">
                          <thead class="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                            <tr>
                              <th class="px-3.5 py-2.5 font-semibold">Nominal</th>
                              <th class="px-3.5 py-2.5 font-semibold">Bank / E-Wallet</th>
                              <th class="px-3.5 py-2.5 font-semibold">No. Rekening</th>
                              <th class="px-3.5 py-2.5 font-semibold">Atas Nama</th>
                              <th class="px-3.5 py-2.5 font-semibold">Status</th>
                              <th class="px-3.5 py-2.5 font-semibold">Bukti Pembayaran</th>
                              <th class="px-3.5 py-2.5 font-semibold">Tanggal</th>
                              <th class="px-3.5 py-2.5 font-semibold text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100">
                            <tr v-if="customerReferralLoading" class="text-slate-500">
                              <td colspan="8" class="px-4 py-6 text-center">Memuat riwayat penarikan...</td>
                            </tr>
                            <tr v-else-if="!customerWithdrawals.length" class="text-slate-500">
                              <td colspan="8" class="px-4 py-6 text-center text-slate-400">
                                Belum ada pengajuan penarikan komisi dari pengguna ini.
                              </td>
                            </tr>
                            <tr v-for="item in customerWithdrawals" :key="item.id" class="hover:bg-slate-50/60 transition-colors">
                              <td class="px-3.5 py-2.5 font-extrabold text-emerald-600">{{ formatCurrency(item.amount || 0) }}</td>
                              <td class="px-3.5 py-2.5 text-slate-700 font-medium">{{ item.bankOrWallet || '-' }}</td>
                              <td class="px-3.5 py-2.5 font-mono text-slate-600">{{ item.accountNumber || '-' }}</td>
                              <td class="px-3.5 py-2.5 text-slate-700">{{ item.accountHolder || '-' }}</td>
                              <td class="px-3.5 py-2.5">
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="withdrawalStatusBadgeClass(item.status)">
                                  {{ withdrawalStatusLabel(item.status) }}
                                </span>
                              </td>
                              <td class="px-3.5 py-2.5">
                                <a
                                  v-if="item.paymentProofUrl"
                                  :href="resolveReceiptUrl(item.paymentProofUrl)"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  <ExternalLink class="h-3 w-3" />
                                  Lihat Bukti
                                </a>
                                <span v-else class="text-[11px] text-slate-400">Belum ada</span>
                              </td>
                              <td class="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{{ formatDate(item.requestDate) }}</td>
                              <td class="px-3.5 py-2.5 text-center whitespace-nowrap">
                                <div v-if="item.status === 'MENUNGGU_VERIFIKASI'" class="flex items-center justify-center gap-1.5">
                                  <button
                                    @click="openApprovalModal(item)"
                                    type="button"
                                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    @click="openRejectWithdrawalModal(item)"
                                    type="button"
                                    class="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition cursor-pointer shadow-2xs"
                                  >
                                    Tolak
                                  </button>
                                </div>
                                <span v-else class="text-slate-400 text-[10px] font-medium">Selesai diproses</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- ========================================== -->
                <!-- TAB 2: PAKET, MASA AKTIF & PEMBAYARAN -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'langganan'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Banner Peringatan jika Expired -->
                  <div 
                    v-if="selectedCustomer.computedStatus === 'expired'"
                    class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs flex-wrap sm:flex-nowrap"
                  >
                    <div class="flex items-center gap-3 text-rose-800">
                      <div class="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                        <AlertCircle class="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p class="font-bold text-xs">Langganan Telah Expired Sejak {{ selectedCustomer.expiredDate }}</p>
                        <p class="text-[11px] text-rose-600 mt-0.5">Toko ini telah melewati masa aktif selama {{ selectedCustomer.daysExpired }} hari. Segera follow-up untuk perpanjangan lisensi.</p>
                      </div>
                    </div>
                    <button 
                      @click="redirectToWa(selectedCustomer, 'expired')"
                      class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <MessageSquare class="w-3.5 h-3.5" />
                      <span>Chat WA Perpanjangan</span>
                    </button>
                  </div>

                  <!-- Card Detail Paket & Billing -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CreditCard class="w-4 h-4 text-indigo-600" />
                        <span>Rincian Langganan & Tagihan</span>
                      </h4>
                      <span 
                        class="px-2.5 py-0.5 rounded-md text-[11px] font-bold border"
                        :class="{
                          'bg-purple-50 text-purple-700 border-purple-200': selectedCustomerPackageName === 'Custom / IT One',
                          'bg-indigo-50 text-indigo-700 border-indigo-200': selectedCustomerPackageName === 'Pro',
                          'bg-slate-100 text-slate-700 border-slate-200': selectedCustomerPackageName === 'Basic'
                        }"
                      >
                        Paket {{ selectedCustomerPackageName }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <!-- Nominal Langganan -->
                      <div class="p-3.5 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-2xl border border-indigo-100/70">
                        <span class="text-slate-500 block text-[11px] font-medium">Biaya Berlangganan:</span>
                        <div class="text-lg font-black text-slate-900 mt-0.5">
                          Rp {{ Number(selectedCustomerPackagePrice).toLocaleString('id-ID') }}
                          <span class="text-xs font-normal text-slate-400">{{ selectedCustomerPackage?.period || selectedCustomer.packagePeriod || '' }}</span>
                        </div>
                        <span class="text-[10px] text-indigo-600 font-bold mt-1 block">Termasuk modul POS & Cloud Sync</span>
                      </div>

                      <!-- Masa Aktif & Expired -->
                      <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <span class="text-slate-500 block text-[11px] font-medium">Masa Berlaku Aktif:</span>
                        <div class="font-mono text-base font-bold text-slate-800 mt-0.5">
                          {{ selectedCustomer.expiredDate || '-' }}
                        </div>
                        <div class="mt-1 flex items-center gap-1.5">
                          <span 
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            :class="{
                              'bg-emerald-100 text-emerald-800': selectedCustomer.computedStatus === 'active',
                              'bg-amber-100 text-amber-800': selectedCustomer.computedStatus === 'expiring',
                              'bg-rose-100 text-rose-800': selectedCustomer.computedStatus === 'expired'
                            }"
                          >
                            {{ selectedCustomer.computedStatus === 'active' ? `Tersisa ${selectedCustomer.daysLeft || 30} Hari` : (selectedCustomer.computedStatus === 'expiring' ? `Hampir Habis (${selectedCustomer.daysLeft} Hari)` : `Lewat ${selectedCustomer.daysExpired || 1} Hari`) }}
                          </span>
                        </div>
                      </div>

                      <!-- Metode Pembayaran -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Metode Pembayaran:</span>
                        <p class="font-bold text-slate-800 mt-0.5">{{ getCustomerPaymentMethod(selectedCustomer) }}</p>
                      </div>

                      <!-- Status Pelanggan -->
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Status Akun:</span>
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span class="font-bold text-slate-800 capitalize">{{ selectedCustomer.status || 'Active' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Bukti Pembayaran / Struk Transfer -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Receipt class="w-4 h-4 text-indigo-600" />
                        <span>Bukti Pembayaran / Struk Transfer</span>
                      </h4>
                      <span
                        class="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                        :class="selectedCustomer.paymentStatus?.toUpperCase() === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                      >
                        <CheckCircle2 class="w-3 h-3" />
                        <span>{{ getPaymentStatusLabel(selectedCustomer.paymentStatus) }}</span>
                      </span>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                      <!-- Struk Thumbnail -->
                      <div
                        v-if="getCustomerPaymentProof(selectedCustomer)"
                        class="relative w-36 h-48 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs cursor-pointer group shrink-0"
                        @click="openReceiptZoom(getCustomerPaymentProof(selectedCustomer))"
                      >
                        <img 
                          :src="getCustomerPaymentProof(selectedCustomer)" 
                          alt="Bukti Transfer" 
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn class="w-6 h-6" />
                        </div>
                      </div>
                      <div v-else class="w-36 h-48 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 flex flex-col items-center justify-center gap-2 shrink-0 text-center px-3">
                        <Receipt class="w-6 h-6" />
                        <span class="text-[11px]">Bukti pembayaran belum tersedia</span>
                      </div>

                      <!-- Struk Details -->
                      <div class="flex-1 space-y-2 text-xs">
                        <div>
                          <span class="text-slate-400 block text-[11px]">Metode / Channel Pembayaran:</span>
                          <p class="font-bold text-slate-800">
                            {{ getCustomerPaymentMethod(selectedCustomer) }}
                          </p>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[11px]">Nominal Transfer:</span>
                          <p class="font-extrabold text-slate-900 text-sm">
                            Rp {{ Number(selectedCustomer.amount ?? selectedCustomer.paymentAmount ?? 0).toLocaleString('id-ID') }}
                          </p>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[11px]">Status Struk:</span>
                          <p class="font-bold flex items-center gap-1" :class="selectedCustomer.paymentStatus?.toUpperCase() === 'PAID' ? 'text-emerald-700' : 'text-slate-600'">
                            <CheckCircle2 v-if="selectedCustomer.paymentStatus?.toUpperCase() === 'PAID'" class="w-3.5 h-3.5 text-emerald-600" />
                            <AlertCircle v-else class="w-3.5 h-3.5 text-slate-500" />
                            <span>{{ getPaymentStatusLabel(selectedCustomer.paymentStatus) }}</span>
                          </p>
                        </div>
                        <div v-if="getCustomerPaymentProof(selectedCustomer)" class="pt-1">
                          <button 
                            type="button"
                            @click="openReceiptZoom(getCustomerPaymentProof(selectedCustomer))"
                            class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <ZoomIn class="w-3.5 h-3.5 text-slate-500" />
                            <span>Perbesar & Lihat Bukti Bayar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Card Riwayat Invoices (Jika Ada) -->
                  <div v-if="getAssociatedInvoices(selectedCustomer).length > 0" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FileText class="w-4 h-4 text-indigo-600" />
                      <span>Riwayat Tagihan / Invoices</span>
                    </h4>

                    <div class="divide-y divide-slate-100 text-xs">
                      <div 
                        v-for="inv in getAssociatedInvoices(selectedCustomer)" 
                        :key="inv.id" 
                        class="py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <span class="font-mono font-bold text-slate-800 block">{{ inv.id }}</span>
                          <span class="text-[11px] text-slate-400">{{ inv.date }} &bull; {{ inv.paymentMethod }}</span>
                        </div>
                        <div class="text-right">
                          <span class="font-bold text-slate-900 block">Rp {{ Number(inv.amount || 0).toLocaleString('id-ID') }}</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {{ inv.status }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <!-- ========================================== -->
                <!-- TAB 3: DETAIL AKUN & PENYIAPAN TEKNISI -->
                <!-- ========================================== -->
                <div v-if="activeDetailTab === 'teknisi'" class="space-y-4 animate-in fade-in duration-150">
                  
                  <!-- Card Status Pengerjaan Teknisi -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Wrench class="w-4 h-4 text-cyan-600" />
                        <span>Status Pengerjaan Teknisi</span>
                      </h4>
                      <button 
                        v-if="canSetupCustomer"
                        @click="openSetupFromDetail"
                        class="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Wrench class="w-3 h-3" />
                        <span>Ubah Status</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Status Saat Ini:</span>
                        <div class="mt-1">
                          <span 
                            v-if="selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue'"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1"
                          >
                            <AlertTriangle class="w-3.5 h-3.5 text-rose-600" />
                            <span>Ada Kendala Penyiapan</span>
                          </span>
                          <span 
                            v-else-if="selectedCustomer.technicianStatus === 'completed'"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
                            <span>Selesai (Aplikasi Diberikan)</span>
                          </span>
                          <span 
                            v-else-if="selectedCustomer.technicianStatus === 'in_progress'"
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1"
                          >
                            <Wrench class="w-3.5 h-3.5 text-indigo-600" />
                            <span>Sedang Pengerjaan</span>
                          </span>
                          <span 
                            v-else
                            class="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 inline-flex items-center gap-1"
                          >
                            <Clock class="w-3.5 h-3.5 text-cyan-600" />
                            <span>Siap Dikerjakan</span>
                          </span>
                        </div>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                        <span class="text-slate-400 block text-[11px]">Teknisi PIC / Penanggung Jawab:</span>
                        <p class="font-bold text-slate-800 mt-1">
                          {{ selectedCustomer.technicianAssignedTo || 'Doni Teknisi (Tim Teknisi IKI KASIR)' }}
                        </p>
                      </div>
                    </div>

                    <!-- Catatan Kendala jika ada -->
                    <div v-if="selectedCustomer.emailIssueReported || selectedCustomer.technicianStatus === 'issue'" class="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-rose-800">Catatan Kendala Teknisi:</span>
                        <button 
                          @click="redirectToWa(selectedCustomer, 'issue')"
                          class="text-rose-700 hover:underline font-bold flex items-center gap-1"
                        >
                          <MessageSquare class="w-3 h-3" /> Hubungi via WA
                        </button>
                      </div>
                      <p class="text-rose-700 mt-1 italic">"{{ selectedCustomer.emailIssueNotes || 'Kendala data nomor telepon / email kasir.' }}"</p>
                    </div>
                  </div>

                  <!-- Card Kredensial Akun Login Kasir -->
                  <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Key class="w-4 h-4 text-indigo-600" />
                        <span>Detail Login Akun Kasir</span>
                      </h4>
                      <button
                        v-if="canUpdateCustomer && !isEditingCredentials"
                        type="button"
                        @click="beginEditCredentials"
                        class="px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold cursor-pointer"
                      >
                        Edit Detail Akun
                      </button>
                    </div>

                    <form v-if="isEditingCredentials" @submit.prevent="saveCustomerCredentials" class="space-y-3">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <label class="space-y-1.5 sm:col-span-2">
                          <span class="text-slate-600 font-semibold">Email Login Akun</span>
                          <input
                            v-model="credentialForm.email"
                            type="email"
                            required
                            autocomplete="email"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </label>
                        <label class="space-y-1.5 sm:col-span-2">
                          <span class="text-slate-600 font-semibold">Password Akun</span>
                          <input
                            v-model="credentialForm.password"
                            type="password"
                            autocomplete="new-password"
                            minlength="6"
                            placeholder="Kosongkan jika tidak ingin mengubah password"
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </label>
                      </div>
                      <p v-if="credentialError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {{ credentialError }}
                      </p>
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          @click="cancelEditCredentials"
                          :disabled="isSavingCredentials"
                          class="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          :disabled="isSavingCredentials"
                          class="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                        >
                          {{ isSavingCredentials ? 'Menyimpan...' : 'Simpan Detail Akun' }}
                        </button>
                      </div>
                    </form>

                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2">
                        <div class="min-w-0 flex-1">
                          <span class="text-slate-400 block text-[11px] font-semibold">Email Login Akun:</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block truncate">
                            {{ getCustomerCredentials(selectedCustomer).username || '-' }}
                          </span>
                        </div>
                        <button
                          v-if="getCustomerCredentials(selectedCustomer).username"
                          @click="copyToClipboard(getCustomerCredentials(selectedCustomer).username, 'Email Login Akun')"
                          class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer shrink-0 ml-2"
                          title="Salin email login akun"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span class="text-slate-400 block text-[11px] font-semibold">Password Akun:</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                            {{ getCustomerCredentials(selectedCustomer).password ? (isPasswordVisible ? getCustomerCredentials(selectedCustomer).password : '••••••••••••') : 'Belum diatur' }}
                          </span>
                        </div>
                        <div v-if="getCustomerCredentials(selectedCustomer).password" class="flex items-center gap-1">
                          <button
                            @click="isPasswordVisible = !isPasswordVisible"
                            class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                            :title="isPasswordVisible ? 'Sembunyikan Password' : 'Lihat Password'"
                          >
                            <EyeOff v-if="isPasswordVisible" class="w-4 h-4" />
                            <Eye v-else class="w-4 h-4" />
                          </button>
                          <button
                            @click="copyToClipboard(getCustomerCredentials(selectedCustomer).password, 'Password Akun')"
                            class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                            title="Salin Password"
                          >
                            <Copy class="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div class="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span class="text-slate-400 block text-[11px] font-semibold">Username Login Kasir:</span>
                          <span class="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                            {{ getCustomerCredentials(selectedCustomer).username || '-' }}
                          </span>
                        </div>
                        <button
                          v-if="getCustomerCredentials(selectedCustomer).username"
                          @click="copyToClipboard(getCustomerCredentials(selectedCustomer).username, 'Username Kasir')"
                          class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                          title="Salin Username"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p class="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Detail email dan password ini hanya diperbarui di Webbase; perubahan tidak mengubah akun Firebase Auth.
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span class="text-[11px] text-slate-400">Data tersinkronisasi otomatis dengan server IKI KASIR.</span>
            
            <div class="flex items-center gap-2">
              <button 
                @click="showDetailModal = false"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white cursor-pointer"
              >
                Tutup
              </button>
              <button 
                v-if="canSetupCustomer"
                @click="openSetupFromDetail"
                class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Wrench class="w-3.5 h-3.5" />
                <span>Setup Status</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- RECEIPT LIGHTBOX ZOOM MODAL -->
    <Teleport to="body">
      <div 
        v-if="isReceiptZoomOpen && zoomedReceiptUrl"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
        @click.self="isReceiptZoomOpen = false"
      >
        <div class="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800">Pratinjau Bukti Transfer Pembayaran</span>
            <button @click="isReceiptZoomOpen = false" class="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X class="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div class="flex items-center justify-center overflow-auto max-h-[75vh]">
            <img 
              :src="resolveReceiptUrl(zoomedReceiptUrl)" 
              alt="Zoomed Receipt" 
              class="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-md"
              @error="handleImageLoadError"
            />
          </div>

          <div class="text-center pt-2">
            <button 
              @click="isReceiptZoomOpen = false"
              class="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- CUSTOMER FORM MODAL (TAMBAH & EDIT DENGAN PEMILIHAN PEMBAYARAN & BUKTI TRANSFER) -->
    <CustomerFormModal 
      :is-open="showAddEditModal"
      :customer-to-edit="editMode ? selectedCustomer : null"
      @close="showAddEditModal = false"
      @saved="handleCustomerSaved"
    />

    <!-- EXISTING DELETE CONFIRMATION -->
    <div v-if="showDeleteConfirm && selectedCustomer" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
        <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center">Hapus Pelanggan?</h3>
        <p class="text-sm text-slate-500 text-center mt-1">Data <strong>{{ selectedCustomer.name }}</strong> akan dihapus secara permanen.</p>
        <div class="flex items-center gap-3 mt-6">
          <button @click="showDeleteConfirm = false" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">Batal</button>
          <button @click="deleteCustomer" class="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-md shadow-rose-200 cursor-pointer">Ya, Hapus</button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM ACC PENARIKAN KOMISI PENGGUNA (APLIKASI ANDROID) -->
    <div
      v-if="isApprovalModalOpen && withdrawalToApprove"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      @click.self="closeApprovalModal"
    >
      <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <h2 class="text-base font-bold text-slate-900">
              {{ approvedWithdrawal ? 'Penarikan Berhasil Disetujui' : 'Form ACC Penarikan Pengguna' }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ selectedCustomer?.businessName || selectedCustomer?.name || 'Pengguna' }} · {{ formatCurrency(withdrawalToApprove.amount) }}
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

        <!-- Approved View (Success) -->
        <div v-if="approvedWithdrawal" class="space-y-5 p-6">
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p class="font-semibold text-emerald-800">Pembayaran berhasil dicatat dan saldo komisi pengguna telah diperbarui.</p>
            <p class="mt-1 text-sm text-emerald-700">Bukti pembayaran kini dapat dilihat oleh pengguna di aplikasi Android.</p>
          </div>

          <div class="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div>
              <p class="text-slate-500">Nomor Invoice</p>
              <p class="font-mono font-bold text-slate-800 mt-0.5">{{ approvedWithdrawal.invoiceNo || '-' }}</p>
            </div>
            <div>
              <p class="text-slate-500">Nominal Penarikan</p>
              <p class="font-extrabold text-emerald-600 mt-0.5">{{ formatCurrency(approvedWithdrawal.amount) }}</p>
            </div>
            <div>
              <p class="text-slate-500">Penerima Transfer</p>
              <p class="font-bold text-slate-800 mt-0.5">{{ approvedWithdrawal.bankOrWallet }} · {{ approvedWithdrawal.accountNumber }}</p>
            </div>
            <div>
              <p class="text-slate-500">Atas Nama</p>
              <p class="font-bold text-slate-800 mt-0.5">{{ approvedWithdrawal.accountHolder }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <a
              v-if="approvedWithdrawal.paymentProofUrl"
              :href="resolveReceiptUrl(approvedWithdrawal.paymentProofUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink class="h-4 w-4" />
              Lihat Bukti Pembayaran
            </a>

            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <p class="text-xs font-bold text-slate-700">Kirim Bukti ke WhatsApp Pengguna</p>
              <p class="text-xs leading-relaxed text-slate-600">
                Bagikan gambar bukti bersama pesan konfirmasi. Jika browser tidak mendukung lampiran langsung, file akan otomatis diunduh agar dapat dilampirkan secara manual di WhatsApp.
              </p>

              <div class="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  @click="shareProofToWhatsapp"
                  :disabled="isSharingProof"
                  class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <MessageCircle class="h-4 w-4" />
                  {{ isSharingProof ? 'Menyiapkan bukti...' : 'Bagikan Bukti + Konfirmasi' }}
                </button>

                <a
                  v-if="customerWaUrl"
                  :href="customerWaUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 shadow-2xs"
                >
                  <MessageSquare class="h-4 w-4 text-emerald-600" />
                  Buka WhatsApp Web
                </a>
              </div>

              <p v-if="whatsappShareNotice" class="text-xs text-indigo-600 mt-2 font-medium">
                {{ whatsappShareNotice }}
              </p>
              <p v-if="whatsappShareError" class="text-xs text-rose-600 mt-2 font-medium">
                {{ whatsappShareError }}
              </p>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="closeApprovalModal"
              class="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Selesai
            </button>
          </div>
        </div>

        <!-- Form Mode: Acc Penarikan -->
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

          <div v-if="!hasValidCustomerPhone" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            Nomor WhatsApp pelanggan belum valid. Lengkapi melalui form edit pelanggan sebelum menyetujui penarikan.
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nomor Referensi Transfer <span class="font-normal normal-case text-slate-400">(opsional)</span>
            </label>
            <input
              v-model="approvalForm.transferReference"
              type="text"
              placeholder="Contoh: TRX-123456 / Ref BCA"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
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
              class="block w-full rounded-xl border border-slate-200 bg-white text-xs text-slate-600 file:mr-3 file:border-0 file:bg-indigo-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            />
            <p class="mt-1 text-[11px] text-slate-500">JPG, PNG, atau WEBP; maksimal 10MB.</p>
            <p v-if="isUploadingProof" class="mt-2 text-xs font-medium text-indigo-600">Mengunggah bukti pembayaran...</p>
            <div v-else-if="approvalForm.paymentProofUrl" class="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <img :src="resolveReceiptUrl(approvalForm.paymentProofUrl)" alt="Pratinjau bukti pembayaran" class="h-14 w-14 rounded-lg border border-emerald-100 object-cover" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold text-slate-800">{{ approvalForm.paymentProofFileName }}</p>
                <p class="text-[11px] text-emerald-700">Bukti berhasil diunggah</p>
              </div>
              <a :href="resolveReceiptUrl(approvalForm.paymentProofUrl)" target="_blank" rel="noopener noreferrer" aria-label="Lihat bukti">
                <ExternalLink class="h-4 w-4 text-indigo-600" />
              </a>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Catatan <span class="font-normal normal-case text-slate-400">(opsional)</span>
            </label>
            <textarea
              v-model="approvalForm.notes"
              rows="2"
              placeholder="Catatan transfer..."
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-none"
            ></textarea>
          </div>

          <p v-if="approvalError" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {{ approvalError }}
          </p>

          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
            <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
            <p class="leading-relaxed">
              Pastikan dana sudah benar-benar ditransfer ke rekening tujuan sebelum menyetujui.
              Pencairan yang disetujui akan otomatis mengurangi saldo referral pengguna, menerbitkan invoice resmi, dan mencatat transaksi kas keluar.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              @click="closeApprovalModal"
              :disabled="isUploadingProof || isApprovingWithdrawal"
              class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isUploadingProof || isApprovingWithdrawal || !approvalForm.paymentProofUrl || !hasValidCustomerPhone"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Upload class="h-4 w-4" />
              {{ isApprovingWithdrawal ? 'Memproses...' : 'Setujui & Simpan Bukti' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL TOLAK PENARIKAN PENGGUNA -->
    <div
      v-if="isRejectModalOpen && withdrawalToReject"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      @click.self="closeRejectWithdrawalModal"
    >
      <div class="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle class="w-6 h-6" />
        </div>
        <div class="text-center">
          <h4 class="text-sm font-bold text-slate-800">Tolak Pengajuan Penarikan</h4>
          <p class="text-xs text-slate-500 mt-1">
            Penarikan sebesar <strong class="text-slate-700">{{ formatCurrency(withdrawalToReject.amount) }}</strong> atas nama <strong>{{ withdrawalToReject.accountHolder }}</strong> akan ditolak. Saldo akan dikembalikan ke akun pengguna.
          </p>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700">Alasan Penolakan <span class="text-rose-500">*</span></label>
          <textarea
            v-model="rejectReason"
            rows="3"
            placeholder="Contoh: Nomor rekening tujuan tidak sesuai dengan data identitas pengguna"
            class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-slate-50/50 text-slate-800 placeholder-slate-400 resize-none"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            type="button"
            @click="closeRejectWithdrawalModal"
            :disabled="isRejectingWithdrawal"
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleConfirmRejectWithdrawal"
            :disabled="isRejectingWithdrawal || !rejectReason.trim()"
            class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {{ isRejectingWithdrawal ? 'Memproses...' : 'Ya, Tolak' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { transform: translateX(30px); opacity: 0; }
.slide-fade-leave-to { transform: translateX(30px); opacity: 0; }
</style>

export interface SalesDashboard {
  id: string
  userId?: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  salesReferralCode: string | null
  salesBalance: number
  salesTotalEarned: number
  salesTotalWithdrawn: number
  totalClients: number
  pendingWithdrawalAmount: number
  pendingWithdrawalCount: number
  availableBalance: number
  totalLeads: number
  recentClients?: SalesClientItem[]
  createdAt?: string
}

export interface SalesClientItem {
  id: string
  name: string
  businessName: string
  phone: string
  email: string
  status: string
  registeredAt: string
  createdAt?: string
  packageName: string | null
  source: string // 'Customer' | 'Lead'
  commission?: number
}

export interface SalesListItem {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  salesReferralCode: string | null
  totalClients: number
  createdAt: string
}

export interface SalesWithdrawal {
  id: string
  userId: string
  salesName: string
  salesEmail: string
  amount: number
  bankOrWallet: string
  accountNumber: string
  accountHolder: string
  requestDate: string
  completedDate: string | null
  status: string // MENUNGGU_VERIFIKASI | SELESAI | DITOLAK
  notes: string
  invoiceNo: string | null
  paymentProofUrl?: string | null
  processedBy: string
  transferReference: string
  rejectionReason: string
}

export interface SalesWithdrawalRequest {
  userId: string
  amount: number
  bankOrWallet: string
  accountNumber: string
  accountHolder: string
  notes?: string
}

export interface SalesReferralValidation {
  valid: boolean
  code: string
  message: string
  sales: {
    id: string
    name: string
    email: string
  } | null
}

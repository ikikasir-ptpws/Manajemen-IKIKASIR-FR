export type PackageType = 'Basic' | 'Add on' | 'Custom' | 'Pro' | 'Custom / IT One' | string

export interface Customer {
  id: string
  no: number
  name: string
  businessName?: string
  business?: string
  packageId?: string
  packageType: PackageType
  packageName?: string
  expiredDate: string
  joinDate?: string
  address?: string
  daysLeft?: number
  daysExpired?: number
  status: 'active' | 'expiring' | 'expired'
  phone?: string
  email?: string
  category?: string
  amount?: number
  paymentMethod?: string
  technicianStatus?: 'pending_setup' | 'in_progress' | 'completed'
  technicianAssignedTo?: string
  appUsername?: string
  appPassword?: string
  appDownloadUrl?: string
  guideBookUrl?: string
  rentalAgreementNumber?: string
  rentalAgreementDate?: string
  emailIssueReported?: boolean
  emailIssueNotes?: string
  setupCompletedAt?: string
  leadId?: string
  referralCode?: string
  referredByCustomerId?: string
  referredByCustomerName?: string
  paymentProofUrl?: string
  notes?: string
}

export interface ActivityItem {
  id: string
  title: string
  highlightText?: string
  description?: string
  time: string
  relativeTime: string
  type: 'convert' | 'payment' | 'warning' | 'followup' | 'export'
}

export interface CashFlowDataPoint {
  date: string
  income: number // in millions or rupiah
  expense: number
  balance: number
}

export interface NewCustomerForm {
  name: string
  businessName: string
  phone: string
  email: string
  category: string
  address: string
  packageType: PackageType
  billingCycle: '1m' | '3m' | '6m' | '12m'
  paymentMethod: 'qris' | 'bca' | 'mandiri' | 'cash'
  amount: number
  autoRecordCashflow: boolean
  notes: string
}

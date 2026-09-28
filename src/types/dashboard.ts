export type PackageType = 'Basic' | 'Custom / IT One'

export interface Customer {
  id: string
  no: number
  name: string
  businessName?: string
  business?: string
  packageType: PackageType
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

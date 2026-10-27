import { httpClient } from './httpClient'
import type { ApiResponse } from './httpClient'

export interface CashTransactionItem {
  id: string
  type: 'masuk' | 'keluar'
  category: string
  desc: string
  amount: number
  date: string
  rawDate: string
  displayDate: string
  time: string
  customer?: string
  paymentMethod: string
  paymentProofUrl?: string
  status: string
  invoiceNo?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CashFlowSummary {
  totalMasuk: number
  totalKeluar: number
  saldoBersih: number
  pertumbuhanMasuk: number
  pertumbuhanKeluar: number
  countMasuk: number
  countKeluar: number
}

export interface CreateIncomePayload {
  date: string
  displayDate?: string
  time?: string
  customer: string
  desc?: string
  category: string
  amount: number
  paymentMethod?: string
  paymentProofUrl?: string
  status?: string
  notes?: string
}

export interface CreateExpensePayload {
  date: string
  displayDate?: string
  time?: string
  desc: string
  category: string
  amount: number
  paymentMethod?: string
  paymentProofUrl?: string
  status?: string
  notes?: string
}

export interface CashFlowFilterParams {
  startDate?: string
  endDate?: string
  type?: 'semua' | 'masuk' | 'keluar'
  search?: string
  category?: string
}

export const cashflowApi = {
  getAll: (params?: CashFlowFilterParams) =>
    httpClient.get<CashTransactionItem[]>('/cashflow', params),

  getSummary: (params?: { startDate?: string; endDate?: string; search?: string }) =>
    httpClient.get<CashFlowSummary>('/cashflow/summary', params),

  getById: (id: string) =>
    httpClient.get<CashTransactionItem>(`/cashflow/${id}`),

  createIncome: (payload: CreateIncomePayload) =>
    httpClient.post<CashTransactionItem>('/cashflow/income', payload),

  createExpense: (payload: CreateExpensePayload) =>
    httpClient.post<CashTransactionItem>('/cashflow/expense', payload),

  create: (payload: {
    type: 'masuk' | 'keluar'
    date: string
    displayDate?: string
    time?: string
    customer?: string
    desc?: string
    category: string
    amount: number
    paymentMethod?: string
    paymentProofUrl?: string
    status?: string
    notes?: string
  }) => httpClient.post<CashTransactionItem>('/cashflow', payload),

  update: (id: string, payload: Partial<CreateIncomePayload & CreateExpensePayload>) =>
    httpClient.put<CashTransactionItem>(`/cashflow/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete(`/cashflow/${id}`)
}

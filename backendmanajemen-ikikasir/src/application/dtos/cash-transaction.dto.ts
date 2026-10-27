export interface CreateIncomeDto {
  date: string;
  displayDate?: string;
  time?: string;
  customer: string;
  desc?: string;
  category: string;
  amount: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  notes?: string;
}

export interface CreateExpenseDto {
  date: string;
  displayDate?: string;
  time?: string;
  desc: string;
  category: string;
  amount: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  notes?: string;
}

export interface CreateCashTransactionDto {
  type: 'masuk' | 'keluar';
  date: string;
  displayDate?: string;
  time?: string;
  customer?: string;
  desc?: string;
  category: string;
  amount: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  notes?: string;
}

export interface UpdateCashTransactionDto {
  date?: string;
  displayDate?: string;
  time?: string;
  customer?: string;
  desc?: string;
  category?: string;
  amount?: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  notes?: string;
}

export interface CashTransactionFilterDto {
  startDate?: string;
  endDate?: string;
  type?: 'semua' | 'masuk' | 'keluar';
  search?: string;
  category?: string;
}

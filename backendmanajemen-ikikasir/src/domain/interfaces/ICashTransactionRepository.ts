import { CashTransaction } from '../entities/CashTransaction.js';

export interface CreateCashTransactionData {
  type: 'masuk' | 'keluar' | string;
  category: string;
  desc: string;
  amount: number;
  date?: Date;
  rawDate?: string;
  displayDate?: string;
  time?: string;
  customer?: string;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  invoiceNo?: string;
  notes?: string;
}

export interface UpdateCashTransactionData {
  category?: string;
  desc?: string;
  amount?: number;
  date?: Date;
  rawDate?: string;
  displayDate?: string;
  time?: string;
  customer?: string;
  paymentMethod?: string;
  paymentProofUrl?: string;
  status?: string;
  notes?: string;
}

export interface CashTransactionFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  type?: 'semua' | 'masuk' | 'keluar' | string;
  search?: string;
  category?: string;
}

export interface CashTransactionSummary {
  totalMasuk: number;
  totalKeluar: number;
  saldoBersih: number;
  countMasuk: number;
  countKeluar: number;
  pertumbuhanMasuk: number;
  pertumbuhanKeluar: number;
}

export interface ICashTransactionRepository {
  create(data: CreateCashTransactionData): Promise<CashTransaction>;
  findById(id: string): Promise<CashTransaction | null>;
  findAll(filter?: CashTransactionFilter): Promise<CashTransaction[]>;
  update(id: string, data: UpdateCashTransactionData): Promise<CashTransaction>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  getSummary(filter?: CashTransactionFilter): Promise<CashTransactionSummary>;
}

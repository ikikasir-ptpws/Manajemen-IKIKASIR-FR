import { ref, computed } from 'vue'

export interface TransactionItem {
  id: string
  name: string
  category: 'Lisensi POS' | 'Hardware' | 'Addon & Aksesoris'
  qty: number
  price: number
}

export interface SalesTransaction {
  id: string
  invoiceNo: string
  date: string // YYYY-MM-DD
  displayDate: string
  time: string
  customer: string
  items: TransactionItem[]
  paymentMethod: 'Tunai' | 'QRIS' | 'Transfer Bank' | 'Kartu Debit'
  status: 'Selesai' | 'Pending' | 'Batal'
}

export interface ExpenseItem {
  id: string
  date: string // YYYY-MM-DD
  displayDate: string
  desc: string
  category: 'Gaji Karyawan' | 'Server & Cloud' | 'Marketing & Iklan' | 'Sewa Kantor' | 'Maintenance'
  amount: number
}

// Master Sales Transactions
const masterTransactions = ref<SalesTransaction[]>([
  {
    id: 'trx-101',
    invoiceNo: 'TRX-20260912-001',
    date: '2026-09-12',
    displayDate: '12 Sep 2026',
    time: '09:15 WIB',
    customer: 'Toko Berkah Utama',
    items: [
      { id: 'i-1', name: 'Kasir POS Pro (Lisensi 1 Tahun)', category: 'Lisensi POS', qty: 1, price: 1250000 },
      { id: 'i-2', name: 'Printer Thermal Bluetooth 80mm', category: 'Hardware', qty: 1, price: 450000 },
      { id: 'i-3', name: 'Kertas Struk Thermal (10 Roll)', category: 'Addon & Aksesoris', qty: 2, price: 45000 },
    ],
    paymentMethod: 'Transfer Bank',
    status: 'Selesai'
  },
  {
    id: 'trx-102',
    invoiceNo: 'TRX-20260912-002',
    date: '2026-09-12',
    displayDate: '12 Sep 2026',
    time: '10:30 WIB',
    customer: 'Apotek Sehat Jaya',
    items: [
      { id: 'i-4', name: 'Paket Usaha Kasir Starter (1 Bulan)', category: 'Lisensi POS', qty: 1, price: 199000 },
      { id: 'i-5', name: 'Addon Laporan Keuangan Multi-Cabang', category: 'Addon & Aksesoris', qty: 1, price: 75000 },
    ],
    paymentMethod: 'QRIS',
    status: 'Selesai'
  },
  {
    id: 'trx-103',
    invoiceNo: 'TRX-20260911-003',
    date: '2026-09-11',
    displayDate: '11 Sep 2026',
    time: '14:20 WIB',
    customer: 'Resto Dapur Nusantara',
    items: [
      { id: 'i-6', name: 'Paket Resto & Cafe Premium (6 Bulan)', category: 'Lisensi POS', qty: 1, price: 1850000 },
      { id: 'i-7', name: 'Barcode Scanner Wireless 2D', category: 'Hardware', qty: 2, price: 380000 },
    ],
    paymentMethod: 'Kartu Debit',
    status: 'Selesai'
  },
  {
    id: 'trx-104',
    invoiceNo: 'TRX-20260911-004',
    date: '2026-09-11',
    displayDate: '11 Sep 2026',
    time: '16:45 WIB',
    customer: 'Minimarket Barokah',
    items: [
      { id: 'i-8', name: 'Paket Retail Standard (1 Bulan)', category: 'Lisensi POS', qty: 1, price: 299000 },
      { id: 'i-9', name: 'Laci Uang Cash Drawer Heavy Duty', category: 'Hardware', qty: 1, price: 520000 },
    ],
    paymentMethod: 'Tunai',
    status: 'Pending'
  },
  {
    id: 'trx-105',
    invoiceNo: 'TRX-20260910-005',
    date: '2026-09-10',
    displayDate: '10 Sep 2026',
    time: '11:10 WIB',
    customer: 'Kopi Kenangan Bangsa',
    items: [
      { id: 'i-10', name: 'Paket Cafe & F&B Express (1 Bulan)', category: 'Lisensi POS', qty: 2, price: 199000 },
    ],
    paymentMethod: 'QRIS',
    status: 'Selesai'
  },
  {
    id: 'trx-106',
    invoiceNo: 'TRX-20260910-006',
    date: '2026-09-10',
    displayDate: '10 Sep 2026',
    time: '15:05 WIB',
    customer: 'Bengkel Maju Motor',
    items: [
      { id: 'i-11', name: 'Paket Bengkel & Jasa (1 Tahun)', category: 'Lisensi POS', qty: 1, price: 990000 },
    ],
    paymentMethod: 'Transfer Bank',
    status: 'Batal'
  },
  {
    id: 'trx-107',
    invoiceNo: 'TRX-20260909-007',
    date: '2026-09-09',
    displayDate: '09 Sep 2026',
    time: '13:40 WIB',
    customer: 'Boutique Fashion Elegant',
    items: [
      { id: 'i-12', name: 'Paket Fashion & Online Sync (3 Bulan)', category: 'Lisensi POS', qty: 1, price: 749000 },
      { id: 'i-13', name: 'Kertas Struk Thermal (5 Roll)', category: 'Addon & Aksesoris', qty: 1, price: 25000 },
    ],
    paymentMethod: 'QRIS',
    status: 'Selesai'
  },
  {
    id: 'trx-108',
    invoiceNo: 'TRX-20260828-008',
    date: '2026-08-28',
    displayDate: '28 Agu 2026',
    time: '10:00 WIB',
    customer: 'Toko Kelontong Pak Haji',
    items: [
      { id: 'i-14', name: 'Paket Usaha Kasir Starter (1 Bulan)', category: 'Lisensi POS', qty: 1, price: 199000 },
    ],
    paymentMethod: 'Tunai',
    status: 'Selesai'
  }
])

// Master Operational Expenses
const masterExpenses = ref<ExpenseItem[]>([
  { id: 'exp-1', date: '2026-09-08', displayDate: '08 Sep 2026', desc: 'Gaji Karyawan Tim Support & Kasir', category: 'Gaji Karyawan', amount: 8500000 },
  { id: 'exp-2', date: '2026-09-09', displayDate: '09 Sep 2026', desc: 'Biaya Server & Cloud Infrastructure', category: 'Server & Cloud', amount: 1500000 },
  { id: 'exp-3', date: '2026-09-07', displayDate: '07 Sep 2026', desc: 'Biaya Marketing & Iklan Ads', category: 'Marketing & Iklan', amount: 2500000 },
  { id: 'exp-4', date: '2026-09-06', displayDate: '06 Sep 2026', desc: 'Biaya Maintenance & License Tool', category: 'Maintenance', amount: 750000 },
  { id: 'exp-5', date: '2026-09-05', displayDate: '05 Sep 2026', desc: 'Biaya Sewa Operasional Kantor', category: 'Sewa Kantor', amount: 2500000 },
  { id: 'exp-6', date: '2026-08-25', displayDate: '25 Agu 2026', desc: 'Gaji Karyawan Agustus', category: 'Gaji Karyawan', amount: 8500000 },
])

export function useReportData() {
  // Shared state for selected period across report views if needed
  const selectedPeriod = ref('Bulan Ini') // 'Hari Ini' | 'Minggu Ini' | 'Bulan Ini' | 'Agustus 2026' | 'Semua'

  // Helper functions
  const getTrxTotalAmount = (trx: SalesTransaction) => {
    return trx.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  }

  const getTrxTotalQty = (trx: SalesTransaction) => {
    return trx.items.reduce((sum, item) => sum + item.qty, 0)
  }

  // Filter transactions based on date or period keyword
  const filterTransactionsByPeriod = (periodKey: string, startDate?: string, endDate?: string) => {
    return masterTransactions.value.filter(trx => {
      if (startDate && trx.date < startDate) return false
      if (endDate && trx.date > endDate) return false
      
      if (!startDate && !endDate) {
        if (periodKey === 'Hari Ini') return trx.date === '2026-09-12'
        if (periodKey === '7 Hari Terakhir' || periodKey === 'Minggu Ini') return trx.date >= '2026-09-06' && trx.date <= '2026-09-12'
        if (periodKey === 'Bulan Ini' || periodKey === 'September 2026') return trx.date.startsWith('2026-09')
        if (periodKey === 'Agustus 2026') return trx.date.startsWith('2026-08')
      }
      return true
    })
  }

  // Filter expenses based on period keyword
  const filterExpensesByPeriod = (periodKey: string, startDate?: string, endDate?: string) => {
    return masterExpenses.value.filter(exp => {
      if (startDate && exp.date < startDate) return false
      if (endDate && exp.date > endDate) return false

      if (!startDate && !endDate) {
        if (periodKey === 'Hari Ini') return exp.date === '2026-09-12'
        if (periodKey === '7 Hari Terakhir' || periodKey === 'Minggu Ini') return exp.date >= '2026-09-06' && exp.date <= '2026-09-12'
        if (periodKey === 'Bulan Ini' || periodKey === 'September 2026') return exp.date.startsWith('2026-09')
        if (periodKey === 'Agustus 2026') return exp.date.startsWith('2026-08')
      }
      return true
    })
  }

  return {
    masterTransactions,
    masterExpenses,
    selectedPeriod,
    getTrxTotalAmount,
    getTrxTotalQty,
    filterTransactionsByPeriod,
    filterExpensesByPeriod
  }
}

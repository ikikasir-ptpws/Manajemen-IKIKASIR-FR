import { ICashTransactionRepository } from '../../domain/interfaces/ICashTransactionRepository.js';
import { CashTransaction } from '../../domain/entities/CashTransaction.js';
import { NotFoundError, BadRequestError } from '../../domain/errors/AppError.js';
import {
  CreateIncomeDto,
  CreateExpenseDto,
  CreateCashTransactionDto,
  UpdateCashTransactionDto,
  CashTransactionFilterDto,
} from '../dtos/cash-transaction.dto.js';

export class CashTransactionUseCases {
  constructor(private cashRepo: ICashTransactionRepository) {}

  /**
   * Helper untuk mengonversi string tanggal ke format Raw YYYY-MM-DD
   */
  private parseRawDate(dateInput?: string): string {
    if (!dateInput) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    return dateInput.substring(0, 10);
  }

  /**
   * Helper untuk format display date Bahasa Indonesia: "12 Sep 2026"
   */
  private formatDisplayDate(rawDateStr: string): string {
    const parts = rawDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthIdx] || ''} ${year}`;
    }
    return rawDateStr;
  }

  /**
   * Helper untuk format waktu Indonesia: "09:15 WIB"
   */
  private formatCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} WIB`;
  }

  /**
   * Mengambil semua transaksi arus kas dengan filter tanggal, tipe, dan search
   */
  async getAllTransactions(filter?: CashTransactionFilterDto): Promise<{
    transactions: CashTransaction[];
    summary: {
      totalMasuk: number;
      totalKeluar: number;
      saldoBersih: number;
      pertumbuhanMasuk: number;
      pertumbuhanKeluar: number;
      countMasuk: number;
      countKeluar: number;
    };
  }> {
    // Pastikan jika database masih kosong, isi dengan data awal
    await this.seedInitialDataIfEmpty();

    const transactions = await this.cashRepo.findAll(filter);
    const summary = await this.cashRepo.getSummary(filter);

    return {
      transactions,
      summary,
    };
  }

  /**
   * Mengambil ringkasan metrik arus kas (Total Masuk, Total Keluar, Saldo Bersih)
   */
  async getSummary(filter?: CashTransactionFilterDto) {
    await this.seedInitialDataIfEmpty();
    return this.cashRepo.getSummary(filter);
  }

  /**
   * Mengambil detail satu transaksi arus kas
   */
  async getTransactionById(id: string): Promise<CashTransaction> {
    const trx = await this.cashRepo.findById(id);
    if (!trx) {
      throw new NotFoundError(`Transaksi arus kas dengan ID '${id}' tidak ditemukan.`);
    }
    return trx;
  }

  /**
   * Mencatat Pemasukan Kas Baru
   */
  async createIncome(dto: CreateIncomeDto): Promise<CashTransaction> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestError('Nominal pemasukan harus lebih besar dari 0.');
    }
    if (!dto.customer || !dto.customer.trim()) {
      throw new BadRequestError('Nama pelanggan atau sumber pemasukan wajib diisi.');
    }

    const rawDate = this.parseRawDate(dto.date);
    const displayDate = dto.displayDate || this.formatDisplayDate(rawDate);
    const time = dto.time || this.formatCurrentTime();
    const dateObj = new Date(rawDate);

    // Generate Invoice No unik: TRX-YYYYMMDD-XXX
    const dateCode = rawDate.replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `TRX-${dateCode}-${randomSuffix}`;

    const descText = dto.desc?.trim()
      ? dto.desc.trim()
      : `Pembayaran Transaksi (${invoiceNo}) - ${dto.customer.trim()}`;

    return this.cashRepo.create({
      type: 'masuk',
      category: dto.category || 'Lisensi POS',
      desc: descText,
      amount: Number(dto.amount),
      date: dateObj,
      rawDate,
      displayDate,
      time,
      customer: dto.customer.trim(),
      paymentMethod: dto.paymentMethod || 'Tunai',
      paymentProofUrl: dto.paymentProofUrl || '',
      status: dto.status || 'Selesai',
      invoiceNo,
      notes: dto.notes || '',
    });
  }

  /**
   * Mencatat Pengeluaran Kas Baru
   */
  async createExpense(dto: CreateExpenseDto): Promise<CashTransaction> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestError('Nominal pengeluaran harus lebih besar dari 0.');
    }
    if (!dto.desc || !dto.desc.trim()) {
      throw new BadRequestError('Deskripsi atau keperluan pengeluaran wajib diisi.');
    }

    const rawDate = this.parseRawDate(dto.date);
    const displayDate = dto.displayDate || this.formatDisplayDate(rawDate);
    const time = dto.time || this.formatCurrentTime();
    const dateObj = new Date(rawDate);

    const dateCode = rawDate.replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `EXP-${dateCode}-${randomSuffix}`;

    return this.cashRepo.create({
      type: 'keluar',
      category: dto.category || 'Operasional & Utilitas',
      desc: dto.desc.trim(),
      amount: Number(dto.amount),
      date: dateObj,
      rawDate,
      displayDate,
      time,
      customer: 'Internal / Vendor',
      paymentMethod: dto.paymentMethod || 'Kas Operasional (Tunai)',
      paymentProofUrl: dto.paymentProofUrl || '',
      status: dto.status || 'Selesai',
      invoiceNo,
      notes: dto.notes || '',
    });
  }

  /**
   * Unified create transaction
   */
  async createTransaction(dto: CreateCashTransactionDto): Promise<CashTransaction> {
    if (dto.type === 'masuk') {
      return this.createIncome({
        date: dto.date,
        displayDate: dto.displayDate,
        time: dto.time,
        customer: dto.customer || 'Pelanggan',
        desc: dto.desc,
        category: dto.category,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentProofUrl: dto.paymentProofUrl,
        status: dto.status,
        notes: dto.notes,
      });
    } else {
      return this.createExpense({
        date: dto.date,
        displayDate: dto.displayDate,
        time: dto.time,
        desc: dto.desc || dto.category,
        category: dto.category,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentProofUrl: dto.paymentProofUrl,
        status: dto.status,
        notes: dto.notes,
      });
    }
  }

  /**
   * Memperbarui data transaksi arus kas
   */
  async updateTransaction(id: string, dto: UpdateCashTransactionDto): Promise<CashTransaction> {
    const existing = await this.cashRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Transaksi arus kas dengan ID '${id}' tidak ditemukan.`);
    }

    let dateObj: Date | undefined;
    let rawDate: string | undefined;
    let displayDate: string | undefined;

    if (dto.date) {
      rawDate = this.parseRawDate(dto.date);
      displayDate = dto.displayDate || this.formatDisplayDate(rawDate);
      dateObj = new Date(rawDate);
    }

    return this.cashRepo.update(id, {
      category: dto.category,
      desc: dto.desc,
      amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
      date: dateObj,
      rawDate,
      displayDate,
      time: dto.time,
      customer: dto.customer,
      paymentMethod: dto.paymentMethod,
      paymentProofUrl: dto.paymentProofUrl,
      status: dto.status,
      notes: dto.notes,
    });
  }

  /**
   * Menghapus transaksi arus kas
   */
  async deleteTransaction(id: string): Promise<boolean> {
    const existing = await this.cashRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Transaksi arus kas dengan ID '${id}' tidak ditemukan.`);
    }
    return this.cashRepo.delete(id);
  }

  /**
   * Seeding data awal jika tabel cash_transactions masih kosong
   */
  async seedInitialDataIfEmpty(): Promise<void> {
    const count = await this.cashRepo.count();
    if (count > 0) return;

    // Data awal Pemasukan (Income)
    const initialIncomes = [
      {
        date: '2026-09-12',
        displayDate: '12 Sep 2026',
        time: '09:15 WIB',
        customer: 'Toko Berkah Utama',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260912-001) - Toko Berkah Utama (Kasir POS Pro Lisensi 1 Tahun)',
        amount: 1745000,
        paymentMethod: 'Transfer Bank',
        status: 'Selesai',
        invoiceNo: 'TRX-20260912-001',
      },
      {
        date: '2026-09-12',
        displayDate: '12 Sep 2026',
        time: '10:30 WIB',
        customer: 'Apotek Sehat Jaya',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260912-002) - Apotek Sehat Jaya (Paket Starter 1 Bulan)',
        amount: 274000,
        paymentMethod: 'QRIS',
        status: 'Selesai',
        invoiceNo: 'TRX-20260912-002',
      },
      {
        date: '2026-09-11',
        displayDate: '11 Sep 2026',
        time: '14:20 WIB',
        customer: 'Resto Dapur Nusantara',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260911-003) - Resto Dapur Nusantara (Paket Resto Custom 6 Bulan)',
        amount: 2610000,
        paymentMethod: 'Kartu Debit',
        status: 'Selesai',
        invoiceNo: 'TRX-20260911-003',
      },
      {
        date: '2026-09-11',
        displayDate: '11 Sep 2026',
        time: '16:45 WIB',
        customer: 'Minimarket Barokah',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260911-004) - Minimarket Barokah (Paket Retail Standard 1 Bulan)',
        amount: 819000,
        paymentMethod: 'Tunai',
        status: 'Pending',
        invoiceNo: 'TRX-20260911-004',
      },
      {
        date: '2026-09-10',
        displayDate: '10 Sep 2026',
        time: '11:10 WIB',
        customer: 'Kopi Kenangan Bangsa',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260910-005) - Kopi Kenangan Bangsa (Paket Cafe & F&B Express)',
        amount: 398000,
        paymentMethod: 'QRIS',
        status: 'Selesai',
        invoiceNo: 'TRX-20260910-005',
      },
      {
        date: '2026-09-09',
        displayDate: '09 Sep 2026',
        time: '13:40 WIB',
        customer: 'Boutique Fashion Elegant',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260909-007) - Boutique Fashion Elegant (Paket Fashion 3 Bulan)',
        amount: 774000,
        paymentMethod: 'QRIS',
        status: 'Selesai',
        invoiceNo: 'TRX-20260909-007',
      },
      {
        date: '2026-08-28',
        displayDate: '28 Agu 2026',
        time: '10:00 WIB',
        customer: 'Toko Kelontong Pak Haji',
        category: 'Lisensi POS',
        desc: 'Pembayaran Transaksi (TRX-20260828-008) - Toko Kelontong Pak Haji (Paket Starter 1 Bulan)',
        amount: 199000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
        invoiceNo: 'TRX-20260828-008',
      },
    ];

    // Data awal Pengeluaran (Expense)
    const initialExpenses = [
      {
        date: '2026-09-08',
        displayDate: '08 Sep 2026',
        time: '10:00 WIB',
        category: 'Gaji Karyawan',
        desc: 'Gaji Karyawan Tim Support & Kasir',
        amount: 8500000,
        paymentMethod: 'Rekening BCA Perusahaan',
        invoiceNo: 'EXP-20260908-101',
      },
      {
        date: '2026-09-09',
        displayDate: '09 Sep 2026',
        time: '11:30 WIB',
        category: 'Server & Cloud',
        desc: 'Biaya Server & Cloud Infrastructure',
        amount: 1500000,
        paymentMethod: 'Rekening BCA Perusahaan',
        invoiceNo: 'EXP-20260909-102',
      },
      {
        date: '2026-09-07',
        displayDate: '07 Sep 2026',
        time: '14:00 WIB',
        category: 'Marketing & Iklan',
        desc: 'Biaya Marketing & Iklan Ads',
        amount: 2500000,
        paymentMethod: 'Rekening Mandiri',
        invoiceNo: 'EXP-20260907-103',
      },
      {
        date: '2026-09-06',
        displayDate: '06 Sep 2026',
        time: '09:45 WIB',
        category: 'Maintenance',
        desc: 'Biaya Maintenance & License Tool',
        amount: 750000,
        paymentMethod: 'Kas Operasional (Tunai)',
        invoiceNo: 'EXP-20260906-104',
      },
      {
        date: '2026-09-05',
        displayDate: '05 Sep 2026',
        time: '08:30 WIB',
        category: 'Sewa Kantor',
        desc: 'Biaya Sewa Operasional Kantor',
        amount: 2500000,
        paymentMethod: 'Rekening BCA Perusahaan',
        invoiceNo: 'EXP-20260905-105',
      },
      {
        date: '2026-08-25',
        displayDate: '25 Agu 2026',
        time: '10:00 WIB',
        category: 'Gaji Karyawan',
        desc: 'Gaji Karyawan Agustus',
        amount: 8500000,
        paymentMethod: 'Rekening BCA Perusahaan',
        invoiceNo: 'EXP-20260825-106',
      },
    ];

    for (const inc of initialIncomes) {
      await this.cashRepo.create({
        type: 'masuk',
        category: inc.category,
        desc: inc.desc,
        amount: inc.amount,
        date: new Date(inc.date),
        rawDate: inc.date,
        displayDate: inc.displayDate,
        time: inc.time,
        customer: inc.customer,
        paymentMethod: inc.paymentMethod,
        paymentProofUrl: '',
        status: inc.status,
        invoiceNo: inc.invoiceNo,
        notes: 'Data inisialisasi awal sistem',
      });
    }

    for (const exp of initialExpenses) {
      await this.cashRepo.create({
        type: 'keluar',
        category: exp.category,
        desc: exp.desc,
        amount: exp.amount,
        date: new Date(exp.date),
        rawDate: exp.date,
        displayDate: exp.displayDate,
        time: exp.time,
        customer: 'Internal Perusahaan',
        paymentMethod: exp.paymentMethod,
        paymentProofUrl: '',
        status: 'Selesai',
        invoiceNo: exp.invoiceNo,
        notes: 'Data inisialisasi operasional awal',
      });
    }
  }
}

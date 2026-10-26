import { ICustomerRepository } from '../../domain/interfaces/ICustomerRepository.js';
import { IPackageRepository } from '../../domain/interfaces/IPackageRepository.js';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  RenewSubscriptionDto,
  CustomerResponseDto,
  SubscriptionCheckResponseDto,
  SimulateExpiredDto,
} from '../dtos/customer.dto.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../domain/errors/AppError.js';
import { Customer } from '../../domain/entities/Customer.js';
import { saveProofFileToStorage } from '../../infrastructure/utils/storage.util.js';

export class CustomerUseCases {
  constructor(
    private customerRepository: ICustomerRepository,
    private packageRepository: IPackageRepository
  ) {}

  private calculateExpiryDate(startDate: Date, months: number): Date {
    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
  }

  public async createCustomer(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const cleanEmail = dto.email.toLowerCase().trim();

    // 1. Validasi keunikan email pelanggan
    const existing = await this.customerRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new ConflictError(`Pelanggan dengan email '${cleanEmail}' sudah terdaftar dalam sistem.`);
    }

    // 2. Ambil paket yang dipilih jika ada
    let selectedPackage = null;
    let packageName = 'Custom / IT One';
    let packagePrice = 0;
    let packagePeriod = '/bulan';
    let months = dto.billingCycleMonths && dto.billingCycleMonths > 0 ? dto.billingCycleMonths : 1;

    if (dto.packageId) {
      selectedPackage = await this.packageRepository.findById(dto.packageId);
      if (!selectedPackage) {
        throw new NotFoundError(`Paket langganan dengan ID '${dto.packageId}' tidak ditemukan.`);
      }
      packageName = selectedPackage.name;
      packagePrice = selectedPackage.price;
      packagePeriod = selectedPackage.period;

      if (!dto.billingCycleMonths) {
        if (selectedPackage.period.includes('tahun')) {
          months = 12;
        } else {
          months = 1;
        }
      }
    }

    const startedAt = new Date();
    const expiresAt = this.calculateExpiryDate(startedAt, months);
    const totalAmount = dto.paymentAmount !== undefined ? dto.paymentAmount : packagePrice * months;
    const finalMethod = dto.paymentMethod || 'QRIS';
    const finalProof = saveProofFileToStorage(dto.paymentProofUrl);

    // 3. Simpan data pelanggan ke database
    const newCustomer = await this.customerRepository.create({
      name: dto.name,
      businessName: dto.businessName,
      email: cleanEmail,
      phone: dto.phone,
      address: dto.address,
      packageId: selectedPackage?.id,
      status: 'ACTIVE',
      startedAt,
      expiresAt,
      notes: dto.notes,
      paymentProofUrl: finalProof,
      paymentMethod: finalMethod,
      paymentAmount: totalAmount,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : startedAt,
      paymentStatus: dto.paymentStatus || 'PAID',
      appUsername: dto.appUsername || cleanEmail,
      appPassword: dto.appPassword || 'Kasir#2026',
      technicianStatus: dto.technicianStatus || 'completed',
    });

    // 4. Catat riwayat invoice awal
    try {
      await this.customerRepository.addSubscriptionHistory({
        customerId: newCustomer.id,
        packageId: selectedPackage?.id,
        packageName,
        amount: totalAmount,
        billingCycleMonths: months,
        paymentMethod: finalMethod,
        paymentStatus: dto.paymentStatus || 'PAID',
        paymentProofUrl: finalProof,
        notes: dto.notes || `Pendaftaran awal paket ${packageName} (${months} Bulan)`,
        startedAt,
        expiresAt,
      });
    } catch (historyErr) {
      console.warn('⚠️ Gagal menyimpan riwayat subscription awal:', historyErr);
    }

    return newCustomer.toJSON();
  }

  public async getAllCustomers(filter?: {
    search?: string;
    status?: string;
    packageId?: string;
  }): Promise<CustomerResponseDto[]> {
    const list = await this.customerRepository.findAll(filter);
    return list.map((c) => c.toJSON());
  }

  public async getCustomerById(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${id}' tidak ditemukan.`);
    }
    return customer.toJSON();
  }

  public async getCustomerByEmail(email: string): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan email '${email}' tidak ditemukan.`);
    }
    return customer.toJSON();
  }

  public async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${id}' tidak ditemukan.`);
    }

    if (dto.email && dto.email.toLowerCase().trim() !== customer.email) {
      const emailTaken = await this.customerRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictError(`Email '${dto.email}' sudah digunakan oleh pelanggan lain.`);
      }
    }

    const updateData: any = { ...dto };
    if (dto.paymentProofUrl !== undefined) {
      updateData.paymentProofUrl = saveProofFileToStorage(dto.paymentProofUrl);
    }
    const updated = await this.customerRepository.update(id, updateData);
    return updated.toJSON();
  }

  public async renewSubscription(
    id: string,
    dto: RenewSubscriptionDto
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${id}' tidak ditemukan.`);
    }

    const targetPackageId = dto.packageId || customer.packageId;
    let packageName = customer.packageName;
    let packagePrice = customer.packagePrice;
    let months = dto.billingCycleMonths && dto.billingCycleMonths > 0 ? dto.billingCycleMonths : 1;

    if (targetPackageId) {
      const pkg = await this.packageRepository.findById(targetPackageId);
      if (pkg) {
        packageName = pkg.name;
        packagePrice = pkg.price;
      }
    }

    // Jika belum expired: perpanjangan dihitung dari expiresAt saat ini.
    // Jika sudah expired: perpanjangan dihitung mulai dari hari ini.
    const isCurrentlyExpired = customer.isExpired();
    const baseDate = isCurrentlyExpired ? new Date() : new Date(customer.expiresAt);
    const newExpiresAt = this.calculateExpiryDate(baseDate, months);
    const amount = dto.customAmount !== undefined ? dto.customAmount : packagePrice * months;
    const finalProof = dto.paymentProofUrl !== undefined ? saveProofFileToStorage(dto.paymentProofUrl) : undefined;

    // Perbarui status dan masa aktif pelanggan
    const updatedCustomer = await this.customerRepository.update(id, {
      packageId: targetPackageId,
      status: 'ACTIVE',
      expiresAt: newExpiresAt,
      paymentProofUrl: finalProof,
      paymentMethod: dto.paymentMethod !== undefined ? dto.paymentMethod : undefined,
      paymentAmount: amount,
    });

    // Catat invoice / riwayat pembayaran
    await this.customerRepository.addSubscriptionHistory({
      customerId: id,
      packageId: targetPackageId,
      packageName,
      amount,
      billingCycleMonths: months,
      paymentMethod: dto.paymentMethod || 'QRIS',
      paymentStatus: 'PAID',
      paymentProofUrl: finalProof || customer.paymentProofUrl || '',
      notes: dto.notes || `Perpanjangan paket ${packageName} (${months} Bulan)`,
      startedAt: baseDate,
      expiresAt: newExpiresAt,
    });

    return updatedCustomer.toJSON();
  }

  public async getExpiredCustomers(search?: string): Promise<CustomerResponseDto[]> {
    const list = await this.customerRepository.findExpired(search);
    return list.map((c) => c.toJSON());
  }

  public async deleteCustomer(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${id}' tidak ditemukan.`);
    }
    await this.customerRepository.delete(id);
  }

  public async getCustomerHistories(customerId: string) {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${customerId}' tidak ditemukan.`);
    }
    const histories = await this.customerRepository.getSubscriptionHistories(customerId);
    return histories.map((h) => h.toJSON());
  }

  /**
   * Endpoint Utama untuk Pengecekan Android:
   * Memvalidasi apakah email pelanggan aktif atau kedaluwarsa
   */
  public async checkSubscription(emailOrUid: string): Promise<SubscriptionCheckResponseDto> {
    if (!emailOrUid || !emailOrUid.trim()) {
      throw new BadRequestError('Parameter email harus disertakan.');
    }

    const cleanInput = emailOrUid.trim().toLowerCase();
    const now = new Date();
    const serverTime = now.toISOString();

    // Cari pelanggan berdasarkan email atau ID pelanggan
    let customer: Customer | null = await this.customerRepository.findByEmail(cleanInput);
    if (!customer) {
      customer = await this.customerRepository.findById(cleanInput);
    }

    // Auto-create untuk akun pengujian default (admin@gmail.com) jika belum ada di database
    if (!customer && cleanInput === 'admin@gmail.com') {
      try {
        const pkgs = await this.packageRepository.findAll({ isActive: true });
        const defaultPkg = pkgs[0];
        customer = await this.customerRepository.create({
          name: 'Admin Kasir',
          businessName: 'Toko Admin IKIKASIR',
          email: 'admin@gmail.com',
          phone: '081234567890',
          address: 'Jl. Raya Utama IKIKASIR No. 1',
          packageId: defaultPkg?.id || null,
          status: 'EXPIRED',
          startedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          notes: '[Auto-created for Testing] Akun admin@gmail.com otomatis expired untuk pengujian Android',
        });
      } catch (err) {
        console.warn('Gagal auto-create customer admin@gmail.com:', err);
      }
    }

    // 1. Kasus: Pelanggan tidak ditemukan
    if (!customer) {
      return {
        isActive: false,
        canAccess: false,
        status: 'NOT_FOUND',
        isExpired: true,
        email: cleanInput,
        customerName: 'Belum Terdaftar',
        businessName: 'Belum Terdaftar',
        packageName: '-',
        message: `Akun (${cleanInput}) belum terdaftar sebagai pelanggan aktif IKIKASIR. Silakan hubungi admin untuk aktivasi.`,
        serverTime,
      };
    }

    // 2. Kasus: Akun disuspend / ditangguhkan manual oleh admin
    if (customer.status === 'SUSPENDED') {
      return {
        isActive: false,
        canAccess: false,
        status: 'SUSPENDED',
        isExpired: false,
        customerName: customer.name,
        businessName: customer.businessName,
        email: customer.email,
        packageName: customer.packageName,
        expiresAt: customer.expiresAt.toISOString(),
        daysRemaining: 0,
        message: 'Akses toko Anda ditangguhkan sementara oleh manajemen. Silakan hubungi admin IKIKASIR.',
        serverTime,
      };
    }

    const isExpired = customer.isExpired(now);
    const daysRemaining = customer.getDaysRemaining(now);
    const daysExpired = customer.getDaysExpired(now);

    // 3. Kasus: Masa aktif telah kedaluwarsa
    if (isExpired) {
      return {
        isActive: false,
        canAccess: false,
        status: 'EXPIRED',
        isExpired: true,
        customerName: customer.name,
        businessName: customer.businessName,
        email: customer.email,
        packageName: customer.packageName,
        expiresAt: customer.expiresAt.toISOString(),
        daysRemaining: 0,
        message: `Masa langganan IKIKASIR untuk toko '${customer.businessName}' telah berakhir ${daysExpired} hari yang lalu. Silakan lakukan perpanjangan paket agar dapat kembali bertransaksi.`,
        serverTime,
      };
    }

    // 4. Kasus: Langganan aktif
    return {
      isActive: true,
      canAccess: true,
      status: 'ACTIVE',
      isExpired: false,
      customerName: customer.name,
      businessName: customer.businessName,
      email: customer.email,
      packageName: customer.packageName,
      expiresAt: customer.expiresAt.toISOString(),
      daysRemaining,
      message: `Langganan aktif. Sisa masa aktif: ${daysRemaining} hari.`,
      serverTime,
    };
  }

  /**
   * Helper Pengujian Cepat: Mengubah expiresAt pelanggan ke masa lampau
   * agar langsung bisa mengetes popup kadaluarsa di Android
   */
  public async simulateExpired(dto: SimulateExpiredDto): Promise<CustomerResponseDto> {
    const cleanEmail = dto.email.toLowerCase().trim();
    let customer = await this.customerRepository.findByEmail(cleanEmail);
    const daysAgo = dto.daysAgo && dto.daysAgo > 0 ? dto.daysAgo : 1;
    const pastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    if (!customer) {
      const pkgs = await this.packageRepository.findAll({ isActive: true });
      const defaultPkg = pkgs[0];
      const namePart = cleanEmail.split('@')[0];
      const newCust = await this.customerRepository.create({
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        businessName: `Toko ${namePart.toUpperCase()}`,
        email: cleanEmail,
        phone: '081234567890',
        address: 'Alamat Pengujian',
        packageId: defaultPkg?.id || null,
        status: 'EXPIRED',
        startedAt: new Date(Date.now() - (daysAgo + 30) * 24 * 60 * 60 * 1000),
        expiresAt: pastDate,
        notes: `[Auto-created for Testing] Simulasi expired untuk ${cleanEmail}`,
      });
      return newCust.toJSON();
    }

    const updated = await this.customerRepository.update(customer.id, {
      status: 'EXPIRED',
      expiresAt: pastDate,
      notes: `[Simulasi Testing] Masa aktif diubah ke ${daysAgo} hari yang lalu untuk pengujian popup Android.`,
    });

    return updated.toJSON();
  }
}

import { ICustomerRepository } from '../../domain/interfaces/ICustomerRepository.js';
import { IReferralRepository } from '../../domain/interfaces/IReferralRepository.js';
import { ILeadRepository } from '../../domain/interfaces/ILeadRepository.js';
import {
  NotFoundError,
  BadRequestError,
} from '../../domain/errors/AppError.js';
import {
  ValidateReferralCodeResponseDto,
  ReferralOverviewDto,
  ReferralUserItemDto,
  ReferralWithdrawalItemDto,
  RequestReferralWithdrawalDto,
  UpdateReferralWithdrawalDto,
  SubmitClientByReferralDto,
  ClientWithdrawalDto,
} from '../dtos/referral.dto.js';
import { Customer } from '../../domain/entities/Customer.js';

/**
 * Hadiah komisi referral per pelanggan aktif (sama dengan nilai pada halaman Referral aplikasi IKIKASIR)
 */
export const REFERRAL_REWARD_PER_ACTIVE_USER = 15000;

/**
 * Prefix kode referral yang dibuat otomatis untuk setiap pelanggan
 */
export const REFERRAL_CODE_PREFIX = 'IKIKASIR-';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatDateID = (date?: Date | null): string => {
  if (!date) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
};

const referralStatusLabel = (status: string): string => {
  switch (status) {
    case 'AKTIF':
      return 'Aktif';
    case 'DITOLAK':
      return 'Ditolak';
    default:
      return 'Menunggu Verifikasi';
  }
};

export class ReferralUseCases {
  constructor(
    private customerRepository: ICustomerRepository,
    private referralRepository: IReferralRepository,
    private leadRepository?: ILeadRepository
  ) {}

  /**
   * Membuat kode referal unik untuk pelanggan (contoh: IKIKASIR-8F3KD)
   */
  private async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const randomPart = Math.random()
        .toString(36)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5)
        .padEnd(5, 'X');
      const code = `${REFERRAL_CODE_PREFIX}${randomPart}`;
      const existing = await this.customerRepository.findByReferralCode(code);
      if (!existing) return code;
    }
    return `${REFERRAL_CODE_PREFIX}${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }

  /**
   * Pastikan pelanggan memiliki kode referal (dibuat otomatis bila belum ada)
   */
  public async ensureReferralCode(customerId: string): Promise<string> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${customerId}' tidak ditemukan.`);
    }

    // Khusus akun simulasi real Sayyid (ikikasir.id@gmail.com)
    if (customer.email === 'ikikasir.id@gmail.com' || customer.name?.toLowerCase().includes('sayyid')) {
      if (customer.referralCode !== 'IKIKASIR-0WTCK') {
        await this.customerRepository.update(customerId, { referralCode: 'IKIKASIR-0WTCK' });
      }
      return 'IKIKASIR-0WTCK';
    }

    if (customer.referralCode) return customer.referralCode;

    const code = await this.generateUniqueReferralCode();
    await this.customerRepository.update(customerId, { referralCode: code });
    return code;
  }

  /**
   * Validasi kode referral yang diketik admin pada halaman Tambah Client.
   * Mengembalikan informasi upline (pelanggan pemilik kode) bila kode valid.
   */
  public async validateReferralCode(code: string): Promise<ValidateReferralCodeResponseDto> {
    const normalized = (code || '').trim().toUpperCase();

    if (!normalized) {
      return {
        valid: false,
        code: normalized,
        message: 'Kode referral wajib diisi.',
        rewardPerActiveUser: REFERRAL_REWARD_PER_ACTIVE_USER,
        upline: null,
      };
    }

    const upline = await this.customerRepository.findByReferralCode(normalized);
    if (!upline) {
      return {
        valid: false,
        code: normalized,
        message: `Kode referral '${normalized}' tidak ditemukan atau belum dipakai pelanggan manapun.`,
        rewardPerActiveUser: REFERRAL_REWARD_PER_ACTIVE_USER,
        upline: null,
      };
    }

    return {
      valid: true,
      code: normalized,
      message: `Kode referral valid. Client akan terhubung ke pelanggan '${upline.name}'.`,
      rewardPerActiveUser: REFERRAL_REWARD_PER_ACTIVE_USER,
      upline: {
        id: upline.id,
        name: upline.name,
        businessName: upline.businessName,
        referralCode: upline.referralCode,
        phone: upline.phone,
        boundDate: upline.referralBoundAt ? formatDateID(upline.referralBoundAt) : null,
      },
    };
  }

  /**
   * Menghubungkan client baru ke upline berdasarkan kode referral.
   * Mencatat komisi referral sesuai alur aplikasi IKIKASIR (Tarik Saldo -> Verifikasi Finance -> Selesai).
   */
  public async bindReferral(
    downlineCustomerId: string,
    code: string,
    source = 'Manual'
  ): Promise<void> {
    const normalized = (code || '').trim().toUpperCase();
    const upline = await this.customerRepository.findByReferralCode(normalized);
    if (!upline) {
      throw new BadRequestError(`Kode referral '${normalized}' tidak ditemukan.`);
    }
    if (upline.id === downlineCustomerId) {
      throw new BadRequestError('Client tidak dapat menggunakan kode referral miliknya sendiri.');
    }

    const existing = await this.referralRepository.findCommissionByUplineAndDownline(upline.id, downlineCustomerId);
    if (existing) {
      return;
    }

    const downline = await this.customerRepository.findById(downlineCustomerId);
    const isActiveUser = !!downline && downline.getComputedStatus() === 'ACTIVE';

    await this.referralRepository.createCommission({
      uplineId: upline.id,
      downlineId: downlineCustomerId,
      amount: REFERRAL_REWARD_PER_ACTIVE_USER,
      status: isActiveUser ? 'AKTIF' : 'MENUNGGU_VERIFIKASI',
      notes: `Komisi referral dari ${downline?.businessName || downline?.name || 'client baru'} (${source})`,
    });
  }

  /**
   * Ringkasan halaman Referral untuk seorang pelanggan:
   * Mendukung pencarian berdasarkan ID maupun Email pelanggan (dari Android app).
   * Menampilkan kode referal, upline ("Aku terikat ke siapa?"), saldo komisi,
   * daftar downline (pelanggan aktif + calon client yang menunggu verifikasi), dan riwayat pencairan.
   */
  public async getOverview(customerIdOrEmail: string): Promise<ReferralOverviewDto> {
    const cleanInput = (customerIdOrEmail || '').trim().toLowerCase();
    let customer: Customer | null = null;

    if (cleanInput.includes('@')) {
      customer = await this.customerRepository.findByEmail(cleanInput);
    } else {
      customer = await this.customerRepository.findById(customerIdOrEmail);
      if (!customer) {
        customer = await this.customerRepository.findByEmail(cleanInput);
      }
    }

    // Auto-create untuk akun default Android jika belum ada di database
    if (!customer && (cleanInput === 'ikikasir.id@gmail.com' || cleanInput === 'admin@gmail.com')) {
      try {
        const isClient = cleanInput === 'ikikasir.id@gmail.com';
        customer = await this.customerRepository.create({
          name: isClient ? 'Sayyid' : 'Admin Kasir',
          businessName: isClient ? 'Toko Sayyid' : 'Toko Admin IKIKASIR',
          email: cleanInput,
          phone: '081234567890',
          address: 'Jl. Merdeka No. 1, Jakarta',
          status: isClient ? 'ACTIVE' : 'EXPIRED',
          startedAt: isClient ? new Date() : new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          expiresAt: isClient ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          referralCode: isClient ? 'IKIKASIR-0WTCK' : undefined,
          referredByCustomerName: isClient ? 'MUhib' : undefined,
          referredByCustomerId: isClient ? 'MUB-9921' : undefined,
          referralBoundAt: isClient ? new Date('2026-09-10') : undefined,
          referralSource: isClient ? 'Aplikasi' : undefined,
          notes: 'Akun lisensi IKIKASIR - Sayyid',
        });
      } catch (err) {
        console.warn('Gagal auto-create customer di getOverview:', err);
      }
    }

    if (customer && (customer.email === 'ikikasir.id@gmail.com' || customer.name?.toLowerCase().includes('sayyid'))) {
      if (customer.referralCode !== 'IKIKASIR-0WTCK') {
        try {
          customer = await this.customerRepository.update(customer.id, {
            referralCode: 'IKIKASIR-0WTCK',
          });
        } catch {}
      }
    }

    if (!customer) {
      throw new NotFoundError(`Pelanggan '${customerIdOrEmail}' tidak ditemukan.`);
    }

    const referralCode = await this.ensureReferralCode(customer.id);
    const commissions = await this.referralRepository.findCommissionsByUpline(customer.id);
    const withdrawals = await this.referralRepository.findWithdrawalsByCustomer(customer.id);

    // 1. Ambil daftar pelanggan yang sudah resmi aktif / dapat komisi
    const activeCommissionDownlineIds = new Set(commissions.map((c) => c.downlineId));
    const activeReferredUsers: ReferralUserItemDto[] = commissions.map((c) => ({
      id: c.downlineId,
      storeName: c.downlineBusinessName || 'Toko Client',
      ownerName: c.downlineName || 'Pemilik Toko',
      phoneNumber: c.downlinePhone || '',
      registeredDate: formatDateID(c.createdAt),
      isActive: c.status === 'AKTIF',
      status: referralStatusLabel(c.status),
      commissionEarned: c.status === 'AKTIF' ? c.amount : 0,
    }));

    // 2. Ambil daftar calon client (leads) yang diajukan dengan referral pelanggan ini namun belum dikonversi
    const pendingLeadsUsers: ReferralUserItemDto[] = [];
    if (this.leadRepository) {
      try {
        const relatedLeads = await this.leadRepository.findAll({
          referredByCustomerId: customer.id,
        });

        for (const lead of relatedLeads) {
          // Hanya masukkan jika belum dikonversi atau belum tercatat di komisi aktif
          if (lead.status !== 'Converted' && !activeCommissionDownlineIds.has(lead.id)) {
            pendingLeadsUsers.push({
              id: lead.id,
              storeName: lead.businessName,
              ownerName: lead.name,
              phoneNumber: lead.phone,
              registeredDate: formatDateID(lead.registrationDate || lead.createdAt),
              isActive: false,
              status: 'Menunggu Verifikasi',
              commissionEarned: 0,
            });
          }
        }
      } catch (leadErr) {
        console.warn('Gagal mengambil leads referral:', leadErr);
      }
    }

    // Gabungkan list: pelanggan aktif lebih dulu, diikuti calon client yang diajukan
    const referredUsers: ReferralUserItemDto[] = [...activeReferredUsers, ...pendingLeadsUsers];

    const totalEarnings = activeReferredUsers
      .filter((u) => u.isActive)
      .reduce((sum, u) => sum + (u.commissionEarned || REFERRAL_REWARD_PER_ACTIVE_USER), 0);

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'SELESAI')
      .reduce((sum, w) => sum + w.amount, 0);

    const withdrawalItems: ReferralWithdrawalItemDto[] = withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount,
      bankOrWallet: w.bankOrWallet,
      accountNumber: w.accountNumber,
      accountHolder: w.accountHolder,
      requestDate: formatDateID(w.requestDate),
      completedDate: w.completedDate ? formatDateID(w.completedDate) : null,
      status: w.status,
      notes: w.notes,
    }));

    const referralInfo = {
      customerId: customer.id,
      referralCode,
      uplineName: customer.referredByCustomerName || 'Belum Terikat',
      uplineCode: customer.referredByCustomerId ?? '',
      uplineBoundDate: customer.referralBoundAt ? formatDateID(customer.referralBoundAt) : null,
      isBound: !!(customer.referredByCustomerId || customer.referredByCustomerName),
      availableBalance: Math.max(totalEarnings - totalWithdrawn, 0),
      totalEarnings,
      totalWithdrawn,
      rewardPerActiveUser: REFERRAL_REWARD_PER_ACTIVE_USER,
    };

    return {
      ...referralInfo,
      referredUsers,
      withdrawals: withdrawalItems,
      // Alias struktur untuk aplikasi Android (APK lama membaca object referralInfo)
      referralInfo,
      // Alias daftar downline untuk aplikasi Android (APK lama membaca userReferrals)
      userReferrals: referredUsers,
    };
  }

  /**
   * Mengajukan Calon Client dari aplikasi Android menggunakan kode referral pemilik toko.
   * Calon client akan otomatis terhubung ke pelanggan (upline) dan berstatus 'Menunggu Verifikasi'.
   * Ketika calon client di-Acc/disetujui oleh admin/finance, otomatis menjadi pelanggan aktif dan komisi 15k cair.
   */
  public async submitClientByReferral(dto: SubmitClientByReferralDto): Promise<any> {
    const normalizedCode = (dto.referralCode || '').trim().toUpperCase();

    const name = (dto.name || '').trim();
    const businessName = (dto.businessName || '').trim();
    const phone = (dto.phone || '').trim();

    if (!name) throw new BadRequestError('Nama pemilik usaha wajib diisi.');
    if (!businessName) throw new BadRequestError('Nama toko / usaha wajib diisi.');
    if (!phone) throw new BadRequestError('Nomor telepon/WhatsApp wajib diisi.');

    // ── Deteksi pengundang ────────────────────────────────────────────────
    // 1. Prioritas: kode referral yang dikirim aplikasi Android
    // 2. Fallback: token referral global (email / ID pelanggan pengundang)
    let upline: Customer | null = null;
    if (normalizedCode) {
      upline = await this.customerRepository.findByReferralCode(normalizedCode);
      if (!upline) {
        throw new BadRequestError(`Kode referral '${normalizedCode}' tidak ditemukan.`);
      }
    } else {
      const userEmail = (dto.userEmail || '').trim().toLowerCase();
      const customerId = (dto.customerId || '').trim();

      if (userEmail) {
        upline = await this.customerRepository.findByEmail(userEmail);
      }
      if (!upline && customerId) {
        upline = await this.customerRepository.findById(customerId);
      }
      if (!upline) {
        throw new BadRequestError(
          'Kode referral wajib diisi atau lisensi pengundang belum dikenali.'
        );
      }
    }

    // Pastikan pengundang punya kode referal (dibuat otomatis bila belum ada)
    const uplineCode = upline.referralCode || (await this.ensureReferralCode(upline.id));

    if (!this.leadRepository) {
      throw new BadRequestError('Repository lead tidak tersedia.');
    }

    const cleanEmail = (dto.email || '').trim().toLowerCase() ||
      `client.${Date.now().toString(36)}@ikikasir.id`;

    const notes = dto.notes?.trim() ||
      `Diajukan via aplikasi kasir (Kode Referral: ${uplineCode} milik ${upline.name})`;

    const newLead = await this.leadRepository.create({
      name,
      businessName,
      phone,
      email: cleanEmail,
      source: 'Referral',
      status: 'New',
      referralCode: uplineCode,
      referredByCustomerId: upline.id,
      referredByCustomerName: upline.name,
      referredByBusinessName: upline.businessName,
      packageInterest: dto.packageInterest || 'Basic',
      estimatedDeal: 250000,
      notes,
    });

    return {
      success: true,
      message: `Calon client '${businessName}' berhasil diajukan dan terhubung ke referal '${upline.name}'. Menunggu persetujuan admin/finance.`,
      referralCode: uplineCode,
      referredBy: {
        id: upline.id,
        name: upline.name,
        businessName: upline.businessName,
        referralCode: uplineCode,
      },
      lead: newLead.toJSON(),
      upline: {
        id: upline.id,
        name: upline.name,
        businessName: upline.businessName,
        referralCode: uplineCode,
      },
    };
  }

  /**
   * Permintaan pencairan saldo komisi referral oleh pelanggan
   */
  public async requestWithdrawal(
    customerId: string,
    dto: RequestReferralWithdrawalDto
  ): Promise<ReferralWithdrawalItemDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError(`Pelanggan dengan ID '${customerId}' tidak ditemukan.`);
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestError('Nominal penarikan harus lebih dari Rp 0.');
    }
    if (!dto.bankOrWallet || !dto.bankOrWallet.trim()) {
      throw new BadRequestError('Silakan pilih bank atau e-wallet tujuan.');
    }
    if (!dto.accountNumber || !dto.accountNumber.trim() || !dto.accountHolder || !dto.accountHolder.trim()) {
      throw new BadRequestError('Nomor rekening dan nama pemilik rekening wajib diisi.');
    }

    const overview = await this.getOverview(customerId);
    if (dto.amount > overview.availableBalance) {
      throw new BadRequestError('Saldo tidak mencukupi untuk melakukan penarikan ini.');
    }

    const withdrawal = await this.referralRepository.createWithdrawal({
      customerId,
      amount: dto.amount,
      bankOrWallet: dto.bankOrWallet.trim(),
      accountNumber: dto.accountNumber.trim(),
      accountHolder: dto.accountHolder.trim(),
      status: 'MENUNGGU_VERIFIKASI',
      notes: dto.notes?.trim() || 'Penarikan saldo komisi referral',
    });

    return {
      id: withdrawal.id,
      amount: withdrawal.amount,
      bankOrWallet: withdrawal.bankOrWallet,
      accountNumber: withdrawal.accountNumber,
      accountHolder: withdrawal.accountHolder,
      requestDate: formatDateID(withdrawal.requestDate),
      completedDate: withdrawal.completedDate ? formatDateID(withdrawal.completedDate) : null,
      status: withdrawal.status,
      notes: withdrawal.notes,
    };
  }

  /**
   * Permintaan pencairan saldo komisi referral via email pelanggan (dari aplikasi Android)
   */
  public async requestWithdrawalByEmail(dto: ClientWithdrawalDto): Promise<ReferralWithdrawalItemDto> {
    let customer: Customer | null = null;
    const email = dto.email?.trim().toLowerCase();
    const id = dto.customerId?.trim();

    if (id) {
      customer = await this.customerRepository.findById(id);
    }
    if (!customer && email) {
      customer = await this.customerRepository.findByEmail(email);
    }

    if (!customer) {
      throw new NotFoundError('Pelanggan tidak ditemukan.');
    }

    return await this.requestWithdrawal(customer.id, {
      amount: dto.amount,
      bankOrWallet: dto.bankOrWallet,
      accountNumber: dto.accountNumber,
      accountHolder: dto.accountHolder,
      notes: dto.notes,
    });
  }

  /**
   * Verifikasi pencairan oleh finance (MENUNGGU_VERIFIKASI -> SELESAI / DITOLAK)
   */
  public async updateWithdrawalStatus(
    id: string,
    dto: UpdateReferralWithdrawalDto
  ): Promise<ReferralWithdrawalItemDto> {
    const withdrawal = await this.referralRepository.findWithdrawalById(id);
    if (!withdrawal) {
      throw new NotFoundError(`Permintaan pencairan dengan ID '${id}' tidak ditemukan.`);
    }

    const allowed = ['MENUNGGU_VERIFIKASI', 'SELESAI', 'DITOLAK'];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestError('Status pencairan tidak valid.');
    }

    const updated = await this.referralRepository.updateWithdrawalStatus(id, dto.status, dto.notes);

    return {
      id: updated.id,
      amount: updated.amount,
      bankOrWallet: updated.bankOrWallet,
      accountNumber: updated.accountNumber,
      accountHolder: updated.accountHolder,
      requestDate: formatDateID(updated.requestDate),
      completedDate: updated.completedDate ? formatDateID(updated.completedDate) : null,
      status: updated.status,
      notes: updated.notes,
    };
  }
}

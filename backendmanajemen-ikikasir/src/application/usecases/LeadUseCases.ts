import { ILeadRepository, LeadFilter, LeadStatistics } from '../../domain/interfaces/ILeadRepository.js';
import { ICustomerRepository } from '../../domain/interfaces/ICustomerRepository.js';
import { IPackageRepository } from '../../domain/interfaces/IPackageRepository.js';
import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  AddFollowUpDto,
  ApproveLeadDto,
  RejectLeadDto,
} from '../dtos/lead.dto.js';
import { NotFoundError, BadRequestError } from '../../domain/errors/AppError.js';
import { Lead, LeadFollowUp } from '../../domain/entities/Lead.js';

export class LeadUseCases {
  constructor(
    private leadRepository: ILeadRepository,
    private customerRepository?: ICustomerRepository,
    private packageRepository?: IPackageRepository
  ) {}

  private async resolvePackage(packageId?: string | null, packageInterest?: string | null): Promise<{ packageId: string | null; packageName: string; packagePrice: number }> {
    let finalId = packageId ?? null;
    let finalName = packageInterest || 'Basic';
    let finalPrice = 250000;

    if (!this.packageRepository) {
      return { packageId: finalId, packageName: finalName, packagePrice: finalPrice };
    }

    try {
      const allPkgs = await this.packageRepository.findAll();
      if (finalId) {
        const found = allPkgs.find(p => p.id === finalId);
        if (found) {
          return { packageId: found.id, packageName: found.name, packagePrice: found.price };
        }
      }

      // Lookup by package name if packageId not found or not given
      if (finalName) {
        const query = finalName.toLowerCase().trim();
        const found = allPkgs.find(p => {
          const pName = p.name.toLowerCase().trim();
          return pName === query || query.includes(pName) || pName.includes(query);
        });
        if (found) {
          return { packageId: found.id, packageName: found.name, packagePrice: found.price };
        }
      }
    } catch (e) {
      console.warn('resolvePackage error:', e);
    }

    return { packageId: finalId, packageName: finalName, packagePrice: finalPrice };
  }

  public async getAllLeads(filter?: LeadFilter): Promise<any[]> {
    const leads = await this.leadRepository.findAll(filter);

    let packagesCache: any[] | null = null;
    if (this.packageRepository) {
      try {
        packagesCache = await this.packageRepository.findAll();
      } catch {
        packagesCache = null;
      }
    }

    return leads.map(l => {
      const json = l.toJSON();
      if (!json.packageId && packagesCache && json.packageInterest) {
        const q = json.packageInterest.toLowerCase().trim();
        const found = packagesCache.find(p => {
          const pName = p.name.toLowerCase().trim();
          return pName === q || q.includes(pName) || pName.includes(q);
        });
        if (found) {
          json.packageId = found.id;
          json.packageName = found.name;
          json.packagePrice = found.price;
          // Perbarui di database agar tersimpan permanen
          this.leadRepository.update(l.id, { packageId: found.id }).catch(() => {});
        }
      }
      return json;
    });
  }

  public async getLeadById(id: string): Promise<any> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }
    const json = lead.toJSON();
    if (!json.packageId && this.packageRepository && json.packageInterest) {
      try {
        const allPkgs = await this.packageRepository.findAll();
        const q = json.packageInterest.toLowerCase().trim();
        const found = allPkgs.find(p => {
          const pName = p.name.toLowerCase().trim();
          return pName === q || q.includes(pName) || pName.includes(q);
        });
        if (found) {
          json.packageId = found.id;
          json.packageName = found.name;
          json.packagePrice = found.price;
          this.leadRepository.update(lead.id, { packageId: found.id }).catch(() => {});
        }
      } catch {}
    }
    return json;
  }

  public async getStatistics(): Promise<LeadStatistics> {
    return await this.leadRepository.getStatistics();
  }

  public async createLead(dto: CreateLeadDto): Promise<any> {
    const cleanPhone = dto.phone.trim();
    const cleanEmail = dto.email.toLowerCase().trim();

    if (!dto.name.trim()) {
      throw new BadRequestError('Nama calon client wajib diisi.');
    }
    if (!dto.businessName.trim()) {
      throw new BadRequestError('Nama usaha/bisnis wajib diisi.');
    }
    if (!cleanPhone) {
      throw new BadRequestError('Nomor telepon/WhatsApp wajib diisi.');
    }
    if (!cleanEmail) {
      throw new BadRequestError('Email calon client wajib diisi.');
    }

    // Ambil packageId & harga paket dari packageRepository
    const pkgInfo = await this.resolvePackage(dto.packageId, dto.packageInterest);
    const estimatedDeal = dto.estimatedDeal && dto.estimatedDeal > 0 ? dto.estimatedDeal : pkgInfo.packagePrice;

    const newLead = await this.leadRepository.create({
      ...dto,
      packageId: pkgInfo.packageId,
      packageInterest: pkgInfo.packageName,
      estimatedDeal: estimatedDeal,
    });

    const json = newLead.toJSON();
    json.packageId = pkgInfo.packageId ?? json.packageId;
    json.packageName = pkgInfo.packageName ?? json.packageName;
    json.packagePrice = pkgInfo.packagePrice ?? json.packagePrice;

    return json;
  }

  public async updateLead(id: string, dto: UpdateLeadDto): Promise<any> {
    const existing = await this.leadRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    let pkgInfo: { packageId: string | null; packageName: string; packagePrice: number } | null = null;
    if (dto.packageId || dto.packageInterest) {
      pkgInfo = await this.resolvePackage(dto.packageId ?? existing.packageId, dto.packageInterest ?? existing.packageInterest);
    }

    const updated = await this.leadRepository.update(id, {
      ...dto,
      packageId: pkgInfo ? pkgInfo.packageId : dto.packageId,
      packageInterest: pkgInfo ? pkgInfo.packageName : dto.packageInterest,
      estimatedDeal: dto.estimatedDeal ?? (pkgInfo ? pkgInfo.packagePrice : undefined),
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    });

    const json = updated.toJSON();
    if (pkgInfo && pkgInfo.packageId && !json.packageId) {
      json.packageId = pkgInfo.packageId;
    }
    return json;
  }

  public async updateLeadStatus(id: string, dto: UpdateLeadStatusDto): Promise<any> {
    const existing = await this.leadRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    const updated = await this.leadRepository.update(id, {
      status: dto.status,
    });

    // Catat log follow-up otomatis
    const noteText = dto.notes || `Status prospek diubah menjadi: ${dto.status}`;
    await this.leadRepository.addFollowUp(id, 'Sistem', noteText);

    // Ambil data terbaru dengan followUpHistory yang diperbarui
    const fresh = await this.leadRepository.findById(id);
    return fresh?.toJSON();
  }

  public async addFollowUp(id: string, dto: AddFollowUpDto): Promise<any> {
    const existing = await this.leadRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    if (!dto.notes || !dto.notes.trim()) {
      throw new BadRequestError('Catatan follow-up tidak boleh kosong.');
    }

    const followUp = await this.leadRepository.addFollowUp(id, dto.channel, dto.notes);
    return followUp.toJSON();
  }

  public async approveLead(id: string, dto: ApproveLeadDto): Promise<any> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    const now = new Date();
    const finalAmount = dto.amount || lead.estimatedDeal || 250000;
    const finalMethod = dto.paymentMethod || lead.paymentMethod || 'Transfer BCA';
    const finalProof = dto.paymentProofUrl || lead.paymentProofUrl;
    const notes = dto.notes || 'Pendaftaran disetujui Super Admin. Klien dikonversi menjadi Pelanggan Aktif.';

    // 1. Update lead ke Converted & verified
    await this.leadRepository.update(id, {
      status: 'Converted',
      paymentStatus: 'verified',
      paymentAmount: finalAmount,
      paymentMethod: finalMethod,
      paymentProofUrl: finalProof,
      paymentVerifiedAt: now,
      paymentVerifiedBy: 'Super Admin',
      paymentNotes: notes,
      technicianStatus: 'pending_setup',
      technicianAssignedTo: 'Tim Teknisi IKI KASIR',
    });

    // 2. Tambahkan follow-up konversi
    await this.leadRepository.addFollowUp(id, 'Sistem', notes);

    // 3. Konversi ke Customer di database jika repository tersedia
    let createdCustomer = null;
    if (this.customerRepository) {
      try {
        const cleanEmail = lead.email.toLowerCase().trim();
        const existingCust = await this.customerRepository.findByEmail(cleanEmail);

        const months = dto.billingCycleMonths || 1;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        if (existingCust) {
          // Update pelanggan yang sudah ada
          createdCustomer = await this.customerRepository.update(existingCust.id, {
            name: lead.name,
            businessName: lead.businessName,
            phone: lead.phone,
            address: lead.address,
            status: 'ACTIVE',
            expiresAt,
            notes: `Diperbarui dari persetujuan calon client (Lead ID: ${lead.id})`,
          });
        } else {
          // Buat pelanggan baru
          createdCustomer = await this.customerRepository.create({
            name: lead.name,
            businessName: lead.businessName,
            email: cleanEmail,
            phone: lead.phone,
            address: lead.address,
            packageId: lead.packageId ?? undefined,
            packageName: lead.packageInterest,
            packagePrice: finalAmount,
            status: 'ACTIVE',
            startedAt: now,
            expiresAt,
            notes: `Dikonversi dari Calon Client (Lead ID: ${lead.id}). Sumber: ${lead.source}`,
          });

          // Catat history invoice pertama
          await this.customerRepository.addSubscriptionHistory({
            customerId: createdCustomer.id,
            packageId: lead.packageId ?? undefined,
            packageName: lead.packageInterest,
            amount: finalAmount,
            billingCycleMonths: months,
            paymentMethod: finalMethod,
            paymentStatus: 'PAID',
            notes: 'Pembayaran pendaftaran calon client',
            startedAt: now,
            expiresAt,
          });
        }
      } catch (custErr: any) {
        console.warn('⚠️ Gagal sinkronisasi otomatis ke tabel customers:', custErr.message);
      }
    }

    const updatedLead = await this.leadRepository.findById(id);

    return {
      lead: updatedLead?.toJSON(),
      customer: createdCustomer ? createdCustomer.toJSON() : null,
      message: `Calon client '${lead.name}' berhasil disetujui dan dikonversi menjadi Pelanggan Aktif.`,
    };
  }

  public async rejectLead(id: string, dto: RejectLeadDto): Promise<any> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    const reason = dto.reason ? ` Alasan: ${dto.reason}` : '';
    const noteText = `Pendaftaran ditolak oleh Super Admin.${reason}`;

    await this.leadRepository.update(id, {
      status: 'Lost',
    });

    await this.leadRepository.addFollowUp(id, 'Sistem', noteText);

    const fresh = await this.leadRepository.findById(id);
    return {
      lead: fresh?.toJSON(),
      message: `Calon client '${lead.name}' telah ditolak (Status: Lost).`,
    };
  }

  public async deleteLead(id: string): Promise<void> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Calon client dengan ID '${id}' tidak ditemukan.`);
    }

    await this.leadRepository.delete(id);
  }
}

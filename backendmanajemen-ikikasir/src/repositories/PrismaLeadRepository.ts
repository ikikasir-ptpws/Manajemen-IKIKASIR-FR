import { prisma } from '../infrastructure/database/prisma.js';
import {
  ILeadRepository,
  CreateLeadData,
  UpdateLeadData,
  LeadFilter,
  LeadStatistics,
} from '../domain/interfaces/ILeadRepository.js';
import { Lead, LeadFollowUp } from '../domain/entities/Lead.js';
import { InternalServerError } from '../domain/errors/AppError.js';

export class PrismaLeadRepository implements ILeadRepository {
  private mapFollowUpToDomain(record: any): LeadFollowUp {
    return new LeadFollowUp({
      id: record.id,
      leadId: record.leadId,
      date: record.date,
      channel: record.channel,
      notes: record.notes,
      createdAt: record.createdAt,
    });
  }

  private mapToDomain(record: any): Lead {
    return new Lead({
      id: record.id,
      no: record.no,
      name: record.name,
      businessName: record.businessName,
      businessCategory: record.businessCategory,
      businessType: record.businessType,
      phone: record.phone,
      email: record.email,
      address: record.address,
      status: record.status,
      source: record.source,
      registrationDate: record.registrationDate,
      lastFollowUp: record.lastFollowUp,
      packageInterest: record.packageInterest,
      packageId: record.packageId,
      packageName: record.package?.name ?? record.packageInterest ?? 'Basic',
      packagePrice: record.package?.price ?? 250000,
      estimatedDeal: record.estimatedDeal,
      notes: record.notes,
      followUpSchedule: record.followUpSchedule,

      referralCode: record.referralCode,
      referredByCustomerId: record.referredByCustomerId,
      referredByCustomerName: record.referredByCustomerName,
      referredByBusinessName: record.referredByBusinessName,

      city: record.city,
      outletCount: record.outletCount,
      employeeAppCount: record.employeeAppCount,
      employeeCount: record.employeeCount,
      currentRecordingMethod: record.currentRecordingMethod,
      neededFeatures: record.neededFeatures ?? [],
      otherNeededFeature: record.otherNeededFeature,
      specialNeed: record.specialNeed,
      knownFrom: record.knownFrom,
      otherKnownFrom: record.otherKnownFrom,
      consentAgreed: record.consentAgreed,

      paymentProofUrl: record.paymentProofUrl,
      paymentStatus: record.paymentStatus,
      paymentAmount: record.paymentAmount,
      paymentDate: record.paymentDate,
      paymentMethod: record.paymentMethod,
      paymentVerifiedAt: record.paymentVerifiedAt,
      paymentVerifiedBy: record.paymentVerifiedBy,
      paymentNotes: record.paymentNotes,

      technicianStatus: record.technicianStatus,
      technicianAssignedTo: record.technicianAssignedTo,
      appUsername: record.appUsername,
      appPassword: record.appPassword,
      appDownloadUrl: record.appDownloadUrl,
      guideBookUrl: record.guideBookUrl,
      rentalAgreementNumber: record.rentalAgreementNumber,
      rentalAgreementDate: record.rentalAgreementDate,
      emailIssueReported: record.emailIssueReported,
      emailIssueNotes: record.emailIssueNotes,
      setupCompletedAt: record.setupCompletedAt,
      appExpiredDate: record.appExpiredDate,

      createdAt: record.createdAt,
      updatedAt: record.updatedAt,

      followUps: record.followUps ? record.followUps.map((f: any) => this.mapFollowUpToDomain(f)) : [],
    });
  }

  public async findAll(filter?: LeadFilter): Promise<Lead[]> {
    try {
      const where: any = {};

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { businessName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { referralCode: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (filter?.status && filter.status !== 'Semua' && filter.status !== 'Semua Status') {
        where.status = filter.status;
      }

      if (filter?.source && filter.source !== 'Semua') {
        where.source = filter.source;
      }

      if (filter?.packageInterest && filter.packageInterest !== 'Semua' && filter.packageInterest !== 'Semua Paket') {
        where.packageInterest = filter.packageInterest;
      }

      if (filter?.packageId) {
        where.packageId = filter.packageId;
      }

      if (filter?.startDate || filter?.endDate) {
        where.registrationDate = {};
        if (filter.startDate) where.registrationDate.gte = filter.startDate;
        if (filter.endDate) where.registrationDate.lte = filter.endDate;
      }

      if (filter?.referralCode) {
        where.referralCode = filter.referralCode.toUpperCase().trim();
      }

      if (filter?.referredByCustomerId) {
        where.referredByCustomerId = filter.referredByCustomerId;
      }

      const records = await prisma.lead.findMany({
        where,
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return records.map((r: any) => this.mapToDomain(r));
    } catch (error: any) {
      throw new InternalServerError('Gagal mengambil data calon client: ' + error.message);
    }
  }

  public async findById(id: string): Promise<Lead | null> {
    try {
      const record = await prisma.lead.findUnique({
        where: { id },
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!record) return null;
      return this.mapToDomain(record);
    } catch (error: any) {
      throw new InternalServerError('Gagal mengambil detail calon client: ' + error.message);
    }
  }

  public async findByEmail(email: string): Promise<Lead | null> {
    try {
      const record = await prisma.lead.findFirst({
        where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!record) return null;
      return this.mapToDomain(record);
    } catch (error: any) {
      throw new InternalServerError('Gagal mencari calon client by email: ' + error.message);
    }
  }

  public async findByPhone(phone: string): Promise<Lead | null> {
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const record = await prisma.lead.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanPhone } },
            { phone: phone.trim() },
          ],
        },
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!record) return null;
      return this.mapToDomain(record);
    } catch (error: any) {
      throw new InternalServerError('Gagal mencari calon client by phone: ' + error.message);
    }
  }

  public async create(data: CreateLeadData): Promise<Lead> {
    try {
      const now = new Date();
      const source = data.source || 'Website';

      const record = await prisma.lead.create({
        data: {
          name: data.name.trim(),
          businessName: data.businessName.trim(),
          businessCategory: data.businessCategory ?? '',
          businessType: data.businessType ?? data.businessCategory ?? 'Retail',
          phone: data.phone.trim(),
          email: data.email.toLowerCase().trim(),
          address: data.address ?? '',
          status: data.status || 'New',
          source: source,
          registrationDate: now,
          lastFollowUp: now,
          packageInterest: data.packageInterest || 'Basic',
          packageId: data.packageId,
          estimatedDeal: data.estimatedDeal || 250000,
          notes: data.notes ?? '',
          followUpSchedule: data.followUpSchedule || 'Hari ini',

          referralCode: data.referralCode ? data.referralCode.toUpperCase().trim() : null,
          referredByCustomerId: data.referredByCustomerId,
          referredByCustomerName: data.referredByCustomerName,
          referredByBusinessName: data.referredByBusinessName,

          city: data.city ?? '',
          outletCount: data.outletCount ?? '',
          employeeAppCount: data.employeeAppCount ?? '',
          employeeCount: data.employeeCount ?? '',
          currentRecordingMethod: data.currentRecordingMethod ?? '',
          neededFeatures: data.neededFeatures ?? [],
          otherNeededFeature: data.otherNeededFeature ?? '',
          specialNeed: data.specialNeed ?? '',
          knownFrom: data.knownFrom ?? '',
          otherKnownFrom: data.otherKnownFrom ?? '',
          consentAgreed: data.consentAgreed ?? true,

          paymentProofUrl: data.paymentProofUrl ?? '',
          paymentStatus: data.paymentStatus || 'unpaid',
          paymentAmount: data.paymentAmount ?? 0,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod ?? '',

          followUps: {
            create: [
              {
                channel: 'Sistem',
                notes: `Pendaftaran berhasil tersimpan via ${source} (Status: Baru).`,
                date: now,
              },
            ],
          },
        },
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
      });

      return this.mapToDomain(record);
    } catch (error: any) {
      throw new InternalServerError('Gagal mendaftarkan calon client baru: ' + error.message);
    }
  }

  public async update(id: string, data: UpdateLeadData): Promise<Lead> {
    try {
      const updatePayload: any = { ...data };

      if (data.email) {
        updatePayload.email = data.email.toLowerCase().trim();
      }
      if (data.referralCode) {
        updatePayload.referralCode = data.referralCode.toUpperCase().trim();
      }

      const record = await prisma.lead.update({
        where: { id },
        data: updatePayload,
        include: {
          package: true,
          followUps: {
            orderBy: { date: 'desc' },
          },
        },
      });

      return this.mapToDomain(record);
    } catch (error: any) {
      throw new InternalServerError('Gagal memperbarui data calon client: ' + error.message);
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      await prisma.lead.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new InternalServerError('Gagal menghapus calon client: ' + error.message);
    }
  }

  public async addFollowUp(leadId: string, channel: string, notes: string): Promise<LeadFollowUp> {
    try {
      const now = new Date();

      const [followUp] = await prisma.$transaction([
        prisma.leadFollowUp.create({
          data: {
            leadId,
            channel: channel || 'Sistem',
            notes: notes.trim(),
            date: now,
          },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            lastFollowUp: now,
          },
        }),
      ]);

      return this.mapFollowUpToDomain(followUp);
    } catch (error: any) {
      throw new InternalServerError('Gagal menambahkan riwayat follow-up: ' + error.message);
    }
  }

  public async getStatistics(): Promise<LeadStatistics> {
    try {
      const [
        totalLeads,
        newLeads,
        contactedLeads,
        followUpLeads,
        interestedLeads,
        convertedLeads,
        lostLeads,
        websiteLeads,
        googleFormLeads,
        instagramLeads,
        whatsappLeads,
        referralLeads,
        basicLeads,
        proLeads,
        addOnLeads,
        customLeads,
      ] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'New' } }),
        prisma.lead.count({ where: { status: 'Contacted' } }),
        prisma.lead.count({ where: { status: 'Follow Up' } }),
        prisma.lead.count({ where: { status: 'Interested' } }),
        prisma.lead.count({ where: { status: 'Converted' } }),
        prisma.lead.count({ where: { status: 'Lost' } }),

        prisma.lead.count({ where: { source: 'Website' } }),
        prisma.lead.count({ where: { source: 'Google Form' } }),
        prisma.lead.count({ where: { source: 'Instagram' } }),
        prisma.lead.count({ where: { source: 'WhatsApp' } }),
        prisma.lead.count({ where: { source: 'Referral' } }),

        prisma.lead.count({ where: { packageInterest: 'Basic' } }),
        prisma.lead.count({ where: { packageInterest: 'Pro' } }),
        prisma.lead.count({ where: { packageInterest: 'Add on' } }),
        prisma.lead.count({ where: { packageInterest: { in: ['Custom', 'Custom / IT One'] } } }),
      ]);

      const inProgressLeads = contactedLeads + followUpLeads;
      const otherSources = Math.max(0, totalLeads - (websiteLeads + googleFormLeads + instagramLeads + whatsappLeads + referralLeads));

      return {
        totalLeads,
        newLeads,
        inProgressLeads,
        interestedLeads,
        convertedLeads,
        lostLeads,
        sources: {
          website: websiteLeads,
          googleForm: googleFormLeads,
          instagram: instagramLeads,
          whatsapp: whatsappLeads,
          referral: referralLeads,
          other: otherSources,
        },
        packages: {
          basic: basicLeads,
          pro: proLeads,
          addOn: addOnLeads,
          custom: customLeads,
        },
      };
    } catch (error: any) {
      throw new InternalServerError('Gagal menghitung statistik calon client: ' + error.message);
    }
  }
}

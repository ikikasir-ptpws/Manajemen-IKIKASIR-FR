import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama calon client minimal terdiri dari 2 karakter.'),
  businessName: z
    .string()
    .trim()
    .min(2, 'Nama usaha / bisnis minimal terdiri dari 2 karakter.'),
  businessCategory: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .min(6, 'Nomor telepon / WhatsApp minimal terdiri dari 6 karakter.'),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.'),
  address: z.string().trim().optional(),
  status: z
    .enum(['New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost'])
    .optional(),
  source: z.string().trim().optional(),
  packageInterest: z.string().trim().optional(),
  packageId: z.string().uuid('ID Paket harus berupa format UUID yang valid.').optional().nullable(),
  estimatedDeal: z.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
  followUpSchedule: z.string().trim().optional(),

  referralCode: z.string().trim().optional(),
  referredByCustomerId: z.string().trim().optional(),
  referredByCustomerName: z.string().trim().optional(),
  referredByBusinessName: z.string().trim().optional(),

  city: z.string().trim().optional(),
  outletCount: z.string().trim().optional(),
  employeeAppCount: z.string().trim().optional(),
  employeeCount: z.string().trim().optional(),
  currentRecordingMethod: z.string().trim().optional(),
  neededFeatures: z.array(z.string()).optional(),
  otherNeededFeature: z.string().trim().optional(),
  specialNeed: z.string().trim().optional(),
  knownFrom: z.string().trim().optional(),
  otherKnownFrom: z.string().trim().optional(),
  consentAgreed: z.boolean().optional(),

  paymentProofUrl: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  paymentAmount: z.number().nonnegative().optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').optional(),
  businessName: z.string().trim().min(2, 'Nama usaha minimal 2 karakter.').optional(),
  businessCategory: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  phone: z.string().trim().min(6, 'Nomor telepon minimal 6 karakter.').optional(),
  email: z.string().trim().email('Format email tidak valid.').optional(),
  address: z.string().trim().optional(),
  status: z.string().trim().optional(),
  source: z.string().trim().optional(),
  packageInterest: z.string().trim().optional(),
  packageId: z.string().uuid().optional().nullable(),
  estimatedDeal: z.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
  followUpSchedule: z.string().trim().optional(),

  referralCode: z.string().trim().optional(),
  referredByCustomerId: z.string().trim().optional(),
  referredByCustomerName: z.string().trim().optional(),
  referredByBusinessName: z.string().trim().optional(),

  city: z.string().trim().optional(),
  outletCount: z.string().trim().optional(),
  employeeAppCount: z.string().trim().optional(),
  employeeCount: z.string().trim().optional(),
  currentRecordingMethod: z.string().trim().optional(),
  neededFeatures: z.array(z.string()).optional(),
  otherNeededFeature: z.string().trim().optional(),
  specialNeed: z.string().trim().optional(),
  knownFrom: z.string().trim().optional(),
  otherKnownFrom: z.string().trim().optional(),
  consentAgreed: z.boolean().optional(),

  paymentProofUrl: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  paymentAmount: z.number().nonnegative().optional(),
  paymentDate: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),

  technicianStatus: z.string().trim().optional(),
  technicianAssignedTo: z.string().trim().optional(),
  appUsername: z.string().trim().optional(),
  appPassword: z.string().trim().optional(),
  appDownloadUrl: z.string().trim().optional(),
  guideBookUrl: z.string().trim().optional(),
  rentalAgreementNumber: z.string().trim().optional(),
  rentalAgreementDate: z.string().trim().optional(),
  emailIssueReported: z.boolean().optional(),
  emailIssueNotes: z.string().trim().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Follow Up', 'Interested', 'Converted', 'Lost'], {
    errorMap: () => ({ message: 'Status harus salah satu dari: New, Contacted, Follow Up, Interested, Converted, Lost.' }),
  }),
  notes: z.string().trim().optional(),
});

export const addFollowUpSchema = z.object({
  channel: z.enum(['WhatsApp', 'Telepon', 'Email', 'Meeting', 'Sistem'], {
    errorMap: () => ({ message: 'Channel harus salah satu dari: WhatsApp, Telepon, Email, Meeting, Sistem.' }),
  }),
  notes: z.string().trim().min(1, 'Catatan follow-up tidak boleh kosong.'),
});

export const approveLeadSchema = z.object({
  amount: z.number().nonnegative('Nominal pembayaran tidak boleh negatif.').optional(),
  paymentMethod: z.string().trim().optional(),
  paymentProofUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  billingCycleMonths: z.number().int().min(1).optional(),
  startDate: z.string().trim().optional(),
  appPassword: z.string().trim().optional(),
});

export const rejectLeadSchema = z.object({
  reason: z.string().trim().optional(),
});

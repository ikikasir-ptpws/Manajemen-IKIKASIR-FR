import { beforeEach, describe, expect, it, vi } from 'vitest'
import { leadsApi } from '../api'
import { salesApi } from '../api/sales.api'
import { usePendaftaranLangganan, type RegistrationFormState } from '../composables/usePendaftaranLangganan'

vi.mock('../api', () => ({
  leadsApi: {
    create: vi.fn(),
  },
}))

vi.mock('../api/sales.api', () => ({
  salesApi: {
    validateReferralCode: vi.fn(),
  },
}))

vi.mock('../composables/useAppData', () => ({
  useAppData: () => ({ addRegistration: vi.fn() }),
}))

const form: RegistrationFormState = {
  name: 'Test Sales Referral',
  phone: '081234567890',
  email: 'sales-referral@example.com',
  businessName: 'Toko Referral',
  businessType: 'Toko kelontong / Minimarket',
  city: 'Bandung',
  address: '',
  packageInterest: 'Basic',
  packageId: '',
  paymentAmount: '250000',
  paymentMethod: 'QRIS',
  outletCount: '',
  employeeAppCount: '',
  currentRecordingMethod: '',
  neededFeatures: [],
  otherNeededFeature: '',
  specialNeed: '',
  knownFrom: '',
  otherKnownFrom: '',
  consentAgreed: true,
  referralCode: 'sales-abc123',
}

describe('Referral Sales pada form pendaftaran langganan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(salesApi.validateReferralCode).mockResolvedValue({
      success: true,
      data: {
        valid: true,
        code: 'SALES-ABC123',
        message: 'valid',
        sales: { id: 'sales-id', name: 'Sales Test', email: 'sales@example.com' },
      },
    })
    vi.mocked(leadsApi.create).mockResolvedValue({
      success: true,
      data: { id: 'lead-id' } as any,
    })
  })

  it('menolak kode SALES yang tidak valid sebelum mengirim pendaftaran', async () => {
    vi.mocked(salesApi.validateReferralCode).mockResolvedValue({
      success: true,
      data: {
        valid: false,
        code: 'SALES-ABC123',
        message: 'Kode referral tidak ditemukan.',
        sales: null,
      },
    })

    const registration = usePendaftaranLangganan()
    const result = await registration.submitRegistration(
      { ...form },
      'data:image/png;base64,proof',
    )

    expect(result).toBeNull()
    expect(registration.errors.value.referralCode).toBe('Kode referral tidak ditemukan.')
    expect(leadsApi.create).not.toHaveBeenCalled()
  })

  it('memvalidasi dan mengirim kode SALES dalam huruf kapital', async () => {
    const registration = usePendaftaranLangganan()
    await registration.submitRegistration({ ...form }, 'data:image/png;base64,proof')

    expect(salesApi.validateReferralCode).toHaveBeenCalledWith('SALES-ABC123')
    expect(leadsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ referralCode: 'SALES-ABC123' }),
    )
  })
})

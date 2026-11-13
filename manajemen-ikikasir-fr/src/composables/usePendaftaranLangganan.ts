import { computed, ref } from 'vue'
import { leadsApi, type CreateLeadPayload, type LeadItem } from '../api'
import { useAppData } from './useAppData'

export type PaymentMethodOption = 'QRIS' | 'Transfer Bank' | 'Virtual Account'

export interface RegistrationFormState {
  name: string
  phone: string
  email: string
  businessName: string
  businessType: string
  city: string
  address: string
  packageInterest: string
  packageId: string
  paymentAmount: string
  paymentMethod: PaymentMethodOption
  outletCount: string
  employeeAppCount: string
  currentRecordingMethod: string
  neededFeatures: string[]
  otherNeededFeature: string
  specialNeed: string
  knownFrom: string
  otherKnownFrom: string
  consentAgreed: boolean
  referralCode: string
  referredByCustomerId?: string
  referredByCustomerName?: string
  referredByBusinessName?: string
}

export const BUSINESS_TYPE_OPTIONS = [
  'Kafe / Restoran / Warung makan',
  'Toko kelontong / Minimarket',
  'Fashion / Pakaian',
  'Laundry',
  'Barbershop / Salon',
  'Bengkel',
  'Lainnya'
]

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  'QRIS',
  'Transfer Bank',
  'Virtual Account'
]

export const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Composable: Handles the "Form Pendaftaran Langganan" on the landing page.
 * Data is saved to the backend via the public endpoint `POST /api/leads`,
 * so the data immediately appears in the webbase "Calon Client" list.
 * The payment proof is sent as a base64 data URL and stored on the server.
 */
export function usePendaftaranLangganan() {
  const { addRegistration } = useAppData()

  const errors = ref<Record<string, string>>({})
  const submitError = ref<string | null>(null)
  const isSubmitting = ref(false)
  const isReadingProof = ref(false)
  const isSuccess = ref(false)
  const submittedLead = ref<LeadItem | null>(null)
  const proofFileName = ref<string>('')
  const proofPreviewUrl = ref<string>('')
  const proofDataUrl = ref<string>('')
  // Promise pembacaan berkas terakhir, dipakai agar submit menunggu file selesai dibaca.
  let proofReadPromise: Promise<string> = Promise.resolve('')

  const clearError = (field: string) => {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  const clearProof = () => {
    proofFileName.value = ''
    proofPreviewUrl.value = ''
    proofDataUrl.value = ''
    proofReadPromise = Promise.resolve('')
    clearError('paymentProof')
  }

  const resetState = () => {
    errors.value = {}
    submitError.value = null
    isSubmitting.value = false
    isReadingProof.value = false
    isSuccess.value = false
    submittedLead.value = null
    proofFileName.value = ''
    proofPreviewUrl.value = ''
    proofDataUrl.value = ''
  }

  const handleProofFile = (file: File | null | undefined): Promise<string> => {
    clearError('paymentProof')
    proofFileName.value = ''
    proofPreviewUrl.value = ''
    proofDataUrl.value = ''

    if (!file) {
      return Promise.resolve('')
    }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      errors.value.paymentProof = 'Format berkas tidak didukung. Gunakan gambar JPG, PNG, atau WEBP.'
      return Promise.resolve('')
    }

    if (file.size > MAX_PROOF_SIZE_BYTES) {
      errors.value.paymentProof = 'Ukuran berkas maksimal 5MB.'
      return Promise.resolve('')
    }

    isReadingProof.value = true

    proofReadPromise = new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : ''
        proofDataUrl.value = result
        proofPreviewUrl.value = result
        proofFileName.value = file.name
        isReadingProof.value = false
        resolve(result)
      }
      reader.onerror = () => {
        errors.value.paymentProof = 'Gagal membaca berkas bukti pembayaran. Silakan coba lagi.'
        isReadingProof.value = false
        resolve('')
      }
      reader.readAsDataURL(file)
    })

    return proofReadPromise
  }

  const validateForm = (form: RegistrationFormState, proof: string): boolean => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) {
      errs.name = 'Nama lengkap wajib diisi.'
    }

    const normalizedPhone = form.phone.replace(/[\s()-]/g, '')
    if (!form.phone.trim()) {
      errs.phone = 'Nomor WhatsApp aktif wajib diisi.'
    } else if (!/^(?:08|628|\+628)\d{8,11}$/.test(normalizedPhone)) {
      errs.phone = 'Format nomor WhatsApp tidak valid. Gunakan 08xx, 628xx, atau +628xx.'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      errs.email = 'Email wajib diisi.'
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = 'Format email tidak valid (contoh: nama@domain.com).'
    }

    if (!form.businessName.trim()) {
      errs.businessName = 'Nama toko / usaha wajib diisi.'
    }
    if (!form.businessType) {
      errs.businessType = 'Jenis usaha wajib dipilih.'
    }
    if (!form.city.trim()) {
      errs.city = 'Kota / kabupaten wajib diisi.'
    }

    const amount = Number(form.paymentAmount.replace(/[^\d]/g, ''))
    if (!form.paymentAmount.trim()) {
      errs.paymentAmount = 'Nominal pembayaran wajib diisi.'
    } else if (!Number.isFinite(amount) || amount <= 0) {
      errs.paymentAmount = 'Nominal pembayaran harus berupa angka lebih dari 0.'
    }

    if (!form.paymentMethod) {
      errs.paymentMethod = 'Metode pembayaran wajib dipilih.'
    }

    if (!proof) {
      errs.paymentProof = 'Bukti pembayaran wajib diunggah.'
    }

    if (!form.consentAgreed) {
      errs.consentAgreed = 'Persetujuan penggunaan data wajib dicentang.'
    }

    errors.value = errs
    return Object.keys(errs).length === 0
  }

  /**
   * Saves the registration to the backend (`POST /api/leads`) and mirrors it
   * to the local store so it is visible in the Calon Client list.
   */
  const submitRegistration = async (
    form: RegistrationFormState,
    proof: string,
    packagePrice?: number
  ): Promise<LeadItem | null> => {
    submitError.value = null
    isSuccess.value = false

    // Tunggu pembacaan berkas bukti pembayaran selesai (jika masih berjalan).
    if (isReadingProof.value) {
      await proofReadPromise
    }

    const proofData = proofDataUrl.value || proof

    if (!validateForm(form, proofData)) {
      submitError.value = '⚠️ Harap lengkapi kolom wajib sebelum mengirim.'
      return null
    }

    isSubmitting.value = true
    try {
      const amount = Number(form.paymentAmount.replace(/[^\d]/g, ''))

      const payload: CreateLeadPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        businessCategory: form.businessType,
        city: form.city.trim(),
        address: form.address.trim(),
        packageInterest: form.packageInterest,
        packageId: form.packageId || undefined,
        source: form.referralCode?.trim() ? 'Referral' : 'Website',
        outletCount: form.outletCount,
        employeeAppCount: form.employeeAppCount,
        employeeCount: form.employeeAppCount,
        currentRecordingMethod: form.currentRecordingMethod,
        neededFeatures: [...form.neededFeatures],
        otherNeededFeature: form.otherNeededFeature.trim(),
        specialNeed: form.specialNeed.trim(),
        knownFrom: form.knownFrom,
        otherKnownFrom: form.otherKnownFrom.trim(),
        consentAgreed: form.consentAgreed,
        referralCode: form.referralCode?.trim()
          ? form.referralCode.trim().toUpperCase()
          : undefined,
        referredByCustomerId: form.referredByCustomerId,
        referredByCustomerName: form.referredByCustomerName,
        referredByBusinessName: form.referredByBusinessName,
        paymentProofUrl: proofData,
        paymentStatus: 'pending_verification',
        paymentAmount: amount,
        paymentMethod: form.paymentMethod,
        paymentDate: new Date().toISOString(),
        estimatedDeal: amount || packagePrice
      }

      const res = await leadsApi.create(payload)
      const created = res.data

      // Simpan juga ke store lokal dengan ID dari backend agar langsung tampil
      // di daftar Calon Client pada perangkat ini.
      addRegistration(
        {
          name: payload.name!,
          phone: payload.phone!,
          email: payload.email!,
          businessName: payload.businessName!,
          businessType: payload.businessType,
          city: payload.city,
          address: payload.address,
          packageInterest: payload.packageInterest!,
          source: payload.source as any,
          outletCount: payload.outletCount,
          employeeAppCount: payload.employeeAppCount,
          currentRecordingMethod: payload.currentRecordingMethod,
          neededFeatures: payload.neededFeatures,
          otherNeededFeature: payload.otherNeededFeature,
          specialNeed: payload.specialNeed,
          knownFrom: payload.knownFrom,
          otherKnownFrom: payload.otherKnownFrom,
          consentAgreed: payload.consentAgreed,
          referralCode: payload.referralCode,
          referredByCustomerId: payload.referredByCustomerId,
          referredByCustomerName: payload.referredByCustomerName,
          referredByBusinessName: payload.referredByBusinessName,
          paymentProofUrl: created?.paymentProofUrl || proofData,
          paymentStatus: 'pending_verification',
          paymentAmount: amount,
          paymentMethod: payload.paymentMethod
        },
        { id: created?.id, skipRemoteSync: true }
      )

      submittedLead.value = created
      isSuccess.value = true
      return created
    } catch (err: any) {
      console.error('[PendaftaranLangganan] gagal menyimpan pendaftaran:', err)

      // Fallback: simpan lokal agar data pendaftar tidak hilang saat server tidak terjangkau.
      addRegistration(
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          businessName: form.businessName.trim(),
          businessType: form.businessType,
          city: form.city.trim(),
          address: form.address.trim(),
          packageInterest: form.packageInterest,
          source: form.referralCode?.trim() ? 'Referral' : 'Website',
          outletCount: form.outletCount,
          employeeAppCount: form.employeeAppCount,
          currentRecordingMethod: form.currentRecordingMethod,
          neededFeatures: [...form.neededFeatures],
          otherNeededFeature: form.otherNeededFeature.trim(),
          specialNeed: form.specialNeed.trim(),
          knownFrom: form.knownFrom,
          otherKnownFrom: form.otherKnownFrom.trim(),
          consentAgreed: form.consentAgreed,
          referralCode: form.referralCode?.trim()
            ? form.referralCode.trim().toUpperCase()
            : undefined,
          referredByCustomerId: form.referredByCustomerId,
          referredByCustomerName: form.referredByCustomerName,
          referredByBusinessName: form.referredByBusinessName,
          paymentProofUrl: proofData,
          paymentStatus: 'pending_verification',
          paymentAmount: Number(form.paymentAmount.replace(/[^\d]/g, '')),
          paymentMethod: form.paymentMethod
        },
        { skipRemoteSync: true }
      )

      submitError.value =
        err?.data?.message ||
        err?.message ||
        '❌ Pendaftaran gagal dikirim ke server. Data tersimpan di perangkat ini.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  const isProofUploaded = computed(() => Boolean(proofDataUrl.value))

  return {
    errors,
    submitError,
    isSubmitting,
    isReadingProof,
    isSuccess,
    submittedLead,
    proofFileName,
    proofPreviewUrl,
    proofDataUrl,
    isProofUploaded,
    clearError,
    clearProof,
    resetState,
    handleProofFile,
    validateForm,
    submitRegistration
  }
}

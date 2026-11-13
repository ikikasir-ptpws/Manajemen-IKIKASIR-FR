// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { useAppData } from '../composables/useAppData'
import RegistrationModal from '../components/RegistrationModal.vue'
import { leadsApi } from '../api'

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  return {
    ...actual,
    leadsApi: {
      ...actual.leadsApi,
      create: vi.fn(),
      getAll: vi.fn().mockResolvedValue({ data: [] })
    }
  }
})

const mockedCreate = leadsApi.create as any

/** Membuat File PNG palsu untuk simulasi unggah bukti pembayaran. */
const createProofFile = () => {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return new File([bytes], 'bukti-bayar.png', { type: 'image/png' })
}

/** Memasang berkas pada input file agar event change terbaca. */
const attachProofFile = async (file: File) => {
  const input = document.body.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
}

const setInput = async (placeholder: string, value: string) => {
  const input = document.body.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

const setSelect = async (index: number, value: string) => {
  const selects = document.body.querySelectorAll('select')
  const select = selects[index] as HTMLSelectElement
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
}

const setConsent = async () => {
  const checkboxes = Array.from(document.body.querySelectorAll('input[type="checkbox"]'))
  const consent = checkboxes[checkboxes.length - 1] as HTMLInputElement
  consent.checked = true
  consent.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
}

const submitForm = async () => {
  document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
  // Beri waktu FileReader menyelesaikan pembacaan berkas bukti pembayaran.
  await new Promise((resolve) => setTimeout(resolve, 50))
  await flushPromises()
}

const fillValidForm = async () => {
  await setInput('Contoh: Budi Santoso', 'Test Pendaftar')
  await setInput('Contoh: 081234567890 atau +6281234567890', '+6281234567890')
  await setInput('nama@domain.com', 'test-registration@example.com')
  await setInput('Nama toko atau usaha Anda', 'Kafe Contoh')
  await setInput('Contoh: Bandung', 'Bandung')
  await setSelect(0, 'Kafe / Restoran / Warung makan')
  await setConsent()
  await attachProofFile(createProofFile())
}

describe('Form Pendaftaran Langganan (Landing Page) & Calon Client Integration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedCreate.mockResolvedValue({
      data: {
        id: 'lead-uuid-1',
        name: 'Test Pendaftar',
        phone: '+6281234567890',
        email: 'test-registration@example.com',
        businessName: 'Kafe Contoh',
        packageInterest: 'Basic',
        paymentAmount: 250000,
        paymentStatus: 'pending_verification'
      }
    })
  })

  it('menampilkan form pendaftaran langganan beserta field pembayaran', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    const text = document.body.textContent || ''
    expect(text).toContain('Form Pendaftaran Langganan')
    expect(text).toContain('Nama Lengkap')
    expect(text).toContain('Alamat Email')
    expect(text).toContain('Nomor WhatsApp')
    expect(text).toContain('Nama Toko / Usaha')
    expect(text).toContain('Jenis Usaha')
    expect(text).toContain('Bukti Pembayaran')
    expect(text).toContain('Nominal Pembayaran')
    expect(text).toContain('Metode Pembayaran')

    wrapper.unmount()
  })

  it('menampilkan pesan error berbahasa Indonesia saat kolom wajib kosong', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    await submitForm()

    const text = document.body.textContent || ''
    expect(text).toContain('Nama lengkap wajib diisi.')
    expect(text).toContain('Nomor WhatsApp aktif wajib diisi.')
    expect(text).toContain('Email wajib diisi.')
    expect(text).toContain('Jenis usaha wajib dipilih.')
    expect(text).toContain('Kota / kabupaten wajib diisi.')
    expect(text).toContain('Bukti pembayaran wajib diunggah.')
    expect(text).toContain('Persetujuan penggunaan data wajib dicentang.')

    wrapper.unmount()
  })

  it('menampilkan error field untuk nomor WhatsApp dan email tidak valid', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    await setInput('Contoh: 081234567890 atau +6281234567890', '0812bukanangka')
    await setInput('nama@domain.com', 'email-tidak-valid')
    await submitForm()

    expect(document.body.textContent).toContain('Format nomor WhatsApp tidak valid')
    expect(document.body.textContent).toContain('Format email tidak valid')

    wrapper.unmount()
  })

  it('menolak berkas bukti pembayaran dengan format tidak didukung', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    const invalidFile = new File(['abc'], 'bukti.pdf', { type: 'application/pdf' })
    await attachProofFile(invalidFile)

    expect(document.body.textContent).toContain('Format berkas tidak didukung')

    wrapper.unmount()
  })

  it('mengirim pendaftaran beserta bukti pembayaran ke backend', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    await fillValidForm()
    await submitForm()

    expect(mockedCreate).toHaveBeenCalled()
    const payload = mockedCreate.mock.calls[0][0]
    expect(payload.name).toBe('Test Pendaftar')
    expect(payload.businessName).toBe('Kafe Contoh')
    expect(payload.city).toBe('Bandung')
    expect(payload.paymentStatus).toBe('pending_verification')
    expect(payload.paymentAmount).toBeGreaterThan(0)
    expect(payload.paymentProofUrl).toContain('data:image/png;base64')
    expect(payload.paymentMethod).toBeTruthy()

    const text = document.body.textContent || ''
    expect(text).toContain('Pendaftaran Berhasil Dikirim')
    expect(text).toContain('lead-uuid-1')
    expect(text).toContain('Menunggu Verifikasi Finance')

    wrapper.unmount()
  })

  it('menyimpan data pendaftaran di store lokal dengan status pembayaran pending', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    await flushPromises()

    await fillValidForm()
    await submitForm()

    const savedLeads = JSON.parse(localStorage.getItem('ikikasir_leads_v4') || '[]')
    const savedLead = savedLeads.find((lead: any) => lead.email === 'test-registration@example.com')
    expect(savedLead).toMatchObject({
      name: 'Test Pendaftar',
      phone: '+6281234567890',
      businessName: 'Kafe Contoh',
      businessType: 'Kafe / Restoran / Warung makan',
      city: 'Bandung',
      consentAgreed: true,
      paymentStatus: 'pending_verification'
    })

    wrapper.unmount()
  })

  it('saves new registration to storage with unique ID and status New', () => {
    const { addRegistration, leads } = useAppData()

    const newLead = addRegistration({
      name: 'Juky Zky',
      businessName: 'Bakso Aci',
      businessCategory: 'Kuliner & F&B',
      phone: '085669660865',
      email: 'juky@example.com',
      address: 'Jl. Ahmad Yani No 123',
      packageInterest: 'Custom / IT One',
      source: 'Website'
    })

    expect(newLead.id).toMatch(/^REG-/)
    expect(newLead.name).toBe('Juky Zky')
    expect(newLead.businessName).toBe('Bakso Aci')
    expect(newLead.status).toBe('New')
    expect(newLead.phone).toBe('085669660865')
    expect(newLead.email).toBe('juky@example.com')
    expect(newLead.packageInterest).toBe('Custom / IT One')

    const found = leads.value.find(l => l.id === newLead.id)
    expect(found).toBeDefined()
    expect(found?.status).toBe('New')

    const savedLeads = JSON.parse(localStorage.getItem('ikikasir_leads_v4') || '[]')
    const savedItem = savedLeads.find((l: any) => l.id === newLead.id)
    expect(savedItem).toBeDefined()
    expect(savedItem.name).toBe('Juky Zky')
  })

  it('promotes lead to customer when approveLead is called without duplication', () => {
    const { addRegistration, approveLead, customers, leads } = useAppData()

    const newLead = addRegistration({
      name: 'Juky Zky',
      businessName: 'Bakso Aci',
      businessCategory: 'Kuliner & F&B',
      phone: '085669660865',
      email: 'juky@example.com',
      address: 'Jl. Ahmad Yani No 123',
      packageInterest: 'Custom / IT One'
    })

    const customer = approveLead(newLead.id)
    expect(customer).toBeDefined()
    expect(customer?.id).toBe('cust-' + newLead.id)
    expect(customer?.name).toBe('Juky Zky')

    const updatedLead = leads.value.find(l => l.id === newLead.id)
    expect(updatedLead?.status).toBe('Converted')

    const customerCount = customers.value.filter(c => c.name === 'Juky Zky').length
    expect(customerCount).toBe(1)

    const secondApproval = approveLead(newLead.id)
    expect(secondApproval?.id).toBe(customer?.id)
    const customerCountAfterSecond = customers.value.filter(c => c.name === 'Juky Zky').length
    expect(customerCountAfterSecond).toBe(1)
  })
})

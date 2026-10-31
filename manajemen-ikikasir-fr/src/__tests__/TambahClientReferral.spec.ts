// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TambahClientIndex from '../views/crm-client/TambahClientIndex.vue'
import { customersApi, packagesApi } from '../api'
import { referralApi } from '../api/referral.api'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('../api', () => ({
  customersApi: { create: vi.fn() },
  packagesApi: { getAll: vi.fn() }
}))

vi.mock('../api/referral.api', () => ({
  referralApi: {
    validateCode: vi.fn(),
    getOverview: vi.fn(),
    requestWithdrawal: vi.fn(),
    updateWithdrawalStatus: vi.fn()
  }
}))

const mockPackages = {
  getAll: vi.fn(),
  create: vi.fn()
}

const setInput = async (placeholder: string, value: string) => {
  const input = document.body.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

describe('Halaman Tambah Client + Alur Referral', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    mockPackages.getAll.mockResolvedValue({
      data: [
        {
          id: 'pkg-basic',
          name: 'Basic',
          price: 250000,
          period: '/bulan',
          isActive: true,
          isConsultation: false,
          features: []
        }
      ]
    })
    ;(packagesApi.getAll as any).mockResolvedValue(mockPackages.getAll())
    ;(referralApi.validateCode as any).mockResolvedValue({
      data: {
        valid: true,
        code: 'IKIKASIR-8F3KD',
        message: 'Kode referral valid.',
        rewardPerActiveUser: 15000,
        upline: {
          id: 'upline-1',
          name: 'Budi Hartono',
          businessName: 'Kopi Santai Kenangan',
          referralCode: 'IKIKASIR-8F3KD',
          phone: '081234567890',
          boundDate: '10 Sep 2026'
        }
      }
    })
    ;(customersApi.create as any).mockResolvedValue({
      data: {
        id: 'customer-1',
        name: 'Siti Rahma',
        businessName: 'Warung Berkah Abadi',
        referralCode: 'IKIKASIR-7H2KD',
        referredByCustomerId: 'upline-1',
        referredByCustomerName: 'Budi Hartono',
        referredByBusinessName: 'Kopi Santai Kenangan'
      }
    })
  })

  it('menampilkan pesan error berbahasa Indonesia saat kolom wajib kosong', async () => {
    const wrapper = mount(TambahClientIndex, { attachTo: document.body })
    await flushPromises()

    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    const text = document.body.textContent || ''
    expect(text).toContain('Nama lengkap client wajib diisi.')
    expect(text).toContain('Nomor WhatsApp client wajib diisi.')
    expect(text).toContain('Email client wajib diisi.')
    expect(text).toContain('Nama toko / usaha wajib diisi.')
    expect(text).toContain('Jenis usaha wajib dipilih.')
    expect(text).toContain('Kabupaten / Kota wajib diisi.')

    wrapper.unmount()
  })

  it('menampilkan panel referral ketika sumber client adalah Referral', async () => {
    const wrapper = mount(TambahClientIndex, { attachTo: document.body })
    await flushPromises()

    const selects = document.body.querySelectorAll('select')
    const sourceSelect = selects[2] as HTMLSelectElement
    sourceSelect.value = 'Referral'
    sourceSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    expect(document.body.textContent).toContain('Kode Referal Client')
    expect(document.body.textContent).toContain('Alur Referral IKIKASIR')

    wrapper.unmount()
  })

  it('memvalidasi kode referral dan menampilkan kartu pelanggan pengundang', async () => {
    const wrapper = mount(TambahClientIndex, { attachTo: document.body })
    await flushPromises()

    const selects = document.body.querySelectorAll('select')
    const sourceSelect = selects[2] as HTMLSelectElement
    sourceSelect.value = 'Referral'
    sourceSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    await setInput('Contoh: IKIKASIR-8F3KD', 'ikikasir-8f3kd')
    const validateButton = Array.from(document.body.querySelectorAll('button')).find(
      button => button.textContent?.trim() === 'Validasi'
    ) as HTMLButtonElement
    validateButton.click()
    await flushPromises()

    const text = document.body.textContent || ''
    expect(text).toContain('Tersambung ke Pelanggan Pengundang')
    expect(text).toContain('Budi Hartono')
    expect(text).toContain('Kopi Santai Kenangan')
    expect(text).toContain('Menunggu Verifikasi')

    wrapper.unmount()
  })

  it('menyimpan client dengan kode referral dan menampilkan halaman sukses', async () => {
    const wrapper = mount(TambahClientIndex, { attachTo: document.body })
    await flushPromises()

    const selects = document.body.querySelectorAll('select')
    const businessType = selects[0] as HTMLSelectElement
    businessType.value = 'Kafe / Restoran / Warung makan'
    businessType.dispatchEvent(new Event('change', { bubbles: true }))

    const sourceSelect = selects[2] as HTMLSelectElement
    sourceSelect.value = 'Referral'
    sourceSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    await setInput('81234567890', '081234567890')
    await setInput('Contoh: Budi Santoso', 'Siti Rahma')
    await setInput('budi@email.com', 'siti@email.com')
    await setInput('Contoh: Toko Berkah Jaya', 'Warung Berkah Abadi')
    await setInput('Contoh: Kabupaten Bogor', 'Kabupaten Bogor')
    await setInput('Contoh: IKIKASIR-8F3KD', 'IKIKASIR-8F3KD')

    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(customersApi.create).toHaveBeenCalled()
    const payload = (customersApi.create as any).mock.calls[0][0]
    expect(payload.referralCode).toBe('IKIKASIR-8F3KD')
    expect(payload.source).toBe('Referral')
    expect(payload.city).toBe('Kabupaten Bogor')

    const text = document.body.textContent || ''
    expect(text).toContain('Client Berhasil Ditambahkan')
    expect(text).toContain('IKIKASIR-7H2KD')
    expect(text).toContain('Terhubung ke Pelanggan Pengundang')

    wrapper.unmount()
  })
})

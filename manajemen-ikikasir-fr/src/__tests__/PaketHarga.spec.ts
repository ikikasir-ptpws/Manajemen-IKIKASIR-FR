import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import { getPaketWaUrl, IKIKASIR_WA_NUMBER, usePaketHarga } from '../composables/usePaketHarga'
import { packagesApi } from '../api'

vi.mock('../api', () => ({
  packagesApi: {
    getAll: vi.fn(),
  },
}))

const mockedApi = vi.mocked(packagesApi)

const basicPkg = {
  id: 'basic',
  name: 'Basic',
  description: 'Cocok untuk usaha kecil.',
  price: 250000,
  period: '/bulan',
  isConsultation: false,
  features: ['Manajemen produk tanpa batas'],
  isActive: true,
}

const proPkg = {
  id: 'pro',
  name: 'Pro',
  description: 'Solusi lengkap.',
  price: 500000,
  period: '/bulan',
  isConsultation: false,
  features: ['Semua fitur Basic'],
  isActive: true,
}

const consultationPkg = {
  id: 'custom',
  name: 'Custom',
  description: 'Solusi sistem kasir khusus.',
  price: 0,
  period: '',
  isConsultation: true,
  features: ['Kustomisasi alur'],
  isActive: true,
}

function mountComposable() {
  let result: ReturnType<typeof usePaketHarga> | null = null
  const wrapper = mount(
    defineComponent({
      setup() {
        result = usePaketHarga()
        return () => h('div')
      },
    })
  )
  return { wrapper, result: result! }
}

describe('usePaketHarga', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memuat paket dari API dan menandai paket harga tertinggi sebagai Populer', async () => {
    mockedApi.getAll.mockResolvedValue({
      success: true,
      data: [basicPkg, proPkg, consultationPkg],
    } as any)

    const { wrapper, result } = mountComposable()
    await vi.waitFor(() => expect(result.loading.value).toBe(false))

    expect(mockedApi.getAll).toHaveBeenCalledWith({ isActive: true })
    expect(result.pricingPlans.value).toHaveLength(3)

    const basic = result.pricingPlans.value.find((p) => p.id === 'basic')!
    const pro = result.pricingPlans.value.find((p) => p.id === 'pro')!
    const consultation = result.pricingPlans.value.find((p) => p.id === 'custom')!

    expect(pro.badge).toBe('Populer')
    expect(pro.cardClass).toContain('pro')
    expect(basic.badge).toBeUndefined()
    expect(basic.cardClass).toBe('price-card')

    // Paket konsultasi memakai gaya gelap
    expect(consultation.cardClass).toContain('consultation')
    expect(consultation.isHighlighted).toBe(true)

    // Semua tombol mengarah ke WhatsApp
    expect(basic.btnText).toBe('Hubungi Kami')
    expect(pro.btnText).toBe('Hubungi Kami')

    wrapper.unmount()
  })

  it('menyimpan pesan error dan mengosongkan daftar saat API gagal', async () => {
    mockedApi.getAll.mockRejectedValue(new Error('Jaringan bermasalah'))

    const { wrapper, result } = mountComposable()
    await vi.waitFor(() => expect(result.loading.value).toBe(false))

    expect(result.error.value).toBe('Jaringan bermasalah')
    expect(result.pricingPlans.value).toEqual([])

    wrapper.unmount()
  })
})

describe('getPaketWaUrl', () => {
  it('membuat link WhatsApp dengan nomor IKI KASIR dan nama paket', () => {
    const url = getPaketWaUrl('Pro')
    expect(url).toContain(`https://wa.me/${IKIKASIR_WA_NUMBER}`)
    expect(url).toContain(encodeURIComponent('paket Pro'))
  })

  it('menggunakan pesan umum saat nama paket tidak diisi', () => {
    const url = getPaketWaUrl()
    expect(url).toContain(`https://wa.me/${IKIKASIR_WA_NUMBER}`)
    expect(url).toContain(encodeURIComponent('paket langganan'))
  })
})

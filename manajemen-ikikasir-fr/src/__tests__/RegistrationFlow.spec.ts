// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { useAppData } from '../composables/useAppData'
import RegistrationModal from '../components/RegistrationModal.vue'

describe('Registration Flow & Calon Client Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reflects managed package edits in the registration package cards', async () => {
    const { packages, updatePackage } = useAppData()
    const packageToEdit = packages.value.find(pkg => pkg.isActive)!
    const originalPackage = { ...packageToEdit, features: [...packageToEdit.features] }
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })

    updatePackage({
      ...originalPackage,
      name: 'Paket Dinamis Uji',
      cardSub: 'Deskripsi terbaru dari Kelola Paket',
      price: 12345,
      isConsultation: false,
      features: ['Fitur terbaru dari katalog'],
      isActive: true
    })
    await flushPromises()

    expect(document.body.textContent).toContain('Paket Dinamis Uji')
    expect(document.body.textContent).toContain('12.345')
    expect(document.body.textContent).toContain('Fitur terbaru dari katalog')

    updatePackage(originalPackage)
    await flushPromises()
    wrapper.unmount()
  })

  it('shows Indonesian field errors when required registration data is empty', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })

    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(document.body.textContent).toContain('Nama lengkap wajib diisi.')
    expect(document.body.textContent).toContain('Nomor WhatsApp aktif wajib diisi.')
    expect(document.body.textContent).toContain('Email wajib diisi.')
    expect(document.body.textContent).toContain('Jenis usaha wajib dipilih.')
    expect(document.body.textContent).toContain('Kota / kabupaten wajib diisi.')
    expect(document.body.textContent).toContain('Persetujuan penggunaan data wajib dicentang.')

    wrapper.unmount()
  })

  it('shows field-level errors for invalid WhatsApp and email formats', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    const phone = document.body.querySelector('input[placeholder="Contoh: 081234567890 atau +6281234567890"]') as HTMLInputElement
    const email = document.body.querySelector('input[placeholder="Contoh: nama@domain.com"]') as HTMLInputElement
    phone.value = '0812bukanangka'
    email.value = 'email-tidak-valid'
    phone.dispatchEvent(new Event('input', { bubbles: true }))
    email.dispatchEvent(new Event('input', { bubbles: true }))
    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(phone.parentElement?.textContent).toContain('Format nomor WhatsApp tidak valid.')
    expect(email.parentElement?.textContent).toContain('Format email tidak valid')

    wrapper.unmount()
  })

  it('accepts valid Indonesian contact details and persists the new registration fields', async () => {
    const wrapper = mount(RegistrationModal, {
      props: { isOpen: true },
      attachTo: document.body
    })
    const setInput = async (placeholder: string, value: string) => {
      const input = document.body.querySelector(`input[placeholder="${placeholder}"]`) as HTMLInputElement
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushPromises()
    }

    await setInput('Isi nama lengkap Anda', 'Test Pendaftar')
    await setInput('Contoh: 081234567890 atau +6281234567890', '+6281234567890')
    await setInput('Contoh: nama@domain.com', 'test-registration@example.com')
    await setInput('Nama toko atau usaha Anda', 'Kafe Contoh')
    await setInput('Contoh: Bandung', 'Bandung')

    const businessType = document.body.querySelector('select') as HTMLSelectElement
    businessType.value = 'Kafe / Restoran / Warung makan'
    businessType.dispatchEvent(new Event('change', { bubbles: true }))
    document.body.querySelectorAll('button').forEach(button => {
      if (button.textContent?.trim() === 'Mungkin' || button.textContent?.trim() === 'Ya') button.click()
    })
    const checkboxes = Array.from(document.body.querySelectorAll('input[type="checkbox"]'))
    const consent = checkboxes[checkboxes.length - 1] as HTMLInputElement
    consent.checked = true
    consent.dispatchEvent(new Event('change', { bubbles: true }))

    document.body.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    const savedLeads = JSON.parse(localStorage.getItem('ikikasir_leads_v3') || '[]')
    const savedLead = savedLeads.find((lead: any) => lead.email === 'test-registration@example.com')
    expect(savedLead).toMatchObject({
      name: 'Test Pendaftar',
      phone: '+6281234567890',
      businessName: 'Kafe Contoh',
      businessType: 'Kafe / Restoran / Warung makan',
      city: 'Bandung',
      consentAgreed: true
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

    // Verify presence in leads store
    const found = leads.value.find(l => l.id === newLead.id)
    expect(found).toBeDefined()
    expect(found?.status).toBe('New')

    // Verify persistence in localStorage
    const savedLeads = JSON.parse(localStorage.getItem('ikikasir_leads_v3') || '[]')
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

    // Approve lead
    const customer = approveLead(newLead.id)
    expect(customer).toBeDefined()
    expect(customer?.id).toBe('cust-' + newLead.id)
    expect(customer?.name).toBe('Juky Zky')

    // Lead status updated to Converted
    const updatedLead = leads.value.find(l => l.id === newLead.id)
    expect(updatedLead?.status).toBe('Converted')

    // Check customer presence in Semua Pelanggan
    const customerCount = customers.value.filter(c => c.name === 'Juky Zky').length
    expect(customerCount).toBe(1)

    // Second click on approve should not duplicate customer
    const secondApproval = approveLead(newLead.id)
    expect(secondApproval?.id).toBe(customer?.id)
    const customerCountAfterSecond = customers.value.filter(c => c.name === 'Juky Zky').length
    expect(customerCountAfterSecond).toBe(1)
  })
})

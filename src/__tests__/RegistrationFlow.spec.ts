// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppData } from '../composables/useAppData'

describe('Registration Flow & Calon Client Integration', () => {
  beforeEach(() => {
    localStorage.clear()
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

import { describe, it, expect } from 'vitest'
import { useAppData } from '../composables/useAppData'

describe('App Data Store', () => {
  it('initializes leads and customers successfully', () => {
    const { leads, customers, statistics } = useAppData()
    expect(leads.value).toBeDefined()
    expect(customers.value).toBeDefined()
    expect(statistics.value.totalLeads).toBeGreaterThanOrEqual(0)
  })
})

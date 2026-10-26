import { httpClient } from './httpClient'

export const subscriptionsApi = {
  checkStatus: (params: { email: string; token?: string }) =>
    httpClient.get('/subscriptions/check', params, { skipAuth: true }),

  simulateExpired: (payload: { customerId: string; daysAgo?: number }) =>
    httpClient.post('/subscriptions/simulate-expired', payload)
}

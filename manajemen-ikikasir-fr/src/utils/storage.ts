import { API_BASE_URL } from '../api/httpClient'

/**
 * Normalizes payment proof / receipt URLs so they work across both
 * local development and production environments, and gracefully handles
 * legacy localhost URLs already stored in the production database.
 */
export const resolveReceiptUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return ''
  }

  const trimmed = url.trim()

  // Inline SVG / Base64 / Blob
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('<svg')
  ) {
    return trimmed
  }

  // Determine production/API origin (e.g. 'https://api.ikikasir.com')
  const rawBase =
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
    API_BASE_URL ||
    ''
  const apiOrigin = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '')

  // If already relative (e.g. /uploads/receipts/proof-xxx.jpg)
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return apiOrigin ? `${apiOrigin}${cleanPath}` : cleanPath
  }

  // If saved as http://localhost:5000/... or http://127.0.0.1:5000/...
  // In production (or when talking to a remote API), rewrite localhost to apiOrigin!
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)?$/i.test(trimmed)) {
    const match = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)?$/i)
    const pathname = match && match[1] ? match[1] : ''

    const isCurrentHostLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const isApiLocal =
      apiOrigin.includes('localhost') || apiOrigin.includes('127.0.0.1')

    // If frontend is deployed (e.g. ikikasir.com) OR API points to a remote server (e.g. api.ikikasir.com),
    // rewrite localhost to apiOrigin so the browser doesn't try to query the local machine
    if (!isCurrentHostLocal || !isApiLocal) {
      if (apiOrigin) {
        return `${apiOrigin}${pathname}`
      }
    }
  }

  return trimmed
}


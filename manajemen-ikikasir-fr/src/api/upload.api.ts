import { httpClient } from './httpClient'

export interface UploadResponseData {
  url: string
  relativePath: string
  filename: string
  originalName?: string
  size?: number
  mimetype?: string
}

export const uploadApi = {
  /**
   * Upload file bukti pembayaran via multipart/form-data
   */
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return httpClient.post<UploadResponseData>('/upload/payment-proof', formData)
  },

  /**
   * Upload bukti pembayaran via Base64 string
   */
  uploadBase64: (base64: string, fileName?: string) => {
    return httpClient.post<UploadResponseData>('/upload/base64', {
      image: base64,
      fileName
    })
  }
}

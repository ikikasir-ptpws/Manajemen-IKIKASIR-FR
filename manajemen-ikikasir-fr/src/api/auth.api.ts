import { httpClient, tokenStorage } from './httpClient'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  lastLogin?: string | null
}

export interface LoginResponseData {
  user: AuthUser
  token: string
}

const USER_STORAGE_KEY = 'ikikasir_user'

export const authApi = {
  loginSuperAdmin: async (payload: LoginPayload) => {
    const res = await httpClient.post<LoginResponseData>('/auth/login/superadmin', payload, { skipAuth: true })
    if (res.data?.token) {
      tokenStorage.set(res.data.token)
    }
    if (res.data?.user) {
      authApi.setUser(res.data.user)
    }
    return res
  },

  loginSales: async (payload: LoginPayload) => {
    const res = await httpClient.post<LoginResponseData>('/auth/login/sales', payload, { skipAuth: true })
    if (res.data?.token) {
      tokenStorage.set(res.data.token)
    }
    if (res.data?.user) {
      authApi.setUser(res.data.user)
    }
    return res
  },

  getMe: async () => {
    return httpClient.get<AuthUser>('/auth/me')
  },

  getUser: (): AuthUser | null => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setUser: (user: AuthUser): void => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch {
      // ignore
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      // ignore
    }
  },

  logout: () => {
    tokenStorage.remove()
    authApi.removeUser()
  }
}


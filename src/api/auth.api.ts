import { http, isMockApi } from './http'
import { mockApi } from './mock'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/auth'

export const authApi = {
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    if (isMockApi) return mockApi.register(payload)
    const { data } = await http.post<RegisterResponse>('/auth/register', payload)
    return data
  },
  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (isMockApi) return mockApi.login(payload)
    const { data } = await http.post<LoginResponse>('/auth/login', payload)
    return data
  },
  async me(): Promise<User> {
    if (isMockApi) return mockApi.me()
    const { data } = await http.get<User>('/me')
    return data
  }
}

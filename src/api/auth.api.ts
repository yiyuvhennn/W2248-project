import { http, isMockApi } from './http'
import { mockApi } from './mock'
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth'

export const authApi = {
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    if (isMockApi) return mockApi.register(payload)

    const { data } = await http.post('/auth/register', payload)
    return data
  },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (isMockApi) return mockApi.login(payload)

    const { data } = await http.post('/auth/login', payload)
    return data
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<MessageResponse> {
    if (isMockApi) return mockApi.forgotPassword(payload)

    const { data } = await http.post('/auth/forgot-password', payload)
    return data
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<MessageResponse> {
    if (isMockApi) return mockApi.resetPassword(payload)

    const { data } = await http.post('/auth/reset-password', payload)
    return data
  },

  async me(): Promise<User> {
    if (isMockApi) return mockApi.me()

    const { data } = await http.get('/me')
    return data
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<User> {
    if (isMockApi) return mockApi.updateProfile(payload)

    const { data } = await http.put('/me', payload)
    return data
  },

  async changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    if (isMockApi) return mockApi.changePassword(payload)

    const { data } = await http.put('/me/password', payload)
    return data
  },

  async deleteAccount(payload: DeleteAccountRequest): Promise<MessageResponse> {
    if (isMockApi) return mockApi.deleteAccount(payload)

    const { data } = await http.delete('/me', {
      data: payload,
    })

    return data
  },
}
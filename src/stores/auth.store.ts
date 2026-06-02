import { defineStore } from 'pinia'
import { authApi } from '@/api/auth.api'
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth'

const TOKEN_KEY = 'finance_access_token'
const USER_KEY = 'finance_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') as User | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    displayName: (state) => state.user?.name || state.user?.email || '使用者',
  },

  actions: {
    async login(payload: LoginRequest) {
      this.loading = true

      try {
        const response = await authApi.login(payload)

        this.token = response.accessToken
        this.user = response.user

        localStorage.setItem(TOKEN_KEY, response.accessToken)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        return response
      } finally {
        this.loading = false
      }
    },

    async register(payload: RegisterRequest) {
      this.loading = true

      try {
        return await authApi.register(payload)
      } finally {
        this.loading = false
      }
    },

    async registerAndLogin(payload: RegisterRequest) {
      this.loading = true

      try {
        await authApi.register(payload)

        const response = await authApi.login({
          email: payload.email,
          password: payload.password,
        })

        this.token = response.accessToken
        this.user = response.user

        localStorage.setItem(TOKEN_KEY, response.accessToken)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        return response
      } finally {
        this.loading = false
      }
    },

    async forgotPassword(payload: ForgotPasswordRequest) {
      this.loading = true

      try {
        return await authApi.forgotPassword(payload)
      } finally {
        this.loading = false
      }
    },

    async resetPassword(payload: ResetPasswordRequest) {
      this.loading = true

      try {
        return await authApi.resetPassword(payload)
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      if (!this.token) return null

      const user = await authApi.me()

      this.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      return user
    },

    async updateProfile(payload: UpdateProfileRequest) {
      this.loading = true

      try {
        const user = await authApi.updateProfile(payload)

        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        return user
      } finally {
        this.loading = false
      }
    },

    async changePassword(payload: ChangePasswordRequest) {
      this.loading = true

      try {
        return await authApi.changePassword(payload)
      } finally {
        this.loading = false
      }
    },

    async deleteAccount(payload: DeleteAccountRequest) {
      this.loading = true

      try {
        const response = await authApi.deleteAccount(payload)
        this.logout()
        return response
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.token = ''
      this.user = null

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },

    updateLocalUser(user: Partial<User>) {
      this.user = {
        ...(this.user || { id: '', email: '', name: '' }),
        ...user,
      }

      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
    },
  },
})
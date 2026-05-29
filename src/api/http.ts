import axios, { AxiosError } from 'axios'
import type { ApiErrorShape } from '@/types/api'

const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const isMockApi = useMock

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('finance_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorShape>) => {
    const code = error.response?.data?.error
    if (error.response?.status === 401 && ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_MISSING'].includes(code || '')) {
      localStorage.removeItem('finance_access_token')
      localStorage.removeItem('finance_user')
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    const data = error.response?.data
    if (data?.details?.length) return data.details.map((item) => item.message).join('、')
    if (data?.error === 'INVALID_CREDENTIALS') return '帳號或密碼錯誤'
    if (data?.error === 'EMAIL_ALREADY_EXISTS') return '此 Email 已被註冊'
    if (data?.error === 'CATEGORY_NAME_EXISTS') return '同類型下已有相同分類名稱'
    if (data?.error === 'CATEGORY_IN_USE') return '此分類底下仍有紀錄，無法刪除'
    if (data?.error === 'FUTURE_DATE_NOT_ALLOWED') return '紀錄日期不可為未來日期'
    if (data?.error === 'TOKEN_EXPIRED') return '登入狀態已過期，請重新登入'
    return data?.message || '系統發生錯誤，請稍後再試'
  }
  return error instanceof Error ? error.message : '系統發生錯誤，請稍後再試'
}

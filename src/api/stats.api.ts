import { http, isMockApi } from './http'
import { mockApi } from './mock'
import type { RecordType } from '@/types/record'
import type { CategoryStatsResponse, MonthlyStatsResponse } from '@/types/stats'

export const statsApi = {
  async category(month: string, type: RecordType): Promise<CategoryStatsResponse> {
    if (isMockApi) return mockApi.getCategoryStats(month, type)
    const { data } = await http.get<CategoryStatsResponse>('/stats/category', { params: { month, type } })
    return data
  },
  async monthly(month: string): Promise<MonthlyStatsResponse> {
    if (isMockApi) return mockApi.getMonthlyStats(month)
    const { data } = await http.get<MonthlyStatsResponse>('/stats/monthly', { params: { month } })
    return data
  }
}

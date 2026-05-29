import { http, isMockApi } from './http'
import { mockApi } from './mock'
import type { FinanceRecord, RecordPayload, RecordsQuery, RecordsResponse, RecordUpdatePayload } from '@/types/record'

export const recordsApi = {
  async list(query: RecordsQuery): Promise<RecordsResponse> {
    if (isMockApi) return mockApi.getRecords(query)
    const { data } = await http.get<RecordsResponse>('/records', { params: query })
    return data
  },
  async create(payload: RecordPayload): Promise<FinanceRecord> {
    if (isMockApi) return mockApi.createRecord(payload)
    const { data } = await http.post<FinanceRecord>('/records', payload)
    return data
  },
  async update(id: string, payload: RecordUpdatePayload): Promise<FinanceRecord> {
    if (isMockApi) return mockApi.updateRecord(id, payload)
    const { data } = await http.put<FinanceRecord>(`/records/${id}`, payload)
    return data
  },
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    if (isMockApi) return mockApi.deleteRecord(id)
    const { data } = await http.delete<{ message: string; deletedId: string }>(`/records/${id}`)
    return data
  }
}

export type RecordType = 'income' | 'expense'

export interface FinanceRecord {
  id: string
  type: RecordType
  amount: number
  categoryId: string
  categoryName: string
  date: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface RecordSummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface RecordsQuery {
  month?: string
  categoryId?: string
  type?: RecordType | ''
  page?: number
  pageSize?: number
}

export interface RecordsResponse {
  data: FinanceRecord[]
  pagination: Pagination
  summary: RecordSummary
}

export interface RecordPayload {
  type: RecordType
  amount: number
  categoryId: string
  date: string
  note?: string | null
}

export type RecordUpdatePayload = Partial<RecordPayload>

import type { RecordType } from './record'

export interface CategoryStatItem {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
  count: number
}

export interface CategoryStatsResponse {
  month: string
  type: RecordType
  totalAmount: number
  categories: CategoryStatItem[]
}

export interface MonthlyStatItem {
  month: string
  totalIncome: number
  totalExpense: number
  balance: number
}

export interface MonthlyStatsResponse {
  baseMonth: string
  months: MonthlyStatItem[]
}

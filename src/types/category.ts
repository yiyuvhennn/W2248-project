import type { RecordType } from './record'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: RecordType
  createdAt: string
}

export interface CategoriesResponse {
  income: Category[]
  expense: Category[]
}

export interface CategoryPayload {
  name: string
  type: RecordType
  icon?: string
  color?: string
}

export interface CategoryUpdatePayload {
  name?: string
  icon?: string
  color?: string
}

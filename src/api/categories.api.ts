import { http, isMockApi } from './http'
import { mockApi } from './mock'
import type { CategoriesResponse, Category, CategoryPayload, CategoryUpdatePayload } from '@/types/category'

export const categoriesApi = {
  async list(): Promise<CategoriesResponse> {
    if (isMockApi) return mockApi.getCategories()
    const { data } = await http.get<CategoriesResponse>('/categories')
    return data
  },
  async create(payload: CategoryPayload): Promise<Category> {
    if (isMockApi) return mockApi.createCategory(payload)
    const { data } = await http.post<Category>('/categories', payload)
    return data
  },
  async update(id: string, payload: CategoryUpdatePayload): Promise<Category> {
    if (isMockApi) return mockApi.updateCategory(id, payload)
    const { data } = await http.put<Category>(`/categories/${id}`, payload)
    return data
  },
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    if (isMockApi) return mockApi.deleteCategory(id)
    const { data } = await http.delete<{ message: string; deletedId: string }>(`/categories/${id}`)
    return data
  }
}

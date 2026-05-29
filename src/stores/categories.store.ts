import { defineStore } from 'pinia'
import { categoriesApi } from '@/api/categories.api'
import type { CategoriesResponse, Category, CategoryPayload, CategoryUpdatePayload } from '@/types/category'
import type { RecordType } from '@/types/record'

const emptyCategories = (): CategoriesResponse => ({ income: [], expense: [] })

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: emptyCategories(),
    loading: false
  }),
  getters: {
    all: (state): Category[] => [...state.categories.income, ...state.categories.expense],
    byType: (state) => (type: RecordType): Category[] => state.categories[type],
    byId: (state) => (id: string): Category | undefined => [...state.categories.income, ...state.categories.expense].find((item) => item.id === id)
  },
  actions: {
    async fetchCategories() {
      this.loading = true
      try {
        this.categories = await categoriesApi.list()
      } finally {
        this.loading = false
      }
    },
    async create(payload: CategoryPayload) {
      const item = await categoriesApi.create(payload)
      this.categories[payload.type].push(item)
      return item
    },
    async update(id: string, payload: CategoryUpdatePayload) {
      const item = await categoriesApi.update(id, payload)
      const group = this.categories[item.type]
      const idx = group.findIndex((category) => category.id === id)
      if (idx >= 0) group[idx] = item
      return item
    },
    async remove(id: string) {
      const item = this.all.find((category) => category.id === id)
      const response = await categoriesApi.remove(id)
      if (item) this.categories[item.type] = this.categories[item.type].filter((category) => category.id !== id)
      return response
    }
  }
})

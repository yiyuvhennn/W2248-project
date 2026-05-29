import type { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '@/types/auth'
import type { CategoriesResponse, Category, CategoryPayload, CategoryUpdatePayload } from '@/types/category'
import type { FinanceRecord, RecordPayload, RecordsQuery, RecordsResponse, RecordUpdatePayload, RecordType } from '@/types/record'
import type { CategoryStatsResponse, MonthlyStatsResponse } from '@/types/stats'
import { currentMonth, shiftMonth } from '@/utils/date'

const now = '2026-03-12T10:00:00.000Z'
let mockUser: User = { id: 'u_abc123', email: 'user@example.com', name: '王小明', createdAt: now }

let categories: CategoriesResponse = {
  income: [
    { id: 'cat_salary', name: '薪資', icon: 'fa-money-bill-wave', color: '#10B981', type: 'income', createdAt: now },
    { id: 'cat_bonus', name: '獎金', icon: 'fa-gift', color: '#3B82F6', type: 'income', createdAt: now },
    { id: 'cat_invest', name: '投資', icon: 'fa-chart-line', color: '#8B5CF6', type: 'income', createdAt: now }
  ],
  expense: [
    { id: 'cat_food', name: '餐飲', icon: 'fa-utensils', color: '#EF4444', type: 'expense', createdAt: now },
    { id: 'cat_transport', name: '交通', icon: 'fa-bus', color: '#F97316', type: 'expense', createdAt: now },
    { id: 'cat_shopping', name: '購物', icon: 'fa-bag-shopping', color: '#EAB308', type: 'expense', createdAt: now },
    { id: 'cat_home', name: '居家', icon: 'fa-house', color: '#12B981', type: 'expense', createdAt: now },
    { id: 'cat_entertain', name: '娛樂', icon: 'fa-gamepad', color: '#8B5CF6', type: 'expense', createdAt: now },
    { id: 'cat_health', name: '醫療', icon: 'fa-heart-pulse', color: '#EC4899', type: 'expense', createdAt: now }
  ]
}

const base = '2026-03'
let records: FinanceRecord[] = [
  createRecord('expense', 1280, 'cat_food', `${base}-06`, '超市採購'),
  createRecord('income', 30000, 'cat_salary', `${base}-05`, '薪資入帳'),
  createRecord('expense', 1280, 'cat_transport', `${base}-04`, '捷運月票'),
  createRecord('expense', 390, 'cat_entertain', `${base}-03`, 'Netflix 訂閱'),
  createRecord('expense', 120, 'cat_food', `${base}-02`, '午餐便當'),
  createRecord('income', 500, 'cat_bonus', `${base}-01`, '兼職收入'),
  createRecord('expense', 10164, 'cat_food', `${base}-01`, '食品餐飲統計'),
  createRecord('expense', 5082, 'cat_transport', `${base}-01`, '交通出行統計'),
  createRecord('expense', 3146, 'cat_home', `${base}-01`, '住房租金統計'),
  createRecord('expense', 3388, 'cat_shopping', `${base}-01`, '其他統計'),
  createRecord('expense', 2420, 'cat_entertain', `${base}-01`, '娛樂休閒統計'),
  createRecord('income', 1250, 'cat_invest', `${shiftMonth(base, -1)}-28`, '股息'),
  createRecord('expense', 880, 'cat_food', `${shiftMonth(base, -1)}-25`, '聚餐'),
  createRecord('expense', 2600, 'cat_shopping', `${shiftMonth(base, -1)}-17`, '衣服'),
  createRecord('income', 52000, 'cat_salary', `${shiftMonth(base, -1)}-05`, '二月薪資')
]

function createRecord(type: RecordType, amount: number, categoryId: string, date: string, note: string | null): FinanceRecord {
  const category = findCategory(categoryId)
  return {
    id: `rec_${Math.random().toString(36).slice(2, 10)}`,
    type,
    amount,
    categoryId,
    categoryName: category?.name || '未分類',
    date,
    note,
    createdAt: now,
    updatedAt: now
  }
}

function findCategory(id: string): Category | undefined {
  return [...categories.income, ...categories.expense].find((item) => item.id === id)
}

function wait<T>(payload: T, ms = 360): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(payload), ms))
}

function assertToken() {
  const token = localStorage.getItem('finance_access_token')
  if (!token) throw new Error('TOKEN_MISSING')
}

function getSummary(items: FinanceRecord[]) {
  const totalIncome = items.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const totalExpense = items.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
}

export const mockApi = {
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    if (payload.email === mockUser.email) throw new Error('此 Email 已被註冊')
    mockUser = { id: `u_${Date.now()}`, email: payload.email, name: payload.name, createdAt: new Date().toISOString() }
    return wait({ message: '註冊成功，請登入', user: mockUser })
  },
  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (!payload.email || !payload.password) throw new Error('請輸入 Email 與密碼')
    return wait({
      accessToken: `mock-token-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 28800,
      user: mockUser
    })
  },
  async me(): Promise<User> {
    assertToken()
    return wait(mockUser)
  },
  async getRecords(query: RecordsQuery): Promise<RecordsResponse> {
    assertToken()
    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const month = query.month || currentMonth()
    const filteredAll = records
      .filter((record) => record.date.startsWith(month))
      .filter((record) => !query.categoryId || record.categoryId === query.categoryId)
      .filter((record) => !query.type || record.type === query.type)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * pageSize
    return wait({
      data: filteredAll.slice(start, start + pageSize),
      pagination: { page, pageSize, totalItems: filteredAll.length, totalPages: Math.max(1, Math.ceil(filteredAll.length / pageSize)) },
      summary: getSummary(filteredAll)
    })
  },
  async createRecord(payload: RecordPayload): Promise<FinanceRecord> {
    assertToken()
    const record = createRecord(payload.type, Number(payload.amount), payload.categoryId, payload.date, payload.note || null)
    records.unshift(record)
    return wait(record)
  },
  async updateRecord(id: string, payload: RecordUpdatePayload): Promise<FinanceRecord> {
    assertToken()
    const idx = records.findIndex((item) => item.id === id)
    if (idx < 0) throw new Error('找不到紀錄')
    const next = { ...records[idx], ...payload, updatedAt: new Date().toISOString() } as FinanceRecord
    if (payload.categoryId) next.categoryName = findCategory(payload.categoryId)?.name || next.categoryName
    records[idx] = next
    return wait(next)
  },
  async deleteRecord(id: string): Promise<{ message: string; deletedId: string }> {
    assertToken()
    records = records.filter((item) => item.id !== id)
    return wait({ message: '紀錄已成功刪除', deletedId: id })
  },
  async getCategories(): Promise<CategoriesResponse> {
    assertToken()
    return wait(JSON.parse(JSON.stringify(categories)))
  },
  async createCategory(payload: CategoryPayload): Promise<Category> {
    assertToken()
    const group = categories[payload.type]
    if (group.some((item) => item.name === payload.name)) throw new Error('同類型下已有相同分類名稱')
    const item: Category = {
      id: `cat_${Date.now()}`,
      name: payload.name,
      type: payload.type,
      icon: payload.icon || 'fa-tag',
      color: payload.color || '#9E9E9E',
      createdAt: new Date().toISOString()
    }
    group.push(item)
    return wait(item)
  },
  async updateCategory(id: string, payload: CategoryUpdatePayload): Promise<Category> {
    assertToken()
    const all = [...categories.income, ...categories.expense]
    const category = all.find((item) => item.id === id)
    if (!category) throw new Error('找不到分類')
    Object.assign(category, payload)
    records = records.map((record) => record.categoryId === id ? { ...record, categoryName: category.name } : record)
    return wait(category)
  },
  async deleteCategory(id: string): Promise<{ message: string; deletedId: string }> {
    assertToken()
    if (records.some((record) => record.categoryId === id)) throw new Error('此分類底下仍有紀錄，無法刪除')
    categories.income = categories.income.filter((item) => item.id !== id)
    categories.expense = categories.expense.filter((item) => item.id !== id)
    return wait({ message: '分類已成功刪除', deletedId: id })
  },
  async getCategoryStats(month: string, type: RecordType): Promise<CategoryStatsResponse> {
    assertToken()
    const items = records.filter((record) => record.date.startsWith(month) && record.type === type)
    const totalAmount = items.reduce((sum, record) => sum + record.amount, 0)
    const byCategory = new Map<string, { amount: number; count: number; name: string }>()
    items.forEach((record) => {
      const current = byCategory.get(record.categoryId) || { amount: 0, count: 0, name: record.categoryName }
      current.amount += record.amount
      current.count += 1
      byCategory.set(record.categoryId, current)
    })
    return wait({
      month,
      type,
      totalAmount,
      categories: Array.from(byCategory.entries()).map(([categoryId, item]) => ({
        categoryId,
        categoryName: item.name,
        amount: item.amount,
        percentage: totalAmount ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0,
        count: item.count
      })).sort((a, b) => b.amount - a.amount)
    })
  },
  async getMonthlyStats(month: string): Promise<MonthlyStatsResponse> {
    assertToken()
    const months = [-5, -4, -3, -2, -1, 0].map((offset) => shiftMonth(month, offset)).map((m) => {
      const summary = getSummary(records.filter((record) => record.date.startsWith(m)))
      if (summary.totalIncome === 0 && summary.totalExpense === 0) {
        const seededIncome = 42000 + Math.round(Math.random() * 12000)
        const seededExpense = 18000 + Math.round(Math.random() * 9000)
        return { month: m, totalIncome: seededIncome, totalExpense: seededExpense, balance: seededIncome - seededExpense }
      }
      return { month: m, ...summary }
    })
    return wait({ baseMonth: month, months })
  }
}

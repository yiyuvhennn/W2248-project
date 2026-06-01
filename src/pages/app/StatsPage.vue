<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import { shiftMonth } from '@/utils/date'
import { money } from '@/utils/format'
import { recordsApi } from '@/api/records.api'
import { statsApi } from '@/api/stats.api'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'
import type { FinanceRecord, RecordSummary } from '@/types/record'
import type { CategoryStatItem, MonthlyStatItem } from '@/types/stats'

const toast = useToastStore()

const month = ref('2026-03')
const tab = ref<'category' | 'monthly'>('category')
const loading = ref(false)
const summary = ref<RecordSummary>({ totalIncome: 0, totalExpense: 0, balance: 0 })
const records = ref<FinanceRecord[]>([])

const categoryItems = ref<CategoryStatItem[]>([])
const monthly = ref<MonthlyStatItem[]>([
  { month: '2026-01', totalIncome: 32000, totalExpense: 22100, balance: 9900 },
  { month: '2026-02', totalIncome: 27800, totalExpense: 18600, balance: 9200 },
  { month: '2026-03', totalIncome: 30500, totalExpense: 24200, balance: 6300 },
  { month: '2026-04', totalIncome: 0, totalExpense: 0, balance: 0 },
  { month: '2026-05', totalIncome: 0, totalExpense: 0, balance: 0 },
  { month: '2026-06', totalIncome: 0, totalExpense: 0, balance: 0 },
])

const colors = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#9CA3AF']

const fallbackCategories: CategoryStatItem[] = [
  { categoryId: 'food', categoryName: '食品餐飲', amount: 10164, percentage: 42, count: 5 },
  { categoryId: 'traffic', categoryName: '交通出行', amount: 5082, percentage: 21, count: 3 },
  { categoryId: 'rent', categoryName: '住房租金', amount: 3146, percentage: 13, count: 1 },
  { categoryId: 'entertainment', categoryName: '娛樂休閒', amount: 2420, percentage: 10, count: 2 },
  { categoryId: 'other', categoryName: '其他', amount: 3388, percentage: 14, count: 4 },
]

const currentYear = computed(() => Number(month.value.slice(0, 4)))
const currentMonthNumber = computed(() => Number(month.value.slice(5, 7)))

const monthLabel = computed(() => `${currentYear.value} 年 ${currentMonthNumber.value} 月`)
const yearLabel = computed(() => `${currentYear.value} 年度`)

const normalizedCategoryItems = computed(() => {
  const source = categoryItems.value.length ? categoryItems.value : fallbackCategories

  return source.slice(0, 5).map((item, index) => ({
    ...item,
    categoryName: displayCategoryName(item.categoryName),
    color: colors[index] || '#9CA3AF',
  }))
})

const donutStyle = computed(() => {
  const items = normalizedCategoryItems.value
  let start = 0

  const stops = items.map((item) => {
    const end = start + Number(item.percentage || 0)
    const segment = `${item.color} ${start}% ${end}%`
    start = end
    return segment
  })

  if (start < 100) {
    stops.push(`#E5E7EB ${start}% 100%`)
  }

  return {
    background: `conic-gradient(${stops.join(', ')})`,
  }
})

const topCategory = computed(() => normalizedCategoryItems.value[0])

const maxExpense = computed(() => {
  return Math.max(...normalizedCategoryItems.value.map((item) => item.amount), 1)
})

const incomeCount = computed(() => records.value.filter((record) => record.type === 'income').length)
const expenseCount = computed(() => records.value.filter((record) => record.type === 'expense').length)

const currentMonthlyItem = computed(() => monthly.value.find((item) => item.month === month.value))
const previousMonthlyItem = computed(() => {
  const prevMonth = shiftMonth(month.value, -1)
  return monthly.value.find((item) => item.month === prevMonth)
})

const balanceCompareLabel = computed(() => {
  const current = currentMonthlyItem.value?.balance ?? summary.value.balance
  const previous = previousMonthlyItem.value?.balance

  if (!previous) return '較上月 --'

  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100)
  const sign = percent >= 0 ? '+' : ''
  return `較上月 ${sign}${percent}%`
})

const monthlyRows = computed(() => {
  const sameYear = monthly.value.filter((item) => item.month.startsWith(`${currentYear.value}-`))

  if (!sameYear.length) return monthly.value

  return sameYear
})

function displayCategoryName(name: string) {
  const map: Record<string, string> = {
    餐飲: '食品餐飲',
    交通: '交通出行',
    居家: '住房租金',
    娛樂: '娛樂休閒',
    工資: '薪資',
  }

  return map[name] || name
}

function prevPeriod() {
  month.value = tab.value === 'monthly'
    ? shiftMonth(month.value, -12)
    : shiftMonth(month.value, -1)
}

function nextPeriod() {
  month.value = tab.value === 'monthly'
    ? shiftMonth(month.value, 12)
    : shiftMonth(month.value, 1)
}

function formatMonthShort(value: string) {
  return `${Number(value.slice(5))}月`
}

function formatMoneyWithSign(value: number) {
  if (value > 0) return `+${money(value).replace('$', '$')}`
  if (value < 0) return `-${money(Math.abs(value)).replace('$', '$')}`
  return money(0)
}

function sumIncome(items: MonthlyStatItem[]): number {
  return items.reduce((sum, item) => sum + item.totalIncome, 0)
}

function sumExpense(items: MonthlyStatItem[]): number {
  return items.reduce((sum, item) => sum + item.totalExpense, 0)
}

function sumBalance(items: MonthlyStatItem[]): number {
  return items.reduce((sum, item) => sum + item.balance, 0)
}

async function fetchData() {
  loading.value = true

  try {
    const res = await recordsApi.list({ month: month.value, page: 1, pageSize: 100 })
    summary.value = res.summary
    records.value = res.data

    const cat = await statsApi.category(month.value, 'expense')
    categoryItems.value = cat.categories.slice(0, 5)

    const monthlyRes = await statsApi.monthly(month.value)

    if (monthlyRes.months.length) {
      monthly.value = monthlyRes.months.slice(0, 6)
    }
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    loading.value = false
  }
}

watch(month, fetchData)
onMounted(fetchData)
</script>

<template>
  <AppShell>
    <main class="stats-page" :class="tab === 'monthly' ? 'is-monthly-tab' : 'is-category-tab'">
      <header class="stats-title-row">
        <h1>統計分析</h1>
      </header>

      <section class="stats-toolbar">
        <div class="stat-tabs">
          <button :class="{ active: tab === 'category' }" @click="tab = 'category'">
            分類統計
          </button>
          <button :class="{ active: tab === 'monthly' }" @click="tab = 'monthly'">
            每月總覽
          </button>
        </div>

        <div class="period-control">
          <button class="period-button" @click="prevPeriod">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <strong>{{ tab === 'monthly' ? yearLabel : monthLabel }}</strong>
          <button class="period-button" @click="nextPeriod">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <template v-if="tab === 'category'">
        <section class="summary-grid">
          <article class="summary-card income">
            <span>本月收入</span>
            <strong>{{ money(summary.totalIncome) }}</strong>
            <small>共 {{ incomeCount }} 筆</small>
          </article>

          <article class="summary-card expense">
            <span>本月支出</span>
            <strong>{{ money(summary.totalExpense) }}</strong>
            <small>共 {{ expenseCount }} 筆</small>
          </article>

          <article class="summary-card balance">
            <span>本月結餘</span>
            <strong>{{ money(summary.balance) }}</strong>
            <small>{{ balanceCompareLabel }}</small>
          </article>
        </section>

        <section class="category-layout">
          <article class="stats-card category-card">
            <h2>支出分類佔比</h2>

            <div v-if="loading" class="loading-state">讀取中...</div>

            <div v-else class="donut-area">
              <div class="donut-chart" :style="donutStyle">
                <div class="donut-center">
                  <strong>{{ money(topCategory?.amount || 0) }}</strong>
                  <small>{{ topCategory?.categoryName || '食品餐飲' }}</small>
                </div>
              </div>

              <div class="category-legend">
                <div
                  v-for="(item, index) in normalizedCategoryItems"
                  :key="item.categoryId"
                  class="legend-row"
                >
                  <span class="legend-dot" :style="{ background: item.color }"></span>
                  <b>{{ item.categoryName }}</b>
                  <small>{{ Math.round(item.percentage) }}%</small>
                  <em>{{ money(item.amount) }}</em>
                </div>
              </div>
            </div>
          </article>

          <article class="stats-card rank-card">
            <h2>支出前五名</h2>

            <div v-if="loading" class="loading-state">讀取中...</div>

            <div v-else class="rank-list">
              <div
                v-for="(item, index) in normalizedCategoryItems"
                :key="item.categoryId"
                class="rank-row"
              >
                <span class="rank-index">{{ index + 1 }}</span>

                <div class="rank-main">
                  <div class="rank-line">
                    <strong>{{ item.categoryName }}</strong>
                    <em>{{ money(item.amount) }}</em>
                  </div>
                  <i class="rank-track">
                    <b
                      :style="{
                        width: `${Math.max(18, Math.round((item.amount / maxExpense) * 100))}%`,
                        background: item.color,
                      }"
                    ></b>
                  </i>
                </div>
              </div>
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <section class="monthly-layout">
          <article class="stats-card monthly-chart-card">
            <div class="card-head">
              <h2>收支趨勢</h2>
              <div class="half-year-control">
                <button>
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                <strong>上半年</strong>
                <button>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div class="chart-scale">
              <span>32K</span>
              <span>24K</span>
              <span>16K</span>
              <span>8K</span>
            </div>

            <div class="monthly-bars">
              <div v-for="item in monthlyRows.slice(0, 6)" :key="item.month" class="month-bar-group">
                <span
                  class="bar income"
                  :style="{ height: `${Math.max(8, item.totalIncome / 260)}px` }"
                ></span>
                <span
                  class="bar expense"
                  :style="{ height: `${Math.max(8, item.totalExpense / 260)}px` }"
                ></span>
                <small :class="{ active: item.month === month }">{{ formatMonthShort(item.month) }}</small>
              </div>
            </div>

            <div class="chart-legend">
              <span><i class="income"></i>收入</span>
              <span><i class="expense"></i>支出</span>
            </div>
          </article>

          <article class="stats-card monthly-table-card">
            <h2 class="desktop-table-title">每月明細</h2>
            <h2 class="mobile-table-title">最近紀錄</h2>

            <table>
              <thead>
                <tr>
                  <th>月份</th>
                  <th>收入</th>
                  <th>支出</th>
                  <th>結餘</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in monthlyRows.slice(0, 3)"
                  :key="item.month"
                  :class="{ active: item.month === month }"
                >
                  <td>
                    {{ formatMonthShort(item.month) }}
                    <b v-if="item.month === month">（當月）</b>
                  </td>
                  <td class="text-income">{{ money(item.totalIncome) }}</td>
                  <td class="text-expense">{{ money(item.totalExpense) }}</td>
                  <td class="text-primary">{{ formatMoneyWithSign(item.balance) }}</td>
                </tr>

                <tr class="total-row">
                  <td>合計</td>
                  <td class="text-income">{{ money(sumIncome(monthlyRows.slice(0, 3))) }}</td>
                  <td class="text-expense">{{ money(sumExpense(monthlyRows.slice(0, 3))) }}</td>
                  <td class="text-primary">{{ formatMoneyWithSign(sumBalance(monthlyRows.slice(0, 3))) }}</td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
      </template>
    </main>
  </AppShell>
</template>

<style scoped>
.stats-page {
  min-height: calc(100vh - var(--top-nav-height, 64px));
  padding: 32px;
  color: #111827;
}

.stats-title-row {
  margin-bottom: 22px;
}

.stats-title-row h1 {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.stats-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stat-tabs {
  width: 250px;
  height: 36px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
}

.stat-tabs button {
  background: #ffffff;
  color: #4b5563;
  font-size: 13px;
  font-weight: 800;
}

.stat-tabs button.active {
  background: #2563eb;
  color: #ffffff;
}

.period-control {
  display: flex;
  align-items: center;
  gap: 14px;
}

.period-control strong {
  min-width: 108px;
  text-align: center;
  color: #111827;
  font-size: 16px;
  line-height: 24px;
  font-weight: 800;
}

.period-button {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5563;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  height: 96px;
  padding: 20px 22px;
  border-radius: 10px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-card span {
  color: #4b5563;
  font-size: 13px;
  line-height: 18px;
  font-weight: 800;
}

.summary-card strong {
  margin-top: 6px;
  font-size: 26px;
  line-height: 32px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.summary-card small {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 16px;
}

.summary-card.income {
  border: 1.5px solid #10b981;
}

.summary-card.income strong {
  color: #10b981;
}

.summary-card.expense {
  border: 1.5px solid #ef4444;
}

.summary-card.expense strong {
  color: #ef4444;
}

.summary-card.balance {
  border: 1.5px solid #2563eb;
}

.summary-card.balance strong {
  color: #2563eb;
}

.category-layout,
.monthly-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.stats-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
}

.stats-card h2,
.card-head {
  height: 50px;
  margin: 0;
  padding: 0 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  color: #111827;
  font-size: 16px;
  line-height: 24px;
  font-weight: 800;
}

.card-head {
  justify-content: space-between;
}

.card-head h2 {
  height: auto;
  padding: 0;
  border: 0;
}

.donut-area {
  min-height: 230px;
  padding: 22px 18px 20px;
  display: grid;
  grid-template-columns: 190px 1fr;
  align-items: center;
  gap: 22px;
}

.donut-chart {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-chart::before {
  content: '';
  position: absolute;
  width: 82px;
  height: 82px;
  border-radius: 999px;
  background: #ffffff;
}

.donut-center {
  position: relative;
  z-index: 1;
  text-align: center;
}

.donut-center strong {
  display: block;
  color: #ef4444;
  font-size: 14px;
  line-height: 20px;
  font-weight: 900;
}

.donut-center small {
  display: block;
  color: #6b7280;
  font-size: 11px;
  line-height: 16px;
}

.category-legend {
  display: flex;
  flex-direction: column;
}

.legend-row {
  min-height: 34px;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 12px 1fr 42px 76px;
  align-items: center;
  gap: 8px;
}

.legend-row:last-child {
  border-bottom: 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-row b {
  color: #111827;
  font-size: 13px;
  line-height: 20px;
  font-weight: 800;
}

.legend-row small {
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}

.legend-row em {
  color: #ef4444;
  font-style: normal;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.rank-list {
  min-height: 230px;
  padding: 14px 18px 12px;
}

.rank-row {
  min-height: 42px;
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.rank-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  line-height: 16px;
  font-weight: 900;
}

.rank-row:nth-child(n + 4) .rank-index {
  background: #f3f4f6;
  color: #6b7280;
}

.rank-main {
  min-width: 0;
}

.rank-line {
  margin-bottom: 7px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rank-line strong {
  color: #111827;
  font-size: 13px;
  line-height: 18px;
  font-weight: 800;
}

.rank-line em {
  color: #ef4444;
  font-style: normal;
  font-size: 13px;
  line-height: 18px;
  font-weight: 900;
}

.rank-track {
  height: 5px;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: #f3f4f6;
}

.rank-track b {
  height: 100%;
  display: block;
  border-radius: 999px;
}

.monthly-chart-card {
  position: relative;
  min-height: 350px;
}

.half-year-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.half-year-control button {
  width: 28px;
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #ffffff;
  color: #6b7280;
}

.half-year-control strong {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.chart-scale {
  position: absolute;
  left: 20px;
  top: 82px;
  bottom: 94px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #9ca3af;
  font-size: 12px;
}

.monthly-bars {
  height: 220px;
  margin: 28px 18px 0 52px;
  padding-right: 8px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: end;
  gap: 20px;
  background:
    linear-gradient(to bottom, transparent 0, transparent 24%, #f3f4f6 24.5%, transparent 25%),
    linear-gradient(to bottom, transparent 0, transparent 49%, #f3f4f6 49.5%, transparent 50%),
    linear-gradient(to bottom, transparent 0, transparent 74%, #f3f4f6 74.5%, transparent 75%);
}

.month-bar-group {
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.bar {
  width: 28px;
  border-radius: 5px 5px 0 0;
}

.bar.income {
  background: #d1fae5;
}

.bar.expense {
  background: #fee2e2;
}

.month-bar-group small {
  position: absolute;
  bottom: -28px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
}

.month-bar-group small.active {
  color: #2563eb;
  font-weight: 900;
}

.chart-legend {
  height: 54px;
  padding: 30px 18px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #111827;
  font-size: 12px;
  font-weight: 800;
}

.chart-legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.chart-legend i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.chart-legend i.income {
  background: #d1fae5;
}

.chart-legend i.expense {
  background: #fee2e2;
}

.monthly-table-card table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.monthly-table-card th,
.monthly-table-card td {
  height: 43px;
  padding: 0 18px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
}

.monthly-table-card th {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.monthly-table-card tr.active {
  background: #dbeafe;
}

.monthly-table-card tr.total-row {
  background: #f9fafb;
  font-weight: 900;
}

.monthly-table-card tbody tr:last-child td {
  border-bottom: 0;
}

.text-income {
  color: #10b981;
  font-weight: 800;
}

.text-expense {
  color: #ef4444;
  font-weight: 800;
}

.text-primary {
  color: #2563eb;
  font-weight: 800;
}

.mobile-table-title {
  display: none !important;
}

.loading-state {
  min-height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 700;
}
@media (max-width: 480px) {
  .stats-page {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    padding: 18px 16px 96px !important;
  }

  .stats-title-row {
    margin-bottom: 16px !important;
  }

  .stats-title-row h1 {
    font-size: 24px !important;
    line-height: 32px !important;
    font-weight: 900 !important;
    letter-spacing: -0.02em !important;
  }

  .stats-toolbar {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
    margin-bottom: 12px !important;
  }

  .stat-tabs {
    width: 100% !important;
    height: 36px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    border-radius: 7px !important;
    overflow: hidden !important;
  }

  .stat-tabs button {
    min-width: 0 !important;
    height: 36px !important;
    font-size: 13px !important;
    line-height: 20px !important;
    font-weight: 800 !important;
    white-space: nowrap !important;
  }

  .period-control {
    width: 100% !important;
    height: 36px !important;
    display: grid !important;
    grid-template-columns: 32px 1fr 32px !important;
    align-items: center !important;
    gap: 0 !important;
    margin: 0 !important;
  }

  .period-control strong {
    min-width: 0 !important;
    text-align: center !important;
    font-size: 14px !important;
    line-height: 20px !important;
    font-weight: 900 !important;
    white-space: nowrap !important;
  }

  .period-button {
    width: 28px !important;
    height: 28px !important;
    border-radius: 7px !important;
  }

  /* =========================
     分類統計 mobile 專用
  ========================= */
  .stats-page.is-category-tab .summary-grid {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin-bottom: 14px !important;
    overflow: visible !important;
  }

  .stats-page.is-category-tab .summary-card {
    width: 100% !important;
    min-width: 0 !important;
    height: 70px !important;
    padding: 12px 18px !important;
    border-radius: 10px !important;
  }

  .stats-page.is-category-tab .summary-card.balance,
  .stats-page.is-category-tab .summary-card.primary {
    grid-column: 1 / -1 !important;
  }

  .stats-page.is-category-tab .summary-card span {
    font-size: 12px !important;
    line-height: 18px !important;
    font-weight: 800 !important;
  }

  .stats-page.is-category-tab .summary-card strong {
    margin-top: 2px !important;
    font-size: 20px !important;
    line-height: 26px !important;
    font-weight: 900 !important;
  }

  .stats-page.is-category-tab .summary-card small {
    font-size: 11px !important;
    line-height: 16px !important;
  }

  .stats-page.is-category-tab .category-layout {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 12px !important;
    overflow: visible !important;
  }

  .stats-page.is-category-tab .category-card,
  .stats-page.is-category-tab .rank-card {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }

  .stats-page.is-category-tab .category-card h2,
  .stats-page.is-category-tab .rank-card h2,
  .stats-page.is-category-tab .card-head {
    height: 44px !important;
    padding: 0 14px !important;
    display: flex !important;
    align-items: center !important;
    font-size: 14px !important;
    line-height: 22px !important;
    font-weight: 900 !important;
    border-bottom: 1px solid #e5e7eb !important;
  }

  .stats-page.is-category-tab .donut-area {
    width: 100% !important;
    padding: 22px 14px 16px !important;
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 18px !important;
  }

  .stats-page.is-category-tab .donut-chart {
    width: 134px !important;
    height: 134px !important;
    margin: 24px auto 18px !important;
  }

  .stats-page.is-category-tab .donut-chart::before {
    width: 78px !important;
    height: 78px !important;
  }

  .stats-page.is-category-tab .donut-center strong {
    font-size: 14px !important;
    line-height: 20px !important;
  }

  .stats-page.is-category-tab .donut-center small {
    font-size: 11px !important;
    line-height: 16px !important;
  }

  .stats-page.is-category-tab .category-legend {
    width: 100% !important;
  }

  .stats-page.is-category-tab .legend-row {
    min-height: 32px !important;
    display: grid !important;
    grid-template-columns: 12px 1fr 38px 74px !important;
    gap: 7px !important;
    align-items: center !important;
  }

  .stats-page.is-category-tab .legend-row b,
  .stats-page.is-category-tab .legend-row em {
    font-size: 12px !important;
    line-height: 18px !important;
  }

  .stats-page.is-category-tab .legend-row small {
    font-size: 11px !important;
    line-height: 16px !important;
  }

  .stats-page.is-category-tab .rank-list {
    padding: 12px 14px 14px !important;
  }

  .stats-page.is-category-tab .rank-row {
    min-height: 46px !important;
    display: grid !important;
    grid-template-columns: 24px 1fr !important;
    gap: 10px !important;
    align-items: center !important;
    margin-bottom: 8px !important;
  }

  .stats-page.is-category-tab .rank-line {
    min-width: 0 !important;
  }

  .stats-page.is-category-tab .rank-line strong {
    font-size: 12px !important;
    line-height: 18px !important;
  }

  .stats-page.is-category-tab .rank-line em {
    font-size: 12px !important;
    line-height: 18px !important;
  }

  .stats-page.is-category-tab .rank-track {
    height: 5px !important;
    border-radius: 999px !important;
  }

  /* =========================
     每月總覽 mobile 專用
  ========================= */
  .stats-page.is-monthly-tab .summary-grid {
    display: none !important;
  }

  .stats-page.is-monthly-tab .monthly-layout {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 12px !important;
    overflow: visible !important;
  }

  .stats-page.is-monthly-tab .monthly-chart-card,
  .stats-page.is-monthly-tab .monthly-table-card {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }

  .stats-page.is-monthly-tab .monthly-chart-card {
    height: 270px !important;
    min-height: 270px !important;
  }

  .stats-page.is-monthly-tab .monthly-chart-card .card-head {
    height: 40px !important;
    padding: 0 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 1px solid #e5e7eb !important;
  }

  .stats-page.is-monthly-tab .monthly-chart-card .card-head h2 {
    font-size: 13px !important;
    line-height: 20px !important;
    font-weight: 900 !important;
    white-space: nowrap !important;
    writing-mode: horizontal-tb !important;
  }

  .stats-page.is-monthly-tab .half-year-control {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  .stats-page.is-monthly-tab .half-year-control button {
    width: 26px !important;
    height: 26px !important;
    border-radius: 7px !important;
  }

  .stats-page.is-monthly-tab .half-year-control strong {
    font-size: 13px !important;
    line-height: 20px !important;
    font-weight: 900 !important;
    white-space: nowrap !important;
  }

  .stats-page.is-monthly-tab .chart-scale {
    position: absolute !important;
    left: 12px !important;
    top: 72px !important;
    height: 112px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    color: #9ca3af !important;
    font-size: 11px !important;
    line-height: 14px !important;
  }

  .stats-page.is-monthly-tab .monthly-bars {
    width: auto !important;
    height: 126px !important;
    margin: 22px 12px 28px 40px !important;
    padding: 0 !important;
    display: grid !important;
    grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
    align-items: end !important;
    gap: 5px !important;
    overflow: visible !important;
  }

  .stats-page.is-monthly-tab .month-bar-group {
    height: 126px !important;
    position: relative !important;
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    gap: 4px !important;
  }

  .stats-page.is-monthly-tab .bar {
    width: 17px !important;
    max-height: 104px !important;
    border-radius: 5px 5px 0 0 !important;
  }

  .stats-page.is-monthly-tab .month-bar-group small {
    position: absolute !important;
    bottom: -22px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    font-size: 11px !important;
    line-height: 14px !important;
    font-weight: 700 !important;
    color: #9ca3af !important;
    white-space: nowrap !important;
  }

  .stats-page.is-monthly-tab .month-bar-group small.active {
    color: #2563eb !important;
    font-weight: 900 !important;
  }

  .stats-page.is-monthly-tab .chart-legend {
    height: 34px !important;
    padding: 0 12px !important;
    margin: 0 !important;
    display: flex !important;
    align-items: center !important;
    gap: 16px !important;
    border-top: 1px solid #f3f4f6 !important;
    font-size: 12px !important;
    line-height: 18px !important;
    font-weight: 800 !important;
  }

  .stats-page.is-monthly-tab .chart-legend span {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    white-space: nowrap !important;
  }

  .stats-page.is-monthly-tab .chart-legend i {
    width: 10px !important;
    height: 10px !important;
    border-radius: 3px !important;
  }

  .stats-page.is-monthly-tab .desktop-table-title {
    display: none !important;
  }

  .stats-page.is-monthly-tab .mobile-table-title {
    display: flex !important;
    height: 42px !important;
    padding: 0 14px !important;
    align-items: center !important;
    font-size: 14px !important;
    line-height: 22px !important;
    font-weight: 900 !important;
    border-bottom: 1px solid #e5e7eb !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card table {
    width: 100% !important;
    table-layout: fixed !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card th,
  .stats-page.is-monthly-tab .monthly-table-card td {
    height: 34px !important;
    padding: 0 10px !important;
    font-size: 12px !important;
    line-height: 18px !important;
    white-space: nowrap !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card th {
    color: #6b7280 !important;
    font-weight: 800 !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card td {
    font-weight: 700 !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card td:first-child,
  .stats-page.is-monthly-tab .monthly-table-card th:first-child {
    width: 24% !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card td:not(:first-child),
  .stats-page.is-monthly-tab .monthly-table-card th:not(:first-child) {
    text-align: center !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card tr.active {
    background: #dbeafe !important;
  }

  .stats-page.is-monthly-tab .monthly-table-card tr.total-row {
    background: #f9fafb !important;
    font-weight: 900 !important;
  }
}
</style>
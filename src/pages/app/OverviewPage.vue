<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import FabButton from '@/components/layout/FabButton.vue'
import RecordModal from '@/components/records/RecordModal.vue'
import { recordsApi } from '@/api/records.api'
import { useCategoriesStore } from '@/stores/categories.store'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'
import { formatMonthLabel, shiftMonth } from '@/utils/date'
import { money, signedMoney } from '@/utils/format'
import type { FinanceRecord, RecordPayload, RecordSummary } from '@/types/record'

const categories = useCategoriesStore()
const toast = useToastStore()

// 先固定成 Figma 的 2026 年 3 月，方便對版
const month = ref('2026-03')

const loading = ref(true)
const submitLoading = ref(false)
const records = ref<FinanceRecord[]>([])
const summary = ref<RecordSummary>({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
})
const balanceCompareText = computed(() => {
  const currentBalance = summary.value.balance
  const previousBalance = previousSummary.value.balance

  if (previousBalance === 0) {
    if (currentBalance === 0) return '較上月 0%'
    return '較上月 --'
  }

  const percent = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100
  const rounded = Math.round(percent)
  const sign = rounded > 0 ? '+' : ''

  return `較上月 ${sign}${rounded}%`
})
const previousSummary = ref<RecordSummary>({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
})
const modalOpen = ref(false)

const visibleRecords = computed(() => {
  return records.value.filter((r) => !(r.note || '').includes('統計'))
})

const hasRecords = computed(() => visibleRecords.value.length > 0)

const recentRecords = computed(() => {
  return visibleRecords.value.slice(0, 6)
})

const incomeCount = computed(() => {
  return records.value.filter((r) => r.type === 'income').length
})

const expenseCount = computed(() => {
  return records.value.filter((r) => r.type === 'expense').length
})

const weeklyBars = [
  { d: '一', income: 126, expense: 74 },
  { d: '二', income: 50, expense: 108 },
  { d: '三', income: 148, expense: 40 },
  { d: '四', income: 82, expense: 126 },
  { d: '五', income: 138, expense: 82 },
  { d: '六', income: 34, expense: 148 },
  { d: '日', income: 74, expense: 58 },
]

function prevMonth() {
  month.value = shiftMonth(month.value, -1)
}

function nextMonth() {
  month.value = shiftMonth(month.value, 1)
}

async function fetchData() {
  loading.value = true

  try {
    if (!categories.all.length) {
      await categories.fetchCategories()
    }

    const previousMonth = shiftMonth(month.value, -1)

    const [currentResponse, previousResponse] = await Promise.all([
      recordsApi.list({
        month: month.value,
        page: 1,
        pageSize: 30,
      }),
      recordsApi.list({
        month: previousMonth,
        page: 1,
        pageSize: 1,
      }),
    ])

    records.value = currentResponse.data
    summary.value = currentResponse.summary
    previousSummary.value = previousResponse.summary
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    loading.value = false
  }
}

async function saveRecord(payload: RecordPayload) {
  submitLoading.value = true

  try {
    await recordsApi.create(payload)
    toast.success('已新增紀錄')
    modalOpen.value = false
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    submitLoading.value = false
  }
}

watch(month, fetchData)
onMounted(fetchData)
</script>

<template>
  <AppShell>
    <div class="overview-page">
      <header class="overview-header">
        <div>
          <h1>月份總覽</h1>
        </div>

        <button class="primary-btn desktop-only" @click="modalOpen = true">
          <i class="fa-solid fa-plus"></i>
          新增紀錄
        </button>
      </header>

      <div class="month-row">
        <button class="icon-button" @click="prevMonth">
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <strong>{{ formatMonthLabel(month) }}</strong>

        <button class="icon-button" @click="nextMonth">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <section class="summary-grid">
        <article class="summary-card income">
          <span>
            <i class="fa-solid fa-arrow-up"></i>
            本月收入
          </span>
          <strong>{{ money(summary.totalIncome) }}</strong>
          <small>共 {{ incomeCount }} 筆</small>
        </article>

        <article class="summary-card expense">
          <span>
            <i class="fa-solid fa-arrow-down"></i>
            本月支出
          </span>
          <strong>{{ money(summary.totalExpense) }}</strong>
          <small>共 {{ expenseCount }} 筆</small>
        </article>

        <article class="summary-card primary">
          <span>本月結餘</span>
          <strong>{{ money(summary.balance) }}</strong>
          <small>{{ balanceCompareText }}</small>
        </article>
      </section>

      <!-- Figma 空白狀態：一張大卡片 -->
      <section v-if="!loading && !hasRecords" class="empty-card">
        <i class="fa-regular fa-clipboard"></i>
        <strong>這個月還沒有任何紀錄</strong>
        <p>點擊「新增紀錄」開始記錄您的收支</p>
        <button class="primary-btn" @click="modalOpen = true">
          <i class="fa-solid fa-plus"></i>
          新增第一筆紀錄
        </button>
      </section>

      <!-- 有資料狀態 -->
      <section v-else class="overview-grid">
        <article class="card chart-panel">
          <div class="panel-head">
            <h2>每週收支趨勢</h2>

            <div class="week-nav">
              <button>
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <strong>3/1 – 3/7</strong>
              <button>
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>

          <div class="pair-chart">
            <div v-for="bar in weeklyBars" :key="bar.d" class="pair-col">
              <div class="pair-bars">
                <span class="income" :style="{ height: bar.income + 'px' }"></span>
                <span class="expense" :style="{ height: bar.expense + 'px' }"></span>
              </div>
              <small>{{ bar.d }}</small>
            </div>
          </div>

          <div class="legend">
            <span><i class="green"></i>收入</span>
            <span><i class="red"></i>支出</span>
          </div>
        </article>

        <article class="card recent-panel">
          <div class="panel-head">
            <h2>最近紀錄</h2>
            <RouterLink to="/app/records">查看全部</RouterLink>
          </div>

          <div class="recent-list">
            <div v-for="record in recentRecords" :key="record.id" class="recent-row">
              <span class="recent-icon" :class="record.type">
                <i :class="record.type === 'income' ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"></i>
              </span>

              <div class="recent-info">
                <strong>{{ record.note || record.categoryName }}</strong>
                <small>
                  <i class="fa-solid fa-tag"></i>
                  {{ record.categoryName }}
                </small>
              </div>

              <div class="recent-money">
                <b :class="record.type === 'income' ? 'money-income' : 'money-expense'">
                  {{ signedMoney(record.type === 'income' ? record.amount : -record.amount) }}
                </b>
                <em>{{ record.date.slice(5).replace('-', '/') }}</em>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>

    <FabButton @click="modalOpen = true" />

    <RecordModal
      :open="modalOpen"
      :categories="categories.all"
      :loading="submitLoading"
      @close="modalOpen = false"
      @save="saveRecord"
    />
  </AppShell>
</template>

<style scoped>
.overview-page {
  padding: 28px 32px 36px;
  min-height: calc(100vh - 56px);
}

.overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.overview-header h1 {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.03em;
}

.month-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.month-row strong {
  font-size: 15px;
  line-height: 22px;
  font-weight: 700;
  color: #111827;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  height: 96px;
  padding: 16px 18px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-card.income {
  border: 1.5px solid #10b981;
}

.summary-card.expense {
  border: 1.5px solid #ef4444;
}

.summary-card.primary {
  border: 1.5px solid #2563eb;
}

.summary-card span {
  color: #4b5563;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-card strong {
  margin-top: 6px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 800;
}

.summary-card small {
  margin-top: 1px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 18px;
}

.summary-card.income strong {
  color: #10b981;
}

.summary-card.expense strong {
  color: #ef4444;
}

.summary-card.primary strong {
  color: #2563eb;
}

.overview-grid {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 14px;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
  overflow: hidden;
}

.chart-panel,
.recent-panel {
  height: 292px;
}

.panel-head {
  height: 46px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}

.panel-head h2 {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: #111827;
}

.panel-head a {
  color: #2563eb;
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: #111827;
}

.week-nav button {
  width: 28px;
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #ffffff;
  color: #6b7280;
}

.pair-chart {
  height: 198px;
  padding: 28px 18px 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 14px;
  align-items: end;
}

.pair-col {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.pair-bars {
  height: 144px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.pair-bars span {
  width: 30px;
  border-radius: 5px 5px 0 0;
  display: block;
}

.pair-bars .income {
  background: #cff8e3;
}

.pair-bars .expense {
  background: #fee0e0;
}

.pair-col small {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
}

.legend {
  display: flex;
  gap: 16px;
  padding: 0 18px 14px;
  font-size: 12px;
  font-weight: 700;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: block;
}

.legend .green {
  background: #d1fae5;
}

.legend .red {
  background: #fee2e2;
}

.recent-list {
  padding: 0 18px 8px;
}

.recent-row {
  height: 41px;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
}

.recent-row:last-child {
  border-bottom: 0;
}

.recent-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.recent-icon.income {
  background: #d1fae5;
  color: #10b981;
}

.recent-icon.expense {
  background: #fee2e2;
  color: #ef4444;
}

.recent-info strong {
  display: block;
  font-size: 13px;
  line-height: 18px;
  color: #111827;
  font-weight: 700;
}

.recent-info small {
  margin-top: 1px;
  font-size: 11px;
  line-height: 16px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 5px;
}

.recent-money {
  min-width: 74px;
  text-align: right;
}

.recent-money b {
  display: block;
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
}

.recent-money em {
  display: block;
  margin-top: 1px;
  font-style: normal;
  color: #9ca3af;
  font-size: 11px;
  line-height: 16px;
}

.empty-card {
  height: 410px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  text-align: center;
}

.empty-card > i {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #9ca3af;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.empty-card strong {
  color: #111827;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
}

.empty-card p {
  margin: 8px 0 16px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 20px;
}

@media (min-width: 481px) and (max-width: 1024px) {
  .overview-page {
    padding: 24px 20px 32px;
  }

  .overview-header {
    margin-bottom: 16px;
  }

  .overview-header h1 {
    font-size: 26px;
    line-height: 34px;
  }

  .month-row {
    margin-bottom: 18px;
  }

  .summary-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .summary-card {
    height: 84px;
    padding: 14px 16px;
  }

  .summary-card strong {
    font-size: 22px;
    line-height: 30px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .chart-panel {
    height: 300px;
  }

  .recent-panel {
    height: auto;
  }

  .pair-chart {
    height: 202px;
    padding: 26px 18px 0;
  }

  .pair-bars {
    height: 132px;
    gap: 10px;
  }

  .pair-bars span {
    width: 24px;
    max-height: 132px;
  }

  .recent-row {
    height: 54px;
  }

  .empty-card {
    height: 430px;
  }
}

@media (max-width: 480px) {
  .overview-page {
    position: relative;
    padding: 18px 16px 96px;
  }

  .overview-header {
    margin-bottom: 18px;
  }

  .overview-header h1 {
    font-size: 24px;
    line-height: 32px;
  }

  .month-row {
    position: absolute;
    top: 18px;
    right: 16px;
    margin-bottom: 0;
    gap: 8px;
  }

  .month-row .icon-button {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .month-row strong {
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .summary-card {
    height: 70px;
    padding: 11px 14px;
    border-radius: 10px;
  }

  .summary-card.primary {
    grid-column: 1 / 3;
  }

  .summary-card span {
    font-size: 12px;
    line-height: 18px;
  }

  .summary-card strong {
    margin-top: 3px;
    font-size: 20px;
    line-height: 26px;
  }

  .summary-card small {
    margin-top: 0;
    font-size: 11px;
    line-height: 16px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .chart-panel {
    height: 190px;
    overflow: hidden;
  }

  .recent-panel {
    height: auto;
    overflow: hidden;
  }

  .panel-head {
    height: 42px;
    padding: 0 12px;
  }

  .panel-head h2 {
    font-size: 15px;
    line-height: 22px;
  }

  .week-nav {
    gap: 8px;
    font-size: 12px;
  }

  .week-nav button {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .pair-chart {
    height: 102px;
    padding: 12px 12px 0;
    gap: 8px;
  }

  .pair-col {
    gap: 7px;
  }

  .pair-bars {
    height: 76px;
    gap: 6px;
  }

  .pair-bars span {
    width: 14px;
    max-height: 76px;
    border-radius: 4px 4px 0 0;
  }

  .pair-col small {
    font-size: 11px;
    line-height: 16px;
  }

  .legend {
    padding: 0 12px 10px;
    gap: 14px;
    font-size: 12px;
  }

  .recent-list {
    padding: 0 14px 8px;
  }

  .recent-row {
    height: 54px;
    grid-template-columns: 36px 1fr auto;
    gap: 10px;
  }

  .recent-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }

  .recent-info strong {
    font-size: 13px;
    line-height: 18px;
  }

  .recent-info small {
    font-size: 11px;
    line-height: 16px;
  }

  .recent-money {
    min-width: 72px;
  }

  .recent-money b {
    font-size: 13px;
    line-height: 18px;
  }

  .recent-money em {
    font-size: 11px;
    line-height: 16px;
  }

  .empty-card {
    height: 488px;
  }
}
</style>
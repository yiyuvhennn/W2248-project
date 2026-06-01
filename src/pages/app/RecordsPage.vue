from pathlib import Path

records_vue = r'''<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import RecordModal from '@/components/records/RecordModal.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { recordsApi } from '@/api/records.api'
import { useCategoriesStore } from '@/stores/categories.store'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'
import { signedMoney } from '@/utils/format'
import type { FinanceRecord, RecordPayload, RecordType } from '@/types/record'

type DropdownName = 'type' | 'category' | 'month' | null

const categories = useCategoriesStore()
const toast = useToastStore()

const month = ref('2026-03')
const type = ref<RecordType | ''>('')
const categoryId = ref('')
const keyword = ref('')
const page = ref(1)

const loading = ref(false)
const submitLoading = ref(false)
const records = ref<FinanceRecord[]>([])
const modalOpen = ref(false)
const editing = ref<FinanceRecord | null>(null)
const deleting = ref<FinanceRecord | null>(null)
const filterOpen = ref(false)
const openDropdown = ref<DropdownName>(null)

const pageSize = 10
const currentYear = computed(() => Number(month.value.slice(0, 4)))
const currentMonthNumber = computed(() => Number(month.value.slice(5, 7)))

const typeOptions: Array<{ value: RecordType | ''; label: string; dot: string }> = [
  { value: '', label: '全部', dot: 'blue' },
  { value: 'income', label: '收入', dot: 'green' },
  { value: 'expense', label: '支出', dot: 'red' },
]

const visibleRecords = computed(() => {
  return records.value.filter((record) => !(record.note || '').includes('統計'))
})

const filtered = computed(() => {
  const key = keyword.value.trim().toLowerCase()

  if (!key) return visibleRecords.value

  return visibleRecords.value.filter((record) => {
    return `${record.note || ''}${record.categoryName}${record.amount}`.toLowerCase().includes(key)
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filtered.value.length / pageSize))
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

const grouped = computed(() => {
  const map = new Map<string, FinanceRecord[]>()

  pagedRecords.value.forEach((record) => {
    if (!map.has(record.date)) {
      map.set(record.date, [])
    }

    map.get(record.date)!.push(record)
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
})

const selectedTypeLabel = computed(() => {
  return typeOptions.find((item) => item.value === type.value)?.label || '全部類型'
})

const selectedCategoryLabel = computed(() => {
  if (!categoryId.value) return '全部分類'
  return categories.all.find((item) => item.id === categoryId.value)?.name || '全部分類'
})

const monthButtonLabel = computed(() => {
  return `${currentYear.value}年${currentMonthNumber.value}月`
})

const mobileMonthLabel = computed(() => {
  return `${currentMonthNumber.value}月`
})

const yearMonths = computed(() => {
  return Array.from({ length: 12 }, (_, index) => {
    const value = `${currentYear.value}-${String(index + 1).padStart(2, '0')}`
    return {
      value,
      label: `${index + 1}月`,
      active: value === month.value,
    }
  })
})

function categoryEmoji(name?: string) {
  const map: Record<string, string> = {
    食品餐飲: '🍔',
    餐飲: '🍔',
    交通出行: '🚌',
    交通: '🚌',
    住房租金: '🏠',
    居家: '🏠',
    娛樂休閒: '🎮',
    娛樂: '🎮',
    薪資: '⚡',
    工資: '⚡',
    購物: '🛒',
    獎金: '🎁',
    其他收入: '🎁',
    醫療: '💊',
    教育: '📚',
    旅遊: '✈️',
    咖啡: '☕',
    音樂: '🎵',
    運動: '🏋️',
  }

  if (!name) return '🧾'
  return map[name] || '🧾'
}

function getRecordEmoji(record: FinanceRecord) {
  const category = categories.all.find((item) => item.id === record.categoryId)
  return categoryEmoji(category?.name || record.categoryName)
}

function recordTime(record: FinanceRecord) {
  return record.type === 'income' ? '08:00' : '14:20'
}

function dateTitle(date: string) {
  const [year, monthValue, dayValue] = date.split('-')
  const monthNumber = Number(monthValue)
  const dayNumber = Number(dayValue)

  if (date === '2026-03-06') {
    return `${year}年${monthNumber}月${dayNumber}日（今天）`
  }

  return `${year}年${monthNumber}月${dayNumber}日`
}

function toggleDropdown(name: Exclude<DropdownName, null>) {
  openDropdown.value = openDropdown.value === name ? null : name
}

function closeDropdowns() {
  openDropdown.value = null
}

function selectType(nextType: RecordType | '') {
  type.value = nextType
  openDropdown.value = null
}

function selectCategory(nextCategoryId: string) {
  categoryId.value = nextCategoryId
  openDropdown.value = null
}

function selectMonth(nextMonth: string) {
  month.value = nextMonth
  openDropdown.value = null
}

function shiftYear(step: number) {
  const nextYear = currentYear.value + step
  month.value = `${nextYear}-${String(currentMonthNumber.value).padStart(2, '0')}`
}

async function fetchData() {
  loading.value = true

  try {
    if (!categories.all.length) {
      await categories.fetchCategories()
    }

    const response = await recordsApi.list({
      month: month.value,
      type: type.value,
      categoryId: categoryId.value,
      page: 1,
      pageSize: 100,
    })

    records.value = response.data
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    loading.value = false
  }
}

function openEdit(record: FinanceRecord) {
  editing.value = record
  modalOpen.value = true
}

function openCreate() {
  editing.value = null
  modalOpen.value = true
}

async function saveRecord(payload: RecordPayload) {
  submitLoading.value = true

  try {
    if (editing.value) {
      await recordsApi.update(editing.value.id, payload)
      toast.success('已更新紀錄')
    } else {
      await recordsApi.create(payload)
      toast.success('已新增紀錄')
    }

    modalOpen.value = false
    editing.value = null
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  } finally {
    submitLoading.value = false
  }
}

async function confirmDelete() {
  if (!deleting.value) return

  try {
    await recordsApi.remove(deleting.value.id)
    toast.success('已刪除紀錄')
    deleting.value = null
    await fetchData()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

function exportCsv() {
  toast.info('已依目前篩選產生匯出資料')
}

function closeFilter() {
  filterOpen.value = false
}

function resetFilter() {
  keyword.value = ''
  type.value = ''
  categoryId.value = ''
  month.value = '2026-03'
  page.value = 1
}

function goPage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), totalPages.value)
}

watch([month, type, categoryId], () => {
  page.value = 1
  fetchData()
})

watch(keyword, () => {
  page.value = 1
})

watch(totalPages, () => {
  if (page.value > totalPages.value) {
    page.value = totalPages.value
  }
})

onMounted(fetchData)
</script>

<template>
  <AppShell>
    <div class="records-page" @click="closeDropdowns">
      <header class="records-header">
        <h1>記帳紀錄</h1>

        <div class="records-actions">
          <button class="secondary-btn" @click.stop="exportCsv">
            <i class="fa-solid fa-download"></i>
            匯出
          </button>

          <button class="primary-btn" @click.stop="openCreate">
            <i class="fa-solid fa-plus"></i>
            新增紀錄
          </button>
        </div>

        <button class="mobile-filter-btn" @click.stop="filterOpen = true">
          <i class="fa-solid fa-filter"></i>
          篩選
        </button>
      </header>

      <section class="filter-row">
        <label class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input v-model="keyword" placeholder="搜尋紀錄名稱..." />
        </label>

        <div class="filter-item" @click.stop>
          <button
            class="filter-trigger"
            :class="{ active: openDropdown === 'type' || type }"
            @click="toggleDropdown('type')"
          >
            <i class="fa-solid fa-filter"></i>
            {{ selectedTypeLabel }}
            <i class="fa-solid fa-chevron-down chevron"></i>
          </button>

          <div v-if="openDropdown === 'type'" class="dropdown-panel type-panel">
            <button
              v-for="option in typeOptions"
              :key="option.label"
              class="type-option"
              :class="{ active: type === option.value }"
              @click="selectType(option.value)"
            >
              <span class="dot" :class="option.dot"></span>
              {{ option.label }}
              <i v-if="type === option.value" class="fa-solid fa-check"></i>
            </button>
          </div>
        </div>

        <div class="filter-item" @click.stop>
          <button
            class="filter-trigger"
            :class="{ active: openDropdown === 'category' || categoryId }"
            @click="toggleDropdown('category')"
          >
            <i class="fa-solid fa-filter"></i>
            {{ selectedCategoryLabel }}
            <i class="fa-solid fa-chevron-down chevron"></i>
          </button>

          <div v-if="openDropdown === 'category'" class="dropdown-panel category-panel">
            <p>選擇分類</p>

            <div class="category-chip-list">
              <button
                class="category-chip"
                :class="{ active: !categoryId }"
                @click="selectCategory('')"
              >
                全部
              </button>

              <button
                v-for="category in categories.all"
                :key="category.id"
                class="category-chip"
                :class="{ active: categoryId === category.id }"
                @click="selectCategory(category.id)"
              >
                <span>{{ categoryEmoji(category.name) }}</span>
                {{ category.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="filter-item" @click.stop>
          <button
            class="filter-trigger month-trigger"
            :class="{ active: openDropdown === 'month' }"
            @click="toggleDropdown('month')"
          >
            <i class="fa-solid fa-filter"></i>
            {{ monthButtonLabel }}
            <i class="fa-regular fa-calendar calendar-icon"></i>
          </button>

          <div v-if="openDropdown === 'month'" class="dropdown-panel month-panel">
            <div class="month-panel-head">
              <button @click="shiftYear(-1)">
                <i class="fa-solid fa-chevron-left"></i>
              </button>
              <strong>{{ currentYear }} 年</strong>
              <button @click="shiftYear(1)">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            <div class="month-grid">
              <button
                v-for="item in yearMonths"
                :key="item.value"
                :class="{ active: item.active }"
                @click="selectMonth(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="record-table">
        <div v-if="loading" class="table-empty">
          讀取中...
        </div>

        <div v-else-if="!grouped.length" class="table-empty">
          <i class="fa-regular fa-clipboard"></i>
          <strong>這個月還沒有任何紀錄</strong>
          <p>點擊「新增紀錄」開始記錄您的收支</p>
          <button class="primary-btn" @click.stop="openCreate">
            <i class="fa-solid fa-plus"></i>
            新增第一筆紀錄
          </button>
        </div>

        <template v-else>
          <div v-for="group in grouped" :key="group.date" class="date-group">
            <div class="date-head">
              {{ dateTitle(group.date) }}
            </div>

            <div
              v-for="record in group.items"
              :key="record.id"
              class="record-row"
            >
              <span class="category-icon" :class="record.type">
                {{ getRecordEmoji(record) }}
              </span>

              <div class="record-meta">
                <strong>{{ record.note || record.categoryName }}</strong>
                <small>{{ record.categoryName }}</small>
              </div>

              <div class="record-money">
                <b :class="record.type === 'income' ? 'money-income' : 'money-expense'">
                  {{ signedMoney(record.type === 'income' ? record.amount : -record.amount) }}
                </b>
                <small>{{ recordTime(record) }}</small>
              </div>

              <button class="mini-action edit-action" @click.stop="openEdit(record)">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="mini-action delete" @click.stop="deleting = record">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          <footer class="table-footer">
            <span>共 {{ filtered.length }} 筆</span>

            <div class="pagination">
              <button :disabled="page === 1" @click="goPage(page - 1)">
                <i class="fa-solid fa-chevron-left"></i>
              </button>

              <button
                v-for="pageNumber in totalPages"
                :key="pageNumber"
                :class="{ active: pageNumber === page }"
                @click="goPage(pageNumber)"
              >
                {{ pageNumber }}
              </button>

              <button :disabled="page === totalPages" @click="goPage(page + 1)">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </footer>
        </template>
      </section>
    </div>

    <div v-if="filterOpen" class="mobile-filter-mask" @click.self="closeFilter">
      <section class="mobile-filter-sheet">
        <span class="sheet-handle"></span>

        <header>
          <button class="reset-text" @click="resetFilter">重置</button>
          <h2>篩選條件</h2>
          <button class="sheet-close" @click="closeFilter">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div class="sheet-block">
          <p>類型</p>
          <div class="mobile-type-grid">
            <button :class="{ active: type === '' }" @click="type = ''">全部</button>
            <button :class="{ active: type === 'income' }" @click="type = 'income'">收入</button>
            <button :class="{ active: type === 'expense' }" @click="type = 'expense'">支出</button>
          </div>
        </div>

        <div class="sheet-block">
          <p>分類</p>
          <div class="mobile-category-list">
            <button :class="{ active: !categoryId }" @click="categoryId = ''">全部</button>
            <button
              v-for="category in categories.all"
              :key="category.id"
              :class="{ active: categoryId === category.id }"
              @click="categoryId = category.id"
            >
              <span>{{ categoryEmoji(category.name) }}</span>
              {{ category.name }}
            </button>
          </div>
        </div>

        <div class="sheet-block">
          <p>月份</p>

          <div class="mobile-month-head">
            <button @click="shiftYear(-1)">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <strong>{{ currentYear }} 年</strong>
            <button @click="shiftYear(1)">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div class="mobile-month-grid">
            <button
              v-for="item in yearMonths"
              :key="item.value"
              :class="{ active: item.active }"
              @click="month = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <button class="apply-filter-btn" @click="closeFilter">
          套用篩選
        </button>
      </section>
    </div>

    <button
      v-if="!modalOpen && !filterOpen && !deleting"
      class="mobile-create-fab"
      type="button"
      aria-label="新增紀錄"
      @click.stop="openCreate"
    >
      <i class="fa-solid fa-plus"></i>
    </button>

    <RecordModal
      :open="modalOpen"
      :record="editing"
      :categories="categories.all"
      :loading="submitLoading"
      @close="modalOpen = false; editing = null"
      @save="saveRecord"
    />

    <ConfirmDialog
      :open="!!deleting"
      title="確定要刪除此筆紀錄嗎？"
      message="刪除後將無法復原，統計資料也會同步更新。"
      confirm-text="刪除"
      danger
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </AppShell>
</template>

<style scoped>
.records-page {
  padding: 32px 32px 42px;
}

.records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.records-header h1 {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.03em;
}

.records-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-filter-btn {
  display: none;
}

.filter-row {
  position: relative;
  z-index: 20;
  height: 44px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr 128px 128px 128px;
  gap: 10px;
  align-items: center;
}

.search-box {
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ca3af;
}

.search-box input {
  border: 0;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 13px;
  color: #374151;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.filter-item {
  position: relative;
}

.filter-trigger {
  width: 100%;
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-trigger.active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.filter-trigger .chevron,
.filter-trigger .calendar-icon {
  margin-left: auto;
  font-size: 11px;
}

.dropdown-panel {
  position: absolute;
  top: 44px;
  right: 0;
  z-index: 50;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.type-panel {
  width: 150px;
  overflow: hidden;
  padding: 6px 0;
}

.type-option {
  width: 100%;
  height: 38px;
  padding: 0 14px;
  display: grid;
  grid-template-columns: 10px 1fr 14px;
  align-items: center;
  gap: 9px;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  text-align: left;
}

.type-option.active {
  background: #dbeafe;
  color: #2563eb;
  font-weight: 700;
}

.type-option i {
  font-size: 11px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.dot.blue {
  background: #2563eb;
}

.dot.green {
  background: #10b981;
}

.dot.red {
  background: #ef4444;
}

.category-panel {
  width: 248px;
  padding: 14px;
}

.category-panel p {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
  font-weight: 700;
}

.category-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-chip {
  height: 30px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}

.category-chip.active {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.month-panel {
  width: 228px;
  padding: 14px;
}

.month-panel-head,
.mobile-month-head {
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.month-panel-head button,
.mobile-month-head button {
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5563;
}

.month-panel-head strong,
.mobile-month-head strong {
  text-align: center;
  color: #111827;
  font-size: 14px;
  line-height: 20px;
  font-weight: 800;
}

.month-grid,
.mobile-month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
}

.month-grid button,
.mobile-month-grid button {
  height: 30px;
  border-radius: 8px;
  background: #ffffff;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
}

.month-grid button.active,
.mobile-month-grid button.active {
  background: #2563eb;
  color: #ffffff;
}

.record-table {
  overflow: hidden;
  min-height: 530px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.06);
}

.date-head {
  height: 30px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 18px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.record-row {
  height: 60px;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 42px 1fr 105px 32px 32px;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  background: #ffffff;
}

.record-row:last-child {
  border-bottom: 0;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.category-icon.income {
  background: #d1fae5;
}

.category-icon.expense {
  background: #fee2e2;
}

.record-meta strong {
  display: block;
  font-size: 14px;
  line-height: 20px;
  color: #111827;
  font-weight: 700;
}

.record-meta small {
  display: block;
  margin-top: 1px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 18px;
}

.record-money {
  text-align: right;
}

.record-money b {
  display: block;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
}

.record-money small {
  color: #9ca3af;
  font-size: 11px;
  line-height: 16px;
}

.mini-action {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-action.delete {
  color: #ef4444;
}

.table-empty {
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
  gap: 8px;
}

.table-empty i {
  font-size: 28px;
  color: #9ca3af;
}

.table-empty strong {
  color: #111827;
}

.table-empty p {
  margin: 0 0 10px;
}

.table-footer {
  height: 46px;
  border-top: 1px solid #e5e7eb;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
  font-size: 12px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination button {
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #4b5563;
  font-size: 12px;
  font-weight: 700;
}

.pagination button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (min-width: 481px) and (max-width: 1024px) {
  .records-page {
    padding: 24px 20px 92px;
  }

  .records-header {
    margin-bottom: 18px;
  }

  .records-header h1 {
    font-size: 26px;
    line-height: 34px;
  }

  .filter-row {
    grid-template-columns: 1fr 105px 105px 100px;
    gap: 8px;
    margin-bottom: 18px;
  }

  .filter-trigger {
    font-size: 12px;
  }

  .record-table {
    min-height: auto;
  }

  .record-row {
    height: 58px;
  }

  .category-panel {
    width: 245px;
  }

  .month-panel {
    width: 220px;
  }
  .mobile-create-fab {
    display: none;
  }

}

@media (max-width: 480px) {
  .records-page {
    padding: 18px 16px 96px;
  }

  .records-header {
    margin-bottom: 16px;
  }

  .records-header h1 {
    font-size: 24px;
    line-height: 32px;
  }

  .records-actions {
    display: none;
  }

  .mobile-filter-btn {
    height: 32px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid #2563eb;
    border-radius: 8px;
    background: #ffffff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
  }

  .filter-row {
    display: none;
  }

  .record-table {
    min-height: auto;
    margin-bottom: 28px;
    border-radius: 10px;
  }

  .date-head {
    height: 34px;
    padding: 0 14px;
    font-size: 12px;
  }

  .record-row {
    height: 64px;
    grid-template-columns: 40px 1fr auto;
    gap: 10px;
    padding: 0 14px;
  }

  .category-icon {
    width: 36px;
    height: 36px;
    font-size: 17px;
  }

  .record-meta strong {
    font-size: 14px;
    line-height: 20px;
  }

  .record-meta small {
    font-size: 12px;
    line-height: 18px;
  }

  .record-money {
    min-width: 72px;
  }

  .record-money b {
    font-size: 14px;
    line-height: 20px;
  }

  .record-money small {
    font-size: 11px;
    line-height: 16px;
  }

  .mini-action {
    display: none;
  }

  .table-footer {
    display: none;
  }

  .table-empty {
    height: 488px;
  }

  .mobile-filter-mask {
    position: fixed;
    inset: 0;
    z-index: 720;
    background: rgba(17, 24, 39, 0.42);
    display: flex;
    align-items: flex-end;
  }

  .mobile-filter-sheet {
    width: 100%;
    background: #ffffff;
    border-radius: 18px 18px 0 0;
    padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
    box-shadow: 0 -18px 40px rgba(15, 23, 42, 0.18);
  }

  .sheet-handle {
    width: 34px;
    height: 4px;
    border-radius: 999px;
    background: #d1d5db;
    display: block;
    margin: 2px auto 12px;
  }

  .mobile-filter-sheet header {
    height: 38px;
    display: grid;
    grid-template-columns: 56px 1fr 32px;
    align-items: center;
    margin-bottom: 18px;
  }

  .mobile-filter-sheet h2 {
    margin: 0;
    text-align: center;
    font-size: 18px;
    line-height: 26px;
    color: #111827;
  }

  .reset-text {
    color: #6b7280;
    background: transparent;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
  }

  .sheet-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: transparent;
    color: #111827;
  }

  .sheet-block {
    margin-bottom: 18px;
  }

  .sheet-block p {
    margin: 0 0 10px;
    color: #6b7280;
    font-size: 13px;
    line-height: 20px;
    font-weight: 700;
  }

  .mobile-type-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .mobile-type-grid button {
    height: 38px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #ffffff;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
  }

  .mobile-type-grid button.active {
    border-color: #2563eb;
    color: #2563eb;
  }

  .mobile-type-grid button:nth-child(2).active {
    color: #10b981;
  }

  .mobile-type-grid button:nth-child(3).active {
    color: #ef4444;
  }

  .mobile-category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mobile-category-list button {
    height: 30px;
    padding: 0 11px;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #ffffff;
    color: #4b5563;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
  }

  .mobile-category-list button.active {
    border-color: #2563eb;
    color: #2563eb;
  }

  .mobile-month-head {
    margin: 4px 0 14px;
  }

  .mobile-month-grid {
    row-gap: 12px;
    column-gap: 10px;
  }

  .mobile-month-grid button {
    height: 34px;
  }

  .apply-filter-btn {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    font-weight: 800;
    margin-top: 8px;
  }
  .mobile-create-fab {
    position: fixed;
    right: calc(18px + env(safe-area-inset-right));
    bottom: calc(78px + env(safe-area-inset-bottom));
    z-index: 620;
    width: 54px;
    height: 54px;
    border: 0;
    border-radius: 999px;
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.38);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .mobile-create-fab:active {
    transform: translateY(1px);
  }
}
</style>



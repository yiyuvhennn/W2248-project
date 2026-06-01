<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Category } from '@/types/category'
import type { FinanceRecord, RecordPayload, RecordType } from '@/types/record'
import { todayDate } from '@/utils/date'

const props = defineProps<{
  open: boolean
  record?: FinanceRecord | null
  categories: Category[]
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: RecordPayload]
  addCategory: [type: RecordType]
}>()

const type = ref<RecordType>('expense')
const amount = ref('')
const categoryId = ref('')
const date = ref('')
const note = ref('')
const error = ref('')

const isEdit = computed(() => Boolean(props.record))
const isIncome = computed(() => type.value === 'income')

const titleText = computed(() => (isEdit.value ? '編輯紀錄' : '新增紀錄'))
const actionText = computed(() => (isEdit.value ? '更新紀錄' : '儲存紀錄'))
const mobileActionText = computed(() => (isEdit.value ? '更新' : '儲存'))

const filteredCategories = computed(() =>
  props.categories.filter((item) => item.type === type.value)
)

const canSubmit = computed(() => {
  return Number(amount.value) > 0 && Boolean(categoryId.value) && Boolean(date.value)
})

const amountMobileValue = computed(() => {
  if (!amount.value || Number(amount.value) <= 0) return '0'
  return Number(amount.value).toLocaleString('en-US')
})

watch(
  () => props.open,
  (open) => {
    if (!open) return

    type.value = props.record?.type || 'expense'
    amount.value = props.record ? String(props.record.amount) : ''
    categoryId.value = props.record?.categoryId || ''
    date.value = props.record?.date || ''
    note.value = props.record?.note || ''
    error.value = ''

    if (!categoryId.value) {
      categoryId.value = filteredCategories.value[0]?.id || ''
    }
  },
  { immediate: true }
)

watch(type, () => {
  categoryId.value = filteredCategories.value[0]?.id || ''
  error.value = ''
})

function closeModal() {
  emit('close')
}

function openAddCategory() {
  emit('addCategory', type.value)
}

function cleanAmount(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')

  if (parts.length <= 1) return cleaned

  return `${parts[0]}.${parts.slice(1).join('')}`
}

function onAmountInput(event: Event) {
  const target = event.target as HTMLInputElement
  amount.value = cleanAmount(target.value)
}

function getCategoryIcon(category: Category) {
  const item = category as Category & { emoji?: string }

  const fallbackMap: Record<string, string> = {
    食品餐飲: '🍔',
    餐飲: '🍔',
    交通出行: '🚌',
    交通: '🚌',
    住房租金: '🏠',
    居家: '🏠',
    娛樂休閒: '🎮',
    娛樂: '🎮',
    購物: '🛒',
    薪資: '⚡',
    其他收入: '⚡',
    健身運動: '🏋️',
    健康運動: '🏋️',
  }

  return item.emoji || fallbackMap[category.name] || category.icon || '🏷️'
}

function isFaIcon(icon: string) {
  return icon.startsWith('fa-') || icon.includes('fa-')
}

function submit() {
  error.value = ''

  if (!amount.value || Number(amount.value) <= 0) {
    error.value = '請輸入大於 0 的金額'
    return
  }

  if (!date.value) {
    error.value = '請選擇日期'
    return
  }

  if (!categoryId.value) {
    error.value = '請選擇分類'
    return
  }

  emit('save', {
    type: type.value,
    amount: Number(amount.value),
    categoryId: categoryId.value,
    date: date.value,
    note: note.value.trim() || null,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-mask"
        @click.self="closeModal"
      >
        <form
          class="record-modal"
          :class="{ 'income-mode': isIncome }"
          @submit.prevent="submit"
        >
          <header class="modal-head">
            <button
              class="mobile-back-btn"
              type="button"
              @click="closeModal"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>

            <h2>{{ titleText }}</h2>

            <button
              class="desktop-close-btn"
              type="button"
              @click="closeModal"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>

            <button
              class="mobile-save-btn"
              type="submit"
              :disabled="!canSubmit || loading"
            >
              {{ loading ? '儲存中' : mobileActionText }}
            </button>
          </header>

          <div class="modal-body">
            <div class="type-toggle">
              <button
                type="button"
                :class="{ active: type === 'expense' }"
                @click="type = 'expense'"
              >
                支出
              </button>
              <button
                type="button"
                :class="{ active: type === 'income' }"
                @click="type = 'income'"
              >
                收入
              </button>
            </div>

            <label class="mobile-amount-field">
              <span>金額</span>
              <div class="mobile-amount-box">
                <span>$</span>
                <input
                  :value="amountMobileValue"
                  inputmode="decimal"
                  placeholder="0"
                  @input="onAmountInput"
                />
              </div>
            </label>

            <div class="modal-grid">
              <label class="desktop-amount-field">
                金額
                <input
                  :value="amount"
                  inputmode="decimal"
                  placeholder="0"
                  @input="onAmountInput"
                />
              </label>

              <label>
                日期
                <input
                  v-model="date"
                  type="date"
                  :max="todayDate()"
                />
              </label>
            </div>

            <label class="category-label">分類</label>

            <div class="chip-list">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                class="cat-chip"
                :class="{ active: categoryId === cat.id }"
                @click="categoryId = cat.id"
              >
                <span
                  v-if="!isFaIcon(getCategoryIcon(cat))"
                  class="chip-emoji"
                >
                  {{ getCategoryIcon(cat) }}
                </span>
                <i
                  v-else
                  :class="['fa-solid', getCategoryIcon(cat)]"
                ></i>
                {{ cat.name }}
              </button>

              <button
                type="button"
                class="cat-chip add-chip"
                @click="openAddCategory"
              >
                ＋ 新增分類
              </button>
            </div>

            <label class="note-label">
              備註（選填）
              <input
                v-model="note"
                :placeholder="isEdit ? '' : '新增備註說明...'"
              />
            </label>

            <p
              v-if="error"
              class="form-error"
            >
              {{ error }}
            </p>
          </div>

          <footer class="modal-actions">
            <button
              class="cancel-btn"
              type="button"
              @click="closeModal"
            >
              取消
            </button>

            <button
              class="save-btn"
              type="submit"
              :disabled="!canSubmit || loading"
            >
              <i class="fa-solid fa-check"></i>
              {{ loading ? '儲存中' : actionText }}
            </button>
          </footer>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.48);
  backdrop-filter: blur(5px);
}

.record-modal {
  width: 480px;
  max-width: calc(100vw - 48px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.26);
  overflow: hidden;
}

.modal-head {
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-head h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  line-height: 28px;
  font-weight: 800;
}

.desktop-close-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #d9dee8;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-back-btn,
.mobile-save-btn {
  display: none;
}

.modal-body {
  padding: 0 28px 18px;
}

.type-toggle {
  width: 100%;
  height: 40px;
  border: 1px solid #d9dee8;
  border-radius: 7px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  margin-bottom: 20px;
  background: #ffffff;
}

.type-toggle button {
  border: 0;
  background: #ffffff;
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
}

.type-toggle button.active:first-child {
  background: #ef4444;
  color: #ffffff;
}

.type-toggle button.active:last-child {
  background: #10b981;
  color: #ffffff;
}

.mobile-amount-field {
  display: none;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #374151;
  font-size: 13px;
  line-height: 18px;
  font-weight: 800;
}

input {
  width: 100%;
  height: 44px;
  border: 1px solid #d9dee8;
  border-radius: 7px;
  background: #ffffff;
  color: #111827;
  padding: 0 13px;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.category-label {
  margin-bottom: 10px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.cat-chip {
  height: 31px;
  padding: 0 12px;
  border: 1px solid #d9dee8;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.chip-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.cat-chip.active {
  border-color: #ef4444;
  background: #fee2e2;
  color: #ef4444;
}

.income-mode .cat-chip.active {
  border-color: #10b981;
  background: #d1fae5;
  color: #10b981;
}

.add-chip {
  background: #f8fafc;
  color: #9ca3af;
}

.note-label {
  margin-bottom: 0;
}

.form-error {
  margin: 12px 0 0;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fef2f2;
  color: #ef4444;
  font-size: 13px;
  font-weight: 800;
}

.modal-actions {
  border-top: 1px solid #e5e7eb;
  padding: 18px 28px 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.save-btn {
  height: 38px;
  border-radius: 7px;
  padding: 0 17px;
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancel-btn {
  border: 1px solid #d9dee8;
  background: #ffffff;
  color: #374151;
}

.save-btn {
  border: 0;
  background: #2563eb;
  color: #ffffff;
}

.save-btn:disabled,
.mobile-save-btn:disabled {
  background: #a9c2ff;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .modal-mask {
    display: block;
    background: #ffffff;
    backdrop-filter: none;
    overflow: auto;
  }

  .record-modal {
    width: 100%;
    min-height: 100dvh;
    max-width: none;
    border-radius: 0;
    box-shadow: none;
    overflow: visible;
  }

  .modal-head {
    position: sticky;
    top: 0;
    z-index: 2;
    height: 52px;
    padding: 0 18px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
    display: grid;
    grid-template-columns: 44px 1fr 58px;
    align-items: center;
  }

  .modal-head h2 {
    text-align: center;
    font-size: 18px;
    line-height: 24px;
  }

  .desktop-close-btn {
    display: none;
  }

  .mobile-back-btn {
    width: 36px;
    height: 36px;
    border: 0;
    background: transparent;
    color: #111827;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 14px;
  }

  .mobile-save-btn {
    width: 48px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    font-size: 13px;
    font-weight: 800;
  }

  .modal-body {
    padding: 22px 20px 28px;
  }

  .type-toggle {
    height: 38px;
    margin-bottom: 20px;
    border-radius: 6px;
  }

  .type-toggle button {
    font-size: 14px;
  }

  .mobile-amount-field {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid #d9dee8;
    text-align: center;
  }

  .mobile-amount-field > span {
    color: #94a3b8;
    font-size: 12px;
    line-height: 18px;
    font-weight: 800;
  }

  .mobile-amount-box {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    font-size: 44px;
    line-height: 56px;
    font-weight: 900;
  }

  .income-mode .mobile-amount-box {
    color: #10b981;
  }

  .mobile-amount-box span {
    transform: translateY(-1px);
  }

  .mobile-amount-box input {
    width: auto;
    min-width: 38px;
    max-width: 230px;
    height: 58px;
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    box-shadow: none;
    text-align: left;
    font-size: 44px;
    line-height: 56px;
    font-weight: 900;
  }

  .mobile-amount-box input:focus {
    border: 0;
    box-shadow: none;
  }

  .modal-grid {
    display: block;
    margin-bottom: 18px;
  }

  .desktop-amount-field {
    display: none;
  }

  .modal-grid label {
    margin-bottom: 18px;
  }

  label {
    gap: 8px;
    font-size: 13px;
  }

  input {
    height: 44px;
    border-radius: 7px;
    font-size: 14px;
  }

  .category-label {
    margin-bottom: 10px;
  }

  .chip-list {
    gap: 10px 8px;
    margin-bottom: 20px;
  }

  .cat-chip {
    height: 30px;
    padding: 0 11px;
    font-size: 12px;
  }

  .note-label {
    margin-bottom: 0;
  }

  .modal-actions {
    display: none;
  }

  .form-error {
    margin-top: 14px;
  }
}
</style>
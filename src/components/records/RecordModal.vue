<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Category } from '@/types/category'
import type { FinanceRecord, RecordPayload, RecordType } from '@/types/record'
import { todayDate } from '@/utils/date'

const props = defineProps<{ open: boolean; record?: FinanceRecord | null; categories: Category[]; loading?: boolean }>()
const emit = defineEmits<{ close: []; save: [payload: RecordPayload] }>()
const type = ref<RecordType>('expense')
const amount = ref('')
const categoryId = ref('')
const date = ref(todayDate())
const note = ref('')
const error = ref('')
const filteredCategories = computed(() => props.categories.filter((item) => item.type === type.value))
watch(() => props.open, (open) => {
  if (!open) return
  type.value = props.record?.type || 'expense'
  amount.value = props.record ? String(props.record.amount) : ''
  categoryId.value = props.record?.categoryId || filteredCategories.value[0]?.id || ''
  date.value = props.record?.date || todayDate()
  note.value = props.record?.note || ''
  error.value = ''
}, { immediate: true })
watch(type, () => { categoryId.value = filteredCategories.value[0]?.id || '' })
function submit() {
  if (!amount.value || Number(amount.value) <= 0) { error.value = '請輸入大於 0 的金額'; return }
  if (!categoryId.value) { error.value = '請選擇分類'; return }
  emit('save', { type: type.value, amount: Number(amount.value), categoryId: categoryId.value, date: date.value, note: note.value || null })
}
</script>
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-mask" @click.self="$emit('close')">
        <form class="record-modal" @submit.prevent="submit">
          <div class="modal-head"><h2>{{ record ? '編輯紀錄' : '新增紀錄' }}</h2><button type="button" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="type-toggle"><button type="button" :class="{ active: type === 'expense' }" @click="type = 'expense'">支出</button><button type="button" :class="{ active: type === 'income' }" @click="type = 'income'">收入</button></div>
          <div class="modal-grid">
            <label>金額<input v-model="amount" type="number" placeholder="0" /></label>
            <label>日期<input v-model="date" type="date" :max="todayDate()" /></label>
          </div>
          <label class="category-label">分類</label>
          <div class="chip-list"><button v-for="cat in filteredCategories" :key="cat.id" type="button" class="cat-chip" :class="{ active: categoryId === cat.id }" @click="categoryId = cat.id"><i :class="['fa-solid', cat.icon]"></i>{{ cat.name }}</button><button type="button" class="cat-chip add-chip">＋ 新增分類</button></div>
          <label class="note-label">備註（選填）<input v-model="note" placeholder="新增備註說明..." /></label>
          <p v-if="error" class="form-error">{{ error }}</p>
          <div class="modal-actions"><button class="cancel-btn" type="button" @click="$emit('close')">取消</button><button class="save-btn" type="submit" :disabled="loading">{{ loading ? '儲存中' : record ? '儲存紀錄' : '儲存紀錄' }}</button></div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.modal-mask{position:fixed;inset:0;z-index:700;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.52);backdrop-filter:blur(2px)}.record-modal{width:330px;background:#fff;border-radius:8px;box-shadow:0 22px 45px rgba(0,0,0,.28);padding:18px}.modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.modal-head h2{font-size:16px;line-height:24px;margin:0;font-weight:800}.modal-head button{width:26px;height:26px;border:1px solid var(--border);border-radius:50%;background:#fff;color:var(--gray-500)}.type-toggle{height:36px;border:1px solid var(--border);border-radius:5px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;margin-bottom:16px}.type-toggle button{background:#fff;color:var(--gray-600);font-weight:800;font-size:12px}.type-toggle button.active:first-child{background:var(--expense);color:#fff}.type-toggle button.active:last-child{background:var(--income);color:#fff}.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:var(--gray-700)}input{height:34px;border:1px solid var(--border);border-radius:5px;padding:0 10px;color:var(--gray-700);background:#fff;font-size:12px}.category-label{margin-bottom:8px}.chip-list{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.cat-chip{height:28px;border:1px solid var(--border);border-radius:999px;background:#fff;color:var(--gray-600);display:flex;align-items:center;gap:6px;padding:0 10px;font-size:11px;font-weight:700}.cat-chip.active{border-color:var(--expense);background:var(--expense-50);color:var(--expense)}.add-chip{color:var(--gray-500);background:#f9fafb}.note-label{margin-bottom:14px}.form-error{color:var(--expense);font-size:12px;font-weight:700;margin:0 0 10px}.modal-actions{border-top:1px solid var(--border);padding-top:14px;display:flex;justify-content:flex-end;gap:8px}.cancel-btn,.save-btn{height:32px;border-radius:5px;padding:0 14px;font-weight:700;font-size:12px}.cancel-btn{background:#fff;border:1px solid var(--border);color:var(--gray-700)}.save-btn{background:var(--primary);color:#fff}.modal-enter-active,.modal-leave-active{transition:.16s ease}.modal-enter-from,.modal-leave-to{opacity:0}@media(max-width:480px){.modal-mask{align-items:flex-end}.record-modal{width:100%;border-radius:16px 16px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom))}.modal-grid{grid-template-columns:1fr}.modal-actions{display:grid;grid-template-columns:1fr 1fr}}
</style>

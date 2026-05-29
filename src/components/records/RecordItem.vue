<script setup lang="ts">
import type { FinanceRecord } from '@/types/record'
import { money } from '@/utils/format'
const props = defineProps<{ record: FinanceRecord; compact?: boolean }>()
defineEmits<{ edit: [record: FinanceRecord]; delete: [record: FinanceRecord] }>()
const isIncome = props.record.type === 'income'
</script>
<template>
  <article class="record-item" :class="{ compact }">
    <div class="record-main">
      <span class="record-icon" :class="record.type"><i :class="['fa-solid', record.type === 'income' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down']"></i></span>
      <div class="record-text">
        <strong>{{ record.note || record.categoryName }}</strong>
        <span>{{ record.categoryName }} · {{ record.date }}</span>
      </div>
    </div>
    <div class="record-right">
      <strong class="amount" :class="record.type">{{ isIncome ? '+' : '-' }}{{ money(record.amount) }}</strong>
      <div v-if="!compact" class="actions">
        <button @click="$emit('edit', record)" aria-label="編輯"><i class="fa-solid fa-pen"></i></button>
        <button class="delete" @click="$emit('delete', record)" aria-label="刪除"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  </article>
</template>
<style scoped>
.record-item { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 0; border-bottom:1px solid var(--border); }
.record-item:last-child { border-bottom:0; }
.record-main { display:flex; align-items:center; gap:12px; min-width:0; }
.record-icon { flex:0 0 auto; width:44px; height:44px; border-radius:15px; display:flex; align-items:center; justify-content:center; }
.record-icon.income { color:var(--income); background:var(--income-100); }
.record-icon.expense { color:var(--expense); background:var(--expense-100); }
.record-text { min-width:0; display:flex; flex-direction:column; gap:3px; }
.record-text strong { color:var(--gray-900); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.record-text span { color:var(--gray-500); font-size:12px; line-height:18px; }
.record-right { display:flex; align-items:center; gap:16px; }
.amount { font-size:15px; min-width:110px; text-align:right; }
.amount.income { color:var(--income); } .amount.expense { color:var(--expense); }
.actions { display:flex; gap:6px; }
.actions button { width:32px; height:32px; border-radius:10px; color:var(--gray-400); background:var(--gray-50); }
.actions button:hover { color:var(--primary); background:var(--primary-50); }
.actions .delete:hover { color:var(--expense); background:var(--expense-50); }
.compact .amount { min-width:auto; }
@media(max-width:480px){ .record-item{padding:14px 0}.actions{display:none}.amount{min-width:auto;font-size:14px}.record-icon{width:40px;height:40px;border-radius:14px}.record-right{gap:0} }
</style>

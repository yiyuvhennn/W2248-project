<script setup lang="ts">
import { money } from '@/utils/format'
withDefaults(defineProps<{ title: string; amount: number; icon: string; tone?: 'income' | 'expense' | 'primary' }>(), { tone: 'primary' })
</script>
<template>
  <article class="summary-card" :class="tone">
    <div>
      <p>{{ title }}</p>
      <strong>{{ money(amount) }}</strong>
    </div>
    <span class="summary-icon"><i :class="['fa-solid', icon]"></i></span>
  </article>
</template>
<style scoped>
.summary-card { min-height:118px; border-radius:18px; border:1px solid var(--border); background:#fff; padding:22px; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow-sm); }
p { margin:0 0 8px; color:var(--gray-500); font-weight:600; }
strong { font-size:26px; line-height:34px; font-weight:800; letter-spacing:-.02em; }
.summary-icon { width:54px; height:54px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:22px; }
.income strong { color:var(--income); } .income .summary-icon { color:var(--income); background:var(--income-100); }
.expense strong { color:var(--expense); } .expense .summary-icon { color:var(--expense); background:var(--expense-100); }
.primary strong { color:var(--primary); } .primary .summary-icon { color:var(--primary); background:var(--primary-100); }
@media(max-width:480px){.summary-card{min-height:100px;padding:18px}.summary-icon{width:48px;height:48px;border-radius:16px}strong{font-size:22px;line-height:30px}}
</style>

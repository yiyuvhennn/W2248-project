<script setup lang="ts">
import type { CategoryStatItem } from '@/types/stats'
import { money } from '@/utils/format'
defineProps<{ items: CategoryStatItem[]; total: number }>()
</script>
<template>
  <div class="bar-list">
    <div v-for="item in items" :key="item.categoryId" class="bar-row">
      <div class="bar-head"><span>{{ item.categoryName }}</span><strong>{{ money(item.amount) }}</strong></div>
      <div class="bar-track"><div class="bar-fill" :style="{ width: `${total ? Math.max(item.amount / total * 100, 4) : 0}%` }"></div></div>
      <p>{{ item.count }} 筆 · {{ item.percentage }}%</p>
    </div>
  </div>
</template>
<style scoped>
.bar-list{display:flex;flex-direction:column;gap:16px}.bar-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:7px}.bar-head span{font-weight:700;color:var(--gray-700)}.bar-head strong{color:var(--gray-900)}.bar-track{height:9px;border-radius:99px;background:var(--gray-100);overflow:hidden}.bar-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--primary),#60a5fa)}p{margin:5px 0 0;color:var(--gray-400);font-size:12px}
</style>

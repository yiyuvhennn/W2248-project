<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryStatItem } from '@/types/stats'
import { money } from '@/utils/format'
const props = defineProps<{ items: CategoryStatItem[]; total: number }>()
const gradient = computed(() => {
  if (!props.items.length || !props.total) return '#E5E7EB 0 100%'
  const colors = ['#EF4444', '#F97316', '#EAB308', '#12B981', '#3C82F6', '#8B5CF6', '#EC4899']
  let cursor = 0
  return props.items.map((item, index) => {
    const next = cursor + item.percentage
    const segment = `${colors[index % colors.length]} ${cursor}% ${next}%`
    cursor = next
    return segment
  }).join(', ')
})
</script>
<template>
  <div class="donut-wrap">
    <div class="donut" :style="{ background: `conic-gradient(${gradient})` }"><div><span>總支出</span><strong>{{ money(total) }}</strong></div></div>
    <div class="legend">
      <div v-for="(item, index) in items" :key="item.categoryId" class="legend-row">
        <span class="dot" :style="{ background: ['#EF4444','#F97316','#EAB308','#12B981','#3C82F6','#8B5CF6','#EC4899'][index % 7] }"></span>
        <span>{{ item.categoryName }}</span><strong>{{ item.percentage }}%</strong>
      </div>
    </div>
  </div>
</template>
<style scoped>
.donut-wrap{display:grid;grid-template-columns:220px 1fr;gap:24px;align-items:center}.donut{width:220px;height:220px;border-radius:50%;display:flex;align-items:center;justify-content:center}.donut>div{width:128px;height:128px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px var(--border)}.donut span{color:var(--gray-500);font-size:12px}.donut strong{font-size:20px;line-height:28px}.legend{display:flex;flex-direction:column;gap:12px}.legend-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center}.dot{width:10px;height:10px;border-radius:50%}.legend-row span:nth-child(2){color:var(--gray-600)}.legend-row strong{font-weight:800}@media(max-width:680px){.donut-wrap{grid-template-columns:1fr}.donut{margin:auto;width:190px;height:190px}.donut>div{width:116px;height:116px}}
</style>

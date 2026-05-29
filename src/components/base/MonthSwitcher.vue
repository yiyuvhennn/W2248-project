<script setup lang="ts">
import { formatMonthLabel, shiftMonth } from '@/utils/date'
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function move(offset: number) { emit('update:modelValue', shiftMonth(props.modelValue, offset)) }
</script>
<template>
  <div class="month-switcher">
    <button @click="move(-1)" aria-label="上一月"><i class="fa-solid fa-chevron-left"></i></button>
    <strong>{{ formatMonthLabel(modelValue) }}</strong>
    <button @click="move(1)" aria-label="下一月"><i class="fa-solid fa-chevron-right"></i></button>
  </div>
</template>
<style scoped>
.month-switcher { height: 40px; padding: 0 8px; display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-sm); }
.month-switcher button { width:30px; height:30px; border-radius:9px; color:var(--gray-600); background:transparent; }
.month-switcher button:hover { background:var(--gray-100); color:var(--primary); }
.month-switcher strong { min-width: 104px; text-align:center; color:var(--gray-900); }
</style>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { Category } from '@/types/category'
import type { RecordType } from '@/types/record'
const props = defineProps<{ open: boolean; categories: Category[]; month: string; type: RecordType | ''; categoryId: string }>()
const emit = defineEmits<{ close: []; apply: [payload: { month: string; type: RecordType | ''; categoryId: string }] }>()
let local = { month: props.month, type: props.type, categoryId: props.categoryId }
</script>
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="sheet-mask" @click.self="$emit('close')">
        <div class="sheet">
          <div class="grabber"></div>
          <h2>篩選紀錄</h2>
          <BaseInput v-model="local.month" type="month" label="月份" />
          <BaseInput v-model="local.type" as="select" label="類型">
            <option value="">全部</option><option value="income">收入</option><option value="expense">支出</option>
          </BaseInput>
          <BaseInput v-model="local.categoryId" as="select" label="分類">
            <option value="">全部分類</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </BaseInput>
          <BaseButton block size="lg" @click="$emit('apply', local)">套用篩選</BaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.sheet-mask{position:fixed;inset:0;z-index:650;background:rgba(17,24,39,.44);display:flex;align-items:flex-end}.sheet{width:100%;background:#fff;border-radius:22px 22px 0 0;padding:10px 18px calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px}.grabber{width:42px;height:5px;border-radius:99px;background:var(--gray-300);margin:0 auto 4px}h2{font-size:20px;margin:0 0 4px}.fade-enter-active,.fade-leave-active{transition:.18s ease}.fade-enter-from,.fade-leave-to{opacity:0}
</style>

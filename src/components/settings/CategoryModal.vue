<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { Category, CategoryPayload } from '@/types/category'
import type { RecordType } from '@/types/record'
const props = defineProps<{ open: boolean; category?: Category | null; loading?: boolean }>()
const emit = defineEmits<{ close: []; save: [payload: CategoryPayload] }>()
const name = ref('')
const type = ref<RecordType>('expense')
const icon = ref('fa-tag')
const color = ref('#EF4444')
const colors = ['#EF4444', '#F97316', '#EAB308', '#12B981', '#3C82F6', '#8B5CF6', '#EC4899', '#9E9E9E']
watch(() => props.open, (open) => {
  if (!open) return
  name.value = props.category?.name || ''
  type.value = props.category?.type || 'expense'
  icon.value = props.category?.icon || 'fa-tag'
  color.value = props.category?.color || '#EF4444'
}, { immediate: true })
function submit() {
  emit('save', { name: name.value, type: type.value, icon: icon.value, color: color.value })
}
</script>
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-mask" @click.self="$emit('close')">
        <form class="category-modal" @submit.prevent="submit">
          <div class="row-between"><h2>{{ category ? '編輯分類' : '新增分類' }}</h2><button type="button" class="close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="preview"><span :style="{ background: color + '22', color }"><i :class="['fa-solid', icon]"></i></span><strong>{{ name || '分類名稱' }}</strong></div>
          <BaseInput v-model="name" label="分類名稱" placeholder="例如：伙食費" />
          <BaseInput v-model="type" as="select" label="類型">
            <option value="income">收入</option><option value="expense">支出</option>
          </BaseInput>
          <BaseInput v-model="icon" label="Font Awesome Icon" placeholder="fa-utensils" />
          <div class="color-field"><span>分類顏色</span><div class="swatches"><button v-for="c in colors" :key="c" type="button" :style="{ background: c }" :class="{ active: color === c }" @click="color = c"></button></div></div>
          <div class="actions"><BaseButton variant="secondary" type="button" @click="$emit('close')">取消</BaseButton><BaseButton type="submit" :loading="loading">儲存</BaseButton></div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.modal-mask{position:fixed;inset:0;z-index:720;background:rgba(17,24,39,.48);display:flex;align-items:center;justify-content:center;padding:24px}.category-modal{width:min(440px,100%);background:#fff;border-radius:22px;box-shadow:var(--shadow-lg);padding:24px;display:flex;flex-direction:column;gap:15px}h2{margin:0;font-size:20px}.close{width:34px;height:34px;border-radius:10px;background:var(--gray-100);color:var(--gray-500)}.preview{height:76px;border:1px dashed var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:12px;background:var(--gray-50)}.preview span{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center}.color-field>span{display:block;color:var(--gray-700);font-weight:700;margin-bottom:8px}.swatches{display:flex;flex-wrap:wrap;gap:8px}.swatches button{width:30px;height:30px;border-radius:10px;border:3px solid transparent}.swatches button.active{border-color:var(--gray-900)}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}.fade-enter-active,.fade-leave-active{transition:.18s ease}.fade-enter-from,.fade-leave-to{opacity:0}@media(max-width:480px){.modal-mask{align-items:flex-end;padding:0}.category-modal{border-radius:22px 22px 0 0;padding:22px 18px calc(22px + env(safe-area-inset-bottom));}.actions{display:grid;grid-template-columns:1fr 1fr}}
</style>

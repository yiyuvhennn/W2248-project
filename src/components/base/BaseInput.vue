<script setup lang="ts">
defineProps<{
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  icon?: string
  error?: string
  hint?: string
  min?: string | number
  max?: string | number
  as?: 'input' | 'textarea' | 'select'
}>()
defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <label class="field">
    <span v-if="label" class="field-label">{{ label }}</span>
    <span class="input-wrap" :class="{ 'has-error': error, textarea: as === 'textarea' }">
      <i v-if="icon" :class="['fa-solid', icon]"></i>
      <textarea
        v-if="as === 'textarea'"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <select
        v-else-if="as === 'select'"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <slot />
      </select>
      <input
        v-else
        :type="type || 'text'"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </span>
    <span v-if="error" class="field-error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</span>
    <span v-else-if="hint" class="field-hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: 7px; width: 100%; }
.field-label { color: var(--gray-700); font-size: 14px; font-weight: 700; }
.input-wrap {
  min-height: 46px; display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid var(--border);
  border-radius: 12px; padding: 0 14px; transition: .18s ease;
}
.input-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37,99,235,.1); }
.input-wrap.has-error { border-color: var(--expense); box-shadow: 0 0 0 4px rgba(239,68,68,.08); }
.input-wrap i { color: var(--gray-400); width: 16px; text-align: center; }
.input-wrap input, .input-wrap select, .input-wrap textarea { width: 100%; border: 0; background: transparent; color: var(--gray-900); }
.input-wrap select { appearance: none; }
.input-wrap.textarea { padding-top: 12px; align-items: flex-start; }
textarea { min-height: 88px; resize: vertical; }
.field-error, .field-hint { display: flex; gap: 6px; align-items: center; min-height: 18px; font-size: 12px; line-height: 18px; }
.field-error { color: var(--expense); }
.field-hint { color: var(--gray-500); }
</style>

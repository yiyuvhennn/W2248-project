<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'income' | 'expense'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'primary', size: 'md', type: 'button' })
</script>

<template>
  <button class="base-button" :class="[`is-${variant}`, `is-${size}`, { 'is-block': block, 'is-loading': loading }]" :type="type" :disabled="loading">
    <span v-if="loading" class="spinner"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 10px; font-weight: 700; transition: .18s ease; white-space: nowrap;
}
.is-block { width: 100%; }
.is-lg { height: 48px; padding: 0 20px; font-size: 15px; }
.is-md { height: 40px; padding: 0 16px; font-size: 14px; }
.is-sm { height: 30px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
.is-primary { color: #fff; background: var(--primary); box-shadow: 0 8px 18px rgba(37,99,235,.22); }
.is-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
.is-income { color: #fff; background: var(--income); box-shadow: 0 8px 18px rgba(16,185,129,.18); }
.is-income:hover { background: var(--income-dark); transform: translateY(-1px); }
.is-expense, .is-danger { color: #fff; background: var(--expense); box-shadow: 0 8px 18px rgba(239,68,68,.18); }
.is-expense:hover, .is-danger:hover { background: var(--expense-dark); transform: translateY(-1px); }
.is-secondary { color: var(--gray-700); background: #fff; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.is-secondary:hover { border-color: var(--gray-300); background: var(--gray-50); }
.is-ghost { color: var(--gray-600); background: transparent; }
.is-ghost:hover { background: var(--gray-100); color: var(--gray-900); }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>

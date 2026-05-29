<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
withDefaults(defineProps<{ open: boolean; title: string; message: string; confirmText?: string; danger?: boolean; loading?: boolean }>(), { confirmText: '確認' })
defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="dialog-mask" @click.self="$emit('close')">
        <div class="dialog-card">
          <div class="dialog-icon" :class="{ danger }"><i :class="['fa-solid', danger ? 'fa-triangle-exclamation' : 'fa-circle-info']"></i></div>
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
          <div class="dialog-actions">
            <BaseButton variant="secondary" @click="$emit('close')">取消</BaseButton>
            <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="$emit('confirm')">{{ confirmText }}</BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.dialog-mask { position:fixed; inset:0; background:rgba(17,24,39,.48); z-index:800; display:flex; align-items:center; justify-content:center; padding:24px; }
.dialog-card { width:min(420px, 100%); background:#fff; border-radius:20px; box-shadow:var(--shadow-lg); padding:28px; text-align:center; }
.dialog-icon { width:54px; height:54px; margin:0 auto 16px; border-radius:18px; display:flex; align-items:center; justify-content:center; background:var(--primary-100); color:var(--primary); font-size:24px; }
.dialog-icon.danger { background:var(--expense-100); color:var(--expense); }
h2 { margin:0; font-size:20px; line-height:28px; }
p { margin:8px 0 22px; color:var(--gray-500); line-height:22px; }
.dialog-actions { display:flex; justify-content:center; gap:12px; }
.fade-enter-active,.fade-leave-active{transition:.18s ease}.fade-enter-from,.fade-leave-to{opacity:0}
@media(max-width:480px){.dialog-card{align-self:flex-end;border-radius:22px 22px 0 0;margin:-24px; width:calc(100% + 48px); padding-bottom: calc(28px + env(safe-area-inset-bottom));}.dialog-mask{align-items:flex-end}}
</style>

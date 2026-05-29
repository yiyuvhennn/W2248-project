<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>()
</script>
<template>
  <div class="empty-state">
    <div class="empty-icon"><i :class="['fa-solid', icon || 'fa-inbox']"></i></div>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>
<style scoped>
.empty-state { min-height: 250px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 18px; color:var(--gray-500); }
.empty-icon { width:64px; height:64px; border-radius:22px; background:var(--gray-100); color:var(--gray-400); display:flex; align-items:center; justify-content:center; font-size:26px; margin-bottom:14px; }
h3 { color:var(--gray-900); margin:0; font-size:16px; line-height:24px; }
p { margin:6px 0 0; max-width:360px; line-height:22px; }
</style>

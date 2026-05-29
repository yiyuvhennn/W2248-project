<script setup lang="ts">
defineEmits<{ click: [] }>()
</script>
<template><button class="fab" @click="$emit('click')"><i class="fa-solid fa-plus"></i></button></template>
<style scoped>
.fab { display:none; position:fixed; right:22px; bottom:calc(var(--mobile-tab-height) + 22px + env(safe-area-inset-bottom)); z-index:130; width:58px; height:58px; border-radius:20px; color:#fff; background:var(--primary); box-shadow:0 14px 28px rgba(37,99,235,.32); font-size:20px; }
@media(max-width:480px){.fab{display:block;}}
</style>

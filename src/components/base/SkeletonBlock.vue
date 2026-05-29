<template><div class="skeleton"><slot /></div></template>
<style scoped>
.skeleton { min-height: 120px; border-radius: var(--radius-lg); background: linear-gradient(90deg, var(--gray-100), #fff, var(--gray-100)); background-size: 200% 100%; animation: shimmer 1.4s infinite; border: 1px solid var(--border); }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>

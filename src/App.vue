<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ToastHost from '@/components/feedback/ToastHost.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

function handleAuthExpired() {
  auth.logout()
  toast.error('登入狀態已過期，請重新登入')
  router.push('/login')
}

onMounted(() => window.addEventListener('auth:expired', handleAuthExpired))
onUnmounted(() => window.removeEventListener('auth:expired', handleAuthExpired))
</script>

<template>
  <RouterView />
  <ToastHost />
</template>

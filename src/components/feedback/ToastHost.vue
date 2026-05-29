｀<script setup lang="ts">
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()

type ToastType = 'success' | 'error' | 'info'

const iconMap: Record<ToastType, string> = {
  success: 'fa-check',
  error: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
}

function toastTitle(type: ToastType, message: string) {
  if (type === 'error') return '操作失敗'
  if (type === 'info') return '提示'

  if (message.includes('新增')) return '新增成功'
  if (message.includes('更新') || message.includes('修改')) return '更新成功'
  if (message.includes('刪除')) return '刪除成功'
  if (message.includes('登入')) return '登入成功'
  if (message.includes('註冊')) return '註冊成功'

  return '操作成功'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <TransitionGroup name="toast">
        <article
          v-for="item in toast.items"
          :key="item.id"
          class="toast-card"
          :class="item.type"
        >
          <span class="toast-icon">
            <i :class="['fa-solid', iconMap[item.type]]"></i>
          </span>

          <div class="toast-content">
            <strong>{{ toastTitle(item.type, item.message) }}</strong>
            <p>{{ item.message }}</p>
          </div>

          <button
            class="toast-close"
            type="button"
            aria-label="關閉通知"
            @click="toast.remove(item.id)"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 86px;
  right: 32px;
  z-index: 1000;
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-card {
  position: relative;
  min-height: 62px;
  padding: 13px 14px 13px 16px;
  display: grid;
  grid-template-columns: 28px 1fr 24px;
  align-items: flex-start;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.14);
  color: #111827;
  pointer-events: auto;
  overflow: hidden;
}

.toast-card.success {
  border-left-color: #10b981;
}

.toast-card.error {
  border-left-color: #ef4444;
}

.toast-card.info {
  border-left-color: #2563eb;
}

.toast-icon {
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex: 0 0 auto;
}

.toast-card.success .toast-icon {
  color: #10b981;
  background: #d1fae5;
}

.toast-card.error .toast-icon {
  color: #ef4444;
  background: #fee2e2;
}

.toast-card.info .toast-icon {
  color: #2563eb;
  background: #dbeafe;
}

.toast-content {
  min-width: 0;
}

.toast-content strong {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 800;
}

.toast-card.success .toast-content strong {
  color: #059669;
}

.toast-card.error .toast-content strong {
  color: #ef4444;
}

.toast-card.info .toast-content strong {
  color: #2563eb;
}

.toast-content p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}

.toast-close {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.toast-close i {
  font-size: 12px;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

.toast-move {
  transition: transform 0.22s ease;
}

@media (min-width: 481px) and (max-width: 1024px) {
  .toast-host {
    top: 76px;
    right: 20px;
    width: 300px;
    gap: 10px;
  }

  .toast-card {
    min-height: 58px;
    padding: 12px 13px 12px 14px;
    grid-template-columns: 26px 1fr 22px;
    gap: 10px;
  }

  .toast-content strong {
    font-size: 13px;
    line-height: 18px;
  }

  .toast-content p {
    font-size: 12px;
    line-height: 18px;
  }
}

@media (max-width: 480px) {
  .toast-host {
    top: auto;
    right: 16px;
    left: 16px;
    bottom: calc(var(--mobile-tab-height, 74px) + 16px + env(safe-area-inset-bottom));
    width: auto;
    gap: 10px;
  }

  .toast-card {
    min-height: 62px;
    padding: 13px 14px 13px 15px;
    border-radius: 8px;
    grid-template-columns: 28px 1fr 24px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
  }

  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateY(16px);
  }
}
</style>

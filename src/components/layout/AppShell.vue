<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import walletIcon from '@/assets/icon/wallet.svg'
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const tabs = [
  { label: '總覽', path: '/app/overview', icon: 'fa-house' },
  { label: '記帳紀錄', path: '/app/records', icon: 'fa-list' },
  { label: '統計分析', path: '/app/stats', icon: 'fa-chart-simple' },
  { label: '設定', path: '/app/settings', icon: 'fa-gear' }
]
function logout() {
  auth.logout()
  useToastStore().info('已登出帳號')
  router.push('/login')
}
function active(path: string) {
  return route.path === path
}
</script>
<template>
  <div class="figma-page-bg">
    <div class="figma-frame app-frame">
      <header class="app-nav">
        <RouterLink class="brand" to="/app/overview">
          <span class="brand-icon-box">
            <img :src="walletIcon" alt="" />
          </span>
          <span>FinanceTracker</span>
        </RouterLink>
        <nav class="nav-tabs">
          <RouterLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav-tab"
            :class="{ active: active(tab.path) }">
            <i :class="['fa-solid', tab.icon]"></i>{{ tab.label }}
          </RouterLink>
        </nav>
        <div class="nav-user">
          <span>{{ auth.user?.name || '王小明' }}</span>
          <button class="logout" @click="logout"><i class="fa-solid fa-right-from-bracket"></i>登出</button>
        </div>
      </header>
      <main>
        <slot />
      </main>
      <nav class="bottom-tab">
        <RouterLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="bottom-item"
          :class="{ active: active(tab.path) }">
          <i :class="['fa-solid', tab.icon]"></i><span>{{ tab.label.replace('記帳紀錄', '紀錄').replace('統計分析', '統計')
            }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
<style scoped>
.app-frame {
  width: 100%;
  min-height: 100vh;
  background: #f9fafb;
}

.app-nav {
  height: 56px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 28px;
  padding: 0 28px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.brand {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #2563eb;
  font-size: 16px;
  line-height: 24px;
  font-weight: 800;
}

.brand i {
  font-size: 13px;
}

.brand-icon-box {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.brand-icon-box img {
  width: 16px;
  height: 16px;
  display: block;
}

.nav-tabs {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 0;
}

.nav-tab {
  height: 56px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
  font-weight: 700;
  font-size: 13px;
  line-height: 20px;
  border-bottom: 2px solid transparent;
}

.nav-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.nav-tab i {
  font-size: 12px;
}

.nav-user {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: #1f2937;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
}

.bottom-tab {
  display: none;
}

.nav-user span {
  white-space: nowrap;
  flex-shrink: 0;
}

.logout {
  height: 32px;
  min-width: 70px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .app-frame {
    width: min(768px, calc(100vw - 32px));
    min-height: auto;
  }

  .app-nav {
    grid-template-columns: 155px 1fr 115px;
    padding: 0 18px;
  }

  .nav-tab {
    padding: 0 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .app-frame {
    width: 100vw;
    min-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }

  .app-nav {
    display: none;
  }

  .bottom-tab {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    height: 74px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #ffffff;
    border-top: 1px solid #e5e7eb;
    box-shadow: 0 -8px 18px rgba(15, 23, 42, 0.08);
  }

  .bottom-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    color: #9ca3af;
    font-size: 11px;
    font-weight: 700;
  }

  .bottom-item.active {
    color: #2563eb;
  }
}
</style>

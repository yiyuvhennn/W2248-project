import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import LoginPage from '@/pages/auth/LoginPage.vue'
import RegisterPage from '@/pages/auth/RegisterPage.vue'
import OverviewPage from '@/pages/app/OverviewPage.vue'
import RecordsPage from '@/pages/app/RecordsPage.vue'
import StatsPage from '@/pages/app/StatsPage.vue'
import SettingsPage from '@/pages/app/SettingsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/app/overview' },
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/register', component: RegisterPage, meta: { guestOnly: true } },
    { path: '/app', redirect: '/app/overview', meta: { requiresAuth: true } },
    { path: '/app/overview', component: OverviewPage, meta: { requiresAuth: true, title: '月份總覽' } },
    { path: '/app/records', component: RecordsPage, meta: { requiresAuth: true, title: '記帳紀錄' } },
    { path: '/app/stats', component: StatsPage, meta: { requiresAuth: true, title: '統計分析' } },
    { path: '/app/settings', component: SettingsPage, meta: { requiresAuth: true, title: '設定' } }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.guestOnly && auth.isAuthenticated) return '/app/overview'
})

export default router

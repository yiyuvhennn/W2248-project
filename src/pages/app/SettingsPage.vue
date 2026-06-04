<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import CategoryModal from '@/components/settings/CategoryModal.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCategoriesStore } from '@/stores/categories.store'
import { useToastStore } from '@/stores/toast.store'
import { categoriesApi } from '@/api/categories.api'
import { getApiErrorMessage } from '@/api/http'
import type { Category, CategoryPayload } from '@/types/category'

const auth = useAuthStore()
const store = useCategoriesStore()
const toast = useToastStore()

type SettingTab = 'profile' | 'password' | 'categories' | 'export' | 'logout'

const active = ref<SettingTab>('profile')
const isMobileSettingsHome = ref(true)
const modalOpen = ref(false)
const editing = ref<Category | null>(null)
const deleting = ref<Category | null>(null)
const exportType = ref<'csv' | 'json'>('csv')
const startDate = ref('2026-01-01')
const endDate = ref('2026-03-06')
const profileName = ref(auth.user?.name || '測試用戶')
const profileEmail = ref(auth.user?.email || 'test@example.com')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const income = computed(() => store.categories.income)
const expense = computed(() => store.categories.expense)

const menus = [
  { key: 'profile', label: '個人資料', icon: 'fa-user' },
  { key: 'password', label: '修改密碼', icon: 'fa-lock' },
  { key: 'categories', label: '分類管理', icon: 'fa-tag' },
  { key: 'export', label: '資料匯出', icon: 'fa-download' },
  { key: 'logout', label: '登出帳號', icon: 'fa-right-from-bracket' }
] as const

const mobileTitle = computed(() => {
  if (active.value === 'profile') return '個人資料設定'
  if (active.value === 'password') return '修改密碼'
  if (active.value === 'categories') return '分類管理'
  if (active.value === 'export') return '資料匯出'
  return '設定'
})

const profileInitial = computed(() => {
  return profileName.value.trim().charAt(0) || '測'
})
function openMobileSetting(tab: SettingTab) {
  if (tab === 'logout') {
    auth.logout()
    toast.info('已登出帳號')
    location.href = '/login'
    return
  }

  active.value = tab
  isMobileSettingsHome.value = false
}

function backToMobileSettingsHome() {
  isMobileSettingsHome.value = true
}
function openCreate() {
  editing.value = null
  modalOpen.value = true
}

function openEdit(category: Category) {
  editing.value = category
  modalOpen.value = true
}

async function saveCategory(payload: CategoryPayload) {
  try {
    if (editing.value) {
      await categoriesApi.update(editing.value.id, payload)
      toast.success('已更新分類')
    } else {
      await categoriesApi.create(payload)
      toast.success('已新增分類')
    }

    modalOpen.value = false
    editing.value = null
    await store.fetchCategories()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

async function confirmDelete() {
  if (!deleting.value) return

  try {
    await categoriesApi.remove(deleting.value.id)
    toast.success('已刪除分類')
    deleting.value = null
    await store.fetchCategories()
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

function menuClick(key: SettingTab) {
  if (key === 'logout') {
    auth.logout()
    toast.info('已登出帳號')
    location.href = '/login'
    return
  }

  active.value = key
}

async function saveProfile() {
  const name = profileName.value.trim()

  if (!name) {
    toast.error('請輸入姓名')
    return
  }

  if (name.length > 50) {
    toast.error('姓名不可超過 50 字')
    return
  }

  try {
    const user = await auth.updateProfile({
      name,
    })

    profileName.value = user.name
    profileEmail.value = user.email

    toast.success('個人資料已儲存')
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

async function updatePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    toast.error('請完整輸入密碼欄位')
    return
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword.value)) {
    toast.error('新密碼至少 8 碼，且需包含英文字母與數字')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('兩次密碼不相符')
    return
  }

  try {
    const response = await auth.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    toast.success(response.message)
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

async function requestDeleteAccount() {
  const confirmed = window.confirm('刪除帳號後將無法復原，確定要繼續嗎？')

  if (!confirmed) return

  const password = window.prompt('請輸入目前密碼以確認刪除帳號')

  if (password === null) return

  if (!password) {
    toast.error('請輸入密碼')
    return
  }

  try {
    const response = await auth.deleteAccount({
      password,
    })

    toast.success(response.message)
    location.href = '/login'
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}

function fakeAction() {
  toast.info('更換大頭照尚未列入 API 規格，暫以前端提示呈現')
}

function download() {
  toast.success(exportType.value === 'csv' ? '已下載 CSV 檔案' : '已匯出 JSON 設定資料')
}

function categoryEmoji(category: Category) {
  const name = category.name

  if (name.includes('食品') || name.includes('餐飲') || name.includes('餐')) return '🍔'
  if (name.includes('交通') || name.includes('車')) return '🚌'
  if (name.includes('住房') || name.includes('房') || name.includes('租')) return '🏠'
  if (name.includes('娛樂') || name.includes('休閒')) return '🎮'
  if (name.includes('購物')) return '🛒'
  if (name.includes('薪資') || name.includes('薪')) return '⚡'
  if (name.includes('其他')) return '⚡'

  return category.type === 'income' ? '⚡' : '🍔'
}

function categoryCount(category: Category) {
  const name = category.name

  if (name.includes('食品') || name.includes('餐飲')) return 5
  if (name.includes('交通')) return 3
  if (name.includes('住房') || name.includes('租')) return 1
  if (name.includes('娛樂')) return 2
  if (name.includes('購物')) return 4
  if (name.includes('薪資')) return 2

  return 1
}

onMounted(() => {
  store.fetchCategories()
})
</script>

<template>
  <AppShell>
    <main class="settings-page" :class="`settings-page--${active}`">
      <header class="mobile-header">
        <button class="mobile-back" type="button" @click="backToMobileSettingsHome">
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <h1>{{ mobileTitle }}</h1>

        <button
          v-if="active === 'categories'"
          class="mobile-add-btn"
          type="button"
          @click="openCreate"
        >
          + 新增
        </button>

        <span v-else class="mobile-header-spacer"></span>
      </header>

      <h1 class="settings-title">設定</h1>

      <div class="settings-layout">
        <nav class="settings-menu">
          <button
            v-for="m in menus"
            :key="m.key"
            type="button"
            :class="{ active: active === m.key, logout: m.key === 'logout' }"
            @click="menuClick(m.key)"
          >
            <i :class="['fa-solid', m.icon]"></i>
            <span>{{ m.label }}</span>
          </button>
        </nav>

        <section class="settings-main">
          <!-- 個人資料 -->
          <template v-if="active === 'profile'">
            <section class="setting-card profile-card">
              <header class="setting-card-head desktop-card-head">
                <div class="setting-head-title">
                  <i class="fa-solid fa-user"></i>
                  <div>
                    <h2>個人資料</h2>
                    <p>管理您的帳號基本資訊</p>
                  </div>
                </div>
              </header>

              <div class="profile-body">
                <div class="profile-avatar-row">
                  <div class="profile-avatar">{{ profileInitial }}</div>

                  <div class="profile-name-block">
                    <h3>{{ profileName }}</h3>
                    <p>{{ profileEmail }}</p>
                    <button class="small-outline-btn" type="button" @click="fakeAction">
                      <i class="fa-solid fa-pen"></i>
                      更換大頭照
                    </button>
                  </div>
                </div>

                <div class="profile-form-grid">
                  <label class="form-field">
                    <span>姓名</span>
                    <div class="input-box">
                      <i class="fa-solid fa-user"></i>
                      <input v-model="profileName" type="text" />
                    </div>
                  </label>

                  <label class="form-field">
                    <span>電子信箱</span>
                    <div class="input-box">
                      <i class="fa-solid fa-envelope"></i>
                      <input v-model="profileEmail" type="email" disabled />
                    </div>
                  </label>
                </div>
              </div>

              <footer class="card-footer desktop-footer">
                <button class="ghost-btn" type="button">取消</button>
                <button class="primary-btn" type="button" @click="saveProfile">
                  <i class="fa-solid fa-check"></i>
                  儲存變更
                </button>
              </footer>
            </section>

            <section class="danger-box desktop-danger">
              <div class="danger-title">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <h3>危險操作</h3>
                  <p>以下操作無法復原，請謹慎操作</p>
                </div>
              </div>

              <button class="danger-btn" type="button" @click="requestDeleteAccount">
                <i class="fa-solid fa-trash"></i>
                刪除帳號及所有資料
              </button>
            </section>

            <section class="mobile-profile-panel">
              <div class="mobile-avatar-card">
                <div class="profile-avatar">{{ profileInitial }}</div>
                <button class="small-outline-btn" type="button" @click="fakeAction"">
                  <i class="fa-solid fa-pen"></i>
                  更換大頭照
                </button>
              </div>

              <div class="mobile-form-card">
                <label class="mobile-form-field">
                  <span>姓名</span>
                  <input v-model="profileName" type="text" />
                </label>

                <label class="mobile-form-field">
                  <span>電子信箱</span>
                  <input v-model="profileEmail" type="email" disabled />
                </label>
              </div>

              <button class="mobile-full-primary" type="button" @click="saveProfile">
                <i class="fa-solid fa-check"></i>
                儲存
              </button>
            </section>
          </template>

          <!-- 修改密碼 -->
          <template v-else-if="active === 'password'">
            <section class="setting-card password-card">
              <header class="setting-card-head">
                <div class="setting-head-title">
                  <i class="fa-solid fa-lock"></i>
                  <div>
                    <h2>修改密碼</h2>
                    <p>定期更換密碼保護帳號安全</p>
                  </div>
                </div>
              </header>

              <div class="password-body">
                <label class="form-field full">
                  <span>目前密碼</span>
                  <div class="input-box">
                    <i class="fa-solid fa-lock"></i>
                    <input v-model="currentPassword" type="password" placeholder="輸入目前密碼" />
                    <i class="fa-solid fa-eye eye-icon"></i>
                  </div>
                </label>

                <div class="password-grid">
                  <label class="form-field">
                    <span>新密碼</span>
                    <div class="input-box">
                      <i class="fa-solid fa-lock"></i>
                      <input v-model="newPassword" type="password" placeholder="至少 8 個字元" />
                      <i class="fa-solid fa-eye eye-icon"></i>
                    </div>
                  </label>

                  <label class="form-field">
                    <span>確認新密碼</span>
                    <div class="input-box">
                      <i class="fa-solid fa-lock"></i>
                      <input v-model="confirmPassword" type="password" placeholder="再輸入一次" />
                      <i class="fa-solid fa-eye eye-icon"></i>
                    </div>
                  </label>
                </div>
              </div>

              <footer class="card-footer">
                <button class="primary-btn" type="button" @click="updatePassword">
                  <i class="fa-solid fa-check"></i>
                  更新密碼
                </button>
              </footer>
            </section>
          </template>

          <!-- 分類管理 -->
          <template v-else-if="active === 'categories'">
            <section class="setting-card categories-card">
              <header class="setting-card-head categories-head">
                <div class="setting-head-title">
                  <i class="fa-solid fa-tag"></i>
                  <div>
                    <h2>分類管理</h2>
                    <p>管理您的收支分類，新增或刪除自訂分類</p>
                  </div>
                </div>

                <button class="primary-btn add-category-btn" type="button" @click="openCreate">
                  <i class="fa-solid fa-plus"></i>
                  新增分類
                </button>
              </header>

              <div class="category-group">
                <div class="category-group-title">支出分類</div>

                <div
                  v-for="cat in expense"
                  :key="cat.id"
                  class="category-row"
                >
                  <span class="category-dot" :style="{ background: cat.color }"></span>

                  <span
                    class="category-emoji"
                    :style="{ background: `${cat.color}22` }"
                  >
                    {{ categoryEmoji(cat) }}
                  </span>

                  <strong>{{ cat.name }}</strong>

                  <small>{{ categoryCount(cat) }} 筆紀錄</small>

                  <button class="mini-action" type="button" @click="openEdit(cat)">
                    <i class="fa-solid fa-pen"></i>
                  </button>

                  <button class="mini-action delete" type="button" @click="deleting = cat">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              <div class="category-group">
                <div class="category-group-title">收入分類</div>

                <div
                  v-for="cat in income"
                  :key="cat.id"
                  class="category-row"
                >
                  <span class="category-dot" :style="{ background: cat.color }"></span>

                  <span
                    class="category-emoji"
                    :style="{ background: `${cat.color}22` }"
                  >
                    {{ categoryEmoji(cat) }}
                  </span>

                  <strong>{{ cat.name }}</strong>

                  <small>{{ categoryCount(cat) }} 筆紀錄</small>

                  <button class="mini-action" type="button" @click="openEdit(cat)">
                    <i class="fa-solid fa-pen"></i>
                  </button>

                  <button class="mini-action delete" type="button" @click="deleting = cat">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </section>
          </template>

          <!-- 資料匯出 -->
          <template v-else-if="active === 'export'">
            <section class="setting-card export-card">
              <header class="setting-card-head">
                <div class="setting-head-title">
                  <i class="fa-solid fa-download"></i>
                  <div>
                    <h2>資料匯出</h2>
                    <p>將記帳紀錄匯出為檔案，方便備份或分析</p>
                  </div>
                </div>
              </header>

              <div class="export-body">
                <div class="export-date-grid">
                  <label class="form-field">
                    <span>起始日期</span>
                    <div class="input-box">
                      <i class="fa-regular fa-calendar"></i>
                      <input v-model="startDate" type="date" />
                    </div>
                  </label>

                  <label class="form-field">
                    <span>結束日期</span>
                    <div class="input-box">
                      <i class="fa-regular fa-calendar"></i>
                      <input v-model="endDate" type="date" />
                    </div>
                  </label>
                </div>

                <div class="format-label">匯出格式</div>

                <div class="export-format-grid">
                  <button
                    class="export-format"
                    :class="{ active: exportType === 'csv' }"
                    type="button"
                    @click="exportType = 'csv'"
                  >
                    <span class="format-icon">📊</span>
                    <strong>CSV</strong>
                    <small>Excel 相容格式</small>
                  </button>

                  <button
                    class="export-format"
                    :class="{ active: exportType === 'json' }"
                    type="button"
                    @click="exportType = 'json'"
                  >
                    <span class="format-icon">📄</span>
                    <strong>JSON</strong>
                    <small>原始資料格式</small>
                  </button>
                </div>

                <div class="export-info">
                  共找到 <strong>23 筆紀錄</strong>（2026/01/01 - 2026/03/06）
                </div>
              </div>

              <footer class="card-footer">
                <button class="primary-btn export-download-btn" type="button" @click="download">
                  <i class="fa-solid fa-download"></i>
                  下載 {{ exportType.toUpperCase() }} 檔案
                </button>
              </footer>
            </section>
          </template>
        </section>
      </div>
    </main>

    <CategoryModal
      :open="modalOpen"
      :category="editing"
      @close="modalOpen = false; editing = null"
      @save="saveCategory"
    />

    <ConfirmDialog
      :open="!!deleting"
      title="確定要刪除此分類嗎？"
      message="若分類底下仍有紀錄，API 會拒絕刪除。"
      confirm-text="刪除"
      danger
      @close="deleting = null"
      @confirm="confirmDelete"
    />
  </AppShell>
</template>

<style scoped>
.settings-page {
  width: 100%;
  min-height: calc(100vh - 64px);
  background: #f9fafb;
  color: #111827;
  padding: 32px 48px 80px;
}

.settings-title {
  margin: 0 0 28px;
  font-size: 32px;
  line-height: 40px;
  font-weight: 900;
  color: #111827;
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 970px);
  gap: 24px;
  align-items: start;
}

.mobile-header {
  display: none;
}

/* sidebar */
.settings-menu {
  width: 220px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.settings-menu button {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.settings-menu button + button {
  margin-top: 6px;
}

.settings-menu i {
  width: 16px;
  color: #4b5563;
  text-align: center;
}

.settings-menu button.active {
  background: #dbeafe;
  color: #2563eb;
}

.settings-menu button.active i {
  color: #2563eb;
}

.settings-menu button.logout {
  margin-top: 10px;
  padding-top: 0;
  border-top: 1px solid #e5e7eb;
  color: #ef4444;
}

.settings-menu button.logout i {
  color: #ef4444;
}

/* main */
.settings-main {
  width: 100%;
  min-width: 0;
}

.setting-card {
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.setting-card-head {
  min-height: 76px;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-head-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.setting-head-title > i {
  width: 18px;
  color: #2563eb;
  font-size: 15px;
  text-align: center;
}

.setting-head-title h2 {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
  color: #111827;
}

.setting-head-title p {
  margin: 2px 0 0;
  color: #9ca3af;
  font-size: 13px;
  line-height: 18px;
}

/* buttons */
.primary-btn {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 7px;
  background: #2563eb;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.ghost-btn {
  height: 40px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.small-outline-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

/* form */
.form-field {
  display: block;
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 800;
}

.form-field > span {
  display: block;
  margin-bottom: 7px;
}

.input-box {
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-box i {
  color: #9ca3af;
  font-size: 13px;
}

.input-box input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.input-box input::placeholder {
  color: #9ca3af;
}

.eye-icon {
  margin-left: auto;
}

.card-footer {
  height: 72px;
  padding: 0 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* profile */
.profile-body {
  padding: 24px;
}

.profile-avatar-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  background: #dbeafe;
  border: 3px solid #fff;
  color: #2563eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  flex: 0 0 auto;
}

.profile-name-block h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
}

.profile-name-block p {
  margin: 2px 0 8px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 18px;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mobile-profile-panel {
  display: none;
}

/* danger */
.danger-box {
  margin-top: 20px;
  padding: 22px;
  border: 2px solid #ef4444;
  border-radius: 12px;
  background: #fee2e2;
}

.danger-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.danger-title i {
  margin-top: 3px;
  color: #ef4444;
}

.danger-title h3 {
  margin: 0;
  color: #ef4444;
  font-size: 16px;
  line-height: 22px;
  font-weight: 900;
}

.danger-title p {
  margin: 4px 0 16px;
  color: #6b7280;
  font-size: 13px;
  line-height: 20px;
}

.danger-btn {
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 7px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* password */
.password-body {
  padding: 24px;
}

.password-body .full {
  margin-bottom: 20px;
}

.password-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* categories */
.categories-head {
  min-height: 86px;
}

.category-group-title {
  height: 36px;
  padding: 0 24px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
}

.category-row {
  min-height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid #f1f5f9;
  display: grid;
  grid-template-columns: 10px 36px 1fr auto 34px 34px;
  align-items: center;
  gap: 14px;
}

.category-row:last-child {
  border-bottom: 0;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.category-emoji {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.category-row strong {
  color: #111827;
  font-size: 15px;
  font-weight: 900;
}

.category-row small {
  color: #9ca3af;
  font-size: 13px;
  white-space: nowrap;
}

.mini-action {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mini-action.delete {
  color: #ef4444;
}

/* export */
.export-body {
  padding: 24px;
}

.export-date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.format-label {
  margin: 18px 0 7px;
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 800;
}

.export-format-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.export-format {
  height: 112px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
}

.export-format.active {
  border: 2px solid #2563eb;
  background: #dbeafe;
}

.format-icon {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 6px;
}

.export-format strong {
  color: #2563eb;
  font-size: 15px;
  font-weight: 900;
  line-height: 20px;
}

.export-format small {
  color: #9ca3af;
  font-size: 13px;
  line-height: 20px;
}

.export-info {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 16px;
  border-radius: 7px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.export-info strong {
  font-weight: 900;
}

/* tablet 768 */
@media (min-width: 481px) and (max-width: 900px) {
  .settings-page {
    min-height: calc(100vh - 64px);
    padding: 28px 72px 96px 72px;
  }

  .settings-title {
    margin-bottom: 26px;
    font-size: 26px;
    line-height: 34px;
  }

  .settings-layout {
    display: block;
    width: 100%;
  }

  .settings-menu {
    width: 100%;
    height: 44px;
    padding: 0;
    margin: 0 0 18px;
    background: transparent;
    border: 0;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    align-items: flex-end;
    gap: 0;
  }

  .settings-menu button {
    width: auto;
    height: 44px;
    padding: 0 16px;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #6b7280;
    display: inline-flex;
    justify-content: center;
  }

  .settings-menu button i {
    display: none;
  }

  .settings-menu button.active {
    background: transparent;
    border-bottom-color: #2563eb;
    color: #2563eb;
  }

  .settings-menu button.logout {
    display: none;
  }

  .settings-main {
    width: 100%;
  }

  .desktop-card-head {
    min-height: 52px;
  }

  .setting-card-head {
    min-height: 52px;
    padding: 0 18px;
  }

  .setting-head-title h2 {
    font-size: 15px;
    line-height: 22px;
  }

  .setting-head-title p {
    display: none;
  }

  .profile-body,
  .password-body,
  .export-body {
    padding: 18px;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .password-grid,
  .export-date-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-footer {
    height: 70px;
    padding: 0 18px;
  }

  .danger-box {
    padding: 18px;
  }

  .category-row {
    padding: 0 18px;
    grid-template-columns: 10px 36px 1fr auto 34px 34px;
  }
}

/* mobile 375 */
@media (max-width: 480px) {
  .settings-page {
    min-height: 100vh;
    padding: 0 16px 32px;
    background: #f9fafb;
  }

  .mobile-header {
    height: 52px;
    margin: 0 -16px;
    padding: 0 16px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    display: grid;
    grid-template-columns: 36px 1fr 72px;
    align-items: center;
  }

  .mobile-header h1 {
    margin: 0;
    text-align: center;
    color: #111827;
    font-size: 20px;
    line-height: 28px;
    font-weight: 900;
  }

  .mobile-back {
    width: 32px;
    height: 32px;
    border: 0;
    background: transparent;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 14px;
  }

  .mobile-header-spacer {
    display: block;
  }

  .mobile-add-btn {
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-size: 13px;
    font-weight: 900;
  }

  .settings-title,
  .settings-menu {
    display: none;
  }

  .settings-layout {
    display: block;
  }

  .settings-main {
    width: 100%;
  }

  .desktop-card-head,
  .desktop-footer,
  .desktop-danger,
  .profile-card {
    display: none;
  }

  .mobile-profile-panel {
    display: block;
    padding-top: 14px;
  }

  .mobile-avatar-card {
    min-height: 136px;
    padding: 22px 16px 16px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-avatar-card .profile-avatar {
    width: 58px;
    height: 58px;
    font-size: 30px;
  }

  .mobile-form-card {
    padding: 16px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }

  .mobile-form-field {
    display: block;
    color: #374151;
    font-size: 13px;
    font-weight: 800;
  }

  .mobile-form-field + .mobile-form-field {
    margin-top: 16px;
  }

  .mobile-form-field span {
    display: block;
    margin-bottom: 7px;
  }

  .mobile-form-field input {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    color: #111827;
    font-size: 14px;
    outline: none;
  }

  .mobile-full-primary {
    width: 100%;
    height: 46px;
    border: 0;
    border-radius: 7px;
    background: #2563eb;
    color: #fff;
    font-size: 15px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .setting-card {
    margin-top: 14px;
    border-radius: 12px;
  }

  .setting-card-head {
    display: none;
  }

  .password-body,
  .export-body {
    padding: 16px;
  }

  .password-grid,
  .export-date-grid,
  .export-format-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .password-body .full {
    margin-bottom: 16px;
  }

  .form-field > span {
    margin-bottom: 7px;
  }

  .input-box {
    height: 42px;
  }

  .card-footer {
    height: auto;
    padding: 0 16px 16px;
    border-top: 0;
  }

  .card-footer .primary-btn {
    width: 100%;
    height: 46px;
  }

  .categories-card {
    margin-top: 14px;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .categories-head {
    display: none;
  }

  .category-group {
    margin-bottom: 14px;
    background: #fff;
  }

  .category-group-title {
    height: 32px;
    padding: 0 14px;
    font-size: 12px;
  }

  .category-row {
    min-height: 64px;
    padding: 0 14px;
    grid-template-columns: 36px 1fr 34px 34px;
    gap: 12px;
    background: #fff;
  }

  .category-dot {
    display: none;
  }

  .category-emoji {
    width: 36px;
    height: 36px;
  }

  .category-row strong {
    font-size: 15px;
  }

  .category-row small {
    grid-column: 2;
    margin-top: -18px;
    font-size: 12px;
  }

  .export-format {
    height: 104px;
  }

  .export-info {
    min-height: 40px;
    font-size: 12px;
  }

  .export-download-btn {
    width: 100%;
  }
}
</style>
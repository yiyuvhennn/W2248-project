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

const startDate = ref('2026/01/01')
const endDate = ref('2026/03/06')

const profileForm = ref({
  name: auth.user?.name || '王小明',
  email: auth.user?.email || 'wangxm@example.com'
})

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const income = computed(() => store.categories.income)
const expense = computed(() => store.categories.expense)

const menus = [
  { key: 'profile', label: '個人資料', icon: 'fa-user', desc: '修改姓名與信箱' },
  { key: 'password', label: '修改密碼', icon: 'fa-lock', desc: '更換登入密碼' },
  { key: 'categories', label: '分類管理', icon: 'fa-tag', desc: '新增或刪除分類' },
  { key: 'export', label: '資料匯出', icon: 'fa-download', desc: '匯出為 CSV 格式' },
  { key: 'logout', label: '登出帳號', icon: 'fa-right-from-bracket', desc: '' }
] as const

const mobileTitle = computed(() => {
  if (active.value === 'profile') return '個人資料設定'
  if (active.value === 'password') return '修改密碼'
  if (active.value === 'categories') return '分類管理'
  if (active.value === 'export') return '資料匯出'
  return '設定'
})

const profileInitial = computed(() => {
  return profileForm.value.name.trim().charAt(0) || '王'
})

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

function logout() {
  auth.logout()
  toast.info('已登出帳號')
  location.href = '/login'
}

function menuClick(key: SettingTab) {
  if (key === 'logout') {
    logout()
    return
  }

  active.value = key
}

function openMobileSetting(key: SettingTab) {
  if (key === 'logout') {
    logout()
    return
  }

  active.value = key
  isMobileSettingsHome.value = false
}

function backToMobileSettingsHome() {
  isMobileSettingsHome.value = true
}

function saveProfile() {
  toast.success('個人資料已儲存')
}

function updatePassword() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    toast.error('請完整輸入密碼欄位')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('兩次密碼不相符')
    return
  }

  toast.success('密碼已更新')
}

function fakeAction() {
  toast.info('此功能依 API 文件目前先以前端提示呈現')
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

  if (name.includes('食品') || name.includes('餐飲') || name.includes('餐')) return 5
  if (name.includes('交通')) return 3
  if (name.includes('住房') || name.includes('房') || name.includes('租')) return 1
  if (name.includes('娛樂')) return 2
  if (name.includes('購物')) return 4
  if (name.includes('薪資') || name.includes('薪')) return 2

  return 1
}

onMounted(() => {
  store.fetchCategories()
})
</script>

<template>
  <AppShell>
    <main class="settings-page">
      <!-- desktop / tablet -->
      <section class="desktop-settings">
        <h1 class="settings-title">設定</h1>

        <div class="settings-layout">
          <aside class="settings-menu">
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
          </aside>

          <section class="settings-content">
            <!-- 個人資料 -->
            <template v-if="active === 'profile'">
              <section class="setting-card profile-card">
                <header class="setting-card-head">
                  <div class="setting-head-title">
                    <i class="fa-solid fa-user"></i>
                    <div>
                      <h2>個人資料</h2>
                      <p>管理您的帳號基本資訊</p>
                    </div>
                  </div>
                </header>

                <div class="profile-body">
                  <div class="profile-top">
                    <div class="profile-avatar">{{ profileInitial }}</div>

                    <div class="profile-meta">
                      <h3>{{ profileForm.name }}</h3>
                      <p>{{ profileForm.email }}</p>
                      <button class="small-outline-btn" type="button" @click="fakeAction">
                        <i class="fa-solid fa-pen"></i>
                        更換大頭照
                      </button>
                    </div>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span>姓名</span>
                      <div class="input-box">
                        <i class="fa-solid fa-user"></i>
                        <input v-model="profileForm.name" type="text" />
                      </div>
                    </label>

                    <label class="field">
                      <span>電子信箱</span>
                      <div class="input-box">
                        <i class="fa-solid fa-envelope"></i>
                        <input v-model="profileForm.email" type="email" />
                      </div>
                    </label>
                  </div>
                </div>

                <footer class="card-footer">
                  <button class="ghost-btn" type="button">取消</button>
                  <button class="primary-btn" type="button" @click="saveProfile">
                    <i class="fa-solid fa-check"></i>
                    儲存變更
                  </button>
                </footer>
              </section>

              <section class="danger-zone">
                <div class="danger-copy">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <h3>危險操作</h3>
                    <p>以下操作無法復原，請謹慎操作</p>
                  </div>
                </div>

                <button class="danger-btn" type="button" @click="fakeAction">
                  <i class="fa-solid fa-trash"></i>
                  刪除帳號及所有資料
                </button>
              </section>
            </template>

            <!-- 修改密碼 -->
            <template v-if="active === 'password'">
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
                  <label class="field field-full">
                    <span>目前密碼</span>
                    <div class="input-box">
                      <i class="fa-solid fa-lock"></i>
                      <input v-model="currentPassword" type="password" placeholder="輸入目前密碼" />
                      <i class="fa-solid fa-eye input-eye"></i>
                    </div>
                  </label>

                  <div class="form-grid">
                    <label class="field">
                      <span>新密碼</span>
                      <div class="input-box">
                        <i class="fa-solid fa-lock"></i>
                        <input v-model="newPassword" type="password" placeholder="至少 8 個字元" />
                        <i class="fa-solid fa-eye input-eye"></i>
                      </div>
                    </label>

                    <label class="field">
                      <span>確認新密碼</span>
                      <div class="input-box">
                        <i class="fa-solid fa-lock"></i>
                        <input v-model="confirmPassword" type="password" placeholder="再輸入一次" />
                        <i class="fa-solid fa-eye input-eye"></i>
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
            <template v-if="active === 'categories'">
              <section class="setting-card category-card">
                <header class="setting-card-head">
                  <div class="setting-head-title">
                    <i class="fa-solid fa-tag"></i>
                    <div>
                      <h2>分類管理</h2>
                      <p>管理您的收支分類，新增或刪除自訂分類</p>
                    </div>
                  </div>

                  <button class="primary-btn" type="button" @click="openCreate">
                    <i class="fa-solid fa-plus"></i>
                    新增分類
                  </button>
                </header>

                <div class="category-group-title">支出分類</div>

                <div
                  v-for="cat in expense"
                  :key="cat.id"
                  class="category-row"
                >
                  <span class="color-dot" :style="{ background: cat.color }"></span>

                  <span
                    class="cat-icon"
                    :style="{ background: cat.color + '22' }"
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

                <div class="category-group-title">收入分類</div>

                <div
                  v-for="cat in income"
                  :key="cat.id"
                  class="category-row"
                >
                  <span class="color-dot" :style="{ background: cat.color }"></span>

                  <span
                    class="cat-icon"
                    :style="{ background: cat.color + '22' }"
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
              </section>
            </template>

            <!-- 資料匯出 -->
            <template v-if="active === 'export'">
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
                  <div class="form-grid">
                    <label class="field">
                      <span>起始日期</span>
                      <div class="input-box">
                        <i class="fa-regular fa-calendar"></i>
                        <input v-model="startDate" type="text" />
                      </div>
                    </label>

                    <label class="field">
                      <span>結束日期</span>
                      <div class="input-box">
                        <i class="fa-regular fa-calendar"></i>
                        <input v-model="endDate" type="text" />
                      </div>
                    </label>
                  </div>

                  <p class="export-label">匯出格式</p>

                  <div class="format-grid">
                    <button
                      type="button"
                      :class="{ active: exportType === 'csv' }"
                      @click="exportType = 'csv'"
                    >
                      <i class="fa-solid fa-chart-column csv-icon"></i>
                      <strong>CSV</strong>
                      <small>Excel 相容格式</small>
                    </button>

                    <button
                      type="button"
                      :class="{ active: exportType === 'json' }"
                      @click="exportType = 'json'"
                    >
                      <i class="fa-solid fa-file json-icon"></i>
                      <strong>JSON</strong>
                      <small>原始資料格式</small>
                    </button>
                  </div>

                  <div class="export-info">共找到 23 筆紀錄（2026/01/01 - 2026/03/06）</div>
                </div>

                <footer class="card-footer">
                  <button class="primary-btn" type="button" @click="download">
                    <i class="fa-solid fa-download"></i>
                    下載 {{ exportType.toUpperCase() }} 檔案
                  </button>
                </footer>
              </section>
            </template>
          </section>
        </div>
      </section>

      <!-- mobile -->
      <section class="mobile-settings">
        <!-- mobile 設定首頁 -->
        <template v-if="isMobileSettingsHome">
          <header class="mobile-home-head">
            <h1>設定</h1>
          </header>

          <section class="mobile-profile-summary">
            <div class="mobile-avatar">{{ profileInitial }}</div>
            <h2>{{ profileForm.name }}</h2>
            <p>{{ profileForm.email }}</p>
          </section>

          <section class="mobile-menu-card">
            <p class="mobile-group-label">帳號設定</p>

            <button type="button" class="mobile-menu-item" @click="openMobileSetting('profile')">
              <span class="mobile-item-icon">
                <i class="fa-solid fa-user"></i>
              </span>
              <span>
                <strong>個人資料</strong>
                <small>修改姓名與信箱</small>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>

            <button type="button" class="mobile-menu-item" @click="openMobileSetting('password')">
              <span class="mobile-item-icon">
                <i class="fa-solid fa-lock"></i>
              </span>
              <span>
                <strong>修改密碼</strong>
                <small>更換登入密碼</small>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </section>

          <section class="mobile-menu-card">
            <p class="mobile-group-label">資料管理</p>

            <button type="button" class="mobile-menu-item" @click="openMobileSetting('categories')">
              <span class="mobile-item-icon">
                <i class="fa-solid fa-tag"></i>
              </span>
              <span>
                <strong>分類管理</strong>
                <small>新增或刪除分類</small>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>

            <button type="button" class="mobile-menu-item" @click="openMobileSetting('export')">
              <span class="mobile-item-icon">
                <i class="fa-solid fa-download"></i>
              </span>
              <span>
                <strong>資料匯出</strong>
                <small>匯出為 CSV 格式</small>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </section>

          <section class="mobile-menu-card">
            <button type="button" class="mobile-menu-item mobile-logout" @click="openMobileSetting('logout')">
              <span class="mobile-item-icon danger">
                <i class="fa-solid fa-right-from-bracket"></i>
              </span>
              <span>
                <strong>登出帳號</strong>
              </span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </section>

          <section class="mobile-danger-box">
            <h3>危險操作</h3>
            <p>以下操作無法復原，請謹慎操作</p>
            <button type="button" @click="fakeAction">
              <i class="fa-solid fa-trash"></i>
              刪除帳號及所有資料
            </button>
          </section>
        </template>

        <!-- mobile 子頁面 -->
        <template v-else>
          <header class="mobile-detail-head">
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

            <span v-else></span>
          </header>

          <!-- mobile 個人資料 -->
          <template v-if="active === 'profile'">
            <section class="mobile-avatar-card">
              <div class="mobile-avatar">{{ profileInitial }}</div>
              <button class="small-outline-btn" type="button" @click="fakeAction">
                <i class="fa-solid fa-pen"></i>
                更換大頭照
              </button>
            </section>

            <section class="mobile-form-card">
              <label class="field">
                <span>姓名</span>
                <div class="mobile-input">
                  <input v-model="profileForm.name" type="text" />
                </div>
              </label>

              <label class="field">
                <span>電子信箱</span>
                <div class="mobile-input">
                  <input v-model="profileForm.email" type="email" />
                </div>
              </label>
            </section>

            <button class="mobile-primary-full" type="button" @click="saveProfile">
              <i class="fa-solid fa-check"></i>
              儲存
            </button>
          </template>

          <!-- mobile 修改密碼 -->
          <template v-if="active === 'password'">
            <section class="mobile-form-card">
              <label class="field">
                <span>目前密碼</span>
                <div class="mobile-input with-icon">
                  <i class="fa-solid fa-lock"></i>
                  <input v-model="currentPassword" type="password" placeholder="輸入目前密碼" />
                  <i class="fa-solid fa-eye input-eye"></i>
                </div>
              </label>

              <label class="field">
                <span>新密碼</span>
                <div class="mobile-input with-icon">
                  <i class="fa-solid fa-lock"></i>
                  <input v-model="newPassword" type="password" placeholder="至少 8 個字元" />
                  <i class="fa-solid fa-eye input-eye"></i>
                </div>
              </label>

              <label class="field">
                <span>確認新密碼</span>
                <div class="mobile-input with-icon">
                  <i class="fa-solid fa-lock"></i>
                  <input v-model="confirmPassword" type="password" placeholder="再輸入一次" />
                  <i class="fa-solid fa-eye input-eye"></i>
                </div>
              </label>
            </section>

            <button class="mobile-primary-full" type="button" @click="updatePassword">
              <i class="fa-solid fa-check"></i>
              更新密碼
            </button>
          </template>

          <!-- mobile 分類管理 -->
          <template v-if="active === 'categories'">
            <section class="mobile-category-list">
              <div class="category-group-title">支出分類</div>

              <div
                v-for="cat in expense"
                :key="cat.id"
                class="mobile-category-row"
              >
                <span
                  class="cat-icon"
                  :style="{ background: cat.color + '22' }"
                >
                  {{ categoryEmoji(cat) }}
                </span>

                <div>
                  <strong>{{ cat.name }}</strong>
                  <small>{{ categoryCount(cat) }} 筆紀錄</small>
                </div>

                <button class="mini-action" type="button" @click="openEdit(cat)">
                  <i class="fa-solid fa-pen"></i>
                </button>

                <button class="mini-action delete" type="button" @click="deleting = cat">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>

              <div class="category-group-title">收入分類</div>

              <div
                v-for="cat in income"
                :key="cat.id"
                class="mobile-category-row"
              >
                <span
                  class="cat-icon"
                  :style="{ background: cat.color + '22' }"
                >
                  {{ categoryEmoji(cat) }}
                </span>

                <div>
                  <strong>{{ cat.name }}</strong>
                  <small>{{ categoryCount(cat) }} 筆紀錄</small>
                </div>

                <button class="mini-action" type="button" @click="openEdit(cat)">
                  <i class="fa-solid fa-pen"></i>
                </button>

                <button class="mini-action delete" type="button" @click="deleting = cat">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </section>
          </template>

          <!-- mobile 資料匯出 -->
          <template v-if="active === 'export'">
            <section class="mobile-form-card">
              <label class="field">
                <span>起始日期</span>
                <div class="mobile-input with-icon">
                  <i class="fa-regular fa-calendar"></i>
                  <input v-model="startDate" type="text" />
                </div>
              </label>

              <label class="field">
                <span>結束日期</span>
                <div class="mobile-input with-icon">
                  <i class="fa-regular fa-calendar"></i>
                  <input v-model="endDate" type="text" />
                </div>
              </label>
            </section>

            <section class="mobile-form-card">
              <p class="export-label">匯出格式</p>

              <div class="format-grid mobile-format-grid">
                <button
                  type="button"
                  :class="{ active: exportType === 'csv' }"
                  @click="exportType = 'csv'"
                >
                  <i class="fa-solid fa-chart-column csv-icon"></i>
                  <strong>CSV</strong>
                  <small>Excel 相容格式</small>
                </button>

                <button
                  type="button"
                  :class="{ active: exportType === 'json' }"
                  @click="exportType = 'json'"
                >
                  <i class="fa-solid fa-file json-icon"></i>
                  <strong>JSON</strong>
                  <small>原始資料格式</small>
                </button>
              </div>
            </section>

            <div class="export-info mobile-export-info">共找到 23 筆紀錄（2026/01/01 - 2026/03/06）</div>

            <button class="mobile-primary-full" type="button" @click="download">
              <i class="fa-solid fa-download"></i>
              下載 {{ exportType.toUpperCase() }} 檔案
            </button>
          </template>
        </template>
      </section>
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
  min-height: calc(100vh - 64px);
  background: #f9fafb;
  color: #111827;
  padding: 32px 32px 96px;
}

.desktop-settings {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.settings-title {
  margin: 0 0 28px;
  color: #111827;
  font-size: 32px;
  line-height: 40px;
  font-weight: 900;
}

.settings-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.settings-menu {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.settings-menu button {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  cursor: pointer;
  text-align: left;
}

.settings-menu button + button {
  margin-top: 6px;
}

.settings-menu button i {
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
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  color: #ef4444;
}

.settings-menu button.logout i {
  color: #ef4444;
}

.settings-content {
  min-width: 0;
}

.setting-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.setting-card-head {
  min-height: 76px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.setting-head-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.setting-head-title > i {
  color: #2563eb;
  font-size: 15px;
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
  font-size: 13px;
  line-height: 20px;
  color: #9ca3af;
}

.profile-body,
.password-body,
.export-body {
  padding: 24px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
}

.profile-avatar,
.mobile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  background: #dbeafe;
  color: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  flex-shrink: 0;
}

.profile-meta h3 {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  font-weight: 900;
  color: #111827;
}

.profile-meta p {
  margin: 2px 0 8px;
  font-size: 13px;
  line-height: 18px;
  color: #9ca3af;
}

.small-outline-btn {
  height: 28px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: block;
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 800;
}

.field-full {
  margin-bottom: 18px;
}

.input-box {
  margin-top: 7px;
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  color: #9ca3af;
}

.input-box i {
  color: #9ca3af;
  font-size: 13px;
}

.input-box input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.input-box input::placeholder {
  color: #9ca3af;
}

.input-eye {
  margin-left: auto;
}

.card-footer {
  min-height: 72px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
}

.ghost-btn {
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  border-radius: 7px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  height: 40px;
  border: 0;
  background: #2563eb;
  color: #fff;
  border-radius: 7px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.danger-zone {
  margin-top: 20px;
  border: 2px solid #ef4444;
  background: #fee2e2;
  border-radius: 12px;
  padding: 22px;
}

.danger-copy {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.danger-copy i {
  color: #ef4444;
  margin-top: 3px;
}

.danger-copy h3 {
  margin: 0;
  color: #ef4444;
  font-size: 16px;
  font-weight: 900;
}

.danger-copy p {
  margin: 4px 0 16px;
  color: #6b7280;
  font-size: 13px;
  line-height: 20px;
}

.danger-btn {
  height: 40px;
  border: 0;
  background: #ef4444;
  color: #fff;
  border-radius: 7px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.category-card {
  padding-bottom: 0;
}

.category-group-title {
  height: 34px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.category-row {
  min-height: 58px;
  border-bottom: 1px solid #f1f5f9;
  display: grid;
  grid-template-columns: 10px 36px 1fr 90px 32px 32px;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
}

.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.category-row strong,
.mobile-category-row strong {
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.category-row small,
.mobile-category-row small {
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}

.mini-action {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mini-action.delete {
  color: #ef4444;
}

.export-label {
  margin: 0 0 8px;
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.format-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.format-grid button {
  height: 96px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #6b7280;
  cursor: pointer;
}

.format-grid button.active {
  border: 2px solid #2563eb;
  background: #dbeafe;
  color: #2563eb;
}

.format-grid i {
  font-size: 24px;
}

.csv-icon {
  color: #16a34a;
}

.json-icon {
  color: #9ca3af;
}

.format-grid strong {
  font-size: 14px;
  color: #374151;
  font-weight: 900;
}

.format-grid small {
  font-size: 12px;
  color: #9ca3af;
}

.export-info {
  min-height: 36px;
  margin-top: 18px;
  background: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
}

.mobile-settings {
  display: none;
}

/* tablet */
@media (max-width: 1024px) {
  .settings-page {
    padding: 24px 24px 96px;
  }

  .desktop-settings {
    max-width: 768px;
  }

  .settings-layout {
    display: block;
  }

  .settings-title {
    margin-bottom: 24px;
  }

  .settings-menu {
    display: flex;
    gap: 0;
    padding: 0;
    margin-bottom: 20px;
    border: 0;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    overflow-x: auto;
  }

  .settings-menu button {
    width: auto;
    height: 44px;
    padding: 0 18px;
    border-radius: 0;
    background: transparent;
    white-space: nowrap;
    color: #6b7280;
  }

  .settings-menu button.active {
    background: transparent;
    color: #2563eb;
    border-bottom: 2px solid #2563eb;
  }

  .settings-menu button.logout {
    display: none;
  }

  .form-grid,
  .format-grid {
    grid-template-columns: 1fr;
  }

  .profile-top {
    align-items: flex-start;
  }
}

/* mobile */
@media (max-width: 480px) {
  .settings-page {
    min-height: calc(100vh - 72px);
    padding: 0 16px 96px;
    background: #f9fafb;
  }

  .desktop-settings {
    display: none;
  }

  .mobile-settings {
    display: block;
  }

  .mobile-home-head,
  .mobile-detail-head {
    height: 56px;
    margin: 0 -16px 16px;
    padding: 0 16px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .mobile-home-head {
    display: flex;
    align-items: center;
  }

  .mobile-home-head h1 {
    margin: 0;
    color: #111827;
    font-size: 20px;
    line-height: 28px;
    font-weight: 900;
  }

  .mobile-detail-head {
    display: grid;
    grid-template-columns: 48px 1fr 72px;
    align-items: center;
  }

  .mobile-detail-head h1 {
    margin: 0;
    text-align: center;
    color: #111827;
    font-size: 20px;
    line-height: 28px;
    font-weight: 900;
  }

  .mobile-back {
    width: 36px;
    height: 36px;
    border: 0;
    background: transparent;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
  }

  .mobile-add-btn {
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-size: 13px;
    font-weight: 900;
    cursor: pointer;
  }

  .mobile-profile-summary,
  .mobile-avatar-card,
  .mobile-form-card,
  .mobile-menu-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .mobile-profile-summary {
    height: 152px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .mobile-profile-summary h2 {
    margin: 8px 0 2px;
    color: #111827;
    font-size: 16px;
    font-weight: 900;
  }

  .mobile-profile-summary p {
    margin: 0;
    color: #9ca3af;
    font-size: 12px;
  }

  .mobile-menu-card {
    overflow: hidden;
    margin-bottom: 12px;
  }

  .mobile-group-label {
    height: 36px;
    margin: 0;
    padding: 0 16px;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    color: #6b7280;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
  }

  .mobile-menu-item {
    width: 100%;
    min-height: 68px;
    border: 0;
    border-bottom: 1px solid #f1f5f9;
    background: #fff;
    display: grid;
    grid-template-columns: 42px 1fr 18px;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    text-align: left;
    cursor: pointer;
  }

  .mobile-menu-item:last-child {
    border-bottom: 0;
  }

  .mobile-item-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f3f4f6;
    color: #111827;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-item-icon.danger {
    background: #fee2e2;
    color: #ef4444;
  }

  .mobile-menu-item strong {
    display: block;
    color: #111827;
    font-size: 14px;
    font-weight: 900;
    line-height: 20px;
  }

  .mobile-menu-item small {
    display: block;
    margin-top: 2px;
    color: #9ca3af;
    font-size: 12px;
    line-height: 16px;
  }

  .mobile-menu-item > i {
    color: #111827;
    font-size: 12px;
  }

  .mobile-logout strong,
  .mobile-logout > i {
    color: #ef4444;
  }

  .mobile-danger-box {
    margin-top: 12px;
    border: 2px solid #ef4444;
    background: #fee2e2;
    border-radius: 10px;
    padding: 14px;
  }

  .mobile-danger-box h3 {
    margin: 0;
    color: #ef4444;
    font-size: 15px;
    font-weight: 900;
  }

  .mobile-danger-box p {
    margin: 4px 0 12px;
    color: #6b7280;
    font-size: 12px;
  }

  .mobile-danger-box button {
    height: 36px;
    border: 0;
    border-radius: 7px;
    background: #ef4444;
    color: #fff;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 900;
  }

  .mobile-avatar-card {
    height: 136px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .mobile-form-card {
    padding: 14px;
    margin-bottom: 12px;
  }

  .mobile-form-card .field + .field {
    margin-top: 14px;
  }

  .mobile-input {
    margin-top: 7px;
    height: 42px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 10px;
  }

  .mobile-input.with-icon i {
    color: #9ca3af;
    font-size: 13px;
  }

  .mobile-input input {
    width: 100%;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: #111827;
    font-size: 14px;
    font-weight: 500;
  }

  .mobile-primary-full {
    width: 100%;
    height: 44px;
    border: 0;
    border-radius: 7px;
    background: #2563eb;
    color: #fff;
    font-size: 14px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }

  .mobile-category-list {
    background: transparent;
  }

  .mobile-category-row {
    min-height: 64px;
    background: #fff;
    border-bottom: 1px solid #f1f5f9;
    display: grid;
    grid-template-columns: 40px 1fr 32px 32px;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
  }

  .mobile-category-row small {
    display: block;
    margin-top: 2px;
    text-align: left;
  }

  .mobile-format-grid {
    grid-template-columns: 1fr;
  }

  .mobile-format-grid button {
    height: 104px;
  }

  .mobile-export-info {
    margin: 12px 0;
    min-height: 40px;
    font-size: 12px;
  }
}
</style>
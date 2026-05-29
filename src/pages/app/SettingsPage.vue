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
const active = ref<'profile' | 'password' | 'categories' | 'export' | 'logout'>('categories')
const modalOpen = ref(false)
const editing = ref<Category | null>(null)
const deleting = ref<Category | null>(null)
const exportType = ref<'csv' | 'json'>('csv')
const startDate = ref('2026-01-01')
const endDate = ref('2026-03-06')
const income = computed(() => store.categories.income)
const expense = computed(() => store.categories.expense)
const menus = [
  { key: 'profile', label: '個人資料', icon: 'fa-user' },
  { key: 'password', label: '修改密碼', icon: 'fa-lock' },
  { key: 'categories', label: '分類管理', icon: 'fa-tag' },
  { key: 'export', label: '資料匯出', icon: 'fa-download' },
  { key: 'logout', label: '登出帳號', icon: 'fa-right-from-bracket' }
] as const
function openCreate(){ editing.value = null; modalOpen.value = true }
function openEdit(category: Category){ editing.value = category; modalOpen.value = true }
async function saveCategory(payload: CategoryPayload){
  try {
    if (editing.value) { await categoriesApi.update(editing.value.id, payload); toast.success('已更新分類') }
    else { await categoriesApi.create(payload); toast.success('已新增分類') }
    modalOpen.value = false; editing.value = null; await store.fetchCategories()
  } catch(err){ toast.error(getApiErrorMessage(err)) }
}
async function confirmDelete(){
  if(!deleting.value) return
  try { await categoriesApi.remove(deleting.value.id); toast.success('已刪除分類'); deleting.value = null; await store.fetchCategories() }
  catch(err){ toast.error(getApiErrorMessage(err)) }
}
function menuClick(key: typeof menus[number]['key']){
  if(key === 'logout'){ auth.logout(); toast.info('已登出帳號'); location.href = '/login'; return }
  active.value = key
}
function fakeAction(){ toast.info('此功能依 API 文件目前先以前端提示呈現') }
function download(){ toast.success(exportType.value === 'csv' ? '已下載 CSV 檔案' : '已匯出 JSON 設定資料') }
onMounted(() => store.fetchCategories())
</script>
<template>
  <AppShell>
    <div class="page-container settings-page">
      <h1 class="h1">設定</h1>
      <div class="settings-layout">
        <aside class="settings-menu card">
          <button v-for="m in menus" :key="m.key" :class="{active: active===m.key, logout:m.key==='logout'}" @click="menuClick(m.key)"><i :class="['fa-solid', m.icon]"></i>{{ m.label }}</button>
        </aside>
        <section class="settings-content card">
          <template v-if="active==='profile'">
            <div class="settings-head"><div><h2 class="h3">個人資料</h2><p>更新您的顯示名稱與帳號資料</p></div><button class="primary-btn" @click="fakeAction">儲存變更</button></div>
            <div class="profile-box"><div class="avatar">王</div><div class="profile-form"><label>姓名<input :value="auth.user?.name || '王小明'" /></label><label>Email<input :value="auth.user?.email || 'user@example.com'" disabled /></label></div></div>
            <div class="danger-zone"><h3>危險操作</h3><p>刪除帳號及所有資料，此操作無法復原。</p><button class="danger-btn" @click="fakeAction">刪除帳號</button></div>
          </template>
          <template v-if="active==='password'">
            <div class="settings-head"><div><h2 class="h3">修改密碼</h2><p>請輸入舊密碼與新密碼</p></div></div>
            <div class="password-form"><label>目前密碼<input type="password" /></label><label>新密碼<input type="password" /></label><label>確認新密碼<input type="password" /></label><button class="primary-btn" @click="fakeAction">更新密碼</button></div>
          </template>
          <template v-if="active==='categories'">
            <div class="settings-head"><div><h2 class="h3">分類管理</h2><p>管理您的收支分類，新增或刪除自訂分類</p></div><button class="primary-btn" @click="openCreate"><i class="fa-solid fa-plus"></i>新增分類</button></div>
            <div class="category-section"><div class="category-title expense-dot">支出分類</div><div v-for="cat in expense" :key="cat.id" class="category-row"><span class="color-dot" :style="{background:cat.color}"></span><span class="cat-icon" :style="{background: cat.color+'22', color: cat.color}"><i :class="['fa-solid', cat.icon]"></i></span><strong>{{ cat.name }}</strong><small>{{ cat.name === '餐飲' ? 5 : cat.name === '交通' ? 3 : cat.name === '購物' ? 4 : cat.name === '娛樂' ? 2 : 1 }} 筆紀錄</small><button class="mini-action" @click="openEdit(cat)"><i class="fa-solid fa-pen"></i></button><button class="mini-action delete" @click="deleting=cat"><i class="fa-solid fa-trash"></i></button></div></div>
            <div class="category-section"><div class="category-title income-dot">收入分類</div><div v-for="cat in income" :key="cat.id" class="category-row"><span class="color-dot" :style="{background:cat.color}"></span><span class="cat-icon" :style="{background: cat.color+'22', color: cat.color}"><i :class="['fa-solid', cat.icon]"></i></span><strong>{{ cat.name }}</strong><small>{{ cat.name === '薪資' ? 2 : 1 }} 筆紀錄</small><button class="mini-action" @click="openEdit(cat)"><i class="fa-solid fa-pen"></i></button><button class="mini-action delete" @click="deleting=cat"><i class="fa-solid fa-trash"></i></button></div></div>
          </template>
          <template v-if="active==='export'">
            <div class="export-box">
              <div class="export-head"><i class="fa-solid fa-download"></i><div><h2 class="h3">資料匯出</h2><p>將記帳紀錄匯出為檔案，方便備份或分析</p></div></div>
              <div class="export-form"><label>起始日期<input v-model="startDate" type="date" /></label><label>結束日期<input v-model="endDate" type="date" /></label></div>
              <div class="format-title">匯出格式</div>
              <div class="format-grid"><button :class="{active:exportType==='csv'}" @click="exportType='csv'"><i class="fa-solid fa-chart-column"></i><strong>CSV</strong><small>Excel 相容格式</small></button><button :class="{active:exportType==='json'}" @click="exportType='json'"><i class="fa-solid fa-file"></i><strong>JSON</strong><small>原始資料格式</small></button></div>
              <div class="export-info">共找到 23 筆紀錄（2026/01/01 - 2026/03/06）</div>
              <div class="export-actions"><button class="primary-btn" @click="download"><i class="fa-solid fa-download"></i>下載 {{ exportType.toUpperCase() }} 檔案</button></div>
            </div>
          </template>
        </section>
      </div>
    </div>
    <CategoryModal :open="modalOpen" :category="editing" @close="modalOpen=false;editing=null" @save="saveCategory" />
    <ConfirmDialog :open="!!deleting" title="確定要刪除此分類嗎？" message="若分類底下仍有紀錄，API 會拒絕刪除。" confirm-text="刪除" danger @close="deleting=null" @confirm="confirmDelete" />
  </AppShell>
</template>
<style scoped>
.settings-page{padding-top:32px}.settings-layout{display:grid;grid-template-columns:150px 1fr;gap:28px;margin-top:18px}.settings-menu{height:max-content;padding:12px}.settings-menu button{width:100%;height:38px;border-radius:6px;background:#fff;color:var(--gray-700);display:flex;align-items:center;gap:12px;padding:0 12px;font-weight:700;font-size:13px;text-align:left}.settings-menu button.active{background:#dbeafe;color:var(--primary)}.settings-menu button.logout{color:var(--expense)}.settings-content{min-height:395px;padding:0;overflow:hidden}.settings-head{height:64px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 22px}.settings-head p{margin:2px 0 0;color:var(--gray-500);font-size:12px}.category-title{height:32px;background:#f3f4f6;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;color:var(--gray-600);font-weight:700;font-size:12px}.category-title::before{content:'';width:8px;height:8px;border-radius:50%;margin-right:10px}.category-title.expense-dot::before{background:var(--expense)}.category-title.income-dot::before{background:var(--income)}.category-row{height:58px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:12px 36px 1fr 80px 32px 32px;align-items:center;gap:12px;padding:0 18px}.color-dot{width:8px;height:8px;border-radius:50%}.cat-icon{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center}.category-row strong{font-size:13px}.category-row small{color:var(--gray-400);font-size:12px;text-align:right}.mini-action{width:30px;height:30px;border:1px solid var(--border);border-radius:7px;background:#fff;color:var(--gray-500)}.mini-action.delete{color:var(--expense)}.export-box{padding:0}.export-head{height:64px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;padding:0 22px}.export-head>i{color:var(--primary)}.export-head p{margin:2px 0 0;color:var(--gray-500);font-size:12px}.export-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px 22px 12px}.export-form label,.profile-form label,.password-form label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--gray-700);font-weight:700}.export-form input,.profile-form input,.password-form input{height:40px;border:1px solid var(--border);border-radius:6px;padding:0 12px}.format-title{padding:0 22px 8px;font-size:12px;font-weight:700;color:var(--gray-700)}.format-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 22px 18px}.format-grid button{height:78px;border:1px solid var(--border);border-radius:7px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:var(--gray-500)}.format-grid button.active{border:2px solid var(--primary);background:#dbeafe;color:var(--primary)}.format-grid strong{font-size:13px;color:var(--gray-800)}.format-grid small{font-size:11px}.export-info{height:30px;margin:0 22px;background:#dbeafe;color:var(--primary);display:flex;align-items:center;padding:0 12px;border-radius:5px;font-size:12px;font-weight:700}.export-actions{height:64px;border-top:1px solid var(--border);margin-top:18px;display:flex;align-items:center;justify-content:flex-end;padding:0 22px}.profile-box{display:flex;gap:24px;padding:24px}.avatar{width:74px;height:74px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800}.profile-form{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px}.danger-zone{margin:0 24px 24px;border:1px solid var(--expense-100);background:var(--expense-50);border-radius:8px;padding:16px}.danger-zone h3{margin:0 0 4px;color:var(--expense)}.danger-zone p{margin:0 0 12px;color:var(--gray-600)}.password-form{padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.password-form button{grid-column:2;justify-self:end}@media(max-width:1024px){.settings-layout{grid-template-columns:1fr}.settings-menu{display:flex;overflow:auto;gap:8px}.settings-menu button{width:auto;white-space:nowrap}.profile-form,.export-form,.format-grid{grid-template-columns:1fr}}@media(max-width:480px){.settings-layout{gap:14px}.settings-content{min-height:auto}.category-row{grid-template-columns:12px 36px 1fr 32px 32px}.category-row small{display:none}.settings-head{height:auto;min-height:64px;padding:14px}.settings-head .primary-btn{height:34px}.export-actions{justify-content:stretch}.export-actions button{width:100%}.password-form{grid-template-columns:1fr}.password-form button{grid-column:auto;width:100%}}
</style>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import { currentMonth, formatMonthLabel, shiftMonth } from '@/utils/date'
import { money } from '@/utils/format'
import { recordsApi } from '@/api/records.api'
import { statsApi } from '@/api/stats.api'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'
import type { RecordSummary } from '@/types/record'
import type { CategoryStatItem, MonthlyStatItem } from '@/types/stats'

const toast = useToastStore()
const month = ref(currentMonth())
const tab = ref<'category' | 'monthly'>('category')
const summary = ref<RecordSummary>({ totalIncome: 0, totalExpense: 0, balance: 0 })
const categoryItems = ref<CategoryStatItem[]>([])
const monthly = ref<MonthlyStatItem[]>([
  { month: '2026-01', totalIncome: 32000, totalExpense: 22100, balance: 9900 },
  { month: '2026-02', totalIncome: 27800, totalExpense: 18600, balance: 9200 },
  { month: '2026-03', totalIncome: 30500, totalExpense: 24200, balance: 6300 }
])
const colors = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#9CA3AF']
function prev(){ month.value = shiftMonth(month.value, -1) }
function next(){ month.value = shiftMonth(month.value, 1) }
async function fetchData(){
  try {
    const res = await recordsApi.list({ month: month.value, page:1, pageSize:100 })
    summary.value = res.summary
    const cat = await statsApi.category(month.value, 'expense')
    categoryItems.value = cat.categories.slice(0,5)
    const monthlyRes = await statsApi.monthly(month.value)
    if (monthlyRes.months.length) monthly.value = monthlyRes.months.slice(-6)
  } catch(err){ toast.error(getApiErrorMessage(err)) }
}
watch(month, fetchData)
onMounted(fetchData)

function sumIncome(items: MonthlyStatItem[]): number { return items.reduce((sum, item) => sum + item.totalIncome, 0) }
function sumExpense(items: MonthlyStatItem[]): number { return items.reduce((sum, item) => sum + item.totalExpense, 0) }
function sumBalance(items: MonthlyStatItem[]): number { return items.reduce((sum, item) => sum + item.balance, 0) }
</script>
<template>
  <AppShell>
    <div class="page-container stats-page">
      <header class="page-header">
        <div><h1 class="h1">統計分析</h1></div>
        <div class="month-control"><button class="icon-button" @click="prev"><i class="fa-solid fa-chevron-left"></i></button><strong>{{ tab === 'monthly' ? '2026 年度' : formatMonthLabel(month) }}</strong><button class="icon-button" @click="next"><i class="fa-solid fa-chevron-right"></i></button></div>
      </header>
      <div class="stat-tabs"><button :class="{active: tab==='category'}" @click="tab='category'">分類統計</button><button :class="{active: tab==='monthly'}" @click="tab='monthly'">每月總覽</button></div>
      <template v-if="tab==='category'">
        <section class="summary-grid-figma">
          <article class="summary-card-figma income"><span>本月收入</span><strong class="money-income">{{ money(summary.totalIncome) }}</strong></article>
          <article class="summary-card-figma expense"><span>本月支出</span><strong class="money-expense">{{ money(summary.totalExpense) }}</strong></article>
          <article class="summary-card-figma primary"><span>本月結餘</span><strong class="money-primary">{{ money(summary.balance) }}</strong></article>
        </section>
        <section class="stats-grid category-grid">
          <article class="card stat-card"><h2 class="h3">支出分類佔比</h2><div class="stat-body donut-row"><div class="donut"><div><strong>{{ money(categoryItems[0]?.amount || 10164) }}</strong><small>{{ categoryItems[0]?.categoryName || '食品餐飲' }}</small></div></div><div class="category-legend"><div v-for="(item,i) in categoryItems" :key="item.categoryId"><span :style="{background: colors[i]}"></span><b>{{ item.categoryName }}</b><small>{{ Math.round(item.percentage) }}%</small><em>{{ money(item.amount) }}</em></div></div></div></article>
          <article class="card stat-card"><h2 class="h3">支出前五名</h2><div class="rank-list"><div v-for="(item,i) in categoryItems" :key="item.categoryId" class="rank-row"><span>{{ i+1 }}</span><div><strong>{{ item.categoryName }}</strong><i><b :style="{width: Math.max(18, item.percentage)+'%', background: colors[i]}"></b></i></div><em>{{ money(item.amount) }}</em></div></div></article>
        </section>
      </template>
      <template v-else>
        <section class="stats-grid monthly-grid">
          <article class="card stat-card monthly-chart"><div class="panel-head"><h2 class="h3">收支趨勢</h2><div class="week-nav"><button><i class="fa-solid fa-chevron-left"></i></button><strong>上半年</strong><button><i class="fa-solid fa-chevron-right"></i></button></div></div><div class="monthly-bars"><div v-for="item in monthly" :key="item.month"><span class="in" :style="{height: Math.max(10, item.totalIncome / 260)+'px'}"></span><span class="out" :style="{height: Math.max(10, item.totalExpense / 260)+'px'}"></span><small>{{ Number(item.month.slice(5)) }}月</small></div></div><div class="legend"><span><i class="green"></i>收入</span><span><i class="red"></i>支出</span></div></article>
          <article class="card stat-card monthly-table"><h2 class="h3">每月明細</h2><table><thead><tr><th>月份</th><th>收入</th><th>支出</th><th>結餘</th></tr></thead><tbody><tr v-for="item in monthly.slice(-3)" :key="item.month" :class="{active:item.month===month}"><td>{{ Number(item.month.slice(5)) }}月 <b v-if="item.month===month">（當月）</b></td><td class="money-income">{{ money(item.totalIncome) }}</td><td class="money-expense">{{ money(item.totalExpense) }}</td><td class="money-primary">+{{ money(item.balance).replace('$','') }}</td></tr><tr class="total"><td>合計</td><td class="money-income">{{ money(sumIncome(monthly)) }}</td><td class="money-expense">{{ money(sumExpense(monthly)) }}</td><td class="money-primary">+{{ money(sumBalance(monthly)).replace('$','') }}</td></tr></tbody></table></article>
        </section>
      </template>
    </div>
  </AppShell>
</template>
<style scoped>
.stats-page{padding-top:32px}.page-header{align-items:center}.month-control{display:flex;align-items:center;gap:14px}.stat-tabs{width:250px;height:36px;border:1px solid var(--border);border-radius:7px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;background:#fff;margin-bottom:20px}.stat-tabs button{background:#fff;color:var(--gray-600);font-weight:700}.stat-tabs button.active{background:var(--primary);color:#fff}.stats-grid{display:grid;gap:14px}.category-grid,.monthly-grid{grid-template-columns:1fr 1fr}.stat-card{overflow:hidden}.stat-card h2{height:50px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 18px}.stat-body{padding:20px 18px}.donut-row{display:grid;grid-template-columns:190px 1fr;align-items:center;gap:18px}.donut{width:140px;height:140px;border-radius:50%;background:conic-gradient(#ef4444 0 42%, #f97316 42% 63%, #eab308 63% 76%, #8b5cf6 76% 86%, #9ca3af 86% 100%);display:flex;align-items:center;justify-content:center;margin:20px auto}.donut::before{content:'';position:absolute;width:82px;height:82px;border-radius:50%;background:#fff}.donut{position:relative}.donut div{position:relative;z-index:1;text-align:center}.donut strong{font-size:14px;color:var(--expense);display:block}.donut small{font-size:11px;color:var(--gray-500)}.category-legend{display:flex;flex-direction:column}.category-legend div{height:34px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:14px 1fr 40px 70px;align-items:center;gap:8px}.category-legend span{width:10px;height:10px;border-radius:50%}.category-legend b{font-size:13px}.category-legend small{color:var(--gray-400);text-align:right}.category-legend em{font-style:normal;color:var(--expense);font-weight:700;text-align:right}.rank-list{padding:14px 18px}.rank-row{height:44px;display:grid;grid-template-columns:26px 1fr 74px;gap:10px;align-items:center}.rank-row span{width:22px;height:22px;border-radius:50%;background:#fff4d6;color:#b45309;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px}.rank-row strong{font-size:13px}.rank-row i{height:5px;border-radius:10px;background:#f3f4f6;display:block;margin-top:6px;overflow:hidden}.rank-row i b{height:100%;display:block;border-radius:10px}.rank-row em{font-style:normal;text-align:right;color:var(--expense);font-weight:800}.monthly-chart{height:350px}.panel-head{height:50px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 18px}.week-nav{display:flex;align-items:center;gap:10px}.week-nav button{width:28px;height:28px;border:1px solid var(--border);border-radius:7px;background:#fff}.monthly-bars{height:240px;display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:18px;padding:22px 30px 0}.monthly-bars div{height:100%;display:flex;align-items:flex-end;justify-content:center;gap:8px;position:relative}.monthly-bars span{width:28px;border-radius:5px 5px 0 0;display:block}.monthly-bars .in{background:#d1fae5}.monthly-bars .out{background:#fee2e2}.monthly-bars small{position:absolute;bottom:-24px;color:var(--gray-400);font-weight:700}.monthly-bars div:nth-child(3) small{color:var(--primary)}.legend{display:flex;gap:16px;padding:34px 18px 0;font-size:12px;font-weight:700}.legend span{display:flex;gap:7px;align-items:center}.legend i{width:10px;height:10px;border-radius:2px;display:block}.legend .green{background:#d1fae5}.legend .red{background:#fee2e2}.monthly-table table{width:100%;border-collapse:collapse;font-size:13px}.monthly-table th,.monthly-table td{height:44px;border-bottom:1px solid var(--border);padding:0 18px;text-align:left}.monthly-table th{color:var(--gray-500);font-size:12px}.monthly-table tr.active{background:#dbeafe}.monthly-table tr.total{background:#f9fafb;font-weight:800}@media(max-width:1024px){.category-grid,.monthly-grid{grid-template-columns:1fr}.donut-row{grid-template-columns:1fr}}@media(max-width:480px){.stat-tabs{width:100%}.summary-grid-figma{grid-template-columns:1fr}.monthly-bars{padding-inline:8px;gap:6px}.monthly-bars span{width:18px}.monthly-table th,.monthly-table td{padding:0 8px;font-size:12px}}
</style>

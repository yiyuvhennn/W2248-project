export function todayDate(): string {
  return '2026-03-06'
}

export function currentMonth(): string {
  return '2026-03'
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${Number(m)}月`
}

export function shiftMonth(month: string, offset: number): string {
  const [year, m] = month.split('-').map(Number)
  const date = new Date(year, m - 1 + offset, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(year, month - 1, day).getDay()]
  return `${year}年${month}月${day}日${date === '2026-03-06' ? '（今天）' : ''}`
}

export function formatDateShort(date: string): string {
  const [, month, day] = date.split('-').map(Number)
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date(date).getDay()]
  return `${month}月${day}日 星期${weekday}`
}

export function isSameMonth(date: string, month: string): boolean {
  return date.startsWith(month)
}

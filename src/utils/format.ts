export function money(value: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0
  }).format(value)
}

export function signedMoney(value: number): string {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${prefix}${money(Math.abs(value))}`
}

export function percent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
}

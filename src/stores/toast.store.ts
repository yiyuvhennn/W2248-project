import { defineStore } from 'pinia'

type ToastType = 'success' | 'error' | 'info'
export interface ToastItem { id: number; type: ToastType; message: string }

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] as ToastItem[] }),
  actions: {
    push(type: ToastType, message: string) {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      this.items.push({ id, type, message })
      window.setTimeout(() => this.remove(id), 3200)
    },
    success(message: string) { this.push('success', message) },
    error(message: string) { this.push('error', message) },
    info(message: string) { this.push('info', message) },
    remove(id: number) { this.items = this.items.filter((item) => item.id !== id) }
  }
})

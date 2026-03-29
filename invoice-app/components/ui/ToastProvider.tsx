'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastState { msg: string; type: 'success' | 'error' | 'info'; id: number }

let _toastFn: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null

export function registerToast(fn: typeof _toastFn) { _toastFn = fn }
export function toast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  _toastFn?.(msg, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  useEffect(() => {
    registerToast((msg, type = 'info') => {
      const id = Date.now()
      setToasts((prev) => [...prev, { msg, type, id }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const colors = {
          success: 'bg-emerald-600 text-white',
          error:   'bg-red-600 text-white',
          info:    'bg-slate-800 text-white',
        }
        return (
          <div key={t.id} className={cn('px-4 py-3 rounded-2xl text-sm font-medium shadow-lg animate-slide-up', colors[t.type])}>
            {t.msg}
          </div>
        )
      })}
    </div>
  )
}

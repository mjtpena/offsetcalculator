import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import { subscribeToasts, dismissToast } from '../../lib/toast'
import type { Toast } from '../../lib/toast'

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-primary/10 text-primary border-primary/20',
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])
  const [exiting, setExiting] = useState<Set<string>>(new Set())

  useEffect(() => {
    return subscribeToasts(setItems)
  }, [])

  const handleDismiss = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id))
    setTimeout(() => {
      dismissToast(id)
      setExiting((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 250)
  }, [])

  if (!items.length) return null

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {items.map((toast) => {
        const Icon = iconMap[toast.type]
        const isExiting = exiting.has(toast.id)
        return (
          <div
            key={toast.id}
            className={`${isExiting ? 'toast-exit' : 'toast-enter'} flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg ${colorMap[toast.type]} dark:bg-slate-800/90 dark:border-slate-700`}
            role="alert"
          >
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium flex-1 text-text-primary dark:text-slate-200">{toast.message}</p>
            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

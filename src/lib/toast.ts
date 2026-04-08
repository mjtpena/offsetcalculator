export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

let listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []
let nextId = 0

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  const id = `toast-${++nextId}`
  toasts = [...toasts, { id, message, type, duration }]
  emit()

  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      emit()
    }, duration)
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function subscribeToasts(listener: (toasts: Toast[]) => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

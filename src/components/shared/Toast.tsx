import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onDismiss, duration = 3500 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-800 px-5 py-3 text-sm text-white shadow-2xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {message}
    </div>
  )
}

interface ToastManagerProps {
  toasts: Array<{ id: string; message: string }>
  onDismiss: (id: string) => void
}

export function ToastManager({ toasts, onDismiss }: ToastManagerProps) {
  return (
    <>
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} onDismiss={() => onDismiss(t.id)} />
      ))}
    </>
  )
}

import { RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

export interface ToastData {
  id: number
  message: string
  onUndo?: () => void
}

interface Props {
  toast: ToastData
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, toast.onUndo ? 7000 : 3500)
    return () => window.clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center pr-24 pl-4 sm:pr-4">
      <div
        role="status"
        className="animate-toast-in pointer-events-auto flex max-w-md min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800 py-2 pr-2 pl-4 text-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      >
        <span className="min-w-0 flex-1 truncate">{toast.message}</span>
        {toast.onUndo && (
          <button
            type="button"
            onClick={() => {
              toast.onUndo?.()
              onDismiss()
            }}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 font-semibold text-emerald-300 hover:bg-white/5"
          >
            <RotateCcw className="size-4" />
            Rückgängig
          </button>
        )}
      </div>
    </div>
  )
}

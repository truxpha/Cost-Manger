import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useBackClose } from '../hooks/useBackClose'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const DISMISS_DISTANCE = 110

export function BottomSheet({ title, onClose, children, footer }: Props) {
  const titleId = useId()
  const drag = useRef<{ startY: number; startT: number } | null>(null)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  useBackClose(onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Nach unten wischen (am Griff/Titel) schließt das Sheet
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { startY: e.clientY, startT: e.timeStamp }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setDragY(Math.max(0, e.clientY - drag.current.startY))
  }
  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dy = Math.max(0, e.clientY - drag.current.startY)
    const velocity = dy / Math.max(1, e.timeStamp - drag.current.startT)
    drag.current = null
    setDragging(false)
    if (dy > DISMISS_DISTANCE || (velocity > 0.6 && dy > 24)) onClose()
    else setDragY(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ opacity: Math.max(0.3, 1 - dragY / 400) }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet-up relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-white/10 bg-surface-1 shadow-2xl sm:rounded-3xl"
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className="cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-white/15" />
          </div>
          <header className="flex items-center justify-between px-5 pt-2 pb-3 sm:pt-5">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex size-11 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Schließen"
            >
              <X className="size-5" />
            </button>
          </header>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && (
          <footer className="border-t border-white/5 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

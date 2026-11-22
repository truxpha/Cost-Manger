import { X, type LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  text: string
  actionLabel: string
  onAction: () => void
  dismissLabel: string
  onDismiss: () => void
}

export function NoticeCard({ icon: Icon, title, text, actionLabel, onAction, dismissLabel, onDismiss }: Props) {
  return (
    <section className="animate-fade-in rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{text}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="-mt-2 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
          aria-label={dismissLabel}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 pl-12">
        <button
          type="button"
          onClick={onAction}
          className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 active:scale-[0.98]"
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="h-10 rounded-xl px-3 text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          {dismissLabel}
        </button>
      </div>
    </section>
  )
}

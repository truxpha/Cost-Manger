import { CheckCircle2, HandCoins, Plus } from 'lucide-react'
import { formatMoney } from '../lib/format'
import type { Debt } from '../types'

interface Props {
  debts: Debt[]
  currency: string
  onOpen: (debt: Debt) => void
  onAdd: () => void
}

export function DebtList({ debts, currency, onOpen, onAdd }: Props) {
  if (debts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-5 text-center">
        <HandCoins className="mx-auto size-6 text-zinc-500" />
        <p className="mt-2 text-sm text-zinc-300">Keine offenen Schulden</p>
        <p className="mt-1 text-xs text-zinc-500">
          Merkliste für Geld, das du jemandem schuldest – ohne feste Raten. Wird nicht vom Budget abgezogen.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-medium"
        >
          <Plus className="size-4" /> Schuld eintragen
        </button>
      </div>
    )
  }

  const sorted = [...debts].sort((a, b) => Number(a.amount === 0) - Number(b.amount === 0) || b.amount - a.amount)
  const open = debts.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="rounded-3xl border border-white/10 bg-surface-1 p-1.5">
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1 text-xs">
        <span className="font-medium text-zinc-400">Nicht im Budget eingerechnet</span>
        <span className="text-zinc-500 tabular-nums">offen {formatMoney(open, currency)}</span>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {sorted.map((debt) => {
          const settled = debt.amount === 0
          const progress = debt.original > 0 ? (debt.original - debt.amount) / debt.original : 0
          return (
            <li key={debt.id}>
              <button
                type="button"
                onClick={() => onOpen(debt)}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.03] active:scale-[0.99] ${
                  settled ? 'opacity-50' : ''
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300">
                  {settled ? <CheckCircle2 className="size-[18px]" /> : <HandCoins className="size-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{debt.name}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {settled ? 'Beglichen' : (debt.note ?? 'Keine festen Raten')}
                  </span>
                  {!settled && progress > 0 && (
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-amber-300"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">{formatMoney(debt.amount, currency)}</span>
                  {!settled && progress > 0 && (
                    <span className="block text-[11px] text-zinc-500 tabular-nums">
                      von {formatMoney(debt.original, currency)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

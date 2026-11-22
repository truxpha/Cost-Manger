import { Plus, Receipt } from 'lucide-react'
import { useMemo } from 'react'
import { currentMonthIndex, parseMonthKey } from '../lib/calc'
import { formatMoney, formatMonthIndex } from '../lib/format'
import type { OneOff } from '../types'

interface Props {
  items: OneOff[]
  currency: string
  now: Date
  onOpen: (item: OneOff) => void
  onAdd: () => void
}

export function OneOffList({ items, currency, now, onOpen, onAdd }: Props) {
  const cur = currentMonthIndex(now)
  const groups = useMemo(() => {
    const byMonth = new Map<number, OneOff[]>()
    for (const item of items) {
      const idx = parseMonthKey(item.month)
      byMonth.set(idx, [...(byMonth.get(idx) ?? []), item])
    }
    // Aktueller und kommende Monate zuerst (aufsteigend), danach vergangene (neueste zuerst)
    return [...byMonth.entries()]
      .sort(([a], [b]) => (a >= cur && b >= cur ? a - b : a >= cur ? -1 : b >= cur ? 1 : b - a))
      .map(([idx, list]) => ({ idx, list, total: list.reduce((s, o) => s + o.amount, 0) }))
  }, [items, cur])

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-5 text-center">
        <Receipt className="mx-auto size-6 text-zinc-500" />
        <p className="mt-2 text-sm text-zinc-300">Keine Einmalausgaben</p>
        <p className="mt-1 text-xs text-zinc-500">
          Für Ausgaben, die nur in einem Monat anfallen – z. B. Geld an Familie, Reparatur, Geschenk.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-medium"
        >
          <Plus className="size-4" /> Einmalausgabe eintragen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map(({ idx, list, total }) => {
        const past = idx < cur
        return (
          <div
            key={idx}
            className={`rounded-3xl border border-white/10 bg-surface-1 p-1.5 ${past ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between px-2.5 pt-2 pb-1 text-xs">
              <span className="font-medium text-zinc-400">
                {idx === cur ? `Dieser Monat · ${formatMonthIndex(idx)}` : formatMonthIndex(idx)}
              </span>
              <span className="text-zinc-500 tabular-nums">−{formatMoney(total, currency)}</span>
            </div>
            <ul className="divide-y divide-white/[0.04]">
              {list.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.03] active:scale-[0.99]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-300">
                      <Receipt className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.name}</span>
                      {item.note && <span className="block truncate text-xs text-zinc-500">{item.note}</span>}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatMoney(item.amount, currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

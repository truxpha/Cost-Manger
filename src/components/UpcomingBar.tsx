import { CalendarClock, CheckCircle2 } from 'lucide-react'
import type { MonthTimeline } from '../lib/calc'
import { formatMoney, formatMoneyShort, MONTHS } from '../lib/format'
import type { Expense } from '../types'

interface Props {
  timeline: MonthTimeline
  nextMonth: { month: number; total: number }
  currency: string
  onOpen: (expense: Expense) => void
}

export function UpcomingBar({ timeline, nextMonth, currency, onOpen }: Props) {
  const { open, paid, totalDue, upcoming, today, daysInMonth, month } = timeline
  const paidShare = totalDue > 0 ? (paid / totalDue) * 100 : 0
  const dayShare = (today / daysInMonth) * 100

  return (
    <section
      aria-label="Abbuchungen diesen Monat"
      className="rounded-3xl border border-white/10 bg-surface-1 p-4"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        <CalendarClock className="size-3.5" />
        Noch offen im {MONTHS[month - 1]}
      </p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">{formatMoney(open, currency)}</p>

      <div className="relative mt-3 h-1.5 rounded-full bg-white/[0.08]" aria-hidden="true">
        <div
          className="h-full rounded-full bg-zinc-300 transition-[width] duration-500"
          style={{ width: `${paidShare}%` }}
        />
        <div
          className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-emerald-400"
          style={{ left: `calc(${dayShare}% - 1px)` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="tabular-nums">
          <span className="text-zinc-300">{formatMoneyShort(paid, currency)}</span> von{' '}
          {formatMoneyShort(totalDue, currency)} abgebucht
        </span>
        <span className="text-right tabular-nums">
          {MONTHS[nextMonth.month - 1]}: <span className="text-zinc-300">{formatMoneyShort(nextMonth.total, currency)}</span>
        </span>
      </div>

      {upcoming.length > 0 ? (
        <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5">
          {upcoming.map(({ expense, day, isToday }) => (
            <li key={expense.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onOpen(expense)}
                className={`flex h-11 items-center gap-2 rounded-full border py-1 pr-3.5 pl-1.5 text-sm transition active:scale-95 ${
                  isToday
                    ? 'border-emerald-400/40 bg-emerald-400/10'
                    : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
                }`}
              >
                <span
                  className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[11px] leading-none font-bold"
                  style={{ backgroundColor: `${expense.color}26`, color: expense.color }}
                >
                  {isToday ? 'Heute' : `${day}.`}
                </span>
                <span className="max-w-[9rem] truncate font-medium">{expense.name}</span>
                <span className="text-zinc-400 tabular-nums">
                  {formatMoneyShort(expense.amount, currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          <CheckCircle2 className="size-4 text-emerald-400" />
          {totalDue > 0 ? 'Alles für diesen Monat abgebucht.' : 'Keine Abbuchungen diesen Monat.'}
        </p>
      )}
    </section>
  )
}

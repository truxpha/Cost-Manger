import { CheckCircle2 } from 'lucide-react'
import { isFinished, monthlyEquivalent, parseMonthKey, remainingPayments } from '../lib/calc'
import { billingLabel, CYCLE_SUFFIX, formatMoney, formatMoneyShort, formatMonthIndex } from '../lib/format'
import type { Expense } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { Toggle } from './Toggle'

interface Props {
  expense: Expense
  currency: string
  onOpen: (expense: Expense) => void
  onToggle: (id: string) => void
  now: Date
}

export function ExpenseRow({ expense, currency, onOpen, onToggle, now }: Props) {
  const monthly = monthlyEquivalent(expense)
  const finished = isFinished(expense, now)
  const inactive = !expense.isActive || finished
  const endIdx = expense.endMonth ? parseMonthKey(expense.endMonth) : null
  const remaining = endIdx !== null && !finished ? remainingPayments(expense, endIdx, now) : null

  return (
    <li className="flex items-center gap-1 rounded-2xl pr-1 transition hover:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => onOpen(expense)}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl py-2 pl-2 text-left active:scale-[0.99]"
      >
        <CategoryIcon category={expense.category} color={expense.color} muted={inactive} />
        <span className={`min-w-0 flex-1 transition-opacity ${inactive ? 'opacity-45' : ''}`}>
          <span className="line-clamp-2 block leading-snug font-medium break-words">{expense.name}</span>
          <span className="block truncate text-xs text-zinc-500">
            {finished ? 'Abbezahlt' : !expense.isActive ? 'Pausiert · ' : ''}
            {!finished && billingLabel(expense)}
          </span>
          {remaining !== null && endIdx !== null && (
            <span className="mt-0.5 block truncate text-[11px] text-zinc-400 tabular-nums">
              {remaining > 0
                ? `Noch ${remaining} ${remaining === 1 ? 'Zahlung' : 'Zahlungen'} · bis ${formatMonthIndex(endIdx, true)}`
                : `Letzte Zahlung erledigt · endet ${formatMonthIndex(endIdx, true)}`}
            </span>
          )}
        </span>
        <span className={`shrink-0 text-right whitespace-nowrap transition-opacity ${inactive ? 'opacity-45' : ''}`}>
          <span
            className={`block font-semibold tabular-nums ${inactive ? 'line-through decoration-zinc-500' : ''}`}
          >
            {formatMoney(monthly, currency)}
          </span>
          <span className="block text-[11px] text-zinc-500 tabular-nums">
            {expense.billingCycle === 'monthly'
              ? 'monatlich'
              : `${formatMoneyShort(expense.amount, currency)} ${CYCLE_SUFFIX[expense.billingCycle]}`}
          </span>
        </span>
      </button>
      {finished ? (
        <span className="flex h-11 w-13 shrink-0 items-center justify-center" aria-hidden="true">
          <CheckCircle2 className="size-5 text-emerald-400/70" />
        </span>
      ) : (
      <Toggle
        checked={expense.isActive}
        onChange={() => onToggle(expense.id)}
        label={`${expense.name} ${expense.isActive ? 'pausieren' : 'aktivieren'}`}
      />
      )}
    </li>
  )
}

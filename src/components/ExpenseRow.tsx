import { monthlyEquivalent } from '../lib/calc'
import { billingLabel, CYCLE_SUFFIX, formatMoney, formatMoneyShort } from '../lib/format'
import type { Expense } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { Toggle } from './Toggle'

interface Props {
  expense: Expense
  currency: string
  onOpen: (expense: Expense) => void
  onToggle: (id: string) => void
}

export function ExpenseRow({ expense, currency, onOpen, onToggle }: Props) {
  const monthly = monthlyEquivalent(expense)
  const inactive = !expense.isActive

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
            {inactive ? 'Pausiert · ' : ''}
            {billingLabel(expense)}
          </span>
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
      <Toggle
        checked={expense.isActive}
        onChange={() => onToggle(expense.id)}
        label={`${expense.name} ${expense.isActive ? 'pausieren' : 'aktivieren'}`}
      />
    </li>
  )
}

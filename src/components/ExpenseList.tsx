import { ArrowDownWideNarrow, CalendarDays, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { countsNow, isFinished, monthlyEquivalent } from '../lib/calc'
import { CATEGORIES, getCategory } from '../lib/categories'
import { formatMoney } from '../lib/format'
import type { Category, Expense, SortMode } from '../types'
import { ExpenseRow } from './ExpenseRow'

interface Props {
  expenses: Expense[]
  currency: string
  sort: SortMode
  onSortChange: (sort: SortMode) => void
  filter: Category | null
  onOpen: (expense: Expense) => void
  onToggle: (id: string) => void
  now: Date
}

const SORT_OPTIONS: { id: SortMode; label: string; icon: LucideIcon }[] = [
  { id: 'category', label: 'Kategorie', icon: LayoutGrid },
  { id: 'day', label: 'Datum', icon: CalendarDays },
  { id: 'amount', label: 'Betrag', icon: ArrowDownWideNarrow },
]

interface Group {
  key: string
  title: string | null
  total: number
  items: Expense[]
}

export function ExpenseList({ expenses, currency, sort, onSortChange, filter, onOpen, onToggle, now }: Props) {
  const groups = useMemo<Group[]>(() => {
    const visible = filter ? expenses.filter((e) => e.category === filter) : expenses
    const activeTotal = (items: Expense[]) =>
      items.filter((e) => countsNow(e, now)).reduce((s, e) => s + monthlyEquivalent(e), 0)
    // Abbezahlte Posten ans Ende
    const byFinished = (a: Expense, b: Expense) => Number(isFinished(a, now)) - Number(isFinished(b, now))

    if (sort === 'category') {
      return CATEGORIES.map((meta) => {
        const items = visible
          .filter((e) => e.category === meta.id)
          .sort((a, b) => byFinished(a, b) || monthlyEquivalent(b) - monthlyEquivalent(a))
        return { key: meta.id, title: meta.id, total: activeTotal(items), items }
      }).filter((g) => g.items.length > 0)
    }

    const sorted = [...visible].sort(
      (a, b) =>
        byFinished(a, b) ||
        (sort === 'day'
          ? a.billingDay - b.billingDay || a.name.localeCompare(b.name, 'de')
          : monthlyEquivalent(b) - monthlyEquivalent(a)),
    )
    return [{ key: 'all', title: null, total: activeTotal(sorted), items: sorted }]
  }, [expenses, filter, sort, now])

  return (
    <section aria-label="Fixkosten">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-base font-semibold tracking-tight">
          {filter ? getCategory(filter).short : 'Fixkosten'}
          <span className="ml-1.5 text-sm font-normal text-zinc-500">
            {groups.reduce((n, g) => n + g.items.length, 0)}
          </span>
        </h2>
        <div
          role="radiogroup"
          aria-label="Sortierung"
          className="flex rounded-full border border-white/10 bg-surface-1 p-0.5"
        >
          {SORT_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={sort === id}
              onClick={() => onSortChange(id)}
              className={`flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition ${
                sort === id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.key} className="rounded-3xl border border-white/10 bg-surface-1 p-1.5">
            {group.title && (
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1 text-xs">
                <span className="font-medium text-zinc-400">{group.title}</span>
                <span className="text-zinc-500 tabular-nums">{formatMoney(group.total, currency)}</span>
              </div>
            )}
            <ul className="divide-y divide-white/[0.04]">
              {group.items.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  currency={currency}
                  onOpen={onOpen}
                  onToggle={onToggle}
                  now={now}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

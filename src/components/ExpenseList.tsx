import { ArrowDownWideNarrow, CalendarDays, LayoutGrid, Plus, Wallet, X, type LucideIcon } from 'lucide-react'
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
  onClearFilter: () => void
  onAdd: () => void
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

export function ExpenseList({
  expenses,
  currency,
  sort,
  onSortChange,
  filter,
  onClearFilter,
  onAdd,
  onOpen,
  onToggle,
  now,
}: Props) {
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

  if (expenses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-5 text-center">
        <Wallet className="mx-auto size-6 text-zinc-500" />
        <p className="mt-2 text-sm text-zinc-300">Noch keine Fixkosten</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-medium"
        >
          <Plus className="size-4" /> Fixkosten eintragen
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-1">
        {filter ? (
          <button
            type="button"
            onClick={onClearFilter}
            className="flex h-9 min-w-0 items-center gap-1.5 rounded-full bg-white/[0.08] pr-2.5 pl-3 text-xs font-medium"
            aria-label={`Filter ${getCategory(filter).short} aufheben`}
          >
            <span className="truncate">{getCategory(filter).short}</span>
            <X className="size-3.5 shrink-0" />
          </button>
        ) : (
          <span className="text-xs text-zinc-500">Sortieren</span>
        )}
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
    </div>
  )
}

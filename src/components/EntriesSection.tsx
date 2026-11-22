import { forwardRef } from 'react'
import type { Category, Expense, OneOff, SortMode } from '../types'
import { ExpenseList } from './ExpenseList'
import { OneOffList } from './OneOffList'

export type ListTab = 'expense' | 'oneoff'

interface Props {
  expenses: Expense[]
  oneOffs: OneOff[]
  currency: string
  now: Date
  tab: ListTab
  onTabChange: (tab: ListTab) => void
  sort: SortMode
  onSortChange: (sort: SortMode) => void
  filter: Category | null
  onClearFilter: () => void
  onToggleExpense: (id: string) => void
  onOpenExpense: (expense: Expense) => void
  onOpenOneOff: (item: OneOff) => void
  onAdd: (kind: ListTab) => void
}

export const EntriesSection = forwardRef<HTMLElement, Props>(function EntriesSection(props, ref) {
  const { expenses, oneOffs, currency, now, tab } = props

  const tabs: { id: ListTab; label: string; badge?: string }[] = [
    { id: 'expense', label: 'Fixkosten', badge: String(expenses.length) },
    { id: 'oneoff', label: 'Einmalig', badge: oneOffs.length ? String(oneOffs.length) : undefined },
  ]

  return (
    <section ref={ref} aria-label="Einträge" className="scroll-mt-4">
      <div role="tablist" aria-label="Einträge" className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-surface-1 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => props.onTabChange(t.id)}
            className={`flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 text-sm font-semibold transition ${
              tab === t.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="truncate">{t.label}</span>
            {t.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums ${
                  tab === t.id ? 'bg-zinc-950/10 text-zinc-700' : 'bg-white/[0.08] text-zinc-400'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3" role="tabpanel">
        {tab === 'expense' && (
          <ExpenseList
            expenses={expenses}
            currency={currency}
            sort={props.sort}
            onSortChange={props.onSortChange}
            filter={props.filter}
            onClearFilter={props.onClearFilter}
            onAdd={() => props.onAdd('expense')}
            onOpen={props.onOpenExpense}
            onToggle={props.onToggleExpense}
            now={now}
          />
        )}
        {tab === 'oneoff' && (
          <OneOffList
            items={oneOffs}
            currency={currency}
            now={now}
            onOpen={props.onOpenOneOff}
            onAdd={() => props.onAdd('oneoff')}
          />
        )}
      </div>
    </section>
  )
})

import { forwardRef } from 'react'
import type { AppData, Category, Debt, EntryKind, Expense, OneOff, SortMode } from '../types'
import { DebtList } from './DebtList'
import { ExpenseList } from './ExpenseList'
import { OneOffList } from './OneOffList'

interface Props {
  data: AppData
  currency: string
  now: Date
  tab: EntryKind
  onTabChange: (tab: EntryKind) => void
  sort: SortMode
  onSortChange: (sort: SortMode) => void
  filter: Category | null
  onClearFilter: () => void
  onToggleExpense: (id: string) => void
  onOpenExpense: (expense: Expense) => void
  onOpenOneOff: (item: OneOff) => void
  onOpenDebt: (debt: Debt) => void
  onAdd: (kind: EntryKind) => void
}

export const EntriesSection = forwardRef<HTMLElement, Props>(function EntriesSection(props, ref) {
  const { data, currency, now, tab } = props
  const openDebt = data.debts.filter((d) => d.amount > 0)

  const tabs: { id: EntryKind; label: string; badge?: string }[] = [
    { id: 'expense', label: 'Fixkosten', badge: String(data.expenses.length) },
    { id: 'oneoff', label: 'Einmalig', badge: data.oneOffs.length ? String(data.oneOffs.length) : undefined },
    { id: 'debt', label: 'Schulden', badge: openDebt.length ? String(openDebt.length) : undefined },
  ]

  return (
    <section ref={ref} aria-label="Einträge" className="scroll-mt-4">
      <div role="tablist" aria-label="Einträge" className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-surface-1 p-1">
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
            expenses={data.expenses}
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
            items={data.oneOffs}
            currency={currency}
            now={now}
            onOpen={props.onOpenOneOff}
            onAdd={() => props.onAdd('oneoff')}
          />
        )}
        {tab === 'debt' && (
          <DebtList debts={data.debts} currency={currency} onOpen={props.onOpenDebt} onAdd={() => props.onAdd('debt')} />
        )}
      </div>
    </section>
  )
})

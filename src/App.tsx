import { Plus, Settings, Sparkles, Wallet } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { ExpenseList } from './components/ExpenseList'
import { ExpenseSheet } from './components/ExpenseSheet'
import { HeroCard } from './components/HeroCard'
import { IncomeSheet } from './components/IncomeSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { UpcomingBar } from './components/UpcomingBar'
import { useStore } from './hooks/useStore'
import { useToday } from './hooks/useToday'
import { computeBreakdown, computeSummary, computeTimeline } from './lib/calc'
import { MONTHS } from './lib/format'
import type { Category, Expense, SortMode } from './types'

type Sheet =
  | { type: 'expense'; expense: Expense | null }
  | { type: 'income' }
  | { type: 'settings' }
  | null

export default function App() {
  const { data, actions } = useStore()
  const now = useToday()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [sort, setSort] = useState<SortMode>('category')
  const [filter, setFilter] = useState<Category | null>(null)

  const currency = data.settings.currency
  const summary = useMemo(() => computeSummary(data), [data])
  const timeline = useMemo(() => computeTimeline(data.expenses, now), [data.expenses, now])
  const breakdown = useMemo(() => computeBreakdown(data.expenses), [data.expenses])

  // Filter zurücksetzen, wenn die Kategorie keine aktiven Posten mehr hat
  const activeFilter = filter && breakdown.some((c) => c.category === filter) ? filter : null

  const closeSheet = useCallback(() => setSheet(null), [])
  const openExpense = useCallback((expense: Expense | null) => setSheet({ type: 'expense', expense }), [])

  const isEmpty = data.expenses.length === 0

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between py-2">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            {MONTHS[now.getMonth()]} {now.getFullYear()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Fixkosten</h1>
        </div>
        <button
          type="button"
          onClick={() => setSheet({ type: 'settings' })}
          className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-surface-1 text-zinc-300 transition hover:text-white active:scale-95"
          aria-label="Einstellungen"
        >
          <Settings className="size-5" />
        </button>
      </header>

      <main className="mt-3 space-y-4">
        <HeroCard summary={summary} currency={currency} onEditIncome={() => setSheet({ type: 'income' })} />

        {isEmpty ? (
          <section className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/[0.06]">
              <Wallet className="size-6 text-zinc-300" />
            </span>
            <h2 className="mt-3 font-semibold">Noch keine Fixkosten</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Trage Miete, Kredite, Versicherungen und Abos ein – einmalig, ohne tägliches Tracking.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openExpense(null)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-zinc-950 active:scale-[0.98]"
              >
                <Plus className="size-5" /> Ersten Posten hinzufügen
              </button>
              <button
                type="button"
                onClick={actions.loadDemo}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] font-medium text-zinc-200 active:scale-[0.98]"
              >
                <Sparkles className="size-4" /> Demo-Daten laden
              </button>
            </div>
          </section>
        ) : (
          <>
            <UpcomingBar timeline={timeline} currency={currency} onOpen={openExpense} />
            <CategoryBreakdown
              breakdown={breakdown}
              currency={currency}
              activeFilter={activeFilter}
              onFilter={setFilter}
            />
            <ExpenseList
              expenses={data.expenses}
              currency={currency}
              sort={sort}
              onSortChange={setSort}
              filter={activeFilter}
              onOpen={openExpense}
              onToggle={actions.toggleExpense}
            />
          </>
        )}
      </main>

      <button
        type="button"
        onClick={() => openExpense(null)}
        className="fixed right-[max(1.25rem,calc(50%-15rem))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex size-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition hover:bg-zinc-200 active:scale-90"
        aria-label="Fixkosten hinzufügen"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>

      {sheet?.type === 'expense' && (
        <ExpenseSheet
          key={sheet.expense?.id ?? 'new'}
          expense={sheet.expense}
          currency={currency}
          onSave={actions.upsertExpense}
          onDelete={actions.deleteExpense}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'income' && (
        <IncomeSheet
          netIncome={data.netIncome}
          extraIncome={data.extraIncome}
          currency={currency}
          onSave={actions.setIncome}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'settings' && (
        <SettingsSheet
          data={data}
          onCurrencyChange={actions.setCurrency}
          onImport={actions.replaceData}
          onLoadDemo={actions.loadDemo}
          onReset={actions.reset}
          onClose={closeSheet}
        />
      )}
    </div>
  )
}

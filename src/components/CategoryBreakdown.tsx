import type { CategoryShare } from '../lib/calc'
import { getCategory } from '../lib/categories'
import { formatMoneyShort, formatPercent } from '../lib/format'
import type { Category } from '../types'

interface Props {
  breakdown: CategoryShare[]
  currency: string
  activeFilter: Category | null
  onFilter: (category: Category | null) => void
}

export function CategoryBreakdown({ breakdown, currency, activeFilter, onFilter }: Props) {
  if (breakdown.length === 0) return null

  return (
    <section aria-label="Kategorien" className="rounded-3xl border border-white/10 bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-zinc-400">Verteilung nach Kategorie</h2>
        {activeFilter && (
          <button
            type="button"
            onClick={() => onFilter(null)}
            className="-my-2 -mr-2 h-9 rounded-full px-3 text-xs font-medium text-emerald-400 hover:bg-white/5"
          >
            Filter aufheben
          </button>
        )}
      </div>

      <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {breakdown.map((c) => (
          <button
            key={c.category}
            type="button"
            tabIndex={-1}
            aria-label={c.category}
            onClick={() => onFilter(activeFilter === c.category ? null : c.category)}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${c.share * 100}%`,
              minWidth: '4px',
              backgroundColor: c.color,
              opacity: activeFilter && activeFilter !== c.category ? 0.25 : 1,
            }}
          />
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {breakdown.map((c) => {
          const meta = getCategory(c.category)
          const Icon = meta.icon
          const selected = activeFilter === c.category
          const dimmed = activeFilter !== null && !selected
          return (
            <li key={c.category}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onFilter(selected ? null : c.category)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition ${
                  selected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                } ${dimmed ? 'opacity-45' : ''}`}
              >
                <Icon className="size-4 shrink-0" style={{ color: c.color }} strokeWidth={2.2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{meta.short}</span>
                  <span className="block text-[11px] text-zinc-500 tabular-nums">
                    {formatMoneyShort(c.total, currency)} · {formatPercent(c.share)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

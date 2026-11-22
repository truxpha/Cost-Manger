import { ChevronRight } from 'lucide-react'
import type { Summary } from '../lib/calc'
import { formatMoney, formatPercent, splitMoney } from '../lib/format'

interface Props {
  summary: Summary
  currency: string
  onEditIncome: () => void
}

function quoteColor(quote: number): string {
  if (quote < 0.5) return '#34d399'
  if (quote < 0.7) return '#fbbf24'
  return '#f87171'
}

export function HeroCard({ summary, currency, onEditIncome }: Props) {
  const { whole, cents } = splitMoney(summary.freeBudget)
  const negative = summary.freeBudget < 0
  const color = quoteColor(summary.quote)
  const width = Math.min(100, Math.max(0, summary.quote * 100))

  return (
    <section
      aria-label="Monatsübersicht"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-zinc-950 p-5 shadow-xl"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full blur-3xl"
        style={{ backgroundColor: negative ? '#f8717126' : '#34d39922' }}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-zinc-400">Frei verfügbares Budget</p>
      <p
        className={`mt-1 flex items-baseline font-bold tracking-tight tabular-nums ${
          negative ? 'text-rose-400' : 'text-white'
        }`}
      >
        <span className="text-5xl leading-none">{whole}</span>
        <span className="ml-0.5 text-2xl opacity-60">,{cents}</span>
        <span className="ml-2 text-2xl opacity-60">{currency}</span>
      </p>
      <p className="mt-1.5 text-xs text-zinc-500">pro Monat · Netto – Fixkosten</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onEditIncome}
          className="group rounded-2xl bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.07] active:scale-[0.98]"
        >
          <span className="flex items-center justify-between text-xs text-zinc-400">
            Nettoeinkommen
            <ChevronRight className="size-3.5 text-zinc-500 transition group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 block text-base font-semibold tabular-nums">
            {formatMoney(summary.totalIncome, currency)}
          </span>
          {summary.extraIncome > 0 && (
            <span className="block text-[11px] text-emerald-400/80 tabular-nums">
              inkl. {formatMoney(summary.extraIncome, currency)} extra
            </span>
          )}
        </button>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <span className="block text-xs text-zinc-400">Fixkosten gesamt</span>
          <span className="mt-1 block text-base font-semibold tabular-nums">
            {formatMoney(summary.fixedCosts, currency)}
          </span>
          <span className="block text-[11px] text-zinc-500">
            {summary.activeCount} aktiv
            {summary.pausedCount > 0 && ` · ${summary.pausedCount} pausiert`}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Fixkosten-Quote</span>
          <span className="font-semibold tabular-nums" style={{ color }}>
            {formatPercent(summary.quote)}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(summary.quote * 100)}
          aria-label="Fixkosten-Quote"
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </section>
  )
}

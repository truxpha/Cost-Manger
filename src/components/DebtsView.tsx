import { AlertTriangle, BellRing, CheckCircle2, CircleHelp, Landmark, Plus } from 'lucide-react'
import { orderDebts, type DebtEntry, type DebtTotals, type PlanResult } from '../lib/debts'
import { formatMoney, formatMonthIndex, formatPercent, splitMoney } from '../lib/format'
import type { DebtPlan } from '../types'
import { ConsolidationCard } from './ConsolidationCard'
import { DebtPlanCard } from './DebtPlanCard'

interface Props {
  entries: DebtEntry[]
  totals: DebtTotals
  plan: DebtPlan
  /** Ergebnis des Tilgungsplans mit den aktuellen Einstellungen */
  planResult: PlanResult
  freeBudget: number
  currency: string
  now: Date
  onPlanChange: (plan: DebtPlan) => void
  onOpen: (entry: DebtEntry) => void
  onAdd: () => void
  onCancelDone: (entry: DebtEntry) => void
}

export function DebtsView(props: Props) {
  const { entries, totals, plan, planResult, currency, now } = props
  const open = orderDebts(entries, plan.strategy)
  const toCancel = entries.filter((d) => d.paidOff && d.cancelWhenPaid)
  const notCovering = entries.filter((d) => !d.paidOff && !d.coversInterest)
  const unknown = entries.filter((d) => d.unknown)
  const paidOff = entries.filter((d) => d.paidOff && !d.cancelWhenPaid)

  if (entries.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-surface-1 p-5">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300">
          <Landmark className="size-5" />
        </span>
        <h2 className="mt-3 text-lg font-semibold tracking-tight">Alle Schulden auf einen Blick</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Trage Kredite, Kreditkarten, Klarna oder private Schulden ein. Du siehst dann, wie viel du insgesamt
          schuldest, was dich die Zinsen kosten und in welcher Reihenfolge du am schlausten tilgst.
        </p>
        <button
          type="button"
          onClick={props.onAdd}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-zinc-950 active:scale-[0.98]"
        >
          <Plus className="size-5" /> Erste Schuld eintragen
        </button>
      </section>
    )
  }

  const { whole, cents } = splitMoney(totals.total)
  const repaidShare = totals.repaidOf > 0 ? totals.repaid / totals.repaidOf : 0

  return (
    <div className="space-y-4">
      <section
        aria-label="Schulden gesamt"
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-800/80 via-zinc-900 to-zinc-950 p-5 shadow-xl"
      >
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-amber-300/10 blur-3xl"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-zinc-400">Schulden gesamt</p>
        <p className="mt-1 flex items-baseline font-bold tracking-tight tabular-nums">
          <span className="text-5xl leading-none">{whole}</span>
          <span className="ml-0.5 text-2xl opacity-60">,{cents}</span>
          <span className="ml-2 text-2xl opacity-60">{currency}</span>
        </p>
        <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">
          {totals.openCount} offen
          {totals.estimated > 0 && ` · davon ≈ ${formatMoney(totals.estimated, currency)} geschätzt aus Restraten`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <span className="block text-xs text-zinc-400">Raten pro Monat</span>
            <span className="mt-1 block text-base font-semibold tabular-nums">
              {formatMoney(totals.payments, currency)}
            </span>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <span className="block text-xs text-zinc-400">Zinsen pro Monat</span>
            <span className="mt-1 block text-base font-semibold text-amber-200 tabular-nums">
              ≈ {formatMoney(totals.monthlyInterest, currency)}
            </span>
          </div>
        </div>

        {totals.repaid > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Seit Erfassung getilgt</span>
              <span className="font-semibold text-emerald-300 tabular-nums">
                {formatMoney(totals.repaid, currency)} · {formatPercent(repaidShare)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
                style={{ width: `${Math.min(100, repaidShare * 100)}%` }}
              />
            </div>
          </div>
        )}

        {planResult.debtFreeIdx !== null && open.length > 0 && (
          <p className="mt-4 text-sm text-zinc-300">
            Schuldenfrei mit deinem Plan:{' '}
            <span className="font-semibold">{formatMonthIndex(planResult.debtFreeIdx)}</span>
          </p>
        )}
      </section>

      {toCancel.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3"
        >
          <BellRing className="size-5 shrink-0 text-emerald-300" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-medium">{d.name} ist abbezahlt</span>
            <span className="block text-xs text-zinc-400">Jetzt kündigen, damit sie nicht wieder voll läuft.</span>
          </span>
          <button
            type="button"
            onClick={() => props.onCancelDone(d)}
            className="h-10 shrink-0 rounded-xl bg-white px-3 text-sm font-semibold text-zinc-950 active:scale-[0.98]"
          >
            Gekündigt
          </button>
        </div>
      ))}

      {notCovering.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => props.onOpen(d)}
          className="flex w-full items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-3 text-left"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-300" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-medium">{d.name}: Rate deckt die Zinsen nicht</span>
            <span className="block text-xs text-zinc-400 tabular-nums">
              Zinsen ≈ {formatMoney((d.balance * (d.rate ?? 0)) / 1200, currency)} pro Monat, Rate{' '}
              {formatMoney(d.payment, currency)} – so wächst die Schuld. Rate erhöhen oder umschulden.
            </span>
          </span>
        </button>
      ))}

      {open.length > 0 && (
        <DebtPlanCard
          entries={entries}
          plan={plan}
          main={planResult}
          freeBudget={props.freeBudget}
          currency={currency}
          now={now}
          onPlanChange={props.onPlanChange}
          onOpen={props.onOpen}
        />
      )}

      {open.some((d) => d.rate !== null && d.rate > 0) && (
        <ConsolidationCard debts={open} currency={currency} now={now} />
      )}

      {(unknown.length > 0 || paidOff.length > 0) && (
        <section className="rounded-3xl border border-white/10 bg-surface-1 p-1.5">
          <ul className="divide-y divide-white/[0.04]">
            {unknown.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => props.onOpen(d)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left hover:bg-white/[0.03]"
                >
                  <CircleHelp className="size-5 shrink-0 text-zinc-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block text-xs text-zinc-500">Restschuld fehlt – antippen und eintragen</span>
                  </span>
                </button>
              </li>
            ))}
            {paidOff.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => props.onOpen(d)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left opacity-60 hover:bg-white/[0.03]"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block text-xs text-zinc-500">Abbezahlt</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={props.onAdd}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04]"
      >
        <Plus className="size-4" /> Schuld hinzufügen
      </button>
    </div>
  )
}

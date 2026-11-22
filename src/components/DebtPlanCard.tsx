import { ChevronRight, Info, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { simulatePlan, type DebtEntry, type PlanResult } from '../lib/debts'
import {
  amountToInput,
  formatMoney,
  formatMoneyShort,
  formatMonthIndex,
  formatPercent,
  parseAmount,
} from '../lib/format'
import { cleanAmountInput, inputBaseClass } from '../lib/ui'
import type { DebtPlan, DebtStrategy } from '../types'

interface Props {
  entries: DebtEntry[]
  plan: DebtPlan
  /** Plan mit den aktuellen Einstellungen (in der App berechnet) */
  main: PlanResult
  freeBudget: number
  currency: string
  now: Date
  onPlanChange: (plan: DebtPlan) => void
  onOpen: (entry: DebtEntry) => void
}

const STRATEGIES: { id: DebtStrategy; title: string; text: string }[] = [
  { id: 'avalanche', title: 'Lawine', text: 'Höchster Zins zuerst – spart am meisten' },
  { id: 'snowball', title: 'Schneeball', text: 'Kleinste Schuld zuerst – schnelle Erfolge' },
]

const EXTRA_CHIPS = [0, 50, 100, 200]

/** „19,9 %“, bei geschätzten Krediten „aus Restraten“, sonst „Zins fehlt“ */
const rateLabel = (entry: DebtEntry) =>
  entry.rate !== null ? formatPercent(entry.rate / 100) : entry.estimated ? 'aus Restraten' : 'Zins fehlt'

export function DebtPlanCard({ entries, plan, main, freeBudget, currency, now, onPlanChange, onOpen }: Props) {
  const { strategy, extra } = plan
  const isCustom = !EXTRA_CHIPS.includes(extra)
  // Während der Eingabe zählt der getippte Text, sonst der gespeicherte Wert (z. B. nach „Rückgängig“)
  const [draft, setDraft] = useState<string | null>(null)
  const extraText = draft ?? (isCustom ? amountToInput(extra) : '')

  // Vergleiche: ohne Extra-Betrag und mit der jeweils anderen Strategie
  const { noExtra, other } = useMemo(() => {
    const otherStrategy: DebtStrategy = strategy === 'avalanche' ? 'snowball' : 'avalanche'
    return {
      noExtra: simulatePlan(entries, { strategy, extra: 0, rollover: true }, now),
      other: simulatePlan(entries, { strategy: otherStrategy, extra, rollover: true }, now),
    }
  }, [entries, strategy, extra, now])
  const target = main.order[0]
  const payments = main.order.reduce((s, d) => s + d.payment, 0)
  const monthsSaved =
    main.debtFreeIdx !== null && noExtra.debtFreeIdx !== null ? noExtra.debtFreeIdx - main.debtFreeIdx : null
  const interestSaved = noExtra.debtFreeIdx !== null ? noExtra.totalInterest - main.totalInterest : null
  const otherDiff = other.totalInterest - main.totalInterest

  const setExtra = (value: number) => onPlanChange({ ...plan, extra: value })

  return (
    <section aria-label="Tilgungsplan" className="rounded-3xl border border-white/10 bg-surface-1 p-4">
      <h2 className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        <Target className="size-3.5" /> Tilgungsplan
      </h2>

      <div role="radiogroup" aria-label="Strategie" className="mt-3 grid grid-cols-2 gap-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={strategy === s.id}
            onClick={() => onPlanChange({ ...plan, strategy: s.id })}
            className={`rounded-2xl border px-3 py-2.5 text-left transition ${
              strategy === s.id
                ? 'border-white/40 bg-white/[0.09]'
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <span className="block text-sm font-semibold">{s.title}</span>
            <span className="block text-[11px] leading-snug text-zinc-500">{s.text}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-400">Zusätzlich pro Monat tilgen</p>
        <div className="mt-2 flex gap-1.5">
          {EXTRA_CHIPS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={!isCustom && extra === value}
              onClick={() => setExtra(value)}
              className={`h-10 min-w-0 flex-1 rounded-xl text-sm font-semibold transition ${
                !isCustom && extra === value
                  ? 'bg-white text-zinc-950'
                  : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.08]'
              }`}
            >
              {value === 0 ? `0 ${currency}` : `+${value} ${currency}`}
            </button>
          ))}
          <input
            aria-label="Eigener Betrag pro Monat"
            className={`${inputBaseClass} h-10 w-20 shrink-0 px-2.5 text-center text-sm ${isCustom ? 'border-white/40' : ''}`}
            value={extraText}
            onFocus={() => setDraft(extraText)}
            onBlur={() => setDraft(null)}
            onChange={(e) => {
              const text = cleanAmountInput(e.target.value)
              setDraft(text)
              // Leeres Feld = kein Extra-Betrag, sonst bliebe der alte Wert unsichtbar aktiv
              const value = text.trim() === '' ? 0 : parseAmount(text)
              if (value !== null) setExtra(value)
            }}
            placeholder="eigener"
            inputMode="decimal"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-500 tabular-nums">
          Monatlich in die Tilgung: {formatMoney(payments + extra, currency)}
          {extra > 0 && ` · danach frei: ${formatMoney(freeBudget - extra, currency)}`}
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-white/[0.04] p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-zinc-400">Schuldenfrei</span>
          <span className="text-xl font-bold tracking-tight tabular-nums">
            {main.debtFreeIdx !== null ? formatMonthIndex(main.debtFreeIdx) : 'nicht absehbar'}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-zinc-400">
          <span>Zinsen bis dahin</span>
          <span className="tabular-nums">{formatMoney(main.totalInterest, currency)}</span>
        </div>
        {main.debtFreeIdx === null && (
          <p className="mt-2 text-xs text-rose-300">
            Mit den aktuellen Raten wird nicht alles abbezahlt. Erhöhe den Extra-Betrag oder prüfe eine Umschuldung.
          </p>
        )}
        {extra > 0 && monthsSaved !== null && interestSaved !== null && (monthsSaved > 0 || interestSaved >= 1) && (
          <p className="mt-2 rounded-xl bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-200 tabular-nums">
            Mit {formatMoneyShort(extra, currency)} extra: {monthsSaved} {monthsSaved === 1 ? 'Monat' : 'Monate'} früher
            fertig und ca. {formatMoney(interestSaved, currency)} Zinsen gespart.
          </p>
        )}
        {extra > 0 && noExtra.debtFreeIdx === null && main.debtFreeIdx !== null && (
          <p className="mt-2 rounded-xl bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-200">
            Ohne Extra-Betrag würden nicht alle Schulden abbezahlt – mit ihm schon.
          </p>
        )}
        {main.order.length > 1 && Math.abs(otherDiff) >= 1 && (
          <p className="mt-2 text-[11px] text-zinc-500 tabular-nums">
            {strategy === 'avalanche' ? 'Schneeball' : 'Lawine'} würde{' '}
            {otherDiff > 0
              ? `${formatMoney(otherDiff, currency)} mehr Zinsen kosten.`
              : `${formatMoney(-otherDiff, currency)} Zinsen sparen.`}
          </p>
        )}
      </div>

      {target && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3">
          <Target className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          <div className="min-w-0 text-sm">
            <p>
              Extra & Sondertilgungen zuerst auf <span className="font-semibold">{target.name}</span>
              {target.rate !== null && <span className="text-zinc-400"> ({rateLabel(target)})</span>}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Ist sie weg, fließt ihre Rate automatisch in die nächste Schuld.
            </p>
          </div>
        </div>
      )}

      <ol className="mt-3 space-y-1">
        {main.order.map((entry, i) => {
          const progress =
            entry.original && entry.original > 0 ? Math.max(0, (entry.original - entry.balance) / entry.original) : null
          const payoff = main.payoff[entry.id]
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-white/[0.04] active:scale-[0.99]"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-zinc-950"
                  style={{ backgroundColor: entry.color }}
                >
                  {i + 1}
                </span>
                <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                  <span className="truncate font-medium">{entry.name}</span>
                  <span className="font-semibold whitespace-nowrap tabular-nums">
                    {entry.estimated && '≈ '}
                    {formatMoney(entry.balance, currency)}
                  </span>
                  <span className="col-span-2 truncate text-xs text-zinc-500 tabular-nums">
                    {rateLabel(entry)}
                    {entry.payment > 0 ? ` · Rate ${formatMoneyShort(entry.payment, currency)}` : ' · keine feste Rate'}
                    {' · '}
                    {payoff !== null && payoff !== undefined
                      ? `frei ab ${formatMonthIndex(payoff + 1, true)}`
                      : 'offen'}
                  </span>
                  {progress !== null && progress > 0 && (
                    <span
                      className="col-span-2 mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.08]"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: entry.color }}
                      />
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-600" />
              </button>
            </li>
          )
        })}
      </ol>

      <details className="group mt-3 rounded-2xl bg-white/[0.03] px-3.5 py-2.5 text-xs text-zinc-400">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-zinc-300">
          <Info className="size-3.5" /> Gut zu wissen: Sondertilgung
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Kreditkarte, Dispo & Klarna: jederzeit ohne Gebühr zurückzahlbar.</li>
          <li>
            Ratenkredit: vorzeitig zurückzahlen ist erlaubt, die Bank darf höchstens 1 % (im letzten Laufzeitjahr 0,5 %)
            Vorfälligkeitsentschädigung verlangen.
          </li>
          <li>Zinslose Schulden (z. B. BAföG, Familie) zuletzt tilgen – dort spart Sondertilgung keine Zinsen.</li>
        </ul>
      </details>
    </section>
  )
}

import { Check, ChevronDown, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { consolidate, type DebtEntry } from '../lib/debts'
import { formatMoney, formatMonthIndex, formatPercent, parseAmount } from '../lib/format'
import { cleanAmountInput, inputClass, labelClass } from '../lib/ui'

interface Props {
  /** Offene Schulden in Tilgungsreihenfolge */
  debts: DebtEntry[]
  currency: string
  now: Date
}

const TERMS = [24, 36, 48, 60, 84]
/** Ab diesem Zinssatz ist eine Umschuldung meist interessant (z. B. Kreditkarte, Dispo) */
const EXPENSIVE_RATE = 10

/** Rechnet durch, was ein neuer, günstigerer Ratenkredit für ausgewählte Schulden bringt */
export function ConsolidationCard({ debts, currency, now }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(debts.filter((d) => (d.rate ?? 0) >= EXPENSIVE_RATE).map((d) => d.id)),
  )
  const [rateText, setRateText] = useState('7')
  const [months, setMonths] = useState(36)

  const rate = parseAmount(rateText)
  const chosen = useMemo(() => debts.filter((d) => selected.has(d.id)), [debts, selected])
  const result = useMemo(
    () => (chosen.length > 0 && rate !== null && rate <= 100 ? consolidate(chosen, rate, months, now) : null),
    [chosen, rate, months, now],
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const saved = result && result.oldDebtFreeIdx !== null ? result.oldInterest - result.interest : null

  return (
    <section aria-label="Umschuldung" className="rounded-3xl border border-white/10 bg-surface-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <Shuffle className="size-4 shrink-0 text-sky-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Umschuldung durchrechnen</span>
          <span className="block text-xs text-zinc-500">Teure Schulden mit einem günstigeren Kredit ablösen</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div>
            <p className={labelClass}>Welche Schulden ablösen?</p>
            <ul className="space-y-1">
              {debts.map((d) => {
                const checked = selected.has(d.id)
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(d.id)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                          checked ? 'border-sky-300 bg-sky-300 text-zinc-950' : 'border-white/25'
                        }`}
                      >
                        {checked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
                      <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                        {d.rate !== null ? formatPercent(d.rate / 100) : d.estimated ? 'aus Restraten' : 'Zins fehlt'} ·{' '}
                        {formatMoney(d.balance, currency)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="grid grid-cols-[7.5rem_1fr] gap-3">
            <div>
              <label htmlFor="consolidation-rate" className={labelClass}>
                Neuer Zins p. a.
              </label>
              <div className="relative">
                <input
                  id="consolidation-rate"
                  className={`${inputClass} pr-8 tabular-nums`}
                  value={rateText}
                  onChange={(e) => setRateText(cleanAmountInput(e.target.value))}
                  inputMode="decimal"
                  autoComplete="off"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500">%</span>
              </div>
            </div>
            <div>
              <span className={labelClass}>Laufzeit (Monate)</span>
              <div className="grid grid-cols-5 gap-1">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={months === t}
                    onClick={() => setMonths(t)}
                    className={`h-12 rounded-xl text-sm font-semibold tabular-nums transition ${
                      months === t ? 'bg-white text-zinc-950' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result ? (
            <div className="space-y-2 rounded-2xl bg-white/[0.04] p-3.5 text-sm">
              <Row label="Abzulösen" value={formatMoney(result.principal, currency)} />
              <Row
                label="Neue Rate"
                value={`${formatMoney(result.payment, currency)} / Monat`}
                hint={`bisher ${formatMoney(result.oldPayment, currency)}`}
              />
              <Row
                label="Zinsen gesamt"
                value={formatMoney(result.interest, currency)}
                hint={
                  result.oldDebtFreeIdx !== null
                    ? `bisher ca. ${formatMoney(result.oldInterest, currency)}`
                    : 'bisher: wird nie ganz abbezahlt'
                }
              />
              <Row
                label="Schuldenfrei"
                value={formatMonthIndex(result.newDebtFreeIdx, true)}
                hint={
                  result.oldDebtFreeIdx !== null ? `bisher ${formatMonthIndex(result.oldDebtFreeIdx, true)}` : undefined
                }
              />
              {saved !== null && (
                <p
                  className={`rounded-xl px-3 py-2 text-xs tabular-nums ${
                    saved > 0 ? 'bg-emerald-400/[0.08] text-emerald-200' : 'bg-amber-300/[0.08] text-amber-200'
                  }`}
                >
                  {saved > 0
                    ? `Du würdest ca. ${formatMoney(saved, currency)} Zinsen sparen.`
                    : `Lohnt sich so nicht: ca. ${formatMoney(-saved, currency)} mehr Zinsen. Kürzere Laufzeit oder niedrigeren Zins prüfen.`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Wähle mindestens eine Schuld und einen gültigen Zinssatz.</p>
          )}

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Grobe Rechnung ohne Gebühren. Vergleiche den effektiven Jahreszins und verzichte auf teure
            Restschuldversicherungen. Abgelöste Kreditkarten danach kündigen oder das Limit auf 0 setzen – sonst laufen
            sie leicht wieder voll.
          </p>
        </div>
      )}
    </section>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span className="text-right">
        <span className="block font-semibold tabular-nums">{value}</span>
        {hint && <span className="block text-[11px] text-zinc-500 tabular-nums">{hint}</span>}
      </span>
    </div>
  )
}

import { AlertTriangle, TrendingDown } from 'lucide-react'
import type { LoanProjection } from '../lib/debts'
import { formatMoney, formatMonthIndex } from '../lib/format'
import { cleanAmountInput, inputClass, labelClass } from '../lib/ui'
import { Toggle } from './Toggle'

interface Props {
  currency: string
  balanceText: string
  onBalanceText: (value: string) => void
  rateText: string
  onRateText: (value: string) => void
  cancelWhenPaid: boolean
  onToggleCancel: () => void
  balanceError: boolean
  rateError: boolean
  /** Vorschau mit den aktuellen Eingaben (null = zu wenig Angaben) */
  projection: LoanProjection | null
  monthlyInterest: number
}

/** Restschuld, Zinssatz und Kündigungs-Erinnerung für Kredite & Kreditkarten */
export function LoanFields(props: Props) {
  const { currency, projection } = props

  return (
    <div className="space-y-3 rounded-2xl bg-white/[0.04] p-4">
      <div>
        <p className="text-sm font-medium">Für die Schuldenübersicht (optional)</p>
        <p className="text-xs text-zinc-500">
          Steht im Banking oder auf der Abrechnung. Die Restschuld sinkt danach automatisch mit jeder Rate.
        </p>
      </div>
      <div className="grid grid-cols-[1fr_7.5rem] gap-2">
        <div>
          <label htmlFor="loan-balance" className={labelClass}>
            Restschuld heute
          </label>
          <div className="relative">
            <input
              id="loan-balance"
              className={`${inputClass} pr-9 tabular-nums ${props.balanceError ? 'border-rose-500/70' : ''}`}
              value={props.balanceText}
              onChange={(e) => props.onBalanceText(cleanAmountInput(e.target.value))}
              placeholder="z. B. 2.400"
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500">
              {currency}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="loan-rate" className={labelClass}>
            Zins p. a.
          </label>
          <div className="relative">
            <input
              id="loan-rate"
              className={`${inputClass} pr-8 tabular-nums ${props.rateError ? 'border-rose-500/70' : ''}`}
              value={props.rateText}
              onChange={(e) => props.onRateText(cleanAmountInput(e.target.value))}
              placeholder="19,9"
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500">%</span>
          </div>
        </div>
      </div>
      {(props.balanceError || props.rateError) && (
        <p className="text-xs text-rose-400">Bitte gültige Werte eintragen (Zins zwischen 0 und 100 %).</p>
      )}

      {projection &&
        (projection.payoffIdx === null ? (
          <p className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="mt-px size-4 shrink-0 text-rose-300" />
            <span>
              Die Rate deckt kaum die Zinsen (ca. {formatMoney(props.monthlyInterest, currency)} pro Monat) – so wird
              die Schuld nicht kleiner. Rate erhöhen oder umschulden.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-400/[0.07] px-3 py-2 text-xs text-zinc-300">
            <TrendingDown className="mt-px size-4 shrink-0 text-emerald-400" />
            <span className="tabular-nums">
              Abbezahlt voraussichtlich im {formatMonthIndex(projection.payoffIdx)}
              {projection.interest >= 1 && ` · noch ca. ${formatMoney(projection.interest, currency)} Zinsen`}
            </span>
          </p>
        ))}

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Nach Abzahlung kündigen</p>
          <p className="text-xs text-zinc-500">Erinnerung, damit die Karte nicht wieder voll läuft</p>
        </div>
        <Toggle checked={props.cancelWhenPaid} onChange={props.onToggleCancel} label="Nach Abzahlung kündigen" />
      </div>
    </div>
  )
}

import { HandCoins } from 'lucide-react'
import { useState } from 'react'
import { parseAmount } from '../lib/format'
import { cleanAmountInput, inputClass } from '../lib/ui'
import { Toggle } from './Toggle'

interface Props {
  title: string
  currency: string
  monthLabel: string
  /** Höchstens so viel kann zurückgezahlt werden (offene Restschuld) */
  max: number
  onSubmit: (amount: number, recordAsOneOff: boolean) => void
}

/** Rückzahlung / Sondertilgung erfassen – optional als Einmalausgabe im laufenden Monat */
export function RepaymentBox({ title, currency, monthLabel, max, onSubmit }: Props) {
  const [text, setText] = useState('')
  const [recordAsOneOff, setRecordAsOneOff] = useState(true)
  const amount = parseAmount(text)
  const valid = amount !== null && amount > 0

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <HandCoins className="size-4 text-amber-300" /> {title}
      </h3>
      <div className="relative mt-3">
        <input
          aria-label={`${title}: Betrag`}
          className={`${inputClass} pr-12 tabular-nums`}
          value={text}
          onChange={(e) => setText(cleanAmountInput(e.target.value))}
          placeholder="z. B. 100"
          inputMode="decimal"
          autoComplete="off"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500">{currency}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">Als Einmalausgabe im {monthLabel} abziehen</p>
        <Toggle
          checked={recordAsOneOff}
          onChange={() => setRecordAsOneOff((v) => !v)}
          label="Als Einmalausgabe erfassen"
        />
      </div>
      <button
        type="button"
        disabled={!valid}
        onClick={() => valid && onSubmit(Math.min(amount, max), recordAsOneOff)}
        className="mt-2 h-11 w-full rounded-xl bg-amber-300 font-semibold text-zinc-950 transition active:scale-[0.98] disabled:opacity-30"
      >
        {title} speichern
      </button>
    </section>
  )
}

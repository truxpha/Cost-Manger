import { HandCoins } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { amountToInput, formatMoney, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import { cleanAmountInput, inputClass, labelClass } from '../lib/ui'
import type { Debt } from '../types'
import { Toggle } from './Toggle'

interface Props {
  debt: Debt | null
  currency: string
  monthLabel: string
  onSave: (debt: Debt) => void
  onPay: (debt: Debt, amount: number, recordAsOneOff: boolean) => void
  onClose: () => void
}

export const DEBT_FORM_ID = 'debt-form'

export function DebtForm({ debt, currency, monthLabel, onSave, onPay, onClose }: Props) {
  const [name, setName] = useState(debt?.name ?? '')
  const [amountText, setAmountText] = useState(amountToInput(debt?.amount ?? 0))
  const [note, setNote] = useState(debt?.note ?? '')
  const [payText, setPayText] = useState('')
  const [recordAsOneOff, setRecordAsOneOff] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const amount = parseAmount(amountText)
  const payAmount = parseAmount(payText)
  const nameError = submitted && name.trim() === ''
  const amountError = submitted && amount === null
  const paidSoFar = debt ? debt.original - debt.amount : 0
  const canPay = debt !== null && debt.amount > 0 && payAmount !== null && payAmount > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (name.trim() === '' || amount === null) return
    const result: Debt = {
      id: debt?.id ?? createId(),
      name: name.trim(),
      amount,
      // Ursprungsbetrag bleibt für den Fortschritt erhalten, außer die Schuld wird erhöht
      original: debt ? Math.max(amount, debt.original) : amount,
    }
    if (note.trim()) result.note = note.trim()
    onSave(result)
    onClose()
  }

  return (
    <div className="space-y-5">
      <form id={DEBT_FORM_ID} onSubmit={handleSubmit} className="space-y-5" noValidate>
        {!debt && (
          <p className="text-xs text-zinc-500">
            Für Geld, das du jemandem schuldest, aber ohne feste Raten. Wird <strong>nicht</strong> vom Budget
            abgezogen – steht nur als Merkposten in der Übersicht.
          </p>
        )}

        <div>
          <label htmlFor="debt-name" className={labelClass}>
            Bei wem / wofür?
          </label>
          <input
            id="debt-name"
            className={`${inputClass} ${nameError ? 'border-rose-500/70' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Mama"
            autoComplete="off"
            maxLength={60}
          />
          {nameError && <p className="mt-1 text-xs text-rose-400">Bitte eintragen, bei wem.</p>}
        </div>

        <div>
          <label htmlFor="debt-amount" className={labelClass}>
            {debt ? 'Noch offen' : 'Betrag'}
          </label>
          <div className="relative">
            <input
              id="debt-amount"
              className={`${inputClass} pr-12 text-2xl font-semibold tabular-nums ${amountError ? 'border-rose-500/70' : ''}`}
              value={amountText}
              onChange={(e) => setAmountText(cleanAmountInput(e.target.value))}
              placeholder="0,00"
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-zinc-500">
              {currency}
            </span>
          </div>
          {debt && debt.original > 0 && paidSoFar > 0 && (
            <p className="mt-1 text-xs text-zinc-500 tabular-nums">
              Bereits {formatMoney(paidSoFar, currency)} von {formatMoney(debt.original, currency)} zurückgezahlt
            </p>
          )}
        </div>

        <div>
          <label htmlFor="debt-note" className={labelClass}>
            Notiz (optional)
          </label>
          <input
            id="debt-note"
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z. B. für die Kaution, bis Sommer zurück"
            autoComplete="off"
            maxLength={120}
          />
        </div>
      </form>

      {debt && debt.amount > 0 && (
        <section className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <HandCoins className="size-4 text-amber-300" /> Rückzahlung erfassen
          </h3>
          <div className="relative mt-3">
            <input
              aria-label="Rückgezahlter Betrag"
              className={`${inputClass} pr-12 tabular-nums`}
              value={payText}
              onChange={(e) => setPayText(cleanAmountInput(e.target.value))}
              placeholder="z. B. 100"
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500">
              {currency}
            </span>
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
            disabled={!canPay}
            onClick={() => {
              if (!canPay) return
              onPay(debt, Math.min(payAmount, debt.amount), recordAsOneOff)
              onClose()
            }}
            className="mt-2 h-11 w-full rounded-xl bg-amber-300 font-semibold text-zinc-950 transition active:scale-[0.98] disabled:opacity-30"
          >
            Rückzahlung speichern
          </button>
        </section>
      )}
    </div>
  )
}

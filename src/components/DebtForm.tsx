import { useState, type FormEvent } from 'react'
import { amountToInput, formatMoney, parseAmount, rateToInput } from '../lib/format'
import { createId } from '../lib/id'
import { cleanAmountInput, focusField, inputClass, labelClass } from '../lib/ui'
import type { Debt } from '../types'
import { RepaymentBox } from './RepaymentBox'
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

/** Schuld ohne feste Rate, z. B. bei Familie, Dispo oder Kreditkarte ohne Teilzahlung */
export function DebtForm({ debt, currency, monthLabel, onSave, onPay, onClose }: Props) {
  const [name, setName] = useState(debt?.name ?? '')
  // Beglichene Schuld zeigt „0“, damit sie ohne neue Eingabe gespeichert werden kann
  const [amountText, setAmountText] = useState(debt && debt.amount === 0 ? '0' : amountToInput(debt?.amount ?? 0))
  const [rateText, setRateText] = useState(debt?.interestRate !== undefined ? rateToInput(debt.interestRate) : '')
  const [cancelWhenPaid, setCancelWhenPaid] = useState(Boolean(debt?.cancelWhenPaid))
  const [note, setNote] = useState(debt?.note ?? '')
  const [submitted, setSubmitted] = useState(false)

  const amount = parseAmount(amountText)
  const rate = rateText.trim() === '' ? null : parseAmount(rateText)
  const nameError = submitted && name.trim() === ''
  const amountError = submitted && amount === null
  const rateInvalid = rateText.trim() !== '' && (rate === null || rate > 100)
  const paidSoFar = debt ? debt.original - debt.amount : 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (name.trim() === '') {
      focusField('debt-name')
      return
    }
    if (amount === null) {
      focusField('debt-amount')
      return
    }
    if (rateInvalid) {
      focusField('debt-rate')
      return
    }
    const result: Debt = {
      id: debt?.id ?? createId(),
      name: name.trim(),
      amount,
      // Ursprungsbetrag bleibt für den Fortschritt erhalten, außer die Schuld wird erhöht
      original: debt ? Math.max(amount, debt.original) : amount,
    }
    if (rate !== null) result.interestRate = rate
    if (cancelWhenPaid) result.cancelWhenPaid = true
    if (note.trim()) result.note = note.trim()
    onSave(result)
    onClose()
  }

  return (
    <div className="space-y-5">
      <form id={DEBT_FORM_ID} onSubmit={handleSubmit} className="space-y-5" noValidate>
        {!debt && (
          <p className="text-xs text-zinc-500">
            Für Schulden ohne feste Monatsrate – z. B. bei Familie, Dispo oder eine Kreditkarte, die du unregelmäßig
            abzahlst. Wird <strong>nicht</strong> vom Budget abgezogen, aber im Tilgungsplan berücksichtigt.
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
            placeholder="z. B. Mama, Dispo"
            autoComplete="off"
            maxLength={60}
          />
          {nameError && <p className="mt-1 text-xs text-rose-400">Bitte eintragen, bei wem.</p>}
        </div>

        <div className="grid grid-cols-[1fr_7.5rem] gap-2">
          <div>
            <label htmlFor="debt-amount" className={labelClass}>
              {debt ? 'Noch offen' : 'Betrag'}
            </label>
            <div className="relative">
              <input
                id="debt-amount"
                className={`${inputClass} pr-9 text-xl font-semibold tabular-nums ${amountError ? 'border-rose-500/70' : ''}`}
                value={amountText}
                onChange={(e) => setAmountText(cleanAmountInput(e.target.value))}
                placeholder="0,00"
                inputMode="decimal"
                autoComplete="off"
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500">
                {currency}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="debt-rate" className={labelClass}>
              Zins p. a.
            </label>
            <div className="relative">
              <input
                id="debt-rate"
                className={`${inputClass} pr-8 tabular-nums ${submitted && rateInvalid ? 'border-rose-500/70' : ''}`}
                value={rateText}
                onChange={(e) => setRateText(cleanAmountInput(e.target.value))}
                placeholder="0"
                inputMode="decimal"
                autoComplete="off"
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-zinc-500">%</span>
            </div>
          </div>
        </div>
        {(amountError || (submitted && rateInvalid)) && (
          <p className="-mt-3 text-xs text-rose-400">Bitte gültige Werte eintragen (Zins zwischen 0 und 100 %).</p>
        )}
        {debt && debt.original > 0 && paidSoFar > 0 && (
          <p className="-mt-3 text-xs text-zinc-500 tabular-nums">
            Bereits {formatMoney(paidSoFar, currency)} von {formatMoney(debt.original, currency)} zurückgezahlt
          </p>
        )}

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

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.04] py-1 pr-1 pl-4">
          <div>
            <p className="text-sm font-medium">Nach Abzahlung kündigen</p>
            <p className="text-xs text-zinc-500">z. B. Dispo oder Kreditkarte</p>
          </div>
          <Toggle
            checked={cancelWhenPaid}
            onChange={() => setCancelWhenPaid((v) => !v)}
            label="Nach Abzahlung kündigen"
          />
        </div>
      </form>

      {debt && debt.amount > 0 && (
        <RepaymentBox
          title="Rückzahlung"
          currency={currency}
          monthLabel={monthLabel}
          max={debt.amount}
          onSubmit={(value, recordAsOneOff) => {
            onPay(debt, value, recordAsOneOff)
            onClose()
          }}
        />
      )}
    </div>
  )
}

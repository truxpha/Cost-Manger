import { useState, type FormEvent } from 'react'
import { currentMonthIndex, fromMonthIndex, parseMonthKey, toMonthKey } from '../lib/calc'
import { amountToInput, formatMonthIndex, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import { cleanAmountInput, inputClass, labelClass } from '../lib/ui'
import type { OneOff } from '../types'
import { MonthPicker } from './MonthPicker'

interface Props {
  item: OneOff | null
  currency: string
  now: Date
  /** Zuletzt verwendete Bezeichnungen als Schnellauswahl */
  recentNames: string[]
  onSave: (item: OneOff) => void
  onClose: () => void
}

export const ONEOFF_FORM_ID = 'oneoff-form'

const DEFAULT_CHIPS = ['Geschenk', 'Reparatur', 'Arzt', 'Urlaub', 'Anschaffung']

export function OneOffForm({ item, currency, now, recentNames, onSave, onClose }: Props) {
  const curIdx = currentMonthIndex(now)
  const [name, setName] = useState(item?.name ?? '')
  const [amountText, setAmountText] = useState(amountToInput(item?.amount ?? 0))
  const [monthIdx, setMonthIdx] = useState(item ? parseMonthKey(item.month) : curIdx)
  const [note, setNote] = useState(item?.note ?? '')
  const [submitted, setSubmitted] = useState(false)

  const amount = parseAmount(amountText)
  const nameError = submitted && name.trim() === ''
  const amountError = submitted && (amount === null || amount <= 0)
  const chips = [...new Set([...recentNames, ...DEFAULT_CHIPS])].slice(0, 8)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (name.trim() === '' || amount === null || amount <= 0) return
    const result: OneOff = { id: item?.id ?? createId(), name: name.trim(), amount, month: toMonthKey(monthIdx) }
    if (note.trim()) result.note = note.trim()
    onSave(result)
    onClose()
  }

  return (
    <form id={ONEOFF_FORM_ID} onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-xs text-zinc-500">
        Zählt nur in einem Monat – z. B. Geld an Familie, Geschenk, Reparatur. Wird im Ausblick und bei „Übrig
        diesen Monat“ abgezogen.
      </p>

      {!item && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setName(chip)}
              className={`h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium transition active:scale-95 ${
                name === chip
                  ? 'border-white bg-white text-zinc-950'
                  : 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="oneoff-name" className={labelClass}>
          Wofür?
        </label>
        <input
          id="oneoff-name"
          className={`${inputClass} ${nameError ? 'border-rose-500/70' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Geld an Mama"
          autoComplete="off"
          maxLength={60}
        />
        {nameError && <p className="mt-1 text-xs text-rose-400">Bitte eine Bezeichnung eingeben.</p>}
      </div>

      <div>
        <label htmlFor="oneoff-amount" className={labelClass}>
          Betrag
        </label>
        <div className="relative">
          <input
            id="oneoff-amount"
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
        {amountError && <p className="mt-1 text-xs text-rose-400">Bitte einen gültigen Betrag eingeben.</p>}
      </div>

      <div>
        <span className={labelClass}>In welchem Monat?</span>
        <div className="mb-2 flex gap-2">
          {[curIdx, curIdx + 1].map((idx, i) => (
            <button
              key={idx}
              type="button"
              aria-pressed={monthIdx === idx}
              onClick={() => setMonthIdx(idx)}
              className={`h-10 rounded-full border px-3.5 text-sm font-medium transition ${
                monthIdx === idx
                  ? 'border-white bg-white text-zinc-950'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
              }`}
            >
              {i === 0 ? 'Dieser Monat' : 'Nächster Monat'}
            </button>
          ))}
        </div>
        <MonthPicker
          value={monthIdx}
          onChange={setMonthIdx}
          fromYear={fromMonthIndex(curIdx).year - 1}
          years={6}
          label="Monat"
        />
        <p className="mt-1 text-xs text-zinc-500">{formatMonthIndex(monthIdx)}</p>
      </div>

      <div>
        <label htmlFor="oneoff-note" className={labelClass}>
          Notiz (optional)
        </label>
        <input
          id="oneoff-note"
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Rückzahlung"
          autoComplete="off"
          maxLength={120}
        />
      </div>
    </form>
  )
}

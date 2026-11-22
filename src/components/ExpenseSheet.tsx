import { Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  currentMonthIndex,
  endMonthForPayments,
  fromMonthIndex,
  monthIndex,
  monthlyEquivalent,
  parseMonthKey,
  remainingPayments,
  toMonthKey,
} from '../lib/calc'
import { ACCENT_COLORS, CATEGORIES, getCategory } from '../lib/categories'
import { amountToInput, CYCLE_LABEL, formatMoney, MONTHS, parseAmount, quarterMonths, MONTHS_SHORT } from '../lib/format'
import { createId } from '../lib/id'
import type { BillingCycle, Category, Expense } from '../types'
import { BottomSheet } from './BottomSheet'
import { Toggle } from './Toggle'

interface Props {
  expense: Expense | null
  currency: string
  onSave: (expense: Expense) => void
  onDelete: (id: string) => void
  onClose: () => void
  now: Date
}

interface Preset {
  name: string
  category: Category
  billingDay: number
  billingCycle?: BillingCycle
  billingMonth?: number
  /** Befristet mit n Zahlungen */
  payments?: number
}

const PRESETS: Preset[] = [
  { name: 'Miete', category: 'Wohnen', billingDay: 1 },
  { name: 'Kredit', category: 'Kredite & Bildung', billingDay: 15 },
  { name: 'BAföG', category: 'Kredite & Bildung', billingDay: 30, billingCycle: 'quarterly', billingMonth: 3 },
  { name: 'Strom', category: 'Wohnen', billingDay: 15 },
  { name: 'Internet', category: 'Verträge & Abos', billingDay: 5 },
  { name: 'Versicherung', category: 'Versicherung & Gesundheit', billingDay: 1 },
  { name: 'Gym', category: 'Verträge & Abos', billingDay: 1 },
  { name: 'Ratenkauf', category: 'Sonstiges', billingDay: 1, payments: 12 },
]

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const inputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.06]'
const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400'

export function ExpenseSheet({ expense, currency, onSave, onDelete, onClose, now }: Props) {
  const isNew = expense === null
  const [name, setName] = useState(expense?.name ?? '')
  const [amountText, setAmountText] = useState(amountToInput(expense?.amount ?? 0))
  const [cycle, setCycle] = useState<BillingCycle>(expense?.billingCycle ?? 'monthly')
  const [billingDay, setBillingDay] = useState(expense?.billingDay ?? 1)
  const [billingMonth, setBillingMonth] = useState(() => expense?.billingMonth ?? new Date().getMonth() + 1)
  const [category, setCategory] = useState<Category>(expense?.category ?? 'Wohnen')
  const [color, setColor] = useState(expense?.color ?? getCategory('Wohnen').color)
  const [colorTouched, setColorTouched] = useState(
    expense ? expense.color !== getCategory(expense.category).color : false,
  )
  const [isActive, setIsActive] = useState(expense?.isActive ?? true)
  const curIdx = currentMonthIndex(now)
  const [hasEnd, setHasEnd] = useState(Boolean(expense?.endMonth))
  const [endIdx, setEndIdx] = useState(() =>
    expense?.endMonth ? parseMonthKey(expense.endMonth) : curIdx + 11,
  )
  const [countText, setCountText] = useState('')
  const [countFocused, setCountFocused] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const amount = parseAmount(amountText)
  const schedule = { billingCycle: cycle, billingDay, billingMonth }
  const remainingCount = remainingPayments(schedule, endIdx, now)
  const endParts = fromMonthIndex(endIdx)
  const years = Array.from({ length: 41 }, (_, i) => fromMonthIndex(curIdx).year + i)
  if (endParts.year < years[0]) years.unshift(endParts.year)

  const changeCount = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 3)
    setCountText(clean)
    const n = Number(clean)
    if (n >= 1) setEndIdx(endMonthForPayments(schedule, n, now))
  }
  const nameError = submitted && name.trim() === ''
  const amountError = submitted && (amount === null || amount <= 0)

  const changeCategory = (next: Category) => {
    setCategory(next)
    if (!colorTouched) setColor(getCategory(next).color)
  }

  const applyPreset = (preset: Preset) => {
    setName(preset.name)
    changeCategory(preset.category)
    setBillingDay(preset.billingDay)
    setCycle(preset.billingCycle ?? 'monthly')
    if (preset.billingMonth) setBillingMonth(preset.billingMonth)
    if (preset.payments) {
      setHasEnd(true)
      setEndIdx(
        endMonthForPayments(
          { billingCycle: preset.billingCycle ?? 'monthly', billingDay: preset.billingDay, billingMonth: preset.billingMonth },
          preset.payments,
          now,
        ),
      )
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (name.trim() === '' || amount === null || amount <= 0) return
    const result: Expense = {
      id: expense?.id ?? createId(),
      name: name.trim(),
      amount,
      billingCycle: cycle,
      billingDay,
      category,
      color,
      isActive,
    }
    if (cycle !== 'monthly') result.billingMonth = billingMonth
    if (hasEnd) result.endMonth = toMonthKey(endIdx)
    onSave(result)
    onClose()
  }

  const preview =
    amount !== null && amount > 0 && cycle !== 'monthly'
      ? monthlyEquivalent({ amount, billingCycle: cycle })
      : null

  return (
    <BottomSheet
      title={isNew ? 'Fixkosten hinzufügen' : 'Fixkosten bearbeiten'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (confirmDelete) {
                  onDelete(expense.id)
                  onClose()
                } else {
                  setConfirmDelete(true)
                }
              }}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-4 font-medium transition ${
                confirmDelete
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
              aria-label="Löschen"
            >
              <Trash2 className="size-5" />
              {confirmDelete && <span>Wirklich löschen?</span>}
            </button>
          )}
          <button
            type="submit"
            form="expense-form"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
          >
            <Check className="size-5" />
            {isNew ? 'Hinzufügen' : 'Speichern'}
          </button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {isNew && (
          <div>
            <span className={labelClass}>Schnellauswahl</span>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {PRESETS.map((preset) => {
                const meta = getCategory(preset.category)
                const Icon = meta.icon
                const selected = name === preset.name
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition active:scale-95 ${
                      selected
                        ? 'border-white bg-white text-zinc-950'
                        : 'border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon className="size-4" style={{ color: selected ? undefined : meta.color }} />
                    {preset.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="expense-name" className={labelClass}>
            Bezeichnung
          </label>
          <input
            id="expense-name"
            className={`${inputClass} ${nameError ? 'border-rose-500/70' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Miete, Strom, Netflix"
            autoComplete="off"
            enterKeyHint="next"
            maxLength={60}
          />
          {nameError && <p className="mt-1 text-xs text-rose-400">Bitte eine Bezeichnung eingeben.</p>}
        </div>

        <div>
          <label htmlFor="expense-amount" className={labelClass}>
            Betrag pro Abbuchung
          </label>
          <div className="relative">
            <input
              id="expense-amount"
              className={`${inputClass} pr-12 text-2xl font-semibold tabular-nums ${amountError ? 'border-rose-500/70' : ''}`}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-zinc-500">
              {currency}
            </span>
          </div>
          {amountError && <p className="mt-1 text-xs text-rose-400">Bitte einen gültigen Betrag eingeben.</p>}
          {preview !== null && (
            <p className="mt-1 text-xs text-zinc-500">
              Entspricht <span className="text-zinc-300 tabular-nums">{formatMoney(preview, currency)}</span> pro
              Monat
            </p>
          )}
        </div>

        <div>
          <span className={labelClass}>Abrechnungszyklus</span>
          <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.04] p-1">
            {CYCLES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cycle === c}
                onClick={() => setCycle(c)}
                className={`h-10 rounded-xl text-sm font-medium transition ${
                  cycle === c ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {CYCLE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-3 ${cycle === 'monthly' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label htmlFor="expense-day" className={labelClass}>
              Abbuchungstag
            </label>
            <select
              id="expense-day"
              className={`${inputClass} appearance-none`}
              value={billingDay}
              onChange={(e) => setBillingDay(Number(e.target.value))}
            >
              {DAYS.map((d) => (
                <option key={d} value={d} className="bg-zinc-900">
                  {cycle === 'monthly' ? `Am ${d}. des Monats` : `${d}.`}
                </option>
              ))}
            </select>
          </div>
          {cycle !== 'monthly' && (
            <div>
              <label htmlFor="expense-month" className={labelClass}>
                {cycle === 'yearly' ? 'Fällig im' : 'Erstmals im'}
              </label>
              <select
                id="expense-month"
                className={`${inputClass} appearance-none`}
                value={billingMonth}
                onChange={(e) => setBillingMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-zinc-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {cycle === 'quarterly' && (
          <p className="-mt-3 text-xs text-zinc-500">
            Abbuchung in: {quarterMonths(billingMonth).map((m) => MONTHS_SHORT[m - 1]).join(', ')}
          </p>
        )}

        <div>
          <span className={labelClass}>Kategorie</span>
          <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((meta, i) => {
              const Icon = meta.icon
              const selected = category === meta.id
              return (
                <button
                  key={meta.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => changeCategory(meta.id)}
                  className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left text-[13px] leading-tight font-medium transition ${
                    i === CATEGORIES.length - 1 ? 'col-span-2' : ''
                  } ${selected ? 'border-white/40 bg-white/[0.09]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">{meta.id}</span>
                  {selected && <Check className="size-4 shrink-0 text-emerald-400" />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className={labelClass}>Akzentfarbe</span>
          <div className="grid grid-cols-5 justify-items-center gap-1 sm:grid-cols-10">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  setColorTouched(true)
                }}
                className="flex size-11 items-center justify-center"
                aria-label={`Farbe ${c}`}
                aria-pressed={color === c}
              >
                <span
                  className={`size-7 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-1' : ''}`}
                  style={{ backgroundColor: c }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.04]">
          <div className="flex items-center justify-between py-1 pr-1 pl-4">
            <div>
              <p className="text-sm font-medium">Befristete Laufzeit</p>
              <p className="text-xs text-zinc-500">z. B. Kredit, Ratenkauf, Vertrag mit Enddatum</p>
            </div>
            <Toggle checked={hasEnd} onChange={() => setHasEnd((v) => !v)} label="Befristete Laufzeit" />
          </div>
          {hasEnd && (
            <div className="space-y-3 border-t border-white/5 px-4 pt-3 pb-4">
              <div>
                <span className={labelClass}>Letzte Zahlung im</span>
                <div className="grid grid-cols-[1fr_7rem] gap-2">
                  <select
                    aria-label="Monat der letzten Zahlung"
                    className={`${inputClass} appearance-none`}
                    value={endParts.month}
                    onChange={(e) => setEndIdx(monthIndex(endParts.year, Number(e.target.value)))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1} className="bg-zinc-900">
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Jahr der letzten Zahlung"
                    className={`${inputClass} appearance-none`}
                    value={endParts.year}
                    onChange={(e) => setEndIdx(monthIndex(Number(e.target.value), endParts.month))}
                  >
                    {years.map((y) => (
                      <option key={y} value={y} className="bg-zinc-900">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="expense-count" className={labelClass}>
                  oder: verbleibende Zahlungen
                </label>
                <input
                  id="expense-count"
                  className={`${inputClass} tabular-nums`}
                  value={countFocused ? countText : String(remainingCount)}
                  onFocus={() => {
                    setCountText(String(remainingCount))
                    setCountFocused(true)
                  }}
                  onBlur={() => setCountFocused(false)}
                  onChange={(e) => changeCount(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-zinc-400">
                {remainingCount > 0 ? (
                  <>
                    Noch <span className="text-zinc-200 tabular-nums">{remainingCount}</span>{' '}
                    {remainingCount === 1 ? 'Zahlung' : 'Zahlungen'}
                    {amount ? (
                      <>
                        {' '}
                        · Restbetrag{' '}
                        <span className="text-zinc-200 tabular-nums">{formatMoney(remainingCount * amount, currency)}</span>
                      </>
                    ) : null}
                    . Ab {MONTHS[fromMonthIndex(endIdx + 1).month - 1]} {fromMonthIndex(endIdx + 1).year} hast du{' '}
                    {amount ? (
                      <span className="text-emerald-300 tabular-nums">
                        {formatMoney(monthlyEquivalent({ amount, billingCycle: cycle }), currency)}
                      </span>
                    ) : (
                      'diesen Betrag'
                    )}{' '}
                    mehr pro Monat.
                  </>
                ) : (
                  'Keine Zahlungen mehr offen – der Posten gilt als abbezahlt.'
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] py-1 pr-1 pl-4">
          <div>
            <p className="text-sm font-medium">In Berechnung einbeziehen</p>
            <p className="text-xs text-zinc-500">Aus = pausiert / „Was wäre wenn“-Szenario</p>
          </div>
          <Toggle checked={isActive} onChange={() => setIsActive((v) => !v)} label="Aktiv" />
        </div>
      </form>
    </BottomSheet>
  )
}

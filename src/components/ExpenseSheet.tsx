import { Check, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { monthlyEquivalent } from '../lib/calc'
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
}

interface Preset {
  name: string
  category: Category
  billingDay: number
  billingCycle?: BillingCycle
  billingMonth?: number
}

const PRESETS: Preset[] = [
  { name: 'Miete', category: 'Wohnen', billingDay: 1 },
  { name: 'Kredit', category: 'Kredite & Bildung', billingDay: 15 },
  { name: 'BAföG', category: 'Kredite & Bildung', billingDay: 30, billingCycle: 'quarterly', billingMonth: 3 },
  { name: 'Strom', category: 'Wohnen', billingDay: 15 },
  { name: 'Internet', category: 'Verträge & Abos', billingDay: 5 },
  { name: 'Versicherung', category: 'Versicherung & Gesundheit', billingDay: 1 },
  { name: 'Gym', category: 'Verträge & Abos', billingDay: 1 },
]

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const inputClass =
  'h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.06]'
const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400'

export function ExpenseSheet({ expense, currency, onSave, onDelete, onClose }: Props) {
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const amount = parseAmount(amountText)
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
          <div role="radiogroup" className="grid grid-cols-1 gap-1.5">
            {CATEGORIES.map((meta) => {
              const Icon = meta.icon
              const selected = category === meta.id
              return (
                <button
                  key={meta.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => changeCategory(meta.id)}
                  className={`flex h-12 items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium transition ${
                    selected ? 'border-white/30 bg-white/[0.08]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{meta.id}</span>
                  {selected && <Check className="size-4 text-emerald-400" />}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className={labelClass}>Akzentfarbe</span>
          <div className="flex flex-wrap gap-1">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c)
                  setColorTouched(true)
                }}
                className="flex size-10 items-center justify-center"
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

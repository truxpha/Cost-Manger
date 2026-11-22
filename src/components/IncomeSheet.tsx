import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { amountToInput, formatMoney, parseAmount } from '../lib/format'
import { createId } from '../lib/id'
import type { IncomeItem } from '../types'
import { BottomSheet } from './BottomSheet'
import { Toggle } from './Toggle'

interface Props {
  netIncome: number
  extraIncome: IncomeItem[]
  currency: string
  onSave: (netIncome: number, extraIncome: IncomeItem[]) => void
  onClose: () => void
}

interface DraftItem {
  id: string
  name: string
  amountText: string
  isActive: boolean
}

const inputBase =
  'h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.06]'
const inputClass = `${inputBase} w-full`

export function IncomeSheet({ netIncome, extraIncome, currency, onSave, onClose }: Props) {
  const [netText, setNetText] = useState(amountToInput(netIncome))
  const [items, setItems] = useState<DraftItem[]>(() =>
    extraIncome.map((i) => ({ id: i.id, name: i.name, amountText: amountToInput(i.amount), isActive: i.isActive })),
  )

  const net = parseAmount(netText) ?? 0
  const extraTotal = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + (parseAmount(i.amountText) ?? 0), 0)

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleaned: IncomeItem[] = items
      .map((i) => ({
        id: i.id,
        name: i.name.trim() || 'Zusatzeinkommen',
        amount: parseAmount(i.amountText) ?? 0,
        isActive: i.isActive,
      }))
      .filter((i) => i.amount > 0)
    onSave(net, cleaned)
    onClose()
  }

  return (
    <BottomSheet
      title="Einkommen"
      onClose={onClose}
      footer={
        <button
          type="submit"
          form="income-form"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
        >
          <Check className="size-5" />
          Speichern · {formatMoney(net + extraTotal, currency)}
        </button>
      }
    >
      <form id="income-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="net-income" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Monatliches Nettoeinkommen
          </label>
          <div className="relative">
            <input
              id="net-income"
              className={`${inputClass} pr-12 text-2xl font-semibold tabular-nums`}
              value={netText}
              onChange={(e) => setNetText(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="3900"
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-zinc-500">
              {currency}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Zusätzliches Einkommen (optional)</span>
            {items.length > 0 && (
              <span className="text-xs text-zinc-500 tabular-nums">+{formatMoney(extraTotal, currency)}</span>
            )}
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-2">
                <div className="flex gap-2">
                  <input
                    className={`${inputBase} min-w-0 flex-1`}
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    placeholder="z. B. Nebenjob"
                    aria-label="Bezeichnung"
                    maxLength={40}
                  />
                  <input
                    className={`${inputBase} w-28 shrink-0 text-right tabular-nums`}
                    value={item.amountText}
                    onChange={(e) => updateItem(item.id, { amountText: e.target.value.replace(/[^0-9.,]/g, '') })}
                    placeholder="0"
                    inputMode="decimal"
                    aria-label="Betrag"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setItems((list) => list.filter((i) => i.id !== item.id))}
                    className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-4" /> Entfernen
                  </button>
                  <div className="flex items-center text-xs text-zinc-400">
                    {item.isActive ? 'Aktiv' : 'Pausiert'}
                    <Toggle
                      checked={item.isActive}
                      onChange={() => updateItem(item.id, { isActive: !item.isActive })}
                      label={`${item.name || 'Einkommen'} aktiv`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              setItems((list) => [...list, { id: createId(), name: '', amountText: '', isActive: true }])
            }
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04]"
          >
            <Plus className="size-4" /> Einkommensquelle hinzufügen
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}

import { useState } from 'react'
import { MONTHS } from '../lib/format'
import type { Debt, EntryKind, Expense, OneOff } from '../types'
import { BottomSheet } from './BottomSheet'
import { DEBT_FORM_ID, DebtForm } from './DebtForm'
import { EXPENSE_FORM_ID, ExpenseForm } from './ExpenseForm'
import { FormFooter } from './FormFooter'
import { ONEOFF_FORM_ID, OneOffForm } from './OneOffForm'

export type EntryTarget =
  | { kind: 'expense'; item: Expense | null }
  | { kind: 'oneoff'; item: OneOff | null }
  | { kind: 'debt'; item: Debt | null }

interface Props {
  target: EntryTarget
  currency: string
  now: Date
  recentOneOffNames: string[]
  onSaveExpense: (expense: Expense) => void
  onDeleteExpense: (id: string) => void
  onSaveOneOff: (item: OneOff) => void
  onDeleteOneOff: (id: string) => void
  onSaveDebt: (debt: Debt) => void
  onDeleteDebt: (id: string) => void
  onPayDebt: (debt: Debt, amount: number, recordAsOneOff: boolean) => void
  onClose: () => void
}

const KINDS: { id: EntryKind; label: string }[] = [
  { id: 'expense', label: 'Fixkosten' },
  { id: 'oneoff', label: 'Einmalig' },
  { id: 'debt', label: 'Schuld' },
]

const EDIT_TITLE: Record<EntryKind, string> = {
  expense: 'Fixkosten bearbeiten',
  oneoff: 'Einmalausgabe bearbeiten',
  debt: 'Schuld bearbeiten',
}

const FORM_ID: Record<EntryKind, string> = {
  expense: EXPENSE_FORM_ID,
  oneoff: ONEOFF_FORM_ID,
  debt: DEBT_FORM_ID,
}

export function EntrySheet(props: Props) {
  const { target, currency, now, onClose } = props
  const isNew = target.item === null
  const [kind, setKind] = useState<EntryKind>(target.kind)

  const remove = () => {
    if (!target.item) return
    if (target.kind === 'expense') props.onDeleteExpense(target.item.id)
    if (target.kind === 'oneoff') props.onDeleteOneOff(target.item.id)
    if (target.kind === 'debt') props.onDeleteDebt(target.item.id)
    onClose()
  }

  return (
    <BottomSheet
      title={isNew ? 'Neuer Eintrag' : EDIT_TITLE[kind]}
      onClose={onClose}
      fullHeight={isNew}
      toolbar={
        isNew && (
          <div role="radiogroup" aria-label="Art des Eintrags" className="grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.05] p-1">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={`h-10 rounded-xl text-sm font-semibold transition ${
                  kind === k.id ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        )
      }
      footer={
        <FormFooter
          key={kind}
          formId={FORM_ID[kind]}
          submitLabel={isNew ? 'Hinzufügen' : 'Speichern'}
          onDelete={isNew ? undefined : remove}
        />
      }
    >
      {kind === 'expense' && (
        <ExpenseForm
          expense={target.kind === 'expense' ? target.item : null}
          currency={currency}
          now={now}
          onSave={props.onSaveExpense}
          onClose={onClose}
        />
      )}
      {kind === 'oneoff' && (
        <OneOffForm
          item={target.kind === 'oneoff' ? target.item : null}
          currency={currency}
          now={now}
          recentNames={props.recentOneOffNames}
          onSave={props.onSaveOneOff}
          onClose={onClose}
        />
      )}
      {kind === 'debt' && (
        <DebtForm
          debt={target.kind === 'debt' ? target.item : null}
          currency={currency}
          monthLabel={MONTHS[now.getMonth()]}
          onSave={props.onSaveDebt}
          onPay={props.onPayDebt}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  )
}

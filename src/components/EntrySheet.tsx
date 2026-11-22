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
  onLoanRepayment: (expense: Expense, amount: number, recordAsOneOff: boolean) => void
  onClose: () => void
}

type DebtMode = 'rate' | 'plain'

const DEBT_MODES: { id: DebtMode; title: string; text: string }[] = [
  { id: 'rate', title: 'Mit monatlicher Rate', text: 'Kredit, Kreditkarte, Klarna' },
  { id: 'plain', title: 'Ohne feste Rate', text: 'Familie, Dispo' },
]

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
  const [debtMode, setDebtMode] = useState<DebtMode>('rate')
  // Neue Schuld mit Rate = Fixkosten-Posten mit Kredit-Details
  const loanForm = isNew && kind === 'debt' && debtMode === 'rate'
  const formId = loanForm ? EXPENSE_FORM_ID : FORM_ID[kind]
  const monthLabel = MONTHS[now.getMonth()]

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
          key={formId}
          formId={formId}
          submitLabel={isNew ? 'Hinzufügen' : 'Speichern'}
          onDelete={isNew ? undefined : remove}
        />
      }
    >
      {isNew && kind === 'debt' && (
        <div role="radiogroup" aria-label="Art der Schuld" className="mb-5 grid grid-cols-2 gap-2">
          {DEBT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={debtMode === m.id}
              onClick={() => setDebtMode(m.id)}
              className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                debtMode === m.id
                  ? 'border-white/40 bg-white/[0.09]'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <span className="block text-sm font-semibold">{m.title}</span>
              <span className="block text-xs text-zinc-500">{m.text}</span>
            </button>
          ))}
        </div>
      )}
      {(kind === 'expense' || loanForm) && (
        <ExpenseForm
          key={loanForm ? 'loan' : 'expense'}
          expense={target.kind === 'expense' ? target.item : null}
          mode={loanForm ? 'loan' : 'default'}
          currency={currency}
          monthLabel={monthLabel}
          now={now}
          onSave={props.onSaveExpense}
          onLoanRepayment={props.onLoanRepayment}
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
      {kind === 'debt' && !loanForm && (
        <DebtForm
          debt={target.kind === 'debt' ? target.item : null}
          currency={currency}
          monthLabel={monthLabel}
          onSave={props.onSaveDebt}
          onPay={props.onPayDebt}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  )
}

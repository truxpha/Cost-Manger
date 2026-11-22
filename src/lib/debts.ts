import type { AppData, Debt, DebtStrategy, Expense } from '../types'
import {
  currentMonthIndex,
  effectiveDay,
  fromMonthIndex,
  isDueInMonth,
  monthIndex,
  monthlyEquivalent,
  parseMonthKey,
  remainingPayments,
  toMonthKey,
} from './calc'

const DAY_MS = 86_400_000
const DAYS_PER_MONTH = 30.4375
const MAX_MONTHS = 50 * 12
const EPSILON = 0.005

/** Farbe für Schulden ohne festen Posten (z. B. privat) */
export const PRIVATE_DEBT_COLOR = '#fcd34d'

/* ---------- Datumshilfen ---------- */

/** Lokales Datum als „YYYY-MM-DD“ */
export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* ---------- Kredite (Fixkosten mit Restschuld) ---------- */

/** Zählt ein Fixkosten-Posten als Schuld? (Kredit-Details oder Kategorie „Kredite & Bildung“) */
export function isLoanExpense(expense: Expense): boolean {
  return Boolean(expense.loan) || expense.category === 'Kredite & Bildung'
}

/** Abbuchungstermine eines Postens nach `after` (exklusiv), höchstens bis zum Laufzeitende */
function* paymentDates(expense: Expense, after: Date): Generator<Date> {
  const startIdx = monthIndex(after.getFullYear(), after.getMonth() + 1)
  const endIdx = expense.endMonth ? parseMonthKey(expense.endMonth) : startIdx + MAX_MONTHS
  for (let idx = startIdx; idx <= endIdx && idx < startIdx + MAX_MONTHS; idx++) {
    const { year, month } = fromMonthIndex(idx)
    if (!isDueInMonth(expense, month)) continue
    const date = new Date(year, month - 1, effectiveDay(expense, year, month))
    if (date > after) yield date
  }
}

export interface LoanProjection {
  /** Restschuld zum Zeitpunkt `at` */
  balance: number
  /** Monat der letzten Zahlung; null = wird mit dieser Rate nie abbezahlt */
  payoffIdx: number | null
  /** Zinsen ab `at` bis zur Abzahlung (bei payoffIdx = null: über 50 Jahre) */
  interest: number
}

/**
 * Schreibt die Restschuld eines Kredits ab dem Stichtag mit jeder Rate fort.
 * Zinsen werden zwischen zwei Abbuchungen anteilig nach Tagen berechnet (vereinfacht).
 */
export function projectLoan(expense: Expense, at: Date): LoanProjection {
  const loan = expense.loan
  if (!loan) return { balance: 0, payoffIdx: null, interest: 0 }
  const monthlyRate = (loan.interestRate ?? 0) / 100 / 12
  let balance = loan.balance
  let last = parseDateKey(loan.balanceDate)
  let current: number | null = null
  let interest = 0
  let lastIdx: number | null = null

  if (balance <= EPSILON) {
    // Ohne Restschuld fällt auch eine in diesem Monat noch ausstehende Rate weg
    const year = last.getFullYear()
    const month = last.getMonth() + 1
    const paidThisMonth = isDueInMonth(expense, month) && effectiveDay(expense, year, month) <= last.getDate()
    return { balance: 0, payoffIdx: monthIndex(year, month) - (paidThisMonth ? 0 : 1), interest: 0 }
  }

  for (const date of paymentDates(expense, last)) {
    if (current === null && date > at) current = balance
    const periodInterest = balance * monthlyRate * ((date.getTime() - last.getTime()) / DAY_MS / DAYS_PER_MONTH)
    if (current !== null) interest += periodInterest
    balance += periodInterest - expense.amount
    last = date
    lastIdx = monthIndex(date.getFullYear(), date.getMonth() + 1)
    if (balance <= EPSILON) {
      return { balance: current ?? 0, payoffIdx: lastIdx, interest }
    }
  }

  // Schleife beendet: Laufzeitende erreicht (Restschuld wird mit der letzten Rate fällig) oder nie abbezahlt
  const endedByContract = expense.endMonth !== undefined && lastIdx !== null
  return {
    balance: Math.max(0, current ?? balance),
    payoffIdx: endedByContract ? lastIdx : null,
    interest,
  }
}

/**
 * Leitet für Kredite mit Restschuld das voraussichtliche Ende ab, damit Budget, Ausblick und
 * Zeitleiste wissen, wann die Rate wegfällt. Gespeichert wird das nicht.
 */
export function withLoanEnds(expenses: Expense[], now: Date): Expense[] {
  return expenses.map((expense) => {
    if (!expense.loan) return expense
    const { payoffIdx } = projectLoan(expense, now)
    if (payoffIdx === null) return expense
    const endIdx = expense.endMonth ? parseMonthKey(expense.endMonth) : null
    // Ohne Zinssatz wäre das berechnete Ende zu früh → vertragliches Ende behalten
    if (endIdx !== null && (expense.loan.interestRate === undefined || payoffIdx >= endIdx)) return expense
    return { ...expense, endMonth: toMonthKey(payoffIdx) }
  })
}

/* ---------- Schuldenübersicht ---------- */

export interface DebtEntry {
  id: string
  name: string
  color: string
  /** Aktuelle Restschuld */
  balance: number
  /** Restschuld bei Erfassung (für den Fortschritt), falls bekannt */
  original: number | null
  /** Restschuld nur geschätzt: verbleibende Raten × Rate (inkl. Zinsen) */
  estimated: boolean
  /** Keine Restschuld bekannt (Kredit-Posten ohne Angaben) */
  unknown: boolean
  /** Effektiver Jahreszins in Prozent, null = unbekannt */
  rate: number | null
  /** Monatliche Rate (normalisiert), 0 = keine feste Rate */
  payment: number
  paidOff: boolean
  cancelWhenPaid: boolean
  /** Deckt die Rate wenigstens die Zinsen? */
  coversInterest: boolean
  /** Fixkosten-Posten (Kredit) bzw. private Schuld, aus der der Eintrag stammt */
  expense?: Expense
  debt?: Debt
}

/** Alle Schulden: Kredite aus den Fixkosten und Schulden ohne feste Rate */
export function collectDebts(data: AppData, now: Date): DebtEntry[] {
  const cur = currentMonthIndex(now)
  const entries: DebtEntry[] = []

  for (const expense of data.expenses) {
    if (!expense.isActive || !isLoanExpense(expense)) continue
    const payment = monthlyEquivalent(expense)
    const base = { id: expense.id, name: expense.name, color: expense.color, payment, expense }

    if (expense.loan) {
      const rate = expense.loan.interestRate ?? null
      const { balance } = projectLoan(expense, now)
      const monthlyInterest = (balance * (rate ?? 0)) / 1200
      entries.push({
        ...base,
        balance,
        original: expense.loan.original,
        estimated: false,
        unknown: false,
        rate,
        paidOff: balance <= EPSILON,
        cancelWhenPaid: Boolean(expense.loan.cancelWhenPaid),
        coversInterest: balance <= EPSILON || payment > monthlyInterest + EPSILON,
      })
    } else if (expense.endMonth) {
      const endIdx = parseMonthKey(expense.endMonth)
      const balance = remainingPayments(expense, endIdx, now) * expense.amount
      entries.push({
        ...base,
        balance,
        original: null,
        estimated: true,
        unknown: false,
        rate: null,
        paidOff: endIdx < cur || balance <= EPSILON,
        cancelWhenPaid: false,
        coversInterest: true,
      })
    } else {
      entries.push({
        ...base,
        balance: 0,
        original: null,
        estimated: false,
        unknown: true,
        rate: null,
        paidOff: false,
        cancelWhenPaid: false,
        coversInterest: true,
      })
    }
  }

  for (const debt of data.debts) {
    entries.push({
      id: debt.id,
      name: debt.name,
      color: PRIVATE_DEBT_COLOR,
      balance: debt.amount,
      original: debt.original,
      estimated: false,
      unknown: false,
      rate: debt.interestRate ?? null,
      payment: 0,
      paidOff: debt.amount <= EPSILON,
      cancelWhenPaid: Boolean(debt.cancelWhenPaid),
      coversInterest: true,
      debt,
    })
  }
  return entries
}

export interface DebtTotals {
  total: number
  /** Teil der Gesamtsumme, der nur geschätzt ist */
  estimated: number
  /** Summe der monatlichen Raten */
  payments: number
  /** Zinsen pro Monat (nur Schulden mit bekanntem Zinssatz) */
  monthlyInterest: number
  /** Bereits getilgt seit Erfassung (nur Schulden mit bekanntem Ursprungsbetrag) */
  repaid: number
  repaidOf: number
  openCount: number
}

export function debtTotals(entries: DebtEntry[]): DebtTotals {
  const open = entries.filter((d) => !d.paidOff && !d.unknown)
  const withOriginal = entries.filter((d) => d.original !== null && d.original > 0)
  return {
    total: open.reduce((s, d) => s + d.balance, 0),
    estimated: open.filter((d) => d.estimated).reduce((s, d) => s + d.balance, 0),
    payments: open.reduce((s, d) => s + d.payment, 0),
    monthlyInterest: open.reduce((s, d) => s + (d.balance * (d.rate ?? 0)) / 1200, 0),
    repaid: withOriginal.reduce((s, d) => s + Math.max(0, (d.original ?? 0) - d.balance), 0),
    repaidOf: withOriginal.reduce((s, d) => s + (d.original ?? 0), 0),
    openCount: open.length,
  }
}

/* ---------- Tilgungsplan ---------- */

/** Offene Schulden in Tilgungsreihenfolge: Lawine = höchster Zins zuerst, Schneeball = kleinste zuerst */
export function orderDebts(entries: DebtEntry[], strategy: DebtStrategy): DebtEntry[] {
  const open = entries.filter((d) => !d.paidOff && !d.unknown && d.balance > EPSILON)
  return open.sort((a, b) =>
    strategy === 'avalanche'
      ? (b.rate ?? 0) - (a.rate ?? 0) || a.balance - b.balance
      : a.balance - b.balance || (b.rate ?? 0) - (a.rate ?? 0),
  )
}

export interface PlanOptions {
  strategy: DebtStrategy
  /** Zusätzliche Tilgung pro Monat (ab nächstem Monat) */
  extra: number
  /** Frei gewordene Raten fließen in die nächste Schuld (Schneeball-Effekt) */
  rollover: boolean
}

export interface PlanResult {
  /** Monat, in dem die letzte Schuld getilgt ist; null = nicht innerhalb von 50 Jahren */
  debtFreeIdx: number | null
  totalInterest: number
  /** Monat der Abzahlung je Schuld (id → Monatsindex oder null) */
  payoff: Record<string, number | null>
  /** Offene Schulden in Tilgungsreihenfolge */
  order: DebtEntry[]
}

/**
 * Simuliert die Tilgung Monat für Monat: Zinsen, eigene Raten nach Fälligkeit,
 * dann Extra-Betrag und frei gewordene Raten auf die Schulden in Reihenfolge.
 */
export function simulatePlan(entries: DebtEntry[], options: PlanOptions, now: Date): PlanResult {
  const order = orderDebts(entries, options.strategy)
  const state = order.map((entry) => ({ entry, balance: entry.balance, rate: (entry.rate ?? 0) / 1200 }))
  const payoff: Record<string, number | null> = Object.fromEntries(order.map((d) => [d.id, null]))
  const cur = currentMonthIndex(now)
  let totalInterest = 0
  let freed = 0

  for (let m = 0; m <= MAX_MONTHS; m++) {
    const idx = cur + m
    const { year, month } = fromMonthIndex(idx)
    let freedNow = 0
    const settle = (s: (typeof state)[number]) => {
      if (s.balance > EPSILON) return
      s.balance = 0
      payoff[s.entry.id] = idx
      freedNow += s.entry.payment
    }

    // Zinsen (der laufende Monat ist in der aktuellen Restschuld schon enthalten)
    if (m > 0) {
      for (const s of state) {
        if (s.balance <= 0) continue
        const interest = s.balance * s.rate
        s.balance += interest
        totalInterest += interest
      }
    }

    // Eigene Raten zum Fälligkeitstermin
    for (const s of state) {
      const expense = s.entry.expense
      if (s.balance <= 0 || !expense || !isDueInMonth(expense, month)) continue
      if (m === 0 && effectiveDay(expense, year, month) < now.getDate()) continue
      s.balance -= Math.min(expense.amount, s.balance)
      settle(s)
    }

    // Extra und frei gewordene Raten in Tilgungsreihenfolge
    if (m > 0) {
      let pool = options.extra + (options.rollover ? freed : 0)
      for (const s of state) {
        if (pool <= EPSILON) break
        if (s.balance <= 0) continue
        const pay = Math.min(pool, s.balance)
        s.balance -= pay
        pool -= pay
        settle(s)
      }
    }

    freed += freedNow
    if (state.every((s) => s.balance <= 0)) {
      return { debtFreeIdx: idx, totalInterest, payoff, order }
    }
  }
  return { debtFreeIdx: null, totalInterest, payoff, order }
}

/* ---------- Umschuldung ---------- */

export interface ConsolidationResult {
  principal: number
  /** Neue Monatsrate (Annuität) */
  payment: number
  /** Zinsen des neuen Kredits über die Laufzeit */
  interest: number
  /** Bisherige Raten der abgelösten Schulden */
  oldPayment: number
  /** Zinsen, wenn die Schulden wie bisher (nur mit ihren Raten) abbezahlt werden */
  oldInterest: number
  oldDebtFreeIdx: number | null
  newDebtFreeIdx: number
}

/** Rechnet durch, was es bringt, die gewählten Schulden mit einem neuen Ratenkredit abzulösen */
export function consolidate(
  selected: DebtEntry[],
  ratePercent: number,
  months: number,
  now: Date,
): ConsolidationResult {
  const principal = selected.reduce((s, d) => s + d.balance, 0)
  const r = ratePercent / 100 / 12
  const payment = r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months)
  const old = simulatePlan(selected, { strategy: 'avalanche', extra: 0, rollover: false }, now)
  return {
    principal,
    payment,
    interest: payment * months - principal,
    oldPayment: selected.reduce((s, d) => s + d.payment, 0),
    oldInterest: old.totalInterest,
    oldDebtFreeIdx: old.debtFreeIdx,
    // Erste Rate des neuen Kredits im nächsten Monat
    newDebtFreeIdx: currentMonthIndex(now) + months,
  }
}

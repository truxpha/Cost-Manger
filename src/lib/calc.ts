import type { AppData, Category, Expense } from '../types'
import { CATEGORIES } from './categories'

export function monthlyEquivalent(expense: Pick<Expense, 'amount' | 'billingCycle'>): number {
  switch (expense.billingCycle) {
    case 'monthly':
      return expense.amount
    case 'quarterly':
      return expense.amount / 3
    case 'yearly':
      return expense.amount / 12
  }
}

/** Wird der Posten im angegebenen Monat (1–12) abgebucht? */
export function isDueInMonth(expense: Pick<Expense, 'billingCycle' | 'billingMonth'>, month: number): boolean {
  const start = expense.billingMonth ?? 1
  switch (expense.billingCycle) {
    case 'monthly':
      return true
    case 'quarterly':
      return (((month - start) % 3) + 3) % 3 === 0
    case 'yearly':
      return month === start
  }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Abbuchungstag, begrenzt auf die Länge des Monats (31. im Februar → 28./29.) */
export function effectiveDay(expense: Pick<Expense, 'billingDay'>, year: number, month: number): number {
  return Math.min(expense.billingDay, daysInMonth(year, month))
}

export interface Summary {
  netIncome: number
  extraIncome: number
  totalIncome: number
  fixedCosts: number
  freeBudget: number
  /** Anteil der Fixkosten am Einkommen (0–1+) */
  quote: number
  activeCount: number
  pausedCount: number
}

export function computeSummary(data: AppData, now: Date): Summary {
  const extraIncome = data.extraIncome
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0)
  const totalIncome = data.netIncome + extraIncome
  const active = data.expenses.filter((e) => countsNow(e, now))
  const fixedCosts = active.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  return {
    netIncome: data.netIncome,
    extraIncome,
    totalIncome,
    fixedCosts,
    freeBudget: totalIncome - fixedCosts,
    quote: totalIncome > 0 ? fixedCosts / totalIncome : fixedCosts > 0 ? 1 : 0,
    activeCount: active.length,
    pausedCount: data.expenses.filter((e) => !e.isActive && !isFinished(e, now)).length,
  }
}

export interface UpcomingItem {
  expense: Expense
  day: number
  isToday: boolean
}

export interface MonthTimeline {
  year: number
  month: number
  today: number
  daysInMonth: number
  totalDue: number
  paid: number
  open: number
  upcoming: UpcomingItem[]
  paidCount: number
}

/**
 * Tatsächliche Abbuchungen im aktuellen Monat (nicht normalisiert).
 * Posten mit Abbuchungstag ≥ heute gelten als „noch offen“.
 */
export function computeTimeline(expenses: Expense[], now: Date): MonthTimeline {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = now.getDate()
  let paid = 0
  let open = 0
  let paidCount = 0
  const upcoming: UpcomingItem[] = []

  for (const expense of expenses) {
    if (!countsNow(expense, now) || !isDueInMonth(expense, month)) continue
    const day = effectiveDay(expense, year, month)
    if (day < today) {
      paid += expense.amount
      paidCount += 1
    } else {
      open += expense.amount
      upcoming.push({ expense, day, isToday: day === today })
    }
  }

  upcoming.sort((a, b) => a.day - b.day || b.expense.amount - a.expense.amount)

  return {
    year,
    month,
    today,
    daysInMonth: daysInMonth(year, month),
    totalDue: paid + open,
    paid,
    open,
    upcoming,
    paidCount,
  }
}

export interface CategoryShare {
  category: Category
  color: string
  total: number
  share: number
  count: number
}

export function computeBreakdown(expenses: Expense[], now: Date): CategoryShare[] {
  const active = expenses.filter((e) => countsNow(e, now))
  const total = active.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  return CATEGORIES.map((meta) => {
    const items = active.filter((e) => e.category === meta.id)
    const catTotal = items.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
    return {
      category: meta.id,
      color: meta.color,
      total: catTotal,
      share: total > 0 ? catTotal / total : 0,
      count: items.length,
    }
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total)
}

/* ---------- Laufzeiten & Ausblick ---------- */

/** Fortlaufender Monatsindex (Jahr * 12 + Monat - 1) */
export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1)
}

export function currentMonthIndex(now: Date): number {
  return monthIndex(now.getFullYear(), now.getMonth() + 1)
}

export function fromMonthIndex(idx: number): { year: number; month: number } {
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

export function parseMonthKey(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return monthIndex(y, m)
}

export function toMonthKey(idx: number): string {
  const { year, month } = fromMonthIndex(idx)
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Läuft der Posten im Monat idx noch (Laufzeitende nicht überschritten)? */
export function isRunning(expense: Expense, idx: number): boolean {
  return !expense.endMonth || idx <= parseMonthKey(expense.endMonth)
}

/** Zählt der Posten aktuell zu den Fixkosten? (aktiv und nicht abbezahlt) */
export function countsNow(expense: Expense, now: Date): boolean {
  return expense.isActive && isRunning(expense, currentMonthIndex(now))
}

export function isFinished(expense: Expense, now: Date): boolean {
  return !isRunning(expense, currentMonthIndex(now))
}

type Schedule = Pick<Expense, 'billingCycle' | 'billingDay' | 'billingMonth'>

const MAX_MONTHS = 50 * 12

/** Noch ausstehende Zahlungen ab heute bis einschließlich Monat endIdx */
export function remainingPayments(expense: Schedule, endIdx: number, now: Date): number {
  const cur = currentMonthIndex(now)
  let count = 0
  for (let idx = cur; idx <= endIdx && idx < cur + MAX_MONTHS; idx++) {
    const { year, month } = fromMonthIndex(idx)
    if (!isDueInMonth(expense, month)) continue
    if (idx === cur && effectiveDay(expense, year, month) < now.getDate()) continue
    count++
  }
  return count
}

/** Monat der n-ten noch ausstehenden Zahlung (für „Noch n Raten“) */
export function endMonthForPayments(expense: Schedule, payments: number, now: Date): number {
  const cur = currentMonthIndex(now)
  let count = 0
  for (let idx = cur; idx < cur + MAX_MONTHS; idx++) {
    const { year, month } = fromMonthIndex(idx)
    if (!isDueInMonth(expense, month)) continue
    if (idx === cur && effectiveDay(expense, year, month) < now.getDate()) continue
    count++
    if (count >= payments) return idx
  }
  return cur + MAX_MONTHS - 1
}

export interface PayoffEvent {
  expense: Expense
  /** Monat der letzten Zahlung */
  lastIdx: number
  /** Erster Monat ohne diese Zahlung */
  freedIdx: number
  /** Monatlich frei werdender Betrag (normalisiert) */
  monthly: number
  remainingCount: number
  remainingTotal: number
}

export interface ForecastPoint {
  idx: number
  fixed: number
  free: number
}

export interface Forecast {
  startIdx: number
  points: ForecastPoint[]
  events: PayoffEvent[]
}

/** Frei verfügbares Budget pro Monat für die kommenden Monate, unter Berücksichtigung von Laufzeitenden */
export function computeForecast(data: AppData, now: Date): Forecast {
  const startIdx = currentMonthIndex(now)
  const income =
    data.netIncome + data.extraIncome.filter((i) => i.isActive).reduce((s, i) => s + i.amount, 0)
  const active = data.expenses.filter((e) => e.isActive)

  const events: PayoffEvent[] = active
    .filter((e) => e.endMonth && parseMonthKey(e.endMonth) >= startIdx)
    .map((e) => {
      const lastIdx = parseMonthKey(e.endMonth as string)
      const remainingCount = remainingPayments(e, lastIdx, now)
      return {
        expense: e,
        lastIdx,
        freedIdx: lastIdx + 1,
        monthly: monthlyEquivalent(e),
        remainingCount,
        remainingTotal: remainingCount * e.amount,
      }
    })
    .sort((a, b) => a.lastIdx - b.lastIdx || b.monthly - a.monthly)

  const lastFreed = events.length ? events[events.length - 1].freedIdx : startIdx
  const endIdx = Math.min(startIdx + 120, Math.max(startIdx + 12, lastFreed + 3))

  const points: ForecastPoint[] = []
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const fixed = active.filter((e) => isRunning(e, idx)).reduce((s, e) => s + monthlyEquivalent(e), 0)
    points.push({ idx, fixed, free: income - fixed })
  }
  return { startIdx, points, events }
}

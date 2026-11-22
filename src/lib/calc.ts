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
export function isDueInMonth(expense: Expense, month: number): boolean {
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
export function effectiveDay(expense: Expense, year: number, month: number): number {
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

export function computeSummary(data: AppData): Summary {
  const extraIncome = data.extraIncome
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0)
  const totalIncome = data.netIncome + extraIncome
  const active = data.expenses.filter((e) => e.isActive)
  const fixedCosts = active.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  return {
    netIncome: data.netIncome,
    extraIncome,
    totalIncome,
    fixedCosts,
    freeBudget: totalIncome - fixedCosts,
    quote: totalIncome > 0 ? fixedCosts / totalIncome : fixedCosts > 0 ? 1 : 0,
    activeCount: active.length,
    pausedCount: data.expenses.length - active.length,
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
    if (!expense.isActive || !isDueInMonth(expense, month)) continue
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

export function computeBreakdown(expenses: Expense[]): CategoryShare[] {
  const active = expenses.filter((e) => e.isActive)
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

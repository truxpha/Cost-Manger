import type { AppData, Expense } from '../types'
import { currentMonthIndex, toMonthKey } from './calc'
import { getCategory } from './categories'
import { createId } from './id'

type DemoExpense = Omit<Expense, 'id' | 'color'> & { color?: string; endInMonths?: number }

const DEMO_EXPENSES: DemoExpense[] = [
  { name: 'Miete (warm)', amount: 1150, billingCycle: 'monthly', billingDay: 1, category: 'Wohnen', isActive: true },
  { name: 'Strom', amount: 85, billingCycle: 'monthly', billingDay: 15, category: 'Wohnen', isActive: true },
  { name: 'Rundfunkbeitrag', amount: 55.08, billingCycle: 'quarterly', billingDay: 15, billingMonth: 1, category: 'Wohnen', isActive: true },
  { name: 'BAföG-Rückzahlung', amount: 390, billingCycle: 'quarterly', billingDay: 30, billingMonth: 3, category: 'Kredite & Bildung', isActive: true, endInMonths: 40 },
  { name: 'Kredit', amount: 180, billingCycle: 'monthly', billingDay: 15, category: 'Kredite & Bildung', isActive: true, endInMonths: 18 },
  { name: 'Fernseher (Ratenkauf)', amount: 45, billingCycle: 'monthly', billingDay: 10, category: 'Kredite & Bildung', isActive: true, endInMonths: 5 },
  { name: 'Klarna (Kopfhörer)', amount: 33.33, billingCycle: 'monthly', billingDay: 28, category: 'Kredite & Bildung', isActive: true, endInMonths: 2 },
  { name: 'PKV', amount: 420, billingCycle: 'monthly', billingDay: 1, category: 'Versicherung & Gesundheit', isActive: true },
  { name: 'Haftpflicht', amount: 65, billingCycle: 'yearly', billingDay: 1, billingMonth: 1, category: 'Versicherung & Gesundheit', isActive: true },
  { name: 'Hausrat', amount: 89, billingCycle: 'yearly', billingDay: 1, billingMonth: 4, category: 'Versicherung & Gesundheit', isActive: true },
  { name: 'Internet', amount: 39.99, billingCycle: 'monthly', billingDay: 5, category: 'Verträge & Abos', isActive: true },
  { name: 'Handyvertrag', amount: 19.99, billingCycle: 'monthly', billingDay: 20, category: 'Verträge & Abos', isActive: true },
  { name: 'Gym', amount: 34.9, billingCycle: 'monthly', billingDay: 1, category: 'Verträge & Abos', isActive: true },
  { name: 'Deutschlandticket', amount: 58, billingCycle: 'monthly', billingDay: 1, category: 'Verträge & Abos', isActive: true },
  { name: 'Netflix', amount: 13.99, billingCycle: 'monthly', billingDay: 12, category: 'Verträge & Abos', isActive: true },
  { name: 'Spotify', amount: 11.99, billingCycle: 'monthly', billingDay: 22, category: 'Verträge & Abos', isActive: true },
  { name: 'Auto (Was wäre wenn)', amount: 300, billingCycle: 'monthly', billingDay: 15, category: 'Sonstiges', isActive: false },
]

export function createDemoData(currency = '€'): AppData {
  const cur = currentMonthIndex(new Date())
  return {
    version: 1,
    netIncome: 3900,
    extraIncome: [
      { id: createId(), name: 'Nebenjob', amount: 250, isActive: true },
      { id: createId(), name: 'Gehaltserhöhung (Szenario)', amount: 200, isActive: false },
    ],
    expenses: DEMO_EXPENSES.map(({ endInMonths, ...e }) => {
      const expense: Expense = { ...e, id: createId(), color: e.color ?? getCategory(e.category).color }
      if (endInMonths !== undefined) expense.endMonth = toMonthKey(cur + endInMonths)
      return expense
    }),
    oneOffs: [
      { id: createId(), name: 'Geld an Mama', amount: 100, month: toMonthKey(cur), note: 'Rückzahlung' },
      { id: createId(), name: 'Geburtstagsgeschenk', amount: 60, month: toMonthKey(cur + 1) },
    ],
    debts: [{ id: createId(), name: 'Mama', amount: 900, original: 1000, note: 'Kaution für die Wohnung' }],
    settings: { currency },
  }
}

export function createEmptyData(currency = '€'): AppData {
  return {
    version: 1,
    netIncome: 0,
    extraIncome: [],
    expenses: [],
    oneOffs: [],
    debts: [],
    settings: { currency },
  }
}

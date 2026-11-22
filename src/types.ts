export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

export type Category =
  | 'Wohnen'
  | 'Kredite & Bildung'
  | 'Versicherung & Gesundheit'
  | 'Verträge & Abos'
  | 'Sonstiges'

export interface Expense {
  id: string
  name: string
  /** Betrag pro Abbuchung in der gewählten Währung */
  amount: number
  billingCycle: BillingCycle
  /** Tag im Monat (1–31), an dem abgebucht wird */
  billingDay: number
  /**
   * Erster Fälligkeitsmonat (1–12) für quartalsweise / jährliche Posten.
   * Wird nur für die Zeitleiste „Noch offen diesen Monat“ benötigt.
   */
  billingMonth?: number
  category: Category
  color: string
  isActive: boolean
}

export interface IncomeItem {
  id: string
  name: string
  amount: number
  isActive: boolean
}

export interface Settings {
  currency: string
}

export interface AppData {
  version: 1
  netIncome: number
  extraIncome: IncomeItem[]
  expenses: Expense[]
  settings: Settings
}

export type SortMode = 'category' | 'day' | 'amount'

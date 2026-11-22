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
  /**
   * Optionales Laufzeitende als „YYYY-MM“: Monat der letzten Zahlung
   * (z. B. Kredit oder Ratenkauf). Danach fällt der Posten weg.
   */
  endMonth?: string
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

/** Einmalige Ausgabe, zählt nur im angegebenen Monat (z. B. „Geld an Mama“) */
export interface OneOff {
  id: string
  name: string
  amount: number
  /** „YYYY-MM“ */
  month: string
  note?: string
}

/** Offene Schuld ohne feste Raten – wird nicht eingerechnet, nur gemerkt */
export interface Debt {
  id: string
  /** Bei wem / wofür, z. B. „Mama“ */
  name: string
  /** Noch offener Betrag */
  amount: number
  /** Ursprünglicher Betrag (für den Fortschritt) */
  original: number
  note?: string
}

export interface Settings {
  currency: string
}

export interface AppData {
  version: 1
  netIncome: number
  extraIncome: IncomeItem[]
  expenses: Expense[]
  oneOffs: OneOff[]
  debts: Debt[]
  settings: Settings
}

export type EntryKind = 'expense' | 'oneoff' | 'debt'

export type SortMode = 'category' | 'day' | 'amount'

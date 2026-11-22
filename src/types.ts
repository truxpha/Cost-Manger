export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'

export type Category = 'Wohnen' | 'Kredite & Bildung' | 'Versicherung & Gesundheit' | 'Verträge & Abos' | 'Sonstiges'

/** Kredit-Details für die Schuldenübersicht (optional) */
export interface LoanInfo {
  /** Restschuld zum Stichtag */
  balance: number
  /** Stichtag der Restschuld „YYYY-MM-DD“ – danach sinkt sie mit jeder Rate */
  balanceDate: string
  /** Restschuld bei der ersten Erfassung (für den Fortschritt) */
  original: number
  /** Effektiver Jahreszins in Prozent */
  interestRate?: number
  /** Nach dem Abbezahlen kündigen (z. B. Kreditkarte) */
  cancelWhenPaid?: boolean
}

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
  /** Restschuld & Zins, wenn der Posten ein Kredit / eine Kreditkarte ist */
  loan?: LoanInfo
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
  /** Effektiver Jahreszins in Prozent (z. B. Dispo, Kreditkarte ohne feste Rate) */
  interestRate?: number
  /** Nach dem Abbezahlen kündigen (z. B. Dispo, Kreditkarte) */
  cancelWhenPaid?: boolean
  note?: string
}

/** Tilgungsstrategie: Lawine = höchster Zins zuerst, Schneeball = kleinste Schuld zuerst */
export type DebtStrategy = 'avalanche' | 'snowball'

export interface DebtPlan {
  strategy: DebtStrategy
  /** Zusätzliche Tilgung pro Monat */
  extra: number
}

export interface Settings {
  currency: string
  debtPlan: DebtPlan
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

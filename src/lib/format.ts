import type { BillingCycle, Expense } from '../types'

const money = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const wholeMoney = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 0,
})

const NBSP = ' '

export function formatMoney(value: number, currency: string): string {
  return `${money.format(value)}${NBSP}${currency}`
}

export function formatMoneyShort(value: number, currency: string): string {
  return `${wholeMoney.format(Math.round(value))}${NBSP}${currency}`
}

/** Zerlegt einen Betrag in Ganzzahl- und Nachkommateil, z. B. für die Hero-Karte */
export function splitMoney(value: number): { whole: string; cents: string } {
  const formatted = money.format(value)
  const idx = formatted.lastIndexOf(',')
  return { whole: formatted.slice(0, idx), cents: formatted.slice(idx + 1) }
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value * 100)}${NBSP}%`
}

/** Parst deutsche (1.234,56) und englische (1234.56) Eingaben */
export function parseAmount(input: string): number | null {
  const trimmed = input.trim().replace(/\s|€/g, '')
  if (trimmed === '') return null
  let normalized = trimmed
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100) / 100
}

export function amountToInput(value: number): string {
  if (!value) return ''
  return value.toFixed(2).replace(/\.00$/, '').replace('.', ',')
}

export const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
  yearly: 'Jährlich',
}

export const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly: 'mtl.',
  quarterly: '/ Quartal',
  yearly: '/ Jahr',
}

export function quarterMonths(start: number): number[] {
  return [0, 3, 6, 9].map((offset) => ((start - 1 + offset) % 12) + 1).sort((a, b) => a - b)
}

export function billingLabel(expense: Expense): string {
  const day = `${expense.billingDay}.`
  const start = expense.billingMonth ?? 1
  switch (expense.billingCycle) {
    case 'monthly':
      return `Am ${day} des Monats`
    case 'quarterly':
      return `Quartalsweise am ${day}`
    case 'yearly':
      return `Jährlich am ${day} ${MONTHS[start - 1]}`
  }
}

/** Monatsindex (Jahr * 12 + Monat - 1) → „März 2027“ bzw. „Mär 2027“ */
export function formatMonthIndex(idx: number, short = false): string {
  const year = Math.floor(idx / 12)
  const month = idx % 12
  return `${(short ? MONTHS_SHORT : MONTHS)[month]} ${year}`
}

export function formatSignedMoney(value: number, currency: string): string {
  const rounded = Math.round(value * 100) / 100
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±'
  return `${sign}${formatMoney(Math.abs(rounded), currency)}`
}

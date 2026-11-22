import type { AppData, BillingCycle, Expense, IncomeItem } from '../types'
import { CATEGORY_IDS, getCategory } from './categories'
import { createEmptyData } from './demo'
import { createId } from './id'

export const STORAGE_KEY = 'fixkosten-tracker:v1'

const CYCLES: BillingCycle[] = ['monthly', 'quarterly', 'yearly']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function sanitizeExpense(raw: unknown): Expense | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const category = CATEGORY_IDS.find((c) => c === raw.category) ?? 'Sonstiges'
  const billingCycle = CYCLES.find((c) => c === raw.billingCycle) ?? 'monthly'
  const expense: Expense = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    amount: Math.max(0, toNumber(raw.amount, 0)),
    billingCycle,
    billingDay: clampInt(toNumber(raw.billingDay, 1), 1, 31),
    category,
    color:
      typeof raw.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(raw.color)
        ? raw.color
        : getCategory(category).color,
    isActive: raw.isActive !== false,
  }
  if (typeof raw.endMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.endMonth)) {
    expense.endMonth = raw.endMonth
  }
  if (billingCycle !== 'monthly') {
    expense.billingMonth = clampInt(toNumber(raw.billingMonth, 1), 1, 12)
  }
  return expense
}

function sanitizeIncome(raw: unknown): IncomeItem | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    amount: Math.max(0, toNumber(raw.amount, 0)),
    isActive: raw.isActive !== false,
  }
}

/** Validiert unbekannte Daten (localStorage oder Import) und wirft bei ungültigem Format. */
export function parseAppData(raw: unknown): AppData {
  if (!isRecord(raw) || !Array.isArray(raw.expenses)) {
    throw new Error('Ungültiges Datenformat: „expenses“ fehlt.')
  }
  const settings = isRecord(raw.settings) ? raw.settings : {}
  const currency =
    typeof settings.currency === 'string' && settings.currency.trim()
      ? settings.currency.trim().slice(0, 4)
      : '€'
  return {
    version: 1,
    netIncome: Math.max(0, toNumber(raw.netIncome, 0)),
    extraIncome: Array.isArray(raw.extraIncome)
      ? raw.extraIncome.map(sanitizeIncome).filter((i): i is IncomeItem => i !== null)
      : [],
    expenses: raw.expenses.map(sanitizeExpense).filter((e): e is Expense => e !== null),
    settings: { currency },
  }
}

export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return parseAppData(JSON.parse(stored))
  } catch {
    // Beschädigte oder nicht verfügbare Daten → Neustart mit leerem Zustand
  }
  return createEmptyData()
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // z. B. privater Modus oder Speicher voll – App bleibt nutzbar
  }
}

export function exportData(data: AppData): void {
  const payload = { ...data, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `fixkosten-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importData(file: File): Promise<AppData> {
  const text = await file.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Die Datei enthält kein gültiges JSON.')
  }
  return parseAppData(json)
}

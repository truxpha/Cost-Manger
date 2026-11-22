import type { AppData, BillingCycle, Debt, DebtPlan, Expense, IncomeItem, LoanInfo, OneOff } from '../types'
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

const DATE_KEY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** Zinssatz in Prozent (0–100), sonst undefined */
function cleanRate(value: unknown): number | undefined {
  const rate = toNumber(value, NaN)
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : undefined
}

function sanitizeLoan(raw: unknown): LoanInfo | undefined {
  if (!isRecord(raw)) return undefined
  const balance = Math.max(0, toNumber(raw.balance, 0))
  if (typeof raw.balanceDate !== 'string' || !DATE_KEY.test(raw.balanceDate)) return undefined
  const loan: LoanInfo = {
    balance,
    balanceDate: raw.balanceDate,
    original: Math.max(balance, toNumber(raw.original, balance)),
  }
  const rate = cleanRate(raw.interestRate)
  if (rate !== undefined) loan.interestRate = rate
  if (raw.cancelWhenPaid === true) loan.cancelWhenPaid = true
  return loan
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
      typeof raw.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(raw.color) ? raw.color : getCategory(category).color,
    isActive: raw.isActive !== false,
  }
  if (typeof raw.endMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.endMonth)) {
    expense.endMonth = raw.endMonth
  }
  const loan = sanitizeLoan(raw.loan)
  if (loan) expense.loan = loan
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

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/

function cleanNote(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 200) : undefined
}

function sanitizeOneOff(raw: unknown): OneOff | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name || typeof raw.month !== 'string' || !MONTH_KEY.test(raw.month)) return null
  const item: OneOff = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    amount: Math.max(0, toNumber(raw.amount, 0)),
    month: raw.month,
  }
  const note = cleanNote(raw.note)
  if (note) item.note = note
  return item
}

function sanitizeDebt(raw: unknown): Debt | null {
  if (!isRecord(raw)) return null
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) return null
  const amount = Math.max(0, toNumber(raw.amount, 0))
  const debt: Debt = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name,
    amount,
    original: Math.max(amount, toNumber(raw.original, amount)),
  }
  const rate = cleanRate(raw.interestRate)
  if (rate !== undefined) debt.interestRate = rate
  if (raw.cancelWhenPaid === true) debt.cancelWhenPaid = true
  const note = cleanNote(raw.note)
  if (note) debt.note = note
  return debt
}

function sanitizeDebtPlan(raw: unknown): DebtPlan {
  const plan = isRecord(raw) ? raw : {}
  return {
    strategy: plan.strategy === 'snowball' ? 'snowball' : 'avalanche',
    extra: Math.max(0, toNumber(plan.extra, 0)),
  }
}

/** Validiert unbekannte Daten (localStorage oder Import) und wirft bei ungültigem Format. */
export function parseAppData(raw: unknown): AppData {
  if (!isRecord(raw) || !Array.isArray(raw.expenses)) {
    throw new Error('Ungültiges Datenformat: „expenses“ fehlt.')
  }
  const settings = isRecord(raw.settings) ? raw.settings : {}
  const currency =
    typeof settings.currency === 'string' && settings.currency.trim() ? settings.currency.trim().slice(0, 4) : '€'
  return {
    version: 1,
    netIncome: Math.max(0, toNumber(raw.netIncome, 0)),
    extraIncome: Array.isArray(raw.extraIncome)
      ? raw.extraIncome.map(sanitizeIncome).filter((i): i is IncomeItem => i !== null)
      : [],
    expenses: raw.expenses.map(sanitizeExpense).filter((e): e is Expense => e !== null),
    oneOffs: Array.isArray(raw.oneOffs) ? raw.oneOffs.map(sanitizeOneOff).filter((o): o is OneOff => o !== null) : [],
    debts: Array.isArray(raw.debts) ? raw.debts.map(sanitizeDebt).filter((d): d is Debt => d !== null) : [],
    settings: { currency, debtPlan: sanitizeDebtPlan(settings.debtPlan) },
  }
}

/** Unlesbare Rohdaten werden hier aufbewahrt, statt beim nächsten Speichern überschrieben zu werden. */
const CORRUPT_KEY = 'fixkosten-tracker:corrupt'

export function loadData(): AppData {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Speicher nicht verfügbar → Neustart mit leerem Zustand
    return createEmptyData()
  }
  if (stored) {
    try {
      return parseAppData(JSON.parse(stored))
    } catch {
      // Beschädigte Daten → Rohdaten sichern, dann mit leerem Zustand starten
      try {
        localStorage.setItem(CORRUPT_KEY, stored)
      } catch {
        // ignorieren
      }
    }
  }
  return createEmptyData()
}

/** Gibt false zurück, wenn nicht gespeichert werden konnte (z. B. privater Modus oder Speicher voll). */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

function backupFile(data: AppData): File {
  const payload = { ...data, exportedAt: new Date().toISOString() }
  const date = new Date().toISOString().slice(0, 10)
  return new File([JSON.stringify(payload, null, 2)], `fixkosten-backup-${date}.json`, {
    type: 'application/json',
  })
}

/** Speichert das Backup als Datei (Android: Ordner „Downloads“). */
export function downloadBackup(data: AppData): void {
  const file = backupFile(data)
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Kann der Browser eine JSON-Datei über das Teilen-Menü (z. B. Google Drive) weitergeben? */
export function canShareBackup(): boolean {
  try {
    const probe = new File(['{}'], 'probe.json', { type: 'application/json' })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

/** Teilt das Backup. Gibt false zurück, wenn der Nutzer abgebrochen hat. */
export async function shareBackup(data: AppData): Promise<boolean> {
  try {
    await navigator.share({ files: [backupFile(data)], title: 'Fixkosten-Backup' })
    return true
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return false
    throw err
  }
}

/* ---------- Sicherheitskopie vor großen Änderungen ---------- */

const SNAPSHOT_KEY = 'fixkosten-tracker:snapshot'

export function hasContent(data: AppData): boolean {
  return data.expenses.length > 0 || data.extraIncome.length > 0 || data.oneOffs.length > 0 || data.debts.length > 0
}

export interface Snapshot {
  savedAt: string
  reason: string
  data: AppData
}

/** Merkt sich den Stand vor Zurücksetzen/Import/Demo, damit er wiederhergestellt werden kann. */
export function saveSnapshot(data: AppData, reason: string): void {
  if (!hasContent(data)) return
  try {
    const snapshot: Snapshot = { savedAt: new Date().toISOString(), reason, data }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // Speicher nicht verfügbar
  }
}

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt?: unknown; reason?: unknown; data?: unknown }
    return {
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'Änderung',
      data: parseAppData(parsed.data),
    }
  } catch {
    return null
  }
}

/* ---------- App-Metadaten (nicht Teil des Backups) ---------- */

const META_KEY = 'fixkosten-tracker:meta'

export interface Meta {
  firstUseAt: string
  lastBackupAt?: string
  backupReminderSnoozedUntil?: string
  installHintDismissed?: boolean
  privacy?: boolean
  /** Beispieldaten geladen → Hinweis „Eigene Daten starten“ */
  demo?: boolean
}

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Meta>
      if (typeof parsed.firstUseAt === 'string') return parsed as Meta
    }
  } catch {
    // ignorieren
  }
  return { firstUseAt: new Date().toISOString() }
}

export function saveMeta(meta: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // ignorieren
  }
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

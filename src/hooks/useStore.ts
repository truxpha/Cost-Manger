import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, Debt, Expense, IncomeItem, OneOff } from '../types'
import { createDemoData, createEmptyData } from '../lib/demo'
import { loadData, parseAppData, saveData, STORAGE_KEY } from '../lib/storage'

export function useStore() {
  const [data, setData] = useState<AppData>(loadData)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    const ok = saveData(data)
    // localStorage ist ein externes System: Ergebnis nach dem Speichern melden
    queueMicrotask(() => setSaveFailed(!ok))
  }, [data])

  // Änderungen aus einem anderen Tab / Fenster übernehmen, statt sie beim nächsten Speichern zu überschreiben
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setData(parseAppData(JSON.parse(e.newValue)))
      } catch {
        // ungültige Daten aus dem anderen Tab ignorieren
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const upsertExpense = useCallback((expense: Expense) => {
    setData((d) => {
      const exists = d.expenses.some((e) => e.id === expense.id)
      return {
        ...d,
        expenses: exists
          ? d.expenses.map((e) => (e.id === expense.id ? expense : e))
          : [...d.expenses, expense],
      }
    })
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }))
  }, [])

  const toggleExpense = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      expenses: d.expenses.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)),
    }))
  }, [])

  const upsertOneOff = useCallback((item: OneOff) => {
    setData((d) => ({
      ...d,
      oneOffs: d.oneOffs.some((o) => o.id === item.id)
        ? d.oneOffs.map((o) => (o.id === item.id ? item : o))
        : [...d.oneOffs, item],
    }))
  }, [])

  const deleteOneOff = useCallback((id: string) => {
    setData((d) => ({ ...d, oneOffs: d.oneOffs.filter((o) => o.id !== id) }))
  }, [])

  const upsertDebt = useCallback((debt: Debt) => {
    setData((d) => ({
      ...d,
      debts: d.debts.some((x) => x.id === debt.id)
        ? d.debts.map((x) => (x.id === debt.id ? debt : x))
        : [...d.debts, debt],
    }))
  }, [])

  const deleteDebt = useCallback((id: string) => {
    setData((d) => ({ ...d, debts: d.debts.filter((x) => x.id !== id) }))
  }, [])

  /** Rückzahlung: Schuld verringern und optional als Einmalausgabe im Monat erfassen */
  const payDebt = useCallback((id: string, amount: number, oneOff: OneOff | null) => {
    setData((d) => ({
      ...d,
      debts: d.debts.map((x) =>
        x.id === id ? { ...x, amount: Math.max(0, Math.round((x.amount - amount) * 100) / 100) } : x,
      ),
      oneOffs: oneOff ? [...d.oneOffs, oneOff] : d.oneOffs,
    }))
  }, [])

  const setIncome = useCallback((netIncome: number, extraIncome: IncomeItem[]) => {
    setData((d) => ({ ...d, netIncome, extraIncome }))
  }, [])

  const setCurrency = useCallback((currency: string) => {
    setData((d) => ({ ...d, settings: { ...d.settings, currency } }))
  }, [])

  const replaceData = useCallback((next: AppData) => setData(next), [])

  const loadDemo = useCallback(() => {
    setData((d) => createDemoData(d.settings.currency))
  }, [])

  const reset = useCallback(() => {
    setData((d) => createEmptyData(d.settings.currency))
  }, [])

  const actions = useMemo(
    () => ({
      upsertExpense,
      deleteExpense,
      toggleExpense,
      upsertOneOff,
      deleteOneOff,
      upsertDebt,
      deleteDebt,
      payDebt,
      setIncome,
      setCurrency,
      replaceData,
      loadDemo,
      reset,
    }),
    [
      upsertExpense,
      deleteExpense,
      toggleExpense,
      upsertOneOff,
      deleteOneOff,
      upsertDebt,
      deleteDebt,
      payDebt,
      setIncome,
      setCurrency,
      replaceData,
      loadDemo,
      reset,
    ],
  )

  return { data, actions, saveFailed }
}

export type StoreActions = ReturnType<typeof useStore>['actions']

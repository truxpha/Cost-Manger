import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, Expense, IncomeItem } from '../types'
import { createDemoData, createEmptyData } from '../lib/demo'
import { loadData, saveData } from '../lib/storage'

export function useStore() {
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => {
    saveData(data)
  }, [data])

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
      setIncome,
      setCurrency,
      replaceData,
      loadDemo,
      reset,
    }),
    [upsertExpense, deleteExpense, toggleExpense, setIncome, setCurrency, replaceData, loadDemo, reset],
  )

  return { data, actions }
}

export type StoreActions = ReturnType<typeof useStore>['actions']

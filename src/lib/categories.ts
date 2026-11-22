import { GraduationCap, House, Repeat, Shapes, ShieldPlus, type LucideIcon } from 'lucide-react'
import type { Category } from '../types'

export interface CategoryMeta {
  id: Category
  short: string
  color: string
  icon: LucideIcon
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'Wohnen', short: 'Wohnen', color: '#60a5fa', icon: House },
  { id: 'Kredite & Bildung', short: 'Kredite', color: '#fbbf24', icon: GraduationCap },
  { id: 'Versicherung & Gesundheit', short: 'Versicherung', color: '#34d399', icon: ShieldPlus },
  { id: 'Verträge & Abos', short: 'Abos', color: '#a78bfa', icon: Repeat },
  { id: 'Sonstiges', short: 'Sonstiges', color: '#94a3b8', icon: Shapes },
]

export const CATEGORY_IDS: Category[] = CATEGORIES.map((c) => c.id)

export function getCategory(id: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

/** Zusätzliche Akzentfarben für einzelne Posten */
export const ACCENT_COLORS = [
  '#60a5fa',
  '#22d3ee',
  '#34d399',
  '#a3e635',
  '#fbbf24',
  '#fb923c',
  '#f87171',
  '#f472b6',
  '#a78bfa',
  '#94a3b8',
]

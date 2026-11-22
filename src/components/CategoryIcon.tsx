import { getCategory } from '../lib/categories'
import type { Category } from '../types'

interface Props {
  category: Category
  color: string
  muted?: boolean
  size?: 'sm' | 'md'
}

export function CategoryIcon({ category, color, muted = false, size = 'md' }: Props) {
  const Icon = getCategory(category).icon
  const box = size === 'md' ? 'size-11 rounded-2xl' : 'size-8 rounded-xl'
  const icon = size === 'md' ? 'size-5' : 'size-4'
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} transition-opacity ${muted ? 'opacity-40' : ''}`}
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden="true"
    >
      <Icon className={icon} strokeWidth={2.2} />
    </span>
  )
}

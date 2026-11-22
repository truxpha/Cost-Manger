import { fromMonthIndex, monthIndex } from '../lib/calc'
import { MONTHS } from '../lib/format'
import { inputClass } from '../lib/ui'

interface Props {
  value: number
  onChange: (idx: number) => void
  /** Erstes Jahr in der Auswahl */
  fromYear: number
  years?: number
  label: string
}

export function MonthPicker({ value, onChange, fromYear, years = 41, label }: Props) {
  const { year, month } = fromMonthIndex(value)
  const yearOptions = Array.from({ length: years }, (_, i) => fromYear + i)
  if (year < fromYear) yearOptions.unshift(year)

  return (
    <div className="grid grid-cols-[1fr_7rem] gap-2">
      <select
        aria-label={`${label}: Monat`}
        className={`${inputClass} appearance-none`}
        value={month}
        onChange={(e) => onChange(monthIndex(year, Number(e.target.value)))}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1} className="bg-zinc-900">
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label={`${label}: Jahr`}
        className={`${inputClass} appearance-none`}
        value={year}
        onChange={(e) => onChange(monthIndex(Number(e.target.value), month))}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y} className="bg-zinc-900">
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}

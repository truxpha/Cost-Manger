/** Basis-Stil für Eingabefelder (ohne Breite) */
export const inputBaseClass =
  'h-12 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.06]'

export const inputClass = `${inputBaseClass} w-full`

export const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400'

/** Erlaubt nur Ziffern, Punkt und Komma (Betragsfelder) */
export const cleanAmountInput = (value: string) => value.replace(/[^0-9.,]/g, '')

/** Setzt den Fokus auf ein Feld (z. B. das erste fehlerhafte) und scrollt es ins Bild */
export const focusField = (id: string) => document.getElementById(id)?.focus()

import { CalendarCheck, Hourglass, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Forecast } from '../lib/calc'
import { formatMoney, formatMoneyShort, formatMonthIndex, formatSignedMoney } from '../lib/format'

interface Props {
  forecast: Forecast
  currency: string
}

const HEIGHT = 150
const PAD = { top: 10, right: 6, bottom: 22, left: 50 }
const LINE = '#34d399'
const SURFACE = '#121215'

function niceTicks(min: number, max: number): number[] {
  const span = Math.max(max - min, 1)
  const raw = span / 2
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

export function ForecastCard({ forecast, currency }: Props) {
  const { points, events, startIdx } = forecast
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)
  const [selected, setSelected] = useState<number>(() => events[0]?.freedIdx ?? startIdx)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = points.length
  const sel = Math.min(Math.max(selected, startIdx), startIdx + n - 1) - startIdx
  const current = points[0]
  const point = points[sel]
  // Vergleich mit dem regulären Monatsbudget heute (ohne Einmalausgaben)
  const delta = point.left - current.free
  const finishedBy = events.filter((e) => e.freedIdx <= point.idx)

  const geo = useMemo(() => {
    const values = points.map((p) => p.left)
    const ticks = niceTicks(Math.min(...values), Math.max(...values))
    const lo = ticks[0]
    const hi = ticks[ticks.length - 1]
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const band = innerW / points.length
    const x = (i: number) => PAD.left + i * band
    const y = (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH
    let d = `M${x(0)},${y(points[0].left)}`
    points.forEach((p, i) => {
      if (i > 0) d += ` V${y(p.left)}`
      d += ` H${x(i + 1)}`
    })
    const years = points.map((p, i) => ({ i, p })).filter(({ p, i }) => p.idx % 12 === 0 && x(i) - x(0) > 44)
    return { ticks, x, y, band, d, years }
  }, [points, width])

  const pickFromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.floor((e.clientX - rect.left - PAD.left) / geo.band)
    setSelected(startIdx + Math.min(n - 1, Math.max(0, i)))
  }

  const onKey = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, PageDown: -12, PageUp: 12 }
    if (e.key in step) setSelected(startIdx + Math.min(n - 1, Math.max(0, sel + step[e.key])))
    else if (e.key === 'Home') setSelected(startIdx)
    else if (e.key === 'End') setSelected(startIdx + n - 1)
    else return
    e.preventDefault()
  }

  const cx = geo.x(sel) + geo.band / 2

  return (
    <section aria-label="Ausblick" className="rounded-3xl border border-white/10 bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <TrendingUp className="size-3.5" />
          Ausblick: übrig pro Monat
        </h2>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">{sel === 0 ? 'Diesen Monat' : `Im ${formatMonthIndex(point.idx)}`}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(point.left, currency)}</p>
          {point.oneOff > 0 && (
            <p className="text-[11px] text-zinc-500 tabular-nums">
              inkl. {formatMoney(point.oneOff, currency)} Einmalausgaben
            </p>
          )}
        </div>
        {sel > 0 && (
          <span
            className={`mb-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
              delta > 0.004 ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[0.06] text-zinc-400'
            }`}
          >
            {formatSignedMoney(delta, currency)} ggü. heute
          </span>
        )}
      </div>

      <div ref={wrapRef} className="relative mt-3">
        <svg
          width={width}
          height={HEIGHT}
          role="slider"
          tabIndex={0}
          aria-label="Monat im Ausblick wählen"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={sel}
          aria-valuetext={`${formatMonthIndex(point.idx)}: ${formatMoney(point.left, currency)} übrig`}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            pickFromPointer(e)
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0 || e.pointerType === 'mouse') pickFromPointer(e)
          }}
          className="block cursor-crosshair touch-pan-y rounded-lg select-none"
        >
          {geo.ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={geo.y(t)}
                y2={geo.y(t)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={geo.y(t) + 3.5}
                fontSize={10}
                fill="#71717a"
                textAnchor="end"
                className="tabular-nums"
              >
                {formatMoneyShort(t, currency)}
              </text>
            </g>
          ))}

          {geo.years.map(({ i, p }) => (
            <g key={p.idx}>
              <line
                x1={geo.x(i)}
                x2={geo.x(i)}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 3"
              />
              <text x={geo.x(i) + 3} y={HEIGHT - 6} fontSize={10} fill="#71717a">
                {Math.floor(p.idx / 12)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} fontSize={10} fill="#71717a">
            Heute
          </text>

          <line
            x1={cx}
            x2={cx}
            y1={PAD.top - 6}
            y2={HEIGHT - PAD.bottom}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1}
          />

          <path d={geo.d} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />

          {events.map((ev) => {
            const i = ev.freedIdx - startIdx
            if (i <= 0 || i >= n) return null
            return (
              <circle
                key={ev.expense.id}
                cx={geo.x(i)}
                cy={geo.y(points[i].left)}
                r={4}
                fill={LINE}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )
          })}

          <circle cx={cx} cy={geo.y(point.left)} r={5} fill="#fff" stroke={SURFACE} strokeWidth={2} />
        </svg>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">Tippe oder ziehe im Diagramm, um einen Monat zu wählen.</p>

      {events.length > 0 ? (
        <>
          {sel > 0 && finishedBy.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-400/[0.07] px-3 py-2 text-xs text-zinc-300">
              <CalendarCheck className="mt-px size-4 shrink-0 text-emerald-400" />
              <span>Bis dahin abbezahlt: {finishedBy.map((e) => e.expense.name).join(', ')}</span>
            </p>
          )}
          <h3 className="mt-4 text-xs font-medium text-zinc-400">Laufzeiten</h3>
          <ul className="mt-1.5 space-y-1">
            {events.map((ev) => (
              <li key={ev.expense.id}>
                <button
                  type="button"
                  onClick={() => setSelected(ev.freedIdx)}
                  aria-label={`${ev.expense.name}: ab ${formatMonthIndex(ev.freedIdx)} ${formatMoney(ev.monthly, currency)} mehr pro Monat`}
                  aria-pressed={point.idx === ev.freedIdx}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                    point.idx === ev.freedIdx ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: ev.expense.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{ev.expense.name}</span>
                    <span className="block text-[11px] text-zinc-500 tabular-nums">
                      {ev.remainingCount > 0
                        ? `Noch ${ev.remainingCount} × ${formatMoneyShort(ev.expense.amount, currency)} = ${formatMoneyShort(ev.remainingTotal, currency)} · bis ${formatMonthIndex(ev.lastIdx, true)}`
                        : `Letzte Zahlung erledigt (${formatMonthIndex(ev.lastIdx, true)})`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-emerald-300 tabular-nums">
                      +{formatMoneyShort(ev.monthly, currency)}
                    </span>
                    <span className="block text-[11px] text-zinc-500">ab {formatMonthIndex(ev.freedIdx, true)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 flex items-start gap-2 text-xs text-zinc-400">
          <Hourglass className="mt-px size-4 shrink-0 text-zinc-500" />
          Lege bei Krediten, Klarna oder Ratenzahlungen eine Laufzeit fest, dann siehst du hier, ab wann du mehr Geld
          zur Verfügung hast.
        </p>
      )}
    </section>
  )
}

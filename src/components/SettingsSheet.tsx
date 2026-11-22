import { Download, HardDrive, RotateCcw, Sparkles, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { exportData, importData } from '../lib/storage'
import type { AppData } from '../types'
import { BottomSheet } from './BottomSheet'

interface Props {
  data: AppData
  onCurrencyChange: (currency: string) => void
  onImport: (data: AppData) => void
  onLoadDemo: () => void
  onReset: () => void
  onClose: () => void
}

const CURRENCIES = ['€', 'CHF', '$', '£']

type Status = { kind: 'success' | 'error'; text: string } | null

function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  danger = false,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
        danger ? 'bg-rose-500/10 hover:bg-rose-500/15' : 'bg-white/[0.04] hover:bg-white/[0.07]'
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          danger ? 'bg-rose-500/15 text-rose-400' : 'bg-white/[0.06] text-zinc-200'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className={`block text-sm font-medium ${danger ? 'text-rose-300' : ''}`}>{title}</span>
        <span className="block text-xs text-zinc-500">{subtitle}</span>
      </span>
    </button>
  )
}

export function SettingsSheet({ data, onCurrencyChange, onImport, onLoadDemo, onReset, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)
  const [custom, setCustom] = useState(
    CURRENCIES.includes(data.settings.currency) ? '' : data.settings.currency,
  )

  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = await importData(file)
      if (!window.confirm(`${imported.expenses.length} Posten importieren? Aktuelle Daten werden ersetzt.`)) return
      onImport(imported)
      setStatus({ kind: 'success', text: `${imported.expenses.length} Posten erfolgreich importiert.` })
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
  }

  return (
    <BottomSheet title="Einstellungen" onClose={onClose}>
      <div className="space-y-6 pb-2">
        <section>
          <h3 className="mb-2 text-xs font-medium text-zinc-400">Währungssymbol</h3>
          <div className="flex gap-1.5">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={data.settings.currency === c}
                onClick={() => {
                  setCustom('')
                  onCurrencyChange(c)
                }}
                className={`h-11 min-w-12 rounded-xl px-3 text-sm font-semibold transition ${
                  data.settings.currency === c
                    ? 'bg-white text-zinc-950'
                    : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
                }`}
              >
                {c}
              </button>
            ))}
            <input
              value={custom}
              onChange={(e) => {
                const v = e.target.value.slice(0, 4)
                setCustom(v)
                if (v.trim()) onCurrencyChange(v.trim())
              }}
              placeholder="Andere"
              aria-label="Eigenes Währungssymbol"
              className="h-11 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm outline-none focus:border-emerald-400/60"
            />
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-400">Datensicherung</h3>
          <p className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
            <HardDrive className="mt-px size-4 shrink-0 text-zinc-500" />
            <span>
              Alle Daten liegen nur lokal in diesem Browser auf diesem Gerät – nichts wird hochgeladen.
              {persisted === true && ' Dauerhafter Speicher ist aktiv.'}
              {persisted === false &&
                ' Tipp: Installiere die App auf dem Home-Bildschirm, damit der Browser die Daten nicht automatisch löscht.'}{' '}
              Beim Löschen der Browserdaten oder Handywechsel gehen sie verloren – exportiere daher regelmäßig ein
              Backup.
            </span>
          </p>
          <ActionButton
            icon={<Download className="size-4" />}
            title="Als JSON exportieren"
            subtitle={`${data.expenses.length} Posten · Backup-Datei herunterladen`}
            onClick={() => {
              exportData(data)
              setStatus({ kind: 'success', text: 'Backup wurde heruntergeladen.' })
            }}
          />
          <ActionButton
            icon={<Upload className="size-4" />}
            title="JSON importieren"
            subtitle="Backup-Datei wiederherstellen"
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
          {status && (
            <p
              role="status"
              className={`rounded-xl px-3 py-2 text-xs ${
                status.kind === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
              }`}
            >
              {status.text}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-400">Daten</h3>
          <ActionButton
            icon={<Sparkles className="size-4" />}
            title="Demo-Daten laden"
            subtitle="Beispiel mit Miete, BAföG, PKV, Abos …"
            onClick={() => {
              if (data.expenses.length === 0 || window.confirm('Aktuelle Daten durch Demo-Daten ersetzen?')) {
                onLoadDemo()
                onClose()
              }
            }}
          />
          <ActionButton
            icon={<RotateCcw className="size-4" />}
            title="Alles zurücksetzen"
            subtitle="Löscht alle Fixkosten und Einkommen"
            danger
            onClick={() => {
              if (window.confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.')) {
                onReset()
                onClose()
              }
            }}
          />
        </section>

        <p className="text-center text-[11px] text-zinc-600">Fixkosten · lokal & offline · v1.0</p>
      </div>
    </BottomSheet>
  )
}

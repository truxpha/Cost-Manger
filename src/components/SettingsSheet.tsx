import {
  CheckCircle2,
  Download,
  History,
  RotateCcw,
  Share2,
  Smartphone,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { formatDateTime, formatRelativeDate } from '../lib/format'
import { canShareBackup, downloadBackup, hasContent, importData, shareBackup, type Snapshot } from '../lib/storage'
import type { AppData } from '../types'
import { BottomSheet } from './BottomSheet'

interface Props {
  data: AppData
  now: Date
  lastBackupAt?: string
  snapshot: Snapshot | null
  install: { canInstall: boolean; standalone: boolean; install: () => Promise<boolean> }
  onCurrencyChange: (currency: string) => void
  onBackupDone: () => void
  onImport: (data: AppData) => void
  onRestoreSnapshot: () => void
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
  primary = false,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
  danger?: boolean
  primary?: boolean
}) {
  const tone = danger
    ? 'bg-rose-500/10 hover:bg-rose-500/15'
    : primary
      ? 'bg-emerald-400/10 hover:bg-emerald-400/15'
      : 'bg-white/[0.04] hover:bg-white/[0.07]'
  const iconTone = danger
    ? 'bg-rose-500/15 text-rose-400'
    : primary
      ? 'bg-emerald-400/15 text-emerald-300'
      : 'bg-white/[0.06] text-zinc-200'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition active:scale-[0.99] ${tone}`}
    >
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconTone}`}>{icon}</span>
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-rose-300' : ''}`}>{title}</span>
        <span className="block text-xs text-zinc-500">{subtitle}</span>
      </span>
    </button>
  )
}

export function SettingsSheet({
  data,
  now,
  lastBackupAt,
  snapshot,
  install,
  onCurrencyChange,
  onBackupDone,
  onImport,
  onRestoreSnapshot,
  onLoadDemo,
  onReset,
  onClose,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [canShare] = useState(canShareBackup)
  const [custom, setCustom] = useState(CURRENCIES.includes(data.settings.currency) ? '' : data.settings.currency)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const imported = await importData(file)
      if (!window.confirm(`${imported.expenses.length} Posten aus dem Backup laden? Der aktuelle Stand wird ersetzt.`))
        return
      onImport(imported)
      onClose()
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Import fehlgeschlagen.' })
    }
  }

  const hasData = hasContent(data)

  return (
    <BottomSheet title="Einstellungen" onClose={onClose}>
      <div className="space-y-6 pb-2">
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-400">App & Speicher</h3>
          {install.standalone ? (
            <p className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 text-sm">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
              <span>
                Als App installiert
                <span className="block text-xs text-zinc-500">
                  {persisted === false
                    ? 'Daten liegen lokal auf diesem Gerät.'
                    : 'Daten liegen dauerhaft und nur lokal auf diesem Gerät.'}
                </span>
              </span>
            </p>
          ) : install.canInstall ? (
            <ActionButton
              primary
              icon={<Smartphone className="size-4" />}
              title="Als App installieren"
              subtitle="Eigenes App-Symbol, Vollbild, Daten besser geschützt"
              onClick={() => void install.install()}
            />
          ) : (
            <p className="flex items-start gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 text-xs text-zinc-400">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-zinc-500" />
              <span>
                Installieren: Im Chrome-Menü <span className="text-zinc-200">⋮</span> auf{' '}
                <span className="text-zinc-200">„App installieren“</span> bzw.{' '}
                <span className="text-zinc-200">„Zum Startbildschirm hinzufügen“</span> tippen.
              </span>
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-medium text-zinc-400">Backup</h3>
            <span className="text-xs text-zinc-500">
              {lastBackupAt ? `Letztes Backup: ${formatRelativeDate(lastBackupAt, now)}` : 'Noch kein Backup'}
            </span>
          </div>
          <ActionButton
            icon={<Download className="size-4" />}
            title="Backup auf dem Handy speichern"
            subtitle="JSON-Datei im Ordner „Downloads“ – bleibt auch beim Löschen der Browserdaten"
            onClick={() => {
              downloadBackup(data)
              onBackupDone()
              setStatus({ kind: 'success', text: 'Backup gespeichert (Ordner „Downloads“).' })
            }}
          />
          {canShare && (
            <ActionButton
              icon={<Share2 className="size-4" />}
              title="Backup teilen"
              subtitle="An Google Drive, E-Mail oder Messenger senden"
              onClick={async () => {
                try {
                  if (await shareBackup(data)) {
                    onBackupDone()
                    setStatus({ kind: 'success', text: 'Backup geteilt.' })
                  }
                } catch {
                  setStatus({ kind: 'error', text: 'Teilen nicht möglich – nutze „Backup auf dem Handy speichern“.' })
                }
              }}
            />
          )}
          <ActionButton
            icon={<Upload className="size-4" />}
            title="Backup wiederherstellen"
            subtitle="Gespeicherte JSON-Datei auswählen"
            onClick={() => fileRef.current?.click()}
          />
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
          {snapshot && (
            <ActionButton
              icon={<History className="size-4" />}
              title="Vorherigen Stand wiederherstellen"
              subtitle={`Automatisch gesichert vor „${snapshot.reason}“ · ${formatDateTime(snapshot.savedAt)} · ${snapshot.data.expenses.length} Posten`}
              onClick={() => {
                onRestoreSnapshot()
                onClose()
              }}
            />
          )}
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
          <h3 className="text-xs font-medium text-zinc-400">Daten</h3>
          <ActionButton
            icon={<Sparkles className="size-4" />}
            title="Demo-Daten laden"
            subtitle="Beispiel mit Miete, PKV, Klarna, BAföG, Schulden …"
            onClick={() => {
              if (!hasData || window.confirm('Aktuelle Daten durch Demo-Daten ersetzen?')) {
                onLoadDemo()
                onClose()
              }
            }}
          />
          {hasData && (
            <ActionButton
              icon={<RotateCcw className="size-4" />}
              title="Alles zurücksetzen"
              subtitle="Löscht Fixkosten, Einmalausgaben, Schulden und Einkommen"
              danger
              onClick={() => {
                if (window.confirm('Wirklich alle Daten löschen?')) {
                  onReset()
                  onClose()
                }
              }}
            />
          )}
        </section>

        <p className="text-center text-[11px] text-zinc-500">Fixkosten · lokal & offline · v1.3</p>
      </div>
    </BottomSheet>
  )
}

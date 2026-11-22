import { ChevronRight, DatabaseBackup, Eye, EyeOff, HandCoins, Plus, Settings, Smartphone, Sparkles } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { EntriesSection } from './components/EntriesSection'
import { EntrySheet, type EntryTarget } from './components/EntrySheet'
import { ForecastCard } from './components/ForecastCard'
import { HeroCard } from './components/HeroCard'
import { IncomeSheet } from './components/IncomeSheet'
import { NoticeCard } from './components/NoticeCard'
import { SettingsSheet } from './components/SettingsSheet'
import { Toast, type ToastData } from './components/Toast'
import { UpcomingBar } from './components/UpcomingBar'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { useMeta } from './hooks/useMeta'
import { useStore } from './hooks/useStore'
import { useToday } from './hooks/useToday'
import { computeBreakdown, computeForecast, computeSummary, computeTimeline, nextMonthDue } from './lib/calc'
import { currentMonthIndex, toMonthKey } from './lib/calc'
import { formatMoney, formatMoneyShort, formatRelativeDate, MONTHS } from './lib/format'
import { createId } from './lib/id'
import { downloadBackup, hasContent, loadSnapshot, saveSnapshot } from './lib/storage'
import type { Category, Debt, EntryKind, Expense, SortMode } from './types'

type Sheet =
  | { type: 'entry'; target: EntryTarget }
  | { type: 'income' }
  | { type: 'settings' }
  | null

const DAY = 86_400_000

/** App-Verknüpfungen (App-Symbol lange drücken): ?aktion=neu bzw. ?aktion=einmalig */
function consumeStartAction(): string | null {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('aktion')
  if (action) {
    params.delete('aktion')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', window.location.pathname + (query ? `?${query}` : ''))
  }
  return action
}
const START_ACTION = consumeStartAction()

export default function App() {
  const { data, actions } = useStore()
  const { meta, updateMeta } = useMeta()
  const install = useInstallPrompt()
  const now = useToday()
  const [sheet, setSheet] = useState<Sheet>(() =>
    START_ACTION === 'neu'
      ? { type: 'entry', target: { kind: 'expense', item: null } }
      : START_ACTION === 'einmalig'
        ? { type: 'entry', target: { kind: 'oneoff', item: null } }
        : null,
  )
  const [tab, setTab] = useState<EntryKind>(START_ACTION === 'einmalig' ? 'oneoff' : 'expense')
  const listRef = useRef<HTMLElement>(null)
  const [sort, setSort] = useState<SortMode>('category')
  const [filter, setFilter] = useState<Category | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [snapshot, setSnapshot] = useState(loadSnapshot)

  const currency = data.settings.currency
  const summary = useMemo(() => computeSummary(data, now), [data, now])
  const timeline = useMemo(() => computeTimeline(data.expenses, now), [data.expenses, now])
  const nextMonth = useMemo(() => nextMonthDue(data.expenses, now), [data.expenses, now])
  const breakdown = useMemo(() => computeBreakdown(data.expenses, now), [data.expenses, now])
  const forecast = useMemo(() => computeForecast(data, now), [data, now])

  // Filter zurücksetzen, wenn die Kategorie keine aktiven Posten mehr hat
  const activeFilter = filter && breakdown.some((c) => c.category === filter) ? filter : null

  const closeSheet = useCallback(() => setSheet(null), [])
  const openEntry = useCallback((target: EntryTarget) => setSheet({ type: 'entry', target }), [])
  const openExpense = useCallback((item: Expense | null) => openEntry({ kind: 'expense', item }), [openEntry])

  const recentOneOffNames = useMemo(
    () => [...new Set([...data.oneOffs].reverse().map((o) => o.name))].slice(0, 5),
    [data.oneOffs],
  )

  const showTab = (kind: EntryKind) => {
    setTab(kind)
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const dismissToast = useCallback(() => setToast(null), [])
  const showToast = (message: string, onUndo?: () => void) => setToast({ id: Date.now(), message, onUndo })

  /** Große Änderungen: vorher Sicherheitskopie anlegen und „Rückgängig“ anbieten */
  const replaceSafely = (reason: string, message: string, apply: () => void) => {
    const previous = data
    if (hasContent(previous)) {
      saveSnapshot(previous, reason)
      setSnapshot(loadSnapshot())
    }
    apply()
    showToast(message, hasContent(previous) ? () => actions.replaceData(previous) : undefined)
  }

  const deleteExpense = (id: string) => {
    const removed = data.expenses.find((e) => e.id === id)
    actions.deleteExpense(id)
    if (removed) showToast(`„${removed.name}“ gelöscht`, () => actions.upsertExpense(removed))
  }

  const deleteOneOff = (id: string) => {
    const removed = data.oneOffs.find((o) => o.id === id)
    actions.deleteOneOff(id)
    if (removed) showToast(`„${removed.name}“ gelöscht`, () => actions.upsertOneOff(removed))
  }

  const deleteDebt = (id: string) => {
    const removed = data.debts.find((d) => d.id === id)
    actions.deleteDebt(id)
    if (removed) showToast(`Schuld „${removed.name}“ gelöscht`, () => actions.upsertDebt(removed))
  }

  const payDebt = (debt: Debt, amount: number, recordAsOneOff: boolean) => {
    const previous = data
    const oneOff = recordAsOneOff
      ? {
          id: createId(),
          name: `Rückzahlung an ${debt.name}`,
          amount,
          month: toMonthKey(currentMonthIndex(now)),
        }
      : null
    actions.payDebt(debt.id, amount, oneOff)
    const settled = debt.amount - amount <= 0.004
    showToast(
      settled
        ? `Schuld bei ${debt.name} beglichen`
        : `${formatMoney(amount, currency)} an ${debt.name} zurückgezahlt`,
      () => actions.replaceData(previous),
    )
  }

  const loadDemo = () => {
    replaceSafely('Demo-Daten', 'Beispieldaten geladen', actions.loadDemo)
    updateMeta({ demo: true })
  }

  const resetAll = (message: string) => {
    replaceSafely('Zurücksetzen', message, actions.reset)
    updateMeta({ demo: false })
  }

  const backupNow = () => {
    downloadBackup(data)
    updateMeta({ lastBackupAt: new Date().toISOString() })
    showToast('Backup gespeichert (Ordner „Downloads“)')
  }

  const isEmpty = !hasContent(data)
  const openDebts = data.debts.filter((d) => d.amount > 0)
  const nowMs = now.getTime()
  const showInstallHint = install.canInstall && !meta.installHintDismissed && !isEmpty
  const backupDue =
    !isEmpty &&
    nowMs - Date.parse(meta.firstUseAt) > 3 * DAY &&
    (!meta.lastBackupAt || nowMs - Date.parse(meta.lastBackupAt) > 30 * DAY) &&
    (!meta.backupReminderSnoozedUntil || nowMs > Date.parse(meta.backupReminderSnoozedUntil))

  // Höchstens ein Hinweis gleichzeitig: Beispieldaten > Installation > Backup
  let notice: ReactNode = null
  if (meta.demo && !isEmpty) {
    notice = (
      <NoticeCard
        icon={Sparkles}
        title="Du siehst Beispieldaten"
        text="Schau dich in Ruhe um. Wenn du bereit bist, starte mit deinen eigenen Zahlen."
        actionLabel="Eigene Daten starten"
        onAction={() => resetAll('Beispieldaten entfernt')}
        dismissLabel="Behalten"
        onDismiss={() => updateMeta({ demo: false })}
      />
    )
  } else if (showInstallHint) {
    notice = (
      <NoticeCard
        icon={Smartphone}
        title="Als App installieren"
        text="Startet wie eine normale App vom Startbildschirm – und Android schützt deine Daten besser vor automatischem Löschen."
        actionLabel="Installieren"
        onAction={() => void install.install()}
        dismissLabel="Nicht jetzt"
        onDismiss={() => updateMeta({ installHintDismissed: true })}
      />
    )
  } else if (backupDue) {
    notice = (
      <NoticeCard
        icon={DatabaseBackup}
        title="Zeit für ein Backup"
        text={`${meta.lastBackupAt ? `Letztes Backup ${formatRelativeDate(meta.lastBackupAt, now)}.` : 'Du hast noch kein Backup.'} Ein Tipp speichert eine Datei in „Downloads“ – nützlich bei Handywechsel oder gelöschten Browserdaten.`}
        actionLabel="Backup speichern"
        onAction={backupNow}
        dismissLabel="Später"
        onDismiss={() => updateMeta({ backupReminderSnoozedUntil: new Date(nowMs + 14 * DAY).toISOString() })}
      />
    )
  }

  return (
    <div
      data-private={meta.privacy ? '' : undefined}
      className="mx-auto min-h-dvh max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
    >
      <header className="flex items-center justify-between gap-2 py-2">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            {MONTHS[now.getMonth()]} {now.getFullYear()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Fixkosten</h1>
        </div>
        <div className="flex gap-2">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => updateMeta({ privacy: !meta.privacy })}
              aria-pressed={Boolean(meta.privacy)}
              className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-surface-1 text-zinc-300 transition hover:text-white active:scale-95"
              aria-label={meta.privacy ? 'Beträge anzeigen' : 'Beträge verbergen'}
            >
              {meta.privacy ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSheet({ type: 'settings' })}
            className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-surface-1 text-zinc-300 transition hover:text-white active:scale-95"
            aria-label="Einstellungen"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <main className="mt-3 space-y-4">
        <HeroCard
          summary={summary}
          currency={currency}
          monthName={MONTHS[now.getMonth()]}
          onEditIncome={() => setSheet({ type: 'income' })}
          onShowOneOffs={() => showTab('oneoff')}
          onShowExpenses={() => showTab('expense')}
        />

        {notice}

        {openDebts.length > 0 && (
          <button
            type="button"
            onClick={() => showTab('debt')}
            className="flex w-full items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-3.5 py-2.5 text-left transition hover:bg-amber-300/[0.08]"
          >
            <HandCoins className="size-5 shrink-0 text-amber-300" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {openDebts.length === 1 ? `Offen bei ${openDebts[0].name}` : `${openDebts.length} offene Schulden`}
              </span>
              <span className="block text-[11px] text-zinc-500">nicht im Budget eingerechnet</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatMoneyShort(summary.openDebts, currency)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-zinc-500" />
          </button>
        )}

        {isEmpty ? (
          <section className="rounded-3xl border border-white/10 bg-surface-1 p-5">
            <h2 className="text-lg font-semibold tracking-tight">In zwei Schritten startklar</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Einmal eintragen – danach siehst du jeden Monat, was dir nach allen Fixkosten bleibt.
            </p>
            <ol className="mt-4 space-y-2">
              {[
                {
                  step: 1,
                  title: 'Nettoeinkommen eintragen',
                  text: `Aktuell ${formatMoney(data.netIncome, currency)} – was monatlich auf dem Konto ankommt`,
                  onClick: () => setSheet({ type: 'income' }),
                },
                {
                  step: 2,
                  title: 'Fixkosten hinzufügen',
                  text: 'Miete, PKV, Kredite, Klarna, Abos …',
                  onClick: () => openExpense(null),
                },
              ].map((item) => (
                <li key={item.step}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.07] active:scale-[0.99]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-300">
                      {item.step}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.title}</span>
                      <span className="block text-xs text-zinc-500">{item.text}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-zinc-500" />
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={loadDemo}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04]"
            >
              <Sparkles className="size-4" /> Erst mal mit Beispieldaten ausprobieren
            </button>
          </section>
        ) : (
          <>
            <UpcomingBar
              timeline={timeline}
              nextMonth={nextMonth}
              currency={currency}
              onOpen={openExpense}
            />
            <CategoryBreakdown
              breakdown={breakdown}
              currency={currency}
              activeFilter={activeFilter}
              onFilter={(category) => {
                setFilter(category)
                if (category) showTab('expense')
              }}
            />
            <ForecastCard forecast={forecast} currency={currency} />
            <EntriesSection
              ref={listRef}
              data={data}
              currency={currency}
              now={now}
              tab={tab}
              onTabChange={setTab}
              sort={sort}
              onSortChange={setSort}
              filter={activeFilter}
              onClearFilter={() => setFilter(null)}
              onToggleExpense={actions.toggleExpense}
              onOpenExpense={openExpense}
              onOpenOneOff={(item) => openEntry({ kind: 'oneoff', item })}
              onOpenDebt={(item) => openEntry({ kind: 'debt', item })}
              onAdd={(kind) => openEntry({ kind, item: null } as EntryTarget)}
            />
          </>
        )}
      </main>

      <button
        type="button"
        onClick={() => openEntry({ kind: tab, item: null } as EntryTarget)}
        className="fixed right-[max(1.25rem,calc(50%-15rem))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex size-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition hover:bg-zinc-200 active:scale-90"
        aria-label="Eintrag hinzufügen"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>

      {toast && <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />}

      {sheet?.type === 'entry' && (
        <EntrySheet
          key={sheet.target.item?.id ?? `new-${sheet.target.kind}`}
          target={sheet.target}
          currency={currency}
          now={now}
          recentOneOffNames={recentOneOffNames}
          onSaveExpense={actions.upsertExpense}
          onDeleteExpense={deleteExpense}
          onSaveOneOff={actions.upsertOneOff}
          onDeleteOneOff={deleteOneOff}
          onSaveDebt={actions.upsertDebt}
          onDeleteDebt={deleteDebt}
          onPayDebt={payDebt}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'income' && (
        <IncomeSheet
          netIncome={data.netIncome}
          extraIncome={data.extraIncome}
          currency={currency}
          onSave={actions.setIncome}
          onClose={closeSheet}
        />
      )}
      {sheet?.type === 'settings' && (
        <SettingsSheet
          data={data}
          now={now}
          lastBackupAt={meta.lastBackupAt}
          snapshot={snapshot}
          install={install}
          onCurrencyChange={actions.setCurrency}
          onBackupDone={() => updateMeta({ lastBackupAt: new Date().toISOString() })}
          onImport={(imported) => {
            replaceSafely('Import', `${imported.expenses.length} Posten aus Backup geladen`, () =>
              actions.replaceData(imported),
            )
            updateMeta({ demo: false })
          }}
          onRestoreSnapshot={() => {
            if (!snapshot) return
            const restored = snapshot.data
            replaceSafely('Wiederherstellen', 'Vorheriger Stand wiederhergestellt', () => actions.replaceData(restored))
            updateMeta({ demo: false })
          }}
          onLoadDemo={loadDemo}
          onReset={() => resetAll('Alle Daten gelöscht')}
          onClose={closeSheet}
        />
      )}
    </div>
  )
}

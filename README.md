# Fixkosten – Cashflow Tracker (PWA)

Minimalistische, mobile-first Progressive Web App, um das **monatliche Einkommen** den **wiederkehrenden Fixkosten** (Miete, Kredite, BAföG, Strom, Versicherungen, Abos …) gegenüberzustellen – ohne tägliches Ausgaben-Tracking.

- 100 % lokal (`localStorage` im Browser des Geräts), kein Backend, kein Login; die App bittet den Browser um dauerhaften Speicher
- JSON-Export/-Import als Backup (z. B. beim Handywechsel)
- Installierbar auf Android/iOS (Manifest, Icons, Offline-Service-Worker)
- Dark-Mode-first, große Touch-Ziele (≥ 44 px)

## Funktionen

Zwei Bereiche, oben umschaltbar: **Budget** und **Schulden**.

### Budget

| Bereich | Beschreibung |
| --- | --- |
| **Übersicht** | Frei verfügbares Budget (Netto – Fixkosten), „Übrig im Monat“ nach Einmalausgaben, Fixkosten-Quote |
| **Noch offen diesen Monat** | Abbuchungen ab heute, Vorschau auf den nächsten Monat |
| **Kategorien** | Verteilung als Balken; Antippen filtert die Liste |
| **Ausblick** | Was pro Monat übrig bleibt – mit Stufen, wenn Kredite, Raten oder Kreditkarten abbezahlt sind |
| **Fixkosten** | Sortierbar, Schalter für „Was wäre wenn“, optionale Laufzeit (letzte Rate oder Anzahl Raten) |
| **Einmalig** | Ausgaben nur für einen Monat (z. B. „Geld an Mama“), fließen in „Übrig“ und Ausblick ein |
| **Vorlagen** | Miete, Strom, Internet, PKV, Kredit, Klarna, Kreditkarte, BAföG … mit kurzen Hinweisen |

### Schulden

| Bereich | Beschreibung |
| --- | --- |
| **Gesamtübersicht** | Schulden gesamt, Raten und Zinsen pro Monat, bereits getilgt, Datum „schuldenfrei“ |
| **Kredite & Kreditkarten** | Fixkosten mit optionaler Restschuld + Zinssatz – die Restschuld sinkt automatisch mit jeder Rate; das Budget weiß, wann die Rate wegfällt |
| **Schulden ohne Rate** | z. B. Familie oder Dispo, optional mit Zinssatz; Rückzahlungen erfassen (optional als Einmalausgabe) |
| **Tilgungsplan** | Lawine (höchster Zins zuerst) oder Schneeball (kleinste Schuld zuerst), Extra-Betrag pro Monat, frei gewordene Raten fließen in die nächste Schuld; zeigt Reihenfolge, Zinsen und Ersparnis |
| **Sondertilgung** | Direkt am Kredit erfassen; Hinweis, wohin sie am meisten bringt |
| **Umschuldung** | Ausgewählte Schulden mit neuem Zinssatz und Laufzeit durchrechnen: neue Rate, Zinsen, Ersparnis |
| **Kündigen** | Erinnerung, wenn eine markierte Kreditkarte / ein Dispo abbezahlt ist |
| **Warnungen** | Wenn eine Rate nicht einmal die Zinsen deckt |

### Daten & App

| Bereich | Beschreibung |
| --- | --- |
| **Datensicherheit** | „Rückgängig“ nach Löschen/Zurücksetzen/Import, automatische Sicherheitskopie, Backup mit einem Tipp in „Downloads“, Erinnerung nach 30 Tagen |
| **Android** | Installierbar, Zurück-Taste schließt Fenster, Sheets nach unten wischen, App-Verknüpfungen, Privatsphäre-Modus |

Quartalsweise und jährliche Beträge werden in der Übersicht automatisch auf einen Monatswert normalisiert (`/3` bzw. `/12`).

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm run build      # Typecheck + Produktions-Build nach dist/
npm run lint       # oxlint (Warnungen = Fehler)
npm run preview    # Build lokal testen (inkl. Service Worker)
```

Stack: Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · Lucide Icons.

## Projektstruktur

```
src/
  types.ts               Datenmodell (Expense, IncomeItem, AppData)
  lib/
    calc.ts              Normalisierung, Summen, Monats-Zeitleiste, Kategorien-Anteile, Ausblick
    debts.ts             Restschuld-Fortschreibung, Schuldenübersicht, Tilgungsplan, Umschuldung
    storage.ts           localStorage, Validierung, JSON-Export/-Import
    categories.ts        Kategorien (Farbe, Icon), Akzentfarben
    format.ts            Formatierung (de-DE), Betrags-Parser, Labels
    demo.ts              Demo- und Startdaten
  hooks/
    useStore.ts          Zentraler Zustand + Persistenz
    useToday.ts          Aktuelles Datum (aktualisiert bei App-Fokus)
    useMeta.ts           Backup-Datum, Hinweise, Privatsphäre-Modus
    useInstallPrompt.ts  „App installieren“-Button (Android/Chrome)
    useBackClose.ts      Android-Zurück-Taste schließt Sheets
  components/            Budget: HeroCard, UpcomingBar, CategoryBreakdown, ForecastCard, EntriesSection …
                         Schulden: DebtsView, DebtPlanCard, ConsolidationCard
                         Formulare: EntrySheet, ExpenseForm (+ LoanFields), OneOffForm, DebtForm, RepaymentBox
public/
  manifest.webmanifest   PWA-Manifest (inkl. Verknüpfung & Screenshots für den Installationsdialog)
  sw.js                  Offline-Service-Worker
  icons/                 App-Icons (SVG, 192, 512, maskable, apple-touch)
```

## Veröffentlichen & auf dem Android-Handy installieren

Die App braucht eine **HTTPS-Adresse**. Am einfachsten über GitHub Pages (kostenlos, Workflow liegt bei):

1. Auf GitHub: **Settings → Pages → Source: „GitHub Actions“** auswählen.
2. **Actions → „Deploy auf GitHub Pages“ → „Run workflow“** starten (später automatisch bei jedem Push auf `main`).
3. Nach ca. 1 Minute ist die App unter `https://<benutzername>.github.io/<repository>/` erreichbar.
4. Die Adresse in **Chrome auf dem Handy** öffnen → Hinweis „Als App installieren“ bzw. Menü ⋮ → **„App installieren“**.

Chrome erzeugt daraus eine echte Android-App (WebAPK): eigenes Symbol im App-Drawer, Vollbild, offline nutzbar, Updates automatisch.

### Wo liegen meine Daten?

- Nur auf dem Handy, im Speicher der App (kein Server, kein Konto).
- Die App fordert **dauerhaften Speicher** an – Android löscht die Daten dann nicht von selbst.
- Weg sind sie nur, wenn man in Chrome **Websitedaten löscht**, die App deinstalliert oder das Handy wechselt.
  Dafür gibt es **„Backup auf dem Handy speichern“**: legt eine JSON-Datei in „Downloads“ ab, die davon unberührt bleibt
  (und z. B. per Google Drive aufs neue Handy kommt).

# Fixkosten – Cashflow Tracker (PWA)

Minimalistische, mobile-first Progressive Web App, um das **monatliche Einkommen** den **wiederkehrenden Fixkosten** (Miete, Kredite, BAföG, Strom, Versicherungen, Abos …) gegenüberzustellen – ohne tägliches Ausgaben-Tracking.

- 100 % lokal (`localStorage` im Browser des Geräts), kein Backend, kein Login; die App bittet den Browser um dauerhaften Speicher
- JSON-Export/-Import als Backup (z. B. beim Handywechsel)
- Installierbar auf Android/iOS (Manifest, Icons, Offline-Service-Worker)
- Dark-Mode-first, große Touch-Ziele (≥ 44 px)

## Funktionen

| Bereich | Beschreibung |
| --- | --- |
| **Übersicht** | Frei verfügbares Budget (Netto – Fixkosten), Nettoeinkommen, Fixkosten gesamt, Fixkosten-Quote mit Fortschrittsbalken |
| **Noch offen diesen Monat** | Tatsächliche Abbuchungen des laufenden Monats ab heute (inkl. quartalsweiser/jährlicher Posten im Fälligkeitsmonat) |
| **Kategorien** | Gestapelter Balken + Legende; Antippen filtert die Liste |
| **Fixkostenliste** | Gruppiert nach Kategorie oder sortiert nach Datum/Betrag; Schalter zum Pausieren („Was wäre wenn“) |
| **Laufzeiten** | Optionales Ende (letzte Zahlung oder Anzahl verbleibender Raten) für Kredite, Ratenkäufe, BAföG … – mit Restbetrag; abbezahlte Posten zählen automatisch nicht mehr |
| **Ausblick** | Diagramm des frei verfügbaren Budgets pro Monat für die kommenden Jahre; Monat antippen → Betrag, Differenz zu heute und was bis dahin abbezahlt ist |
| **Datensicherheit** | „Rückgängig“ nach Löschen/Zurücksetzen/Import, automatische Sicherheitskopie vor großen Änderungen, Backup mit einem Tipp in „Downloads“, Erinnerung nach 30 Tagen |
| **Android** | Installierbar mit eigenem Button, Zurück-Taste schließt Fenster, Sheets nach unten wischen, App-Verknüpfung „Hinzufügen“ (App-Symbol lange drücken), Privatsphäre-Modus (Beträge verbergen) |
| **Schnell hinzufügen** | `+`-Button mit Vorlagen (Miete, Kredit, BAföG, Strom, Internet, Versicherung, Gym) |
| **Einstellungen** | Währungssymbol, JSON-Export/-Import, Demo-Daten, Zurücksetzen |

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
    calc.ts              Normalisierung, Summen, Monats-Zeitleiste, Kategorien-Anteile
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
  components/            HeroCard, UpcomingBar, CategoryBreakdown, ForecastCard, ExpenseList/-Row,
                         ExpenseSheet, IncomeSheet, SettingsSheet, BottomSheet, Toast, NoticeCard, Toggle
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

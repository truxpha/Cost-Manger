# Fixkosten – Cashflow Tracker (PWA)

Minimalistische, mobile-first Progressive Web App, um das **monatliche Einkommen** den **wiederkehrenden Fixkosten** (Miete, Kredite, BAföG, Strom, Versicherungen, Abos …) gegenüberzustellen – ohne tägliches Ausgaben-Tracking.

- 100 % lokal (`localStorage`), kein Backend, kein Login
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
  components/            HeroCard, UpcomingBar, CategoryBreakdown, ExpenseList/-Row,
                         ExpenseSheet, IncomeSheet, SettingsSheet, BottomSheet, Toggle
public/
  manifest.webmanifest   PWA-Manifest
  sw.js                  Offline-Service-Worker
  icons/                 App-Icons (SVG, 192, 512, maskable, apple-touch)
```

## Auf dem Handy installieren

Die App muss über **HTTPS** ausgeliefert werden (z. B. GitHub Pages, Netlify, Vercel – `dist/` ist statisch, `base` ist relativ).

- **Android (Chrome):** Menü ⋮ → „App installieren“
- **iOS (Safari):** Teilen → „Zum Home-Bildschirm“

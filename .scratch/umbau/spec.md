# Spec: Umbau für die Stores

Status: needs-triage (wartet auf das Go des Nutzers nach dem Merge von `feature/energie`)

PLAN 3a «Umbau für die Stores». Die Entscheide stammen aus dem Grilling vom 15.11.2026. Sie ändern den Weg in PLAN 4
(Play Store) und legen PLAN 5 (Steam) fest. Die Weichen stehen in ADR 0011 (Web-Technik statt Engine), ADR 0012
(Capacitor statt TWA) und ADR 0013 (Electron statt Tauri).

Gearbeitet wird auf dem Branch `feature/umbau`. **Begonnen wird erst, wenn `feature/energie` nach `main` gemergt ist
und der Nutzer das Go gibt.** Dann zuerst `main` in `feature/umbau` holen. Während des Umbaus kommen keine neuen
Funktionen dazu, nur Fehlerbehebungen (sonst gibt es ständig Konflikte in `index.html`).

## Ziel

Prisma erscheint im Google Play Store, auf Steam (Windows und Steam Deck) und weiter im Browser, alles aus **einem**
Code. Dazu wird das Spiel so umgebaut, dass es sich mit wenig Aufwand verpacken, übersetzen und weiterentwickeln lässt.

## Ausgangslage

- Eine einzige `index.html` mit rund 27 000 Zeilen und 1,5 MB, kein Build-Schritt, Start mit Doppelklick über
  `file://`. Three.js r147 und die Schrift Jost in `vendor/`, Skyboxen in `backgrounds/` (rund 28 MB).
- Service Worker `sw.js` mit einer Dateiliste von Hand (`FILES`, `LAZY`), Manifest `manifest.webmanifest`.
- Fortschritt im `localStorage`, an mehreren Stellen direkt gelesen und geschrieben.
- Alle Texte nur auf Deutsch, verteilt im Code.
- Prüfungen lesen markierte Bereiche aus dem Quelltext (`LOGIC` mit `LEVELS`, `WUERFEL` und `GESCHICHTE` darin, dazu
  `HALL`; der Vorrat der Level zwischen `VORRAT:BEGIN` und `VORRAT:END` in `tools/vorrat/`) und öffnen `index.html`
  über `file://`. Werkzeuge wie `tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs` und
  `tools/vorrat.mjs` **schreiben** in diese Bereiche von `index.html`.

## Entschieden

### Technik

- **Web-Technik bleibt** (ADR 0011). Kein Wechsel auf Godot, Unity o. Ä.: Strahlregel, Löser, die Level der Geschichte
  und alle Prüfungen bleiben erhalten.
- **Vite und npm.** Entwickelt wird mit `npm run dev` auf `localhost`. `npm run build` erzeugt das fertige Spiel in
  `dist/`, mit relativen Pfaden (`base: './'`), damit dieselbe Ausgabe auf GitHub Pages unter `/Prisma/`, in Capacitor
  und in Electron läuft. Auf den Start mit Doppelklick über `file://` wird verzichtet.
- **Module und TypeScript, schrittweise.** Der Code wird Stück für Stück aus `index.html` in Module unter `src/`
  gelöst. TypeScript wird schrittweise eingeführt: Neue und herausgelöste Module dürfen TypeScript sein, alter Code
  bleibt vorerst JavaScript (`allowJs`). Keine Umstellung in einem Rutsch.
- **Three.js bleibt bei r147.** Eine Aktualisierung ist ein eigener Entscheid nach dem Umbau (neuere Fassungen
  behandeln Farben und Licht anders, das Aussehen müsste neu abgestimmt werden).
- **Speicherschicht.** Aller Zugriff auf den Spielstand läuft über eine eigene Schicht. Heute steckt dahinter
  `localStorage`, später je Plattform etwas anderes (z. B. eine Datei für Steam Cloud). Die Schlüssel und das Format
  des Spielstands bleiben gleich, kein Spieler verliert seinen Fortschritt.
- **Level und Texte in Dateien.** Level, Geschichte und alle Texte wandern aus dem Code in Datendateien. Die Werkzeuge,
  die heute in `index.html` schreiben, schreiben dann in diese Dateien.
- **Eigene kleine Übersetzungsschicht.** `t('schluessel', { werte })`, eine JSON-Datei je Sprache. Fehlt ein Schlüssel,
  gilt der deutsche Text. Ein Test prüft, dass jede Sprache alle Schlüssel hat. Keine Bibliothek wie i18next.
- **Sprachen:** Deutsch und Englisch; eine weitere Sprache ist nur eine weitere JSON-Datei. Die englischen Texte
  schreibt Claude, der Nutzer prüft sie im Spiel.
- **Sprachwahl:** Zuerst die Sprache des Geräts (Deutsch bei Deutsch, sonst Englisch), dazu ein Schalter in den
  Einstellungen. Im englischen Store heisst das Spiel «Prisma – Light Puzzle».

### Plattformen und Verpacken

- **Browser:** bleibt. `dist/` wird bei jedem Push auf `main` von einer GitHub Action gebaut und auf GitHub Pages
  veröffentlicht (`bonomoalessandro.github.io/Prisma/`). Diese Adresse ist fest; ein späterer Wechsel kostet die
  Spieler der Browser-Fassung ihren Fortschritt.
- **Android:** Capacitor statt TWA (ADR 0012). Das Spiel liegt in der App und läuft vom ersten Start an offline.
- **Steam:** Electron mit `steamworks.js` (ADR 0013), für Windows und das Steam Deck (Linux). macOS später.
- **Spielstand:** Jede Plattform hat ihren eigenen. Auf Steam kommt Steam Cloud dazu. Kein Abgleich zwischen
  Plattformen.
- **Controller:** Vor Steam bekommt Prisma eine volle Controller-Steuerung (Voraussetzung für «Deck Verified»). Das ist
  ein eigenes Vorhaben nach dem Play-Store-Start.

### Geld

- Steam: einmaliger Kaufpreis.
- Android: gratis. Eine Vollversion zum Kaufen kommt später als eigenes Vorhaben; der Umbau bereitet dafür **nichts**
  vor.

## Vorgehen

- **Schrittweise.** Nach jedem Schritt sieht das Spiel genau gleich aus und verhält sich gleich. Das Spiel bleibt in
  jedem Moment spielbar.
- **Automatisch geprüft, ohne den Nutzer.** Nach jedem Schritt müssen grün sein: der Bildvergleich (Ticket 01),
  `tests/golden.mjs` gegen die bestehende Referenz (kein `--write`), alle Node-Tests und die Proben. Danach prüft ein
  Reviewer-Agent den Diff. Erst dann geht es weiter.
- **Der Nutzer spielt selbst nur an drei Meilensteinen** auf dem Handy:
  1. nach Ticket 02 (das Spiel kommt erstmals aus `dist/`),
  2. nach Ticket 07 (Level und Texte in Dateien, Übersetzungsschicht, auf Deutsch),
  3. nach Ticket 08 (englische Fassung).
- Schwere Läufe (Chrome, Proben) wie bisher über `tools/leise.sh`.

## Ablauf

| # | Ticket | Meilenstein |
|---|---|---|
| 01 | Bildvergleich gegen die heutige `index.html` | |
| 02 | Vite, npm und `dist/`; Prüfungen gegen den Build | 1 |
| 03 | Spiellogik und markierte Bereiche als Module | |
| 04 | Übriger Code in Module, TypeScript einführen | |
| 05 | Speicherschicht | |
| 06 | Level und Geschichte als Datendateien | |
| 07 | Übersetzungsschicht, deutsche Texte, Sprachwahl | 2 |
| 08 | Englische Fassung | 3 |
| 09 | Browser-Fassung auf GitHub Pages | |
| 10 | Android mit Capacitor und Play Store | eigenes Grilling vorher |
| 11 | Controller-Steuerung | eigenes Grilling vorher |
| 12 | Steam mit Electron | eigenes Grilling vorher |

Je Ticket ein Umsetzer, danach ein unabhängiges Review; Kleines behebt der Reviewer selbst. Der Merge nach `main`
erfolgt nur auf das Go des Nutzers. Ob nach jedem Meilenstein oder erst am Ende gemergt wird, entscheidet der Nutzer
beim jeweiligen Meilenstein.

Vor den Tickets 10–12 gibt es je ein eigenes Grilling. Offen sind dort u. a.: Paketname und Signaturschlüssel für
Android, Mindestversion von Android, Preis und Store-Seite auf Steam, die Bedienung mit Controller im Einzelnen,
Steam-Erfolge.

## Nicht in diesem Vorhaben

- Neue Funktionen, neue Level, Änderungen an der Strahlregel oder am Löser.
- Aktualisierung von Three.js.
- Vollversion zum Kaufen auf Android.
- Abgleich des Spielstands zwischen Plattformen, Konten, eigener Server.
- macOS und iOS.
- Gegenlesen der englischen Texte durch Muttersprachler (kann vor dem Erscheinen noch entschieden werden).

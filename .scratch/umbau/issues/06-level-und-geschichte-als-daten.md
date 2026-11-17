# 06: Level und Geschichte als Datendateien

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, wartet auf Review)

**Blocked by:** 05

**What to build:** Level (`LEVELS` mit den Übungen im Dorf, die Würfel-Level `LEVELS_3D` zwischen den Markern
`WUERFEL`, dazu der Vorrat in `tools/vorrat/`) und die Reise der Geschichte (`GESCHICHTE`, `STORY_LEVELS`) liegen
nicht mehr im Code, sondern in eigenen Datendateien. Die Werkzeuge, die heute zwischen den
Markern in `index.html` schreiben, schreiben in diese Dateien. Spiel und Level bleiben genau gleich.

- [x] Ein Format für die Level festlegen (JSON oder ein Daten-Modul), das die heutigen Kommentare zur Lösung erhält
      oder sie in ein Feld übernimmt. Die Wahl unter «Comments» begründen.
- [x] Das Spiel lädt die Daten beim Build mit. Kein Nachladen über das Netz, das Spiel bleibt offline spielbar.
- [x] `tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`, `tools/leveldaten.mjs`,
      `tools/levelliste.mjs`, `tools/vorrat.mjs`, `tools/lader.mjs` und alle anderen Werkzeuge, die die Marker
      benutzen, lesen und schreiben die neuen Dateien. Die Marker verschwinden aus dem Code.
- [x] Die Texte bleiben in diesem Ticket noch Deutsch im Datensatz. Ticket 07 macht Schlüssel daraus.
- [x] Golden gegen die bestehende Referenz grün (Vergleich je Level nach Namen), `tests/geschichte.test.mjs`,
      `tests/levelliste.test.mjs`, `tests/wuerfelliste.test.mjs`, `tests/vorrat.test.mjs`, Bildvergleich
      und alle Proben grün (Proben mit Zeitmessung: Reviewer).
- [x] README: wo die Level liegen und wie man ein Level ändert.

## Comments

### Umsetzung

Umsetzer, 17.11.2026, Branch `ticket/umbau-06` ab dem Stand von Ticket 05 (`93a2508`, noch im Review). Commits:
`83baf18` (Daten, Logik, Werkzeuge, Tests), `0788f73` (README, `3D-WUERFEL.md`), dazu dieser.

**Wahl des Formats: ein Daten-Modul `src/daten/level.js` (JavaScript, nur Literale), kein JSON.**

- Die Kommentare je Level (Lösung, Herkunft mit Generator, Seed, Ziel, Stand) bleiben, wo sie sind, Zeile für Zeile.
  Sie werden gelesen: `levelliste.test` und `wuerfelliste.test` prüfen die Herkunft im Kommentar (zum Nachbauen),
  `generiere.mjs`/`ausbau.mjs` bauen danach nach. In JSON müssten sie in ein Feld, damit alle 842 Level und beide
  Dateien des Vorrats umgeschrieben werden, samt aller Werkzeuge, die den Kommentar schreiben oder lesen.
- Ein Level ist ein Block von `  {` bis `  },`, der byte-gleich zwischen Spiel und Vorrat wandert (Ablegen und
  Zurückholen verlustfrei). JSON hat kein Komma nach dem letzten Element und keine Kommentare: Ein Level am Ende
  verschieben änderte die Nachbarzeile, und der Diff zeigte nicht mehr nur das Level, das geht oder kommt.
- Vite bündelt das Modul wie jedes andere ins Spiel (kein Nachladen, offline). Eine Übersetzungsschicht (Ticket 07)
  kann die Texte der Übungen (`schritte`) später ebenso in Schlüssel umwandeln.
- Nachteil: Andere Programme als JavaScript lesen die Datei nicht direkt. Für das Spiel und die Werkzeuge (alle
  Node) spielt das keine Rolle; feste Form (kein Code, am Schluss ein `export`-Block) prüft `logic.test`.

**Aufbau.** `src/daten/level.js` hat `UEBUNGEN` (die vier Übungen im Dorf, von Hand), `FLACH` (die 240 Level der
Reihe im Spiel), `WUERFEL` (heute leer) und `REISE` (die Reise je Grad). `src/logik.js` importiert sie (`import { FLACH,
REISE, UEBUNGEN, WUERFEL } from './daten/level.js';`) und setzt `LEVELS = [...UEBUNGEN, ...FLACH]`,
`LEVELS_3D = [...WUERFEL]`, `STORY_LEVELS = REISE`; die Namen und Werte, die Spiel, Tests und Werkzeuge sehen, sind
dieselben. Ein Bereich für die Werkzeuge sind die Zeilen zwischen der Zeile, die das Feld öffnet (`const FLACH = [`,
`const WUERFEL = [`, `const REISE = {`, im Vorrat `const VORRAT_FLACH = [`/`const VORRAT_WUERFEL = [`), und der
nächsten Zeile `];` bzw. `};` (`bereich` in `tools/vorrat.mjs`, gemeinsam für `vorrat`, `ordne-level`,
`ordne-wuerfel`, `geschichte`, `leveldaten`). Keine Marken mehr: `LEVELS:`, `WUERFEL:`, `GESCHICHTE:` aus
`src/logik.js`, `VORRAT:` aus den Dateien des Vorrats (ein Test in `logic` sucht sie im Code). Die Blöcke wurden mit
einem Skript (nur für dieses Ticket, nicht im Repo) aus `src/logik.js` verschoben, unverändert; die Doc-Kommentare
zum Format stehen jetzt in der Datendatei. `src/logik.js` hat jetzt 44 KB, die Datendatei 326 KB.

**Werkzeuge und Tests.** `vorrat.mjs` (`DATEN` statt `LOGIK`, `bereich`/`spielBereich` exportiert), `lader.mjs`
(`alleText()` = Leveldaten mit allen Leveln), `leveldaten.mjs` (`datenMitLeveln`/`datenMitWuerfeln` statt
`logikMit…`), `ordne-level.mjs`, `ordne-wuerfel.mjs`, `geschichte.mjs` (`BLOCK` = `const REISE = {` … `};`),
`seitenmodule.mjs` (`zerlege` lässt den Kopfkommentar `/* … */` vor dem import zu und Importe aus `./daten/`;
`LEVELDATEN`). KI-Tester: `spielServer({ daten })`/`baue({ daten })`, `PRISMA_LEVELDATEN` in `vite.config.mjs`
ersetzt `src/daten/level.js` (statt `PRISMA_LOGIK` die ganze Logik), `prepare.mjs` schreibt `<lauf>/seite/level.js`
statt `seite/logik.js`. `golden.mjs` gibt der umgelenkten Kopie der Logik die Leveldaten als Parameter. Tests
angepasst (`vorrat`, `ki-tester`, `geschichte`, `logic`: neue Prüfung der Importe und der Marken, `feste` Form auch
für die Datendatei). `tools/levelliste.mjs` brauchte keine Änderung ausser einem Kommentar (es liest über den Lader).

### Läufe

Über `tools/leise.sh` (`LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=6`, die Probe allein).

- **Leveldaten gleich:** `L` (LEVELS, LEVELS_3D, STORY_LEVELS, TUTORIAL_COUNT), `ALLE`, `VORRAT` und `ort` als JSON vor
  und nach dem Umzug: byte-gleich.
- **Werkzeuge wie vorher (im Speicher, Basis `93a2508` gegen Ticket):** `ablegen Fingerzeig Alkaid`, Zurückholen
  danach, drei aus dem Vorrat zurückholen, alles zurückholen, `inGanzerFolge` mit umgekehrter Reihe (wie
  `ordne-level`) und ohne Änderung, Kandidaten am Ende von `FLACH`/`WUERFEL` für die Seite der KI-Tester: die Zeilen
  aller Bereiche (Spiel flach, Würfel, Reise, Vorrat flach, Vorrat Würfel) jedes Mal gleich.
- **Werkzeuge am echten Stand** (92 s): `geschichte.mjs spiel` «nichts zu schreiben»; `ordne-level.mjs --schreiben`
  «Reihenfolge und Grade stimmen …»; `ordne-wuerfel.mjs --schreiben` meldet «geschrieben», schreibt dieselben Bytes;
  `vorrat.mjs ablegen Fingerzeig Alkaid`, dann `zurueckholen Fingerzeig Alkaid`. Danach `src/daten/level.js`,
  `tools/vorrat/flach.js`, `tools/vorrat/wuerfel.js`, `wahl.json` byte-gleich (md5); `tools/levelliste.json` wieder
  LF statt CRLF, `git diff` leer (wie in Review 03 und 04, älter als dieses Ticket).
- `npm test`: alle grün (golden, logic 2082, hall, speicher, testschnittstelle, vorrat 18, geschichte 35,
  levelliste 54, wuerfelliste 20, ki-tester 84, beurteilung 206, generator, typecheck, leise); geschichte 1487 s (der
  Rechner war voll belegt), sonst wie gewohnt.
- `golden.mjs --voll`: alle 842 Level (davon 300 Würfel) wie in `golden.json`, Löser für alle Level.
- Bildvergleich `--gpu`: **GRÜN**, 77 Bilder in 7 min 32 s, grösste Abweichung 6, Anteil höchstens 0,014 %.
- `geschichte-probe --handy` (GPU=1, allein, 12 min): bestanden, Konsole ohne Fehler; drei Lücken beim ersten Laden
  (157, 334, 150 ms, Bretter bauen und Himmel wählen), gemeldet, nicht gezählt.

### Abweichungen

- Die Übungen im Dorf stehen mit in der Datendatei (`UEBUNGEN`), nicht in einer eigenen; so liegen alle Level an
  einem Ort, und kein Werkzeug schreibt dorthin.
- Der Vorrat bekam keine neue Form, nur ohne Marken (zwei Zeilen je Datei weg, Kopfkommentar nachgeführt); seine
  Blöcke sind unverändert.
- Umbenannt: `logikMitLeveln`/`logikMitWuerfeln` → `datenMitLeveln`/`datenMitWuerfeln`, Option `logik` →
  `daten`, `PRISMA_LOGIK` → `PRISMA_LEVELDATEN`, `<lauf>/seite/logik.js` → `seite/level.js`. Alte Läufe der KI-Tester
  unter `tests/output/` (nicht versioniert) behalten ihre `seite/logik.js`; neu gebaut wird nur aus `seite/level.js`.
  Ein KI-Tester-Lauf mit Bildern (`shots.mjs` mit Kandidaten) ist nicht gelaufen; geprüft sind die Datei der Seite
  (`ki-tester.test`) und der Build ohne Ersatz.

### Offene Punkte

- Reviewer: Proben mit Zeitmessung, Bildvergleich in SwiftShader, ein Lauf `prepare.mjs`/`shots.mjs` mit Kandidaten
  (Build mit `PRISMA_LEVELDATEN`).
- Ticket 07: die Texte der Übungen (`schritte`, auch `NEBENBEI` in `src/logik.js`) zu Schlüsseln.

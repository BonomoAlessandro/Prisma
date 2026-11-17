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

### Review (unabhängiger Reviewer, 18.11.2026)

**Ergebnis:** bestanden. Zwei kleine Dinge selbst behoben, keine mittleren oder grossen Funde. Stand `2c86ded` (Ticket
mit `feature/umbau` `b6be56d`), Basis zum Vergleich `b6be56d`.

**Selbst behoben:**
- `59930ed` README: Beim Merge (Konflikt, Fassung von 06 genommen) war der Umbruch aus Review 05 (`fdfbed4`) wieder
  verloren; hergestellt, dazu den Absatz zur festen Form der Module neu auf 120 Zeichen umbrochen.
- `041804d` `logic.test`: Die Behauptung «nur Daten, kein Code» für `src/daten/level.js` prüfte kein Test (nur der
  export-Block). Neu: kein import, oberste Ebene nur `const`, im Baum nur Felder, Listen und Literale (auch negativ);
  Gegenproben mit Aufruf, `let`, Pfeilfunktion und Spread fallen auf. `logic` danach 2083 grün.

**Geprüft am Code:**
- Spiel und Level gleich, unabhängig vom Umsetzer: Die Zeilen der Übungen (vor `LEVELS:BEGIN`), der 240 Level
  (zwischen `LEVELS:BEGIN/END`) und der Reise (`GESCHICHTE`) in `src/logik.js` der Basis sind byte-gleich mit
  `UEBUNGEN`, `FLACH` und `REISE` in `src/daten/level.js`, samt aller Kommentare zu Lösung und Herkunft; `WUERFEL` ist
  wie vorher leer; die Vorratsdateien sind ab `const VORRAT_…` bis auf die zwei Markenzeilen byte-gleich. `LEVELS =
  [...UEBUNGEN, ...FLACH]`, `LEVELS_3D`, `STORY_LEVELS` und `TUTORIAL_COUNT` wie vorher; Golden bestätigt alle 842.
- Offline: Ein eigener Build legt die Level in den Haupt-Chunk `assets/index-….js` (kein eigener Chunk, nichts wird
  nachgeladen); `offline.mjs` grün.
- Format: Das Daten-Modul ist gut begründet (Kommentare je Level werden gelesen, Blöcke wandern byte-gleich zwischen
  Spiel und Vorrat, Diffs zeigen nur das Level). Für Ticket 07 tragfähig: Texte der Übungen (`schritte`) und die
  `titel` in den Namenszeilen lassen sich durch Schlüssel ersetzen. Hinweis für 07: Die Titel schreibt
  `tools/geschichte.mjs spiel` aus `titel.json` in `FLACH`; werden sie Schlüssel, muss das Werkzeug mit.
- Werkzeuge: Der gemeinsame `bereich` (Zeile «const X = [» bis zur nächsten Zeile «];»/«};») ersetzt die Marken in
  `vorrat`, `ordne-level`, `ordne-wuerfel`, `geschichte`, `leveldaten` gleichwertig, auch bei leerem Bereich
  (`WUERFEL`) und CRLF. Keine Marken mehr in Code, Werkzeugen, README, `3D-WUERFEL.md` (nur noch in alten Tickets
  und ADRs als Geschichte). `tools/ausbau.mjs` (Stand des Codes) schaut weiter nur `src/logik.js` an; seit 06 zählt
  eine Änderung an Leveln dort nicht mehr als geänderte Spiellogik, was eher richtiger ist.

**Läufe** (über `tools/leise.sh`, leichte mit `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100`, Proben allein mit
`GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100`):
- `npm test`: alle 14 grün (golden 8 s, logic 137, vorrat 15, geschichte 939, levelliste 54, wuerfelliste 21,
  ki-tester 6, beurteilung 80, generator 68, typecheck 2, leise 25 …; mit drei anderen leichten Läufen daneben).
- `golden.mjs --voll`: grün, alle 842 Level (300 Würfel) wie in `golden.json`, Löser für alle (63 s).
- `offline.mjs`: grün (36 Prüfungen).
- Bildvergleich in SwiftShader (ohne `--gpu`, ganz, allein): **GRÜN**, 77 Bilder in 62 min 9 s, grösste Abweichung 6,
  Anteil höchstens 0,001 %; einmal «fast ruhig» (`poco-start`, 21 Pixel).
- Werkzeuge am echten Stand (107 s): `geschichte.mjs spiel` «nichts zu schreiben»; `ordne-level.mjs --schreiben`
  «Reihenfolge und Grade stimmen»; `ordne-wuerfel.mjs --schreiben` schreibt dieselben Bytes; `vorrat.mjs ablegen
  Fingerzeig Kanopus Alkaid` und `zurueckholen` derselben: Leveldaten und Vorrat wieder byte-gleich (md5);
  Würfel-Level `Wippe` zurückgeholt (in den leeren Bereich `WUERFEL`) und wieder abgelegt: richtig, es kommt dabei
  wie vorgesehen ans Ende des Vorrats (nur Ablegen→Zurückholen ist byte-gleich), danach per git zurückgesetzt;
  `vorrat.mjs liste`. Am Schluss alles byte-gleich, `git status` sauber.
- KI-Tester mit Kandidaten (offen vom Umsetzer): `prepare.mjs review06-kandidaten --kandidaten` mit zwei erfundenen
  leichten Kandidaten (wie in `ki-tester.test`, Plätze 12 und 13) mit Bildern: grün in 1408 s, Build mit
  `PRISMA_LEVELDATEN` aus `seite/level.js`, 8 Anker und 2 Kandidaten je Desktop und Handy; Bild `L1-desktop` zeigt
  den Kandidaten (9 Elemente, Kennung «L1»). Würfel: ein Skript nur für das Review legte ein Würfel-Level des Vorrats
  mit `datenMitWuerfeln` als Kandidat ans Ende von `WUERFEL` und nahm es mit `takeShots(…, daten)` auf, dazu dasselbe
  Level an seinem Platz: alle vier Bilder (Desktop, oben, seitlich, Handy) byte-gleich (127 s). Lauf danach gelöscht.
- Proben mit Zeitmessung (allein): `start-probe` grün (31 s), `leerlauf-probe` grün (48 s), `ruhetakt-probe` grün
  (73 s), `spiegel-probe pruefe` grün (144 s; eine Lücke 108 ms beim Wechsel milky → beach, gemeldet), `buehne-messung
  messen` grün (66 s), `brett-probe` grün (344 s, auch «Reise»), `geschichte-probe` grün (676 s), `--handy` grün
  (673 s), `--quer` grün (674 s), `--menue` grün (79 s), Konsole jeweils ohne Fehler; Lücken beim ersten Laden wie
  gewohnt gemeldet, nicht gezählt.
- `geschichte-probe --uebersicht` und `--dorf` rot, auch auf der Basis (eigener Worktree von `b6be56d`, abwechselnd
  laufen lassen): `--uebersicht` 5 von 5 rot im Ticket, 5 von 5 auf der Basis, je eine einzelne Lücke an wechselnder
  Stelle («Spiel → Übersicht» 106–163 ms, «letztes Level → Übersicht», «Übersicht → Spiel (Schliessen)» bis 466 ms auf
  der Basis, «Menü → Übersicht» 413/444 ms im Ticket und 412 ms auf der Basis). `--dorf` 3 von 3 rot im Ticket, 2 von 2
  auf der Basis, jedes Mal «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4» (Ticket 335–420 ms, Basis
  302–335 ms); in diesem Review kam dort statt «Menü → Prolog → Überspringen» diese Stelle, auf beiden Ständen
  gleich. Einmal im Ticket (1 von 5) verlor Chrome den WebGL-Kontext («context loss and was blocked», danach
  Zeitüberschreitung); in den vier weiteren Läufen nicht, der Code der Darstellung ist unverändert: ein Ausreisser
  der Grafikkarte, nicht gezählt. Nichts kommt nur im Ticket.
